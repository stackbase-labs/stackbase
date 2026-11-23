import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkDocker,
  parseServiceEndpoint,
  probeTcpPort,
} from "../checks/docker.js";
import { checkEnv, parseEnvFileMap } from "../checks/env.js";
import {
  checkRuntime,
  detectProjectPackageManager,
  parseMinMajorVersion,
  parseSemver,
} from "../checks/runtime.js";
import { checkWorkspace } from "../checks/workspace.js";
import { runDoctorChecks } from "../doctor.js";

describe("Runtime & Package Manager Checks", () => {
  it("parses semver strings and engine ranges accurately", () => {
    expect(parseSemver("v24.2.1")).toEqual({ major: 24, minor: 2, patch: 1 });
    expect(parseSemver(">=24")).toEqual({ major: 24, minor: 0, patch: 0 });
    expect(parseMinMajorVersion(">=24.0.0")).toBe(24);
    expect(parseMinMajorVersion(undefined)).toBe(24);
  });

  it("passes when Node >= 24 and package manager matches", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-rt-"));
    try {
      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-workspace",
          packageManager: "pnpm@11.1.1",
          engines: { node: ">=24" },
        }),
      );

      const group = await checkRuntime(tempDir, {
        nodeVersion: "24.3.0",
        execCommand: async () => ({ stdout: "11.1.1\n", stderr: "" }),
      });

      const nodeCheck = group.checks.find((c) => c.id === "node-version");
      const pmCheck = group.checks.find((c) => c.id === "package-manager");

      expect(nodeCheck?.status).toBe("pass");
      expect(pmCheck?.status).toBe("pass");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("fails when Node version is below 24", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-rt-old-"));
    try {
      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-workspace",
          engines: { node: ">=24" },
        }),
      );

      const group = await checkRuntime(tempDir, {
        nodeVersion: "20.11.0",
        execCommand: async () => ({ stdout: "11.1.1\n", stderr: "" }),
      });

      const nodeCheck = group.checks.find((c) => c.id === "node-version");
      expect(nodeCheck?.status).toBe("fail");
      expect(nodeCheck?.remedy).toContain("24");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("warns on package manager major version mismatch and fails if missing", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-pm-"));
    try {
      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-workspace",
          packageManager: "pnpm@11.1.1",
        }),
      );

      const pmDetected = await detectProjectPackageManager(tempDir);
      expect(pmDetected.manager).toBe("pnpm");
      expect(pmDetected.expectedVersion).toBe("11.1.1");

      const mismatchGroup = await checkRuntime(tempDir, {
        nodeVersion: "24.0.0",
        execCommand: async () => ({ stdout: "9.12.0\n", stderr: "" }),
      });
      expect(
        mismatchGroup.checks.find((c) => c.id === "package-manager")?.status,
      ).toBe("warn");

      const missingGroup = await checkRuntime(tempDir, {
        nodeVersion: "24.0.0",
        execCommand: async () => {
          throw new Error("command not found");
        },
      });
      expect(
        missingGroup.checks.find((c) => c.id === "package-manager")?.status,
      ).toBe("fail");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Docker Daemon & Port Checks", () => {
  it("parses local and remote service endpoints", () => {
    expect(
      parseServiceEndpoint(
        "postgresql://postgres:password@127.0.0.1:5432/app",
        5432,
      ),
    ).toEqual({
      host: "127.0.0.1",
      port: 5432,
      isLocal: true,
    });

    expect(
      parseServiceEndpoint(
        "postgresql://user:pass@ep-cool-db.us-east-1.aws.neon.tech/app",
        5432,
      ),
    ).toEqual({
      host: "ep-cool-db.us-east-1.aws.neon.tech",
      port: 5432,
      isLocal: false,
    });
  });

  it("probes real TCP listening port vs closed port", async () => {
    const server = net.createServer();
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address() as net.AddressInfo;

    try {
      const openResult = await probeTcpPort("127.0.0.1", address.port, 500);
      expect(openResult).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    const closedResult = await probeTcpPort("127.0.0.1", address.port, 200);
    expect(closedResult).toBe(false);
  });

  it("verifies Docker daemon and flags closed local service ports (5432, 6379, 9000, 8079)", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-docker-"));
    try {
      await writeFile(
        join(tempDir, "docker-compose.yml"),
        `services:
  postgres:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine
  minio:
    image: cgr.dev/chainguard/minio:latest
  upstash-redis-http:
    image: hiett/serverless-redis-http:latest
`,
      );

      const group = await checkDocker(tempDir, {
        execCommand: async (cmd) => {
          if (cmd === "docker --version") {
            return {
              stdout: "Docker version 27.3.1, build ce123\n",
              stderr: "",
            };
          }
          if (cmd === "docker info") {
            return { stdout: "Server Version: 27.3.1\n", stderr: "" };
          }
          return { stdout: "", stderr: "" };
        },
        probePort: async (_host, port) => {
          // Simulate 5432 and 6379 running, 9000 and 8079 down
          return port === 5432 || port === 6379;
        },
      });

      expect(group.checks.find((c) => c.id === "docker-daemon")?.status).toBe(
        "pass",
      );
      expect(group.checks.find((c) => c.id === "port-postgres")?.status).toBe(
        "pass",
      );
      expect(group.checks.find((c) => c.id === "port-redis")?.status).toBe(
        "pass",
      );
      expect(group.checks.find((c) => c.id === "port-minio")?.status).toBe(
        "fail",
      );
      expect(
        group.checks.find((c) => c.id === "port-upstash-proxy")?.status,
      ).toBe("fail");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Environment Variable Sync (.env.example vs .env)", () => {
  it("parses .env key-value pairs accurately", () => {
    const map = parseEnvFileMap(
      `# Comment\nDATABASE_URL="postgresql://localhost:5432/db"\nPORT=4000\nEMPTY=\n`,
    );
    expect(map.get("DATABASE_URL")).toBe("postgresql://localhost:5432/db");
    expect(map.get("PORT")).toBe("4000");
    expect(map.get("EMPTY")).toBe("");
  });

  it("flags missing .env files, missing keys, and placeholder secrets, and auto-fixes them", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-env-"));
    try {
      await mkdir(join(tempDir, "apps", "api"), { recursive: true });
      await mkdir(join(tempDir, "apps", "web"), { recursive: true });

      // Root has .env.example and partial .env
      await writeFile(
        join(tempDir, ".env.example"),
        `DATABASE_URL="postgresql://127.0.0.1:5432/db"\nREDIS_URL="redis://127.0.0.1:6379"\n`,
      );
      await writeFile(
        join(tempDir, ".env"),
        `DATABASE_URL="postgresql://127.0.0.1:5432/db"\n`,
      );

      // apps/api has .env.example but NO .env file at all
      await writeFile(
        join(tempDir, "apps", "api", ".env.example"),
        `PORT=4000\nBETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n`,
      );

      // apps/web has .env with placeholder secret
      await writeFile(
        join(tempDir, "apps", "web", ".env.example"),
        `BETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n`,
      );
      await writeFile(
        join(tempDir, "apps", "web", ".env"),
        `BETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n`,
      );

      const initialGroup = await checkEnv(tempDir);
      const rootCheck = initialGroup.checks.find((c) => c.id === "env-keys-.");
      const apiCheck = initialGroup.checks.find(
        (c) => c.id === "env-missing-file-apps/api",
      );
      const webCheck = initialGroup.checks.find(
        (c) => c.id === "env-keys-apps/web",
      );

      expect(rootCheck?.status).toBe("fail");
      expect(rootCheck?.detail).toContain("REDIS_URL");
      expect(apiCheck?.status).toBe("fail");
      expect(webCheck?.status).toBe("warn");

      // Execute auto-fixes
      for (const c of initialGroup.checks) {
        if (c.fixable && c.fix) {
          await c.fix();
        }
      }

      const afterGroup = await checkEnv(tempDir);
      expect(afterGroup.checks.every((c) => c.status === "pass")).toBe(true);

      const fixedRootEnv = await readFile(join(tempDir, ".env"), "utf8");
      expect(fixedRootEnv).toContain("REDIS_URL=");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("supports .env.local files generated by stackbase init", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-envlocal-"));
    try {
      await mkdir(join(tempDir, "packages", "db"), { recursive: true });
      await writeFile(
        join(tempDir, "packages", "db", ".env.example"),
        `DATABASE_URL="postgresql://127.0.0.1:5432/db"\n`,
      );
      await writeFile(
        join(tempDir, "packages", "db", ".env.local"),
        `DATABASE_URL="postgresql://127.0.0.1:5432/db"\n`,
      );

      const group = await checkEnv(tempDir);
      const dbCheck = group.checks.find((c) => c.id === "env-keys-packages/db");
      expect(dbCheck?.status).toBe("pass");
      expect(dbCheck?.label).toBe("packages/db/.env.local");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("detects and synchronizes mismatched BETTER_AUTH_SECRET across apps/api and apps/web", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-authsync-"));
    try {
      await mkdir(join(tempDir, "apps", "api"), { recursive: true });
      await mkdir(join(tempDir, "apps", "web"), { recursive: true });

      await writeFile(
        join(tempDir, "apps", "api", ".env.example"),
        `BETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n`,
      );
      await writeFile(
        join(tempDir, "apps", "web", ".env.example"),
        `BETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n`,
      );

      await writeFile(
        join(tempDir, "apps", "api", ".env.local"),
        `BETTER_AUTH_SECRET="secret-one-that-is-at-least-32-characters-long"\n`,
      );
      await writeFile(
        join(tempDir, "apps", "web", ".env.local"),
        `BETTER_AUTH_SECRET="secret-two-that-is-different-and-32-chars-long"\n`,
      );

      const initialGroup = await checkEnv(tempDir);
      const syncCheck = initialGroup.checks.find(
        (c) => c.id === "env-auth-secret-sync",
      );
      expect(syncCheck?.status).toBe("warn");
      expect(syncCheck?.fixable).toBe(true);

      await syncCheck?.fix?.();

      const afterGroup = await checkEnv(tempDir);
      expect(
        afterGroup.checks.find((c) => c.id === "env-auth-secret-sync"),
      ).toBeUndefined();

      const apiEnv = parseEnvFileMap(
        await readFile(join(tempDir, "apps", "api", ".env.local"), "utf8"),
      );
      const webEnv = parseEnvFileMap(
        await readFile(join(tempDir, "apps", "web", ".env.local"), "utf8"),
      );
      expect(apiEnv.get("BETTER_AUTH_SECRET")).toBe(
        webEnv.get("BETTER_AUTH_SECRET"),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Catalog Consistency & Workspace References", () => {
  it("detects dangling workspace:* references and missing catalog:* entries, and repairs catalogs", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-ws-"));
    try {
      await mkdir(join(tempDir, "apps", "api"), { recursive: true });
      await mkdir(join(tempDir, "packages", "db"), { recursive: true });
      await mkdir(join(tempDir, "node_modules"), { recursive: true });

      await writeFile(
        join(tempDir, "pnpm-workspace.yaml"),
        `packages:
  - 'apps/*'
  - 'packages/*'
catalogs:
  core:
    zod: ^4.3.6
`,
      );

      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({
          name: "test-root",
          devDependencies: {
            turbo: "catalog:core", // Missing in pnpm-workspace.yaml catalogs.core, present in DEFAULT_CATALOGS
          },
        }),
      );

      await writeFile(
        join(tempDir, "packages", "db", "package.json"),
        JSON.stringify({
          name: "@workspace/db",
          dependencies: {
            zod: "catalog:core",
          },
        }),
      );

      await writeFile(
        join(tempDir, "apps", "api", "package.json"),
        JSON.stringify({
          name: "api",
          dependencies: {
            "@workspace/db": "workspace:*",
            "@workspace/nonexistent": "workspace:*",
          },
        }),
      );

      const group = await checkWorkspace(tempDir);
      const wsRefs = group.checks.find((c) => c.id === "workspace-refs");
      const catCheck = group.checks.find((c) => c.id === "catalog-consistency");

      expect(wsRefs?.status).toBe("fail");
      expect(wsRefs?.detail).toContain("@workspace/nonexistent");

      expect(catCheck?.status).toBe("fail");
      expect(catCheck?.detail).toContain("turbo");
      expect(catCheck?.fixable).toBe(true);

      // Run catalog auto-fix
      await catCheck?.fix?.();

      const afterGroup = await checkWorkspace(tempDir);
      expect(
        afterGroup.checks.find((c) => c.id === "catalog-consistency")?.status,
      ).toBe("pass");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("End-to-End runDoctorChecks Orchestrator", () => {
  it("aggregates all 4 pillars and applies fixes when fix: true", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-doc-e2e-"));
    try {
      await mkdir(join(tempDir, "node_modules"), { recursive: true });
      await writeFile(
        join(tempDir, "package.json"),
        JSON.stringify({
          name: "e2e-root",
          packageManager: "pnpm@11.1.1",
          engines: { node: ">=24" },
        }),
      );
      await writeFile(
        join(tempDir, ".env.example"),
        `DATABASE_URL="postgresql://127.0.0.1:5432/app"\n`,
      );

      const { report, fixLogs } = await runDoctorChecks(
        { cwd: tempDir, fix: true },
        {
          runtime: {
            nodeVersion: "24.2.0",
            execCommand: async () => ({ stdout: "11.1.1\n", stderr: "" }),
          },
          docker: {
            execCommand: async () => ({
              stdout: "Docker version 27.0.0\n",
              stderr: "",
            }),
            probePort: async () => true,
          },
        },
      );

      expect(fixLogs.length).toBe(1);
      expect(report.healthy).toBe(true);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.fixed).toBe(1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
