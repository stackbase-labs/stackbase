import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hashContent,
  MANIFEST_VERSION,
  type StackbaseManifest,
} from "../manifest.js";
import {
  convertLegacyManifest,
  parseLegacyManifest,
  type LegacyBuildElevateManifest,
} from "../migrate.js";
import { upgrade } from "../upgrade.js";

const legacyManifest = (
  overrides: Partial<LegacyBuildElevateManifest> = {},
): LegacyBuildElevateManifest => ({
  version: 1,
  commit: "abcdef123456",
  template: "fullstack",
  projectName: "my-app",
  scaffoldedAt: "2026-01-01T00:00:00.000Z",
  features: {
    docker: true,
    kubernetes: false,
    studio: true,
  },
  files: {
    "package.json": "a3f8c2d1b4e5",
  },
  ...overrides,
});

describe("Build Elevate manifest migration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a valid legacy manifest", () => {
    expect(parseLegacyManifest(JSON.stringify(legacyManifest()))).toEqual(
      legacyManifest(),
    );
  });

  it("rejects malformed or incomplete manifests", () => {
    expect(() => parseLegacyManifest("not json")).toThrow("invalid JSON");
    expect(() => parseLegacyManifest(JSON.stringify({ files: {} }))).toThrow(
      "commit field",
    );
    expect(() =>
      parseLegacyManifest(
        JSON.stringify({
          ...legacyManifest(),
          files: { "package.json": 42 },
        }),
      ),
    ).toThrow("files field");
    expect(() =>
      parseLegacyManifest(
        JSON.stringify({
          ...legacyManifest(),
          files: { "../outside.txt": "a3f8c2d1b4e5" },
        }),
      ),
    ).toThrow("unsafe file path");
  });

  it("maps fullstack to base and records the legacy source", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "stackbase-migrate-"));

    try {
      await writeFile(
        join(projectRoot, "docker-compose.observability.yml"),
        "services: {}\n",
      );

      const converted = await convertLegacyManifest(
        legacyManifest(),
        projectRoot,
      );

      expect(converted).toMatchObject({
        version: MANIFEST_VERSION,
        commit: "abcdef123456",
        template: "base",
        projectName: "my-app",
        source: "build-elevate",
        features: {
          docker: true,
          kubernetes: false,
          studio: true,
          observability: true,
        },
      });
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("infers missing feature flags and disables observability for web", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "stackbase-migrate-"));

    try {
      await mkdir(join(projectRoot, "apps", "studio"), { recursive: true });
      await mkdir(join(projectRoot, "k8s"));
      await writeFile(
        join(projectRoot, "docker-compose.prod.yml"),
        "services: {}\n",
      );
      await writeFile(
        join(projectRoot, "docker-compose.observability.yml"),
        "services: {}\n",
      );

      const converted = await convertLegacyManifest(
        legacyManifest({ template: "web", features: undefined }),
        projectRoot,
      );

      expect(converted.features).toEqual({
        docker: true,
        kubernetes: true,
        studio: true,
        observability: false,
      });
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("rejects unknown legacy template names", async () => {
    await expect(
      convertLegacyManifest(legacyManifest({ template: "mobile" })),
    ).rejects.toThrow("Unsupported Build Elevate template");
  });

  it("updates untouched files with display-title branding without overwriting new-file collisions", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "stackbase-migrate-"));
    const oldCommit = "abcdef123456";
    const latestCommit = "fedcba654321";
    const legacyBranding = "export const APP_TITLE = 'DealFlow360';\n";
    const latestBranding = await readFile(
      new URL(
        "../../../../templates/base/packages/email/src/branding.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const manifest: StackbaseManifest = {
      version: MANIFEST_VERSION,
      commit: oldCommit,
      template: "base",
      projectName: "deal-flow360",
      scaffoldedAt: "2026-01-01T00:00:00.000Z",
      features: {
        docker: false,
        kubernetes: false,
        studio: false,
        observability: false,
      },
      files: {
        "tracked.txt": hashContent("legacy\n"),
        "packages/email/src/branding.ts": hashContent(legacyBranding),
      },
      source: "build-elevate",
    };
    let persistedManifest: StackbaseManifest | undefined;

    try {
      await writeFile(join(projectRoot, "tracked.txt"), "legacy\n");
      await writeFile(join(projectRoot, "collision.txt"), "user content\n");
      await mkdir(join(projectRoot, "packages", "email", "src"), {
        recursive: true,
      });
      await writeFile(
        join(projectRoot, "packages", "email", "src", "branding.ts"),
        legacyBranding,
      );

      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string | URL | Request) => {
          const url = String(input);
          if (url.endsWith("/commits/main")) {
            return new Response(latestCommit);
          }
          if (url.includes(`/git/trees/${latestCommit}`)) {
            return Response.json({
              tree: [
                { path: "templates/base/tracked.txt", type: "blob" },
                { path: "templates/base/collision.txt", type: "blob" },
                {
                  path: "templates/base/packages/email/src/branding.ts",
                  type: "blob",
                },
              ],
            });
          }
          if (url.endsWith(`/${latestCommit}/templates/base/tracked.txt`)) {
            return new Response("latest\n");
          }
          if (url.endsWith(`/${latestCommit}/templates/base/collision.txt`)) {
            return new Response("template content\n");
          }
          if (
            url.endsWith(
              `/${latestCommit}/templates/base/packages/email/src/branding.ts`,
            )
          ) {
            return new Response(latestBranding);
          }
          return new Response(null, { status: 404 });
        }),
      );

      await upgrade({
        manifest,
        operation: "migration",
        projectRoot,
        persistManifest: async (updatedManifest) => {
          persistedManifest = structuredClone(updatedManifest);
        },
      });

      expect(await readFile(join(projectRoot, "tracked.txt"), "utf8")).toBe(
        "latest\n",
      );
      expect(await readFile(join(projectRoot, "collision.txt"), "utf8")).toBe(
        "user content\n",
      );
      expect(
        await readFile(
          join(projectRoot, "packages", "email", "src", "branding.ts"),
          "utf8",
        ),
      ).toContain("export const APP_TITLE = 'Deal Flow360';");
      expect(persistedManifest?.commit).toBe(oldCommit);
      expect(persistedManifest?.source).toBe("build-elevate");
      expect(persistedManifest?.files["collision.txt"]).toBeUndefined();
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
