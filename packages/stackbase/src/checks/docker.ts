import { readFile } from "node:fs/promises";
import net from "node:net";
import { join } from "node:path";
import yaml from "yaml";
import { directoryExists, exec } from "../utils.js";
import type { CheckGroup, CheckResult } from "./types.js";

export interface ServiceTarget {
  id: string;
  label: string;
  composeServices: string[];
  defaultPort: number;
  envKeys: string[];
}

export const DEFAULT_SERVICE_TARGETS: ServiceTarget[] = [
  {
    id: "postgres",
    label: "PostgreSQL",
    composeServices: ["postgres", "db"],
    defaultPort: 5432,
    envKeys: ["DATABASE_URL"],
  },
  {
    id: "redis",
    label: "Redis",
    composeServices: ["redis"],
    defaultPort: 6379,
    envKeys: ["REDIS_URL"],
  },
  {
    id: "minio",
    label: "MinIO S3 Storage",
    composeServices: ["minio"],
    defaultPort: 9000,
    envKeys: ["S3_ENDPOINT"],
  },
  {
    id: "upstash-proxy",
    label: "Upstash Redis Proxy",
    composeServices: ["upstash-redis-http"],
    defaultPort: 8079,
    envKeys: ["UPSTASH_REDIS_REST_URL"],
  },
];

export interface DockerCheckDeps {
  execCommand?: (cmd: string) => Promise<{ stdout: string; stderr: string }>;
  probePort?: (
    host: string,
    port: number,
    timeoutMs?: number,
  ) => Promise<boolean>;
}

/**
 * Tests if a TCP port is accepting connections on the specified host.
 */
export const probeTcpPort = (
  host: string,
  port: number,
  timeoutMs: number = 400,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (result: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));

    socket.connect(port, host);
  });
};

/**
 * Parses a connection URL (e.g. postgresql://..., http://127.0.0.1:8079, redis://localhost:6379)
 * into host, port, and whether it points to a local machine.
 */
export const parseServiceEndpoint = (
  rawUrl: string | undefined,
  defaultPort: number,
): { host: string; port: number; isLocal: boolean } => {
  if (!rawUrl) {
    return { host: "127.0.0.1", port: defaultPort, isLocal: true };
  }

  try {
    const unquoted = rawUrl.trim().replace(/^["']|["']$/g, "");
    const parsed = new URL(unquoted);
    const host = parsed.hostname || "127.0.0.1";
    const port = parsed.port ? Number.parseInt(parsed.port, 10) : defaultPort;
    const isLocal =
      host === "127.0.0.1" ||
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "::1";
    return { host, port, isLocal };
  } catch {
    return { host: "127.0.0.1", port: defaultPort, isLocal: true };
  }
};

/**
 * Reads environment variables from root, apps/api, apps/web .env files for endpoint discovery.
 */
const collectConfiguredEnvValues = async (
  projectRoot: string,
): Promise<Record<string, string>> => {
  const candidates = [
    join(projectRoot, ".env.local"),
    join(projectRoot, ".env"),
    join(projectRoot, "apps", "api", ".env.local"),
    join(projectRoot, "apps", "api", ".env"),
    join(projectRoot, "apps", "web", ".env.local"),
    join(projectRoot, "apps", "web", ".env"),
    join(projectRoot, "packages", "db", ".env.local"),
    join(projectRoot, "packages", "db", ".env"),
  ];

  const values: Record<string, string> = {};

  for (const filePath of candidates) {
    if (!(await directoryExists(filePath))) continue;
    try {
      const content = await readFile(filePath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key && val && !values[key]) {
          values[key] = val;
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return values;
};

/**
 * Reads service names defined in docker-compose.yml if present.
 */
const getComposeServices = async (
  projectRoot: string,
): Promise<Set<string> | null> => {
  const composePath = join(projectRoot, "docker-compose.yml");
  if (!(await directoryExists(composePath))) return null;

  try {
    const content = await readFile(composePath, "utf8");
    const parsed = yaml.parse(content) as {
      services?: Record<string, unknown>;
    };
    if (parsed?.services && typeof parsed.services === "object") {
      return new Set(Object.keys(parsed.services));
    }
  } catch {
    // Ignore YAML parse errors
  }
  return new Set();
};

/**
 * Verifies Docker daemon status and tests local container ports (5432, 6379, 9000, 8079).
 */
export const checkDocker = async (
  projectRoot: string = process.cwd(),
  deps: DockerCheckDeps = {},
): Promise<CheckGroup> => {
  const checks: CheckResult[] = [];
  const runCmd =
    deps.execCommand ??
    ((cmd: string) =>
      exec(cmd, { cwd: projectRoot, encoding: "utf8", timeout: 4000 }));
  const probe = deps.probePort ?? probeTcpPort;

  const composeServices = await getComposeServices(projectRoot);
  const envValues = await collectConfiguredEnvValues(projectRoot);
  const hasComposeFile = composeServices !== null;

  // 1. Check Docker binary & daemon
  let dockerDaemonRunning = false;
  try {
    const { stdout: versionOut } = await runCmd("docker --version");
    const versionClean = versionOut.trim().replace(/^Docker version\s*/i, "");

    try {
      await runCmd("docker info");
      dockerDaemonRunning = true;
      checks.push({
        id: "docker-daemon",
        label: "Docker daemon",
        status: "pass",
        detail: `Running (${versionClean})`,
      });
    } catch {
      checks.push({
        id: "docker-daemon",
        label: "Docker daemon",
        status: hasComposeFile ? "fail" : "warn",
        detail: "Docker is installed but the daemon is not running",
        remedy:
          "Start Docker Desktop or the Docker system service (`sudo systemctl start docker`)",
      });
    }
  } catch {
    checks.push({
      id: "docker-daemon",
      label: "Docker CLI",
      status: hasComposeFile ? "fail" : "warn",
      detail: "Docker is not installed or not available in PATH",
      remedy:
        "Install Docker Desktop (https://www.docker.com/products/docker-desktop/)",
    });
  }

  // 2. Check local container ports in parallel (5432 Postgres, 6379 Redis, 9000 MinIO, 8079 Upstash proxy)
  const portChecks = await Promise.all(
    DEFAULT_SERVICE_TARGETS.map(async (target): Promise<CheckResult> => {
      const configuredUrl = target.envKeys
        .map((k) => envValues[k])
        .find(Boolean);

      const isInCompose =
        composeServices !== null &&
        target.composeServices.some((s) => composeServices.has(s));

      // If docker-compose.yml exists and explicitly omits this service, and no env var configures it, skip
      if (
        composeServices !== null &&
        composeServices.size > 0 &&
        !isInCompose &&
        !configuredUrl
      ) {
        return {
          id: `port-${target.id}`,
          label: `${target.label} (port ${target.defaultPort})`,
          status: "skip",
          detail: "Not configured in docker-compose.yml or .env",
        };
      }

      const endpoint = parseServiceEndpoint(configuredUrl, target.defaultPort);

      if (!endpoint.isLocal) {
        return {
          id: `port-${target.id}`,
          label: `${target.label}`,
          status: "pass",
          detail: `Using remote endpoint (${endpoint.host}:${endpoint.port})`,
        };
      }

      const isOpen = await probe(endpoint.host, endpoint.port, 400);
      if (isOpen) {
        return {
          id: `port-${target.id}`,
          label: `${target.label} (${endpoint.host}:${endpoint.port})`,
          status: "pass",
          detail: "Reachable and accepting connections",
        };
      }

      const serviceCmd =
        isInCompose && target.composeServices[0]
          ? `docker compose up -d ${target.composeServices[0]}`
          : "docker compose up -d";

      return {
        id: `port-${target.id}`,
        label: `${target.label} (${endpoint.host}:${endpoint.port})`,
        status: "fail",
        detail: "Connection refused (port not listening)",
        remedy: `Run \`${serviceCmd}\` to start the local container`,
        fixable: dockerDaemonRunning && hasComposeFile,
        fix:
          dockerDaemonRunning && hasComposeFile
            ? async () => {
                await runCmd("docker compose up -d");
                return `Started local Docker containers via \`docker compose up -d\``;
              }
            : undefined,
      };
    }),
  );

  checks.push(...portChecks);

  return {
    name: "docker",
    title: "Docker & Local Container Ports",
    checks,
  };
};
