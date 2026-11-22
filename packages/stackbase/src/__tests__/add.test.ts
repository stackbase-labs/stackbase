import { describe, expect, it } from "vitest";
import { getAvailableModules, getModule, MODULE_REGISTRY } from "../modules.js";
import { adaptScope } from "../transformers/scope.js";
import { extractEnvKeys, mergeEnvExample } from "../transformers/env.js";
import { mergeDockerComposeService } from "../transformers/dockerCompose.js";
import {
  adaptPackageDependencies,
  DEFAULT_CATALOGS,
} from "../transformers/catalog.js";
import { linkPackageToApp } from "../transformers/appLink.js";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("retrieves module by name case-insensitively", () => {
    expect(getModule("QUEUE")).toBeDefined();
    expect(getModule("queue")?.name).toBe("queue");
    expect(getModule("nonexistent")).toBeUndefined();
  });

  it("lists all available modules", () => {
    const all = getAvailableModules();
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(all.some((m) => m.name === "queue")).toBe(true);
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
      },
    };

    const adapted = adaptPackageDependencies(pkg, null, "npm");
    const deps = adapted.dependencies as Record<string, string>;
    expect(deps.bullmq).toBe(DEFAULT_CATALOGS.core.bullmq);
    expect(deps.zod).toBe(DEFAULT_CATALOGS.core.zod);
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
