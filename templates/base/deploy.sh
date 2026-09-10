#!/usr/bin/env bash
set -euo pipefail

# Set this to your Docker Hub (or other registry) username before deploying.
USERNAME="your-dockerhub-username"
PROJECT="stackbase"
NAMESPACE="stackbase"

# Apps are built and deployed only when their Kubernetes manifests are present,
# so this script works for full-stack, web-only, and api-only projects without
# any edits.
apps=()
[ -f "k8s/api-deployment.yml" ] && apps+=("api")
[ -f "k8s/web-deployment.yml" ] && apps+=("web")

if [ ${#apps[@]} -eq 0 ]; then
  echo "No app deployments found in k8s/. Nothing to deploy."
  exit 1
fi

echo "Building and pushing Docker images..."
for app in "${apps[@]}"; do
  docker compose -f docker-compose.prod.yml build "$app"
  docker tag "$PROJECT-$app:latest" "$USERNAME/$PROJECT-$app:latest"
  docker push "$USERNAME/$PROJECT-$app:latest"
done

echo "Applying namespace and ConfigMap..."
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml

echo "Updating secrets..."
for app in "${apps[@]}"; do
  env_file="apps/$app/.env.production"
  if [ -f "$env_file" ]; then
    kubectl create secret generic "$PROJECT-$app-env" \
      --from-env-file="$env_file" \
      --namespace="$NAMESPACE" \
      --dry-run=client -o yaml | kubectl apply -f -
  else
    echo "  warning: $env_file not found, skipping $app secret"
  fi
done

echo "Applying Deployments, Services, Ingress, and HPAs..."
for app in "${apps[@]}"; do
  kubectl apply -f "k8s/$app-deployment.yml"
  kubectl apply -f "k8s/$app-service.yml"
  [ -f "k8s/$app-ingress.yml" ] && kubectl apply -f "k8s/$app-ingress.yml"
  [ -f "k8s/$app-hpa.yml" ] && kubectl apply -f "k8s/$app-hpa.yml"
done

echo "Waiting for rollouts..."
for app in "${apps[@]}"; do
  kubectl rollout status "deployment/$PROJECT-$app-deployment" -n "$NAMESPACE"
done

echo ""
echo "Deploy complete. Useful commands:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get services -n $NAMESPACE"
echo "  kubectl get ingress -n $NAMESPACE"
echo "  kubectl get hpa -n $NAMESPACE"
