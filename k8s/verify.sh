#!/usr/bin/env bash
# Verifies the stackbase Kubernetes deployment, working outward:
# pods -> deployments -> services/endpoints -> ingress -> live HTTP -> HPA.
# Exits non-zero on any failure so it can be used in CI.
set -uo pipefail

PROJECT="stackbase"
NAMESPACE="stackbase"
FAIL=0

# Detect which apps were deployed from the manifests that exist.
apps=()
[ -f "k8s/api-deployment.yml" ] && apps+=("api")
[ -f "k8s/web-deployment.yml" ] && apps+=("web")

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
hr()    { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

check() {
  # check "description" "command..."  -> runs command, reports pass/fail
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    green "  ok   $desc"
  else
    red   "  FAIL $desc"
    FAIL=1
  fi
}

if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  red "Namespace '$NAMESPACE' not found. Has the app been deployed?"
  exit 1
fi

hr "Pods"
kubectl get pods -n "$NAMESPACE" -o wide

hr "Deployments rolled out"
for app in "${apps[@]}"; do
  check "$app deployment available" \
    kubectl rollout status "deployment/$PROJECT-$app-deployment" -n "$NAMESPACE" --timeout=10s
done

hr "Services and endpoints"
# Use EndpointSlices (discovery.k8s.io/v1)
kubectl get svc,endpointslices -n "$NAMESPACE"
# A slice must list addresses, otherwise the service selector isn't matching pods.
has_endpoints() {
  test -n "$(kubectl get endpointslices -n "$NAMESPACE" \
    -l "kubernetes.io/service-name=$1" \
    -o jsonpath='{.items[*].endpoints[*].addresses[*]}')"
}
for app in "${apps[@]}"; do
  check "$app service has endpoints" has_endpoints "$PROJECT-$app-service"
done

hr "In-cluster HTTP (via temporary curl pod)"
# Hits the ClusterIP services directly from inside the cluster, so this works
# even when there is no external ingress address yet.
run_curl() {
  kubectl run "verify-curl-$RANDOM" -n "$NAMESPACE" --rm -i --restart=Never \
    --image=curlimages/curl:8.8.0 --quiet -- \
    curl -sf -m 5 "$1" >/dev/null 2>&1
}
for app in "${apps[@]}"; do
  if [ "$app" = "api" ]; then
    check "api /healthz reachable" run_curl "http://$PROJECT-api-service:4000/healthz"
    check "api /readyz reachable"  run_curl "http://$PROJECT-api-service:4000/readyz"
  elif [ "$app" = "web" ]; then
    check "web / reachable"        run_curl "http://$PROJECT-web-service:3000/"
  fi
done

hr "Ingress"
kubectl get ingress -n "$NAMESPACE"
# Prefer the web ingress address; fall back to the api ingress for api-only.
INGRESS_NAME="$PROJECT-web-ingress"
kubectl get ingress "$INGRESS_NAME" -n "$NAMESPACE" >/dev/null 2>&1 || INGRESS_NAME="$PROJECT-api-ingress"
ADDRESS=$(kubectl get ingress "$INGRESS_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
if [ -n "$ADDRESS" ]; then
  green "  ingress address: $ADDRESS"
  echo  "  test externally with:"
  if [ "$INGRESS_NAME" = "$PROJECT-web-ingress" ]; then
    echo  "    curl http://$ADDRESS/"
  fi
  echo  "    curl http://$ADDRESS/api/v1/health"
else
  red   "  no external ingress address yet (controller pending, or local cluster without a LoadBalancer)"
fi

hr "Autoscaling (HPA)"
# A real percentage in TARGETS means metrics-server is feeding the HPA.
# '<unknown>' means metrics-server isn't serving metrics -> the HPA cannot scale,
# and since the deployments no longer pin replicas they stay at minReplicas.
# Check the rendered TARGETS column directly: the currentMetrics field is
# populated with metric *definitions* even when values are unknown, so it can't
# be used to tell whether real values exist.
HPA_OUT=$(kubectl get hpa -n "$NAMESPACE" 2>/dev/null)
echo "$HPA_OUT"
if echo "$HPA_OUT" | grep -q '<unknown>'; then
  red   "  HPA targets are <unknown>: metrics-server isn't serving metrics, so autoscaling can't react to load."
  red   "  On minikube enable it with: minikube addons enable metrics-server"
  FAIL=1
else
  green "  HPA is reading metrics"
fi

hr "Result"
if [ "$FAIL" -eq 0 ]; then
  green "All checks passed."
else
  red "One or more checks failed (see above)."
fi
exit "$FAIL"
