import { describe, expect, it } from "vitest";
import {
  getAvailableModules,
  getModule,
  getOptionalModules,
  MODULE_REGISTRY,
} from "../modules.js";
import { getModulesStatus } from "../list.js";
import { isExcludedByOptionalModules } from "../upgrade.js";
import { isGitClean } from "../utils.js";
import { adaptScope } from "../transformers/scope.js";
import {
  detectWorkspaceEnvFileName,
  extractEnvKeys,
  initializeModuleEnv,
  mergeEnvExample,
} from "../transformers/env.js";
import { checkEnv, parseEnvFileMap } from "../checks/env.js";
import { mergeDockerComposeService } from "../transformers/dockerCompose.js";
import {
  adaptPackageDependencies,
  DEFAULT_CATALOGS,
} from "../transformers/catalog.js";
import { linkPackageToApp } from "../transformers/appLink.js";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Module Registry", () => {
  it("registers essential modules", () => {
    expect(MODULE_REGISTRY.queue).toBeDefined();
    expect(MODULE_REGISTRY.storage).toBeDefined();
    expect(MODULE_REGISTRY.email).toBeDefined();
    expect(MODULE_REGISTRY["rate-limit"]).toBeDefined();
    expect(MODULE_REGISTRY.auth).toBeDefined();
  });

  it("registers opt-in payments, ai, and analytics modules", () => {
    expect(MODULE_REGISTRY.payments).toBeDefined();
    expect(MODULE_REGISTRY.payments?.optional).toBe(true);
    expect(MODULE_REGISTRY.payments?.recommendedApp).toBe("api");
    expect(MODULE_REGISTRY.payments?.recommendedApps).toEqual(["api", "web"]);

    expect(MODULE_REGISTRY.ai).toBeDefined();
    expect(MODULE_REGISTRY.ai?.optional).toBe(true);
    expect(MODULE_REGISTRY.ai?.recommendedApp).toBe("api");
    expect(MODULE_REGISTRY.ai?.recommendedApps).toEqual(["api", "web"]);

    expect(MODULE_REGISTRY.analytics).toBeDefined();
    expect(MODULE_REGISTRY.analytics?.optional).toBe(true);
    expect(MODULE_REGISTRY.analytics?.recommendedApp).toBe("web");
    expect(MODULE_REGISTRY.analytics?.recommendedApps).toEqual(["web", "api"]);
  });

  it("returns only opt-in modules from getOptionalModules()", () => {
    const optional = getOptionalModules();
    const names = optional.map((m) => m.name);
    expect(names).toEqual(
      expect.arrayContaining(["payments", "ai", "analytics"]),
    );
    expect(names).not.toContain("queue");
    expect(names).not.toContain("auth");
  });

  it("retrieves module by name case-insensitively", () => {
    expect(getModule("QUEUE")).toBeDefined();
    expect(getModule("queue")?.name).toBe("queue");
    expect(getModule("PAYMENTS")?.name).toBe("payments");
    expect(getModule("AI")?.name).toBe("ai");
    expect(getModule("ANALYTICS")?.name).toBe("analytics");
    expect(getModule("nonexistent")).toBeUndefined();
  });

  it("lists all available modules", () => {
    const all = getAvailableModules();
    expect(all.length).toBeGreaterThanOrEqual(8);
    expect(all.some((m) => m.name === "queue")).toBe(true);
    expect(all.some((m) => m.name === "payments")).toBe(true);
    expect(all.some((m) => m.name === "ai")).toBe(true);
    expect(all.some((m) => m.name === "analytics")).toBe(true);
  });
});

describe("Optional Module Upgrade Filtering", () => {
  it("excludes opt-in modules that are not tracked in the manifest", () => {
    const manifestFiles = new Set(["package.json", "packages/db/package.json"]);
    expect(
      isExcludedByOptionalModules(
        "packages/payments/package.json",
        manifestFiles,
      ),
    ).toBe(true);
    expect(
      isExcludedByOptionalModules("packages/ai/src/index.ts", manifestFiles),
    ).toBe(true);
    expect(
      isExcludedByOptionalModules(
        "packages/analytics/src/index.ts",
        manifestFiles,
      ),
    ).toBe(true);
    expect(
      isExcludedByOptionalModules("packages/db/package.json", manifestFiles),
    ).toBe(false);
  });

  it("includes opt-in modules when already tracked in the manifest", () => {
    const manifestFiles = new Set([
      "package.json",
      "packages/payments/package.json",
    ]);
    expect(
      isExcludedByOptionalModules(
        "packages/payments/package.json",
        manifestFiles,
      ),
    ).toBe(false);
    expect(
      isExcludedByOptionalModules(
        "packages/payments/src/new-file.ts",
        manifestFiles,
      ),
    ).toBe(false);
    expect(
      isExcludedByOptionalModules("packages/ai/package.json", manifestFiles),
    ).toBe(true);
  });
});

describe("Scope Transformation", () => {
  it("replaces @workspace/ with detected scope", () => {
    expect(adaptScope("@workspace/queue", "@repo")).toBe("@repo/queue");
    expect(adaptScope("@workspace/storage", "@acme")).toBe("@acme/storage");
  });

  it("leaves content unchanged if scope is already @workspace", () => {
    expect(adaptScope("@workspace/queue", "@workspace")).toBe(
      "@workspace/queue",
    );
  });
});

describe("Env Transformer", () => {
  it("extracts env keys from content", () => {
    const env = `
# Comment
PORT=3000
NODE_ENV=development
# Another comment
REDIS_HOST=127.0.0.1
    `;
    const keys = extractEnvKeys(env);
    expect(keys.has("PORT")).toBe(true);
    expect(keys.has("NODE_ENV")).toBe(true);
    expect(keys.has("REDIS_HOST")).toBe(true);
    expect(keys.has("MISSING")).toBe(false);
  });

  it("merges only missing env keys into target file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-env-"));
    const targetFile = join(tempDir, ".env.example");

    try {
      await writeFile(targetFile, "PORT=3000\nNODE_ENV=development\n");

      const moduleEnv = `
# Redis connection
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# Already present
PORT=4000
      `;

      const result = await mergeEnvExample(moduleEnv, targetFile);
      expect(result.changed).toBe(true);
      expect(result.addedKeys).toEqual(["REDIS_HOST", "REDIS_PORT"]);

      const updated = await readFile(targetFile, "utf8");
      expect(updated).toContain("REDIS_HOST=127.0.0.1");
      expect(updated).toContain("REDIS_PORT=6379");
      expect(updated).toContain("PORT=3000"); // preserved original
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("initializes packages/<module>/.env.local by default and passes checkEnv", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-mod-env-"));

    try {
      const dbDir = join(tempDir, "packages", "db");
      const queueDir = join(tempDir, "packages", "queue");
      await mkdir(dbDir, { recursive: true });
      await mkdir(queueDir, { recursive: true });

      await writeFile(
        join(dbDir, ".env.example"),
        'DATABASE_URL="postgresql://127.0.0.1:5432/app"\n',
      );
      await writeFile(
        join(dbDir, ".env.local"),
        'DATABASE_URL="postgresql://127.0.0.1:5432/app"\n',
      );

      await writeFile(
        join(queueDir, ".env.example"),
        "REDIS_HOST=127.0.0.1\nREDIS_PORT=6379\nREDIS_PASSWORD=\n",
      );

      const res = await initializeModuleEnv(queueDir, tempDir);
      expect(res.created).toBe(true);
      expect(res.envFileName).toBe(".env.local");

      const envGroup = await checkEnv(tempDir);
      expect(envGroup.checks.every((c) => c.status === "pass")).toBe(true);
      const queueCheck = envGroup.checks.find(
        (c) => c.id === "env-keys-packages/queue",
      );
      expect(queueCheck?.status).toBe("pass");
      expect(queueCheck?.label).toBe("packages/queue/.env.local");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("respects workspace .env convention when no .env.local files are used", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-mod-dotenv-"));

    try {
      const apiDir = join(tempDir, "apps", "api");
      const queueDir = join(tempDir, "packages", "queue");
      await mkdir(apiDir, { recursive: true });
      await mkdir(queueDir, { recursive: true });

      await writeFile(join(apiDir, ".env.example"), "PORT=4000\n");
      await writeFile(join(apiDir, ".env"), "PORT=4000\n");
      await writeFile(
        join(queueDir, ".env.example"),
        "REDIS_HOST=127.0.0.1\nREDIS_PORT=6379\n",
      );

      expect(await detectWorkspaceEnvFileName(tempDir)).toBe(".env");

      const res = await initializeModuleEnv(queueDir, tempDir);
      expect(res.created).toBe(true);
      expect(res.envFileName).toBe(".env");

      const envGroup = await checkEnv(tempDir);
      expect(envGroup.checks.every((c) => c.status === "pass")).toBe(true);
      const queueCheck = envGroup.checks.find(
        (c) => c.id === "env-keys-packages/queue",
      );
      expect(queueCheck?.status).toBe("pass");
      expect(queueCheck?.label).toBe("packages/queue/.env");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("synchronizes BETTER_AUTH_SECRET with existing workspace secret or generates one", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-mod-auth-"));

    try {
      const apiDir = join(tempDir, "apps", "api");
      const authDir = join(tempDir, "packages", "auth");
      await mkdir(apiDir, { recursive: true });
      await mkdir(authDir, { recursive: true });

      const existingSecret = "existing-valid-better-auth-secret-over-32-chars";
      await writeFile(
        join(apiDir, ".env.example"),
        "BETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n",
      );
      await writeFile(
        join(apiDir, ".env.local"),
        `BETTER_AUTH_SECRET="${existingSecret}"\n`,
      );

      await writeFile(
        join(authDir, ".env.example"),
        "BETTER_AUTH_URL=http://localhost:4000\nBETTER_AUTH_SECRET=your-betterauth-secret-key-min-32-chars\n",
      );

      const res = await initializeModuleEnv(authDir, tempDir);
      expect(res.created).toBe(true);
      expect(res.envFileName).toBe(".env.local");

      const authEnvMap = parseEnvFileMap(
        await readFile(res.envFilePath, "utf8"),
      );
      expect(authEnvMap.get("BETTER_AUTH_SECRET")).toBe(existingSecret);

      const envGroup = await checkEnv(tempDir);
      expect(envGroup.checks.every((c) => c.status === "pass")).toBe(true);
      expect(
        envGroup.checks.find((c) => c.id === "env-auth-secret-sync"),
      ).toBeUndefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Docker Compose Transformer", () => {
  it("merges missing service into docker-compose.yml", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-dc-"));
    const targetFile = join(tempDir, "docker-compose.yml");

    try {
      await writeFile(
        targetFile,
        `services:\n  postgres:\n    image: postgres:16-alpine\n`,
      );

      const result = await mergeDockerComposeService(targetFile, "redis", {
        image: "redis:7-alpine",
        ports: ["127.0.0.1:6379:6379"],
      });

      expect(result.changed).toBe(true);
      expect(result.serviceAdded).toBe("redis");

      const content = await readFile(targetFile, "utf8");
      expect(content).toContain("postgres:16-alpine");
      expect(content).toContain("redis:7-alpine");

      // Idempotency check: merging again should do nothing
      const retry = await mergeDockerComposeService(targetFile, "redis", {
        image: "redis:7-alpine",
      });
      expect(retry.changed).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Catalog Adaptation", () => {
  it("preserves catalog: when pnpm workspace has the catalog entry", () => {
    const pkg = {
      dependencies: {
        bullmq: "catalog:core",
        zod: "catalog:core",
      },
    };
    const targetCatalogs = {
      core: {
        bullmq: "^5.41.0",
        zod: "^4.3.6",
      },
    };

    const adapted = adaptPackageDependencies(pkg, targetCatalogs, "pnpm");
    expect(adapted.dependencies).toEqual({
      bullmq: "catalog:core",
      zod: "catalog:core",
    });
  });

  it("resolves catalog: to concrete semver for npm or workspaces without catalogs", () => {
    const pkg = {
      dependencies: {
        bullmq: "catalog:core",
        zod: "catalog:core",
        stripe: "catalog:core",
        ai: "catalog:core",
        "@ai-sdk/openai": "catalog:core",
        "@ai-sdk/anthropic": "catalog:core",
        "posthog-js": "catalog:core",
        "posthog-node": "catalog:core",
      },
    };

    const adapted = adaptPackageDependencies(pkg, null, "npm");
    const deps = adapted.dependencies as Record<string, string>;
    expect(deps.bullmq).toBe(DEFAULT_CATALOGS.core.bullmq);
    expect(deps.zod).toBe(DEFAULT_CATALOGS.core.zod);
    expect(deps.stripe).toBe("^23.2.0");
    expect(deps.ai).toBe("^7.0.179");
    expect(deps["@ai-sdk/openai"]).toBe("^4.0.122");
    expect(deps["@ai-sdk/anthropic"]).toBe("^4.0.107");
    expect(deps["posthog-js"]).toBe("^1.453.3");
    expect(deps["posthog-node"]).toBe("^6.0.6");
  });

  it("converts workspace:* to * for npm workspaces", () => {
    const pkg = {
      dependencies: {
        "@workspace/contracts": "workspace:*",
      },
    };

    const adapted = adaptPackageDependencies(pkg, null, "npm");
    const deps = adapted.dependencies as Record<string, string>;
    expect(deps["@workspace/contracts"]).toBe("*");
  });
});

describe("App Linking", () => {
  it("injects workspace dependency into app package.json", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-app-"));
    const pkgPath = join(tempDir, "package.json");

    try {
      await writeFile(
        pkgPath,
        JSON.stringify(
          {
            name: "api",
            dependencies: {
              express: "^5.2.1",
            },
          },
          null,
          2,
        ),
      );

      const linked = await linkPackageToApp(
        pkgPath,
        "@workspace/queue",
        "pnpm",
      );
      expect(linked).toBe(true);

      const content = JSON.parse(await readFile(pkgPath, "utf8"));
      expect(content.dependencies["@workspace/queue"]).toBe("workspace:*");
      expect(content.dependencies.express).toBe("^5.2.1");

      // Idempotency: second call returns false
      const retry = await linkPackageToApp(pkgPath, "@workspace/queue", "pnpm");
      expect(retry).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Module Status & Listing", () => {
  it("detects installed packages in workspace", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "stackbase-test-list-"));
    try {
      const { mkdir } = await import("node:fs/promises");
      await mkdir(join(tempDir, "packages/queue"), { recursive: true });

      const statuses = await getModulesStatus(tempDir);
      const queueStatus = statuses.find((s) => s.name === "queue");
      const storageStatus = statuses.find((s) => s.name === "storage");

      expect(queueStatus?.installed).toBe(true);
      expect(storageStatus?.installed).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Git Status Check", () => {
  it("returns a boolean for git status", async () => {
    const clean = await isGitClean();
    expect(typeof clean).toBe("boolean");
  });
});
