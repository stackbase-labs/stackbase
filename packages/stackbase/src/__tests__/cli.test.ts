import { describe, it, expect } from "vitest";
import {
  normalizeTemplateName,
  getTemplatePath,
  getTemplateFilePath,
  templateRegistry,
  templateAliases,
  templateNames,
} from "../templates.js";
import { getDescription } from "../utils.js";
import { applyPackageJsonCleanup } from "../update.js";
import {
  buildManifest,
  resolveFeatures,
  type StackbaseManifest,
} from "../manifest.js";

describe("Template normalization and aliases", () => {
  it("normalizes canonical template names correctly", () => {
    expect(normalizeTemplateName("base")).toBe("base");
    expect(normalizeTemplateName("web")).toBe("web");
    expect(normalizeTemplateName("api")).toBe("api");
  });

  it("normalizes the legacy fullstack alias to canonical base", () => {
    expect(normalizeTemplateName("fullstack")).toBe("base");
    expect(templateAliases.fullstack).toBe("base");
  });

  it("returns null for invalid or unknown template names", () => {
    expect(normalizeTemplateName("invalid")).toBeNull();
    expect(normalizeTemplateName("")).toBeNull();
    expect(normalizeTemplateName("react")).toBeNull();
    expect(normalizeTemplateName("express")).toBeNull();
  });

  it("contains all canonical template names in templateNames", () => {
    expect(templateNames).toEqual(["base", "web", "api"]);
  });
});

describe("Template capabilities", () => {
  it("defines correct capabilities for the base template", () => {
    expect(templateRegistry.base.capabilities).toEqual({
      docker: true,
      kubernetes: true,
      observability: true,
      studio: true,
    });
  });

  it("defines correct capabilities for the web template (no kubernetes, no observability)", () => {
    expect(templateRegistry.web.capabilities).toEqual({
      docker: true,
      kubernetes: false,
      observability: false,
      studio: true,
    });
  });

  it("defines correct capabilities for the api template (observability yes, no kubernetes)", () => {
    expect(templateRegistry.api.capabilities).toEqual({
      docker: true,
      kubernetes: false,
      observability: true,
      studio: true,
    });
  });
});

describe("Upgrade and diff template path resolution", () => {
  it("resolves the correct root template path for canonical templates", () => {
    expect(getTemplatePath("base")).toBe("templates/base");
    expect(getTemplatePath("web")).toBe("templates/web");
    expect(getTemplatePath("api")).toBe("templates/api");
  });

  it("resolves the correct root template path for the legacy fullstack alias", () => {
    expect(getTemplatePath("fullstack")).toBe("templates/base");
  });

  it("defaults to templates/base for unknown templates", () => {
    expect(getTemplatePath("unknown")).toBe("templates/base");
  });

  it("resolves the correct template file path for diff and upgrade", () => {
    expect(getTemplateFilePath("base", "package.json")).toBe(
      "templates/base/package.json",
    );
    expect(getTemplateFilePath("fullstack", "package.json")).toBe(
      "templates/base/package.json",
    );
    expect(getTemplateFilePath("web", "apps/web/next.config.ts")).toBe(
      "templates/web/apps/web/next.config.ts",
    );
    expect(getTemplateFilePath("api", "apps/api/src/index.ts")).toBe(
      "templates/api/apps/api/src/index.ts",
    );
  });

  it("normalizes Windows backslashes in template file paths", () => {
    expect(getTemplateFilePath("base", "apps\\web\\next.config.ts")).toBe(
      "templates/base/apps/web/next.config.ts",
    );
    expect(getTemplateFilePath("fullstack", "apps\\api\\package.json")).toBe(
      "templates/base/apps/api/package.json",
    );
  });
});

describe("Manifest recording and feature resolution", () => {
  it("resolves features accurately from manifest", async () => {
    const baseManifest: StackbaseManifest = {
      version: 1,
      commit: "abcdef123456",
      template: "base",
      projectName: "my-app",
      scaffoldedAt: new Date().toISOString(),
      features: {
        docker: true,
        kubernetes: true,
        studio: true,
        observability: true,
      },
      files: {},
    };

    const resolvedBase = await resolveFeatures(baseManifest);
    expect(resolvedBase).toEqual({
      docker: true,
      kubernetes: true,
      studio: true,
      observability: true,
    });
  });

  it("ensures web template manifest features do not claim observability", async () => {
    const webManifest: StackbaseManifest = {
      version: 1,
      commit: "abcdef123456",
      template: "web",
      projectName: "my-web-app",
      scaffoldedAt: new Date().toISOString(),
      features: {
        docker: true,
        kubernetes: false,
        studio: true,
        observability: false,
      },
      files: {},
    };

    const resolvedWeb = await resolveFeatures(webManifest);
    expect(resolvedWeb.kubernetes).toBe(false);
    expect(resolvedWeb.observability).toBe(false);
  });

  it("handles legacy manifests without observability field by defaulting web to false", async () => {
    const legacyWebManifest: StackbaseManifest = {
      version: 1,
      commit: "abcdef123456",
      template: "web",
      projectName: "my-web-app",
      scaffoldedAt: new Date().toISOString(),
      features: {
        docker: true,
        kubernetes: false,
        studio: true,
      },
      files: {},
    };

    const resolved = await resolveFeatures(legacyWebManifest);
    expect(resolved.observability).toBe(false);
  });
});

describe("Descriptions and package.json cleanup", () => {
  it("resolves description for canonical templates and legacy alias", () => {
    const baseDesc = getDescription("base");
    expect(baseDesc).toContain("Full-stack application");

    // fullstack alias should resolve to base description
    const fullstackDesc = getDescription("fullstack");
    expect(fullstackDesc).toBe(baseDesc);

    expect(getDescription("web")).toContain("Frontend application");
    expect(getDescription("api")).toContain("Backend API");
    expect(getDescription("unknown")).toBe("");
  });

  it("cleans up package.json for web template (removes observability and k8s)", () => {
    const initialPkg = JSON.stringify({
      name: "stackbase",
      scripts: {
        build: "turbo build",
        "docker:dev": "docker-compose up",
        "docker:observability": "docker-compose -f observability.yml up",
        "docker:prod": "docker-compose -f prod.yml up",
        "k8s:deploy": "sh deploy.sh",
        "k8s:verify": "sh verify.sh",
      },
    });

    const cleaned = JSON.parse(
      applyPackageJsonCleanup(initialPkg, "web", true, false, false),
    );

    expect(cleaned.scripts["docker:dev"]).toBeDefined();
    expect(cleaned.scripts["docker:prod"]).toBeDefined();
    expect(cleaned.scripts["docker:observability"]).toBeUndefined();
    expect(cleaned.scripts["k8s:deploy"]).toBeUndefined();
    expect(cleaned.scripts["k8s:verify"]).toBeUndefined();
  });

  it("cleans up package.json for api template (keeps observability, removes k8s)", () => {
    const initialPkg = JSON.stringify({
      name: "stackbase",
      scripts: {
        build: "turbo build",
        "docker:dev": "docker-compose up",
        "docker:observability": "docker-compose -f observability.yml up",
        "docker:prod": "docker-compose -f prod.yml up",
        "k8s:deploy": "sh deploy.sh",
        "k8s:verify": "sh verify.sh",
      },
    });

    const cleaned = JSON.parse(
      applyPackageJsonCleanup(initialPkg, "api", true, false, true),
    );

    expect(cleaned.scripts["docker:dev"]).toBeDefined();
    expect(cleaned.scripts["docker:prod"]).toBeDefined();
    expect(cleaned.scripts["docker:observability"]).toBeDefined();
    expect(cleaned.scripts["k8s:deploy"]).toBeUndefined();
    expect(cleaned.scripts["k8s:verify"]).toBeUndefined();
  });

  it("removes all docker and observability scripts when includeDocker is false", () => {
    const initialPkg = JSON.stringify({
      name: "stackbase",
      scripts: {
        build: "turbo build",
        "docker:dev": "docker-compose up",
        "docker:observability": "docker-compose -f observability.yml up",
        "docker:prod": "docker-compose -f prod.yml up",
        "k8s:deploy": "sh deploy.sh",
        "k8s:verify": "sh verify.sh",
      },
    });

    const cleaned = JSON.parse(
      applyPackageJsonCleanup(initialPkg, "base", false, false, false),
    );

    expect(cleaned.scripts["docker:dev"]).toBeUndefined();
    expect(cleaned.scripts["docker:prod"]).toBeUndefined();
    expect(cleaned.scripts["docker:observability"]).toBeUndefined();
  });
});

describe("Canonical template recording and option validation", () => {
  it("records canonical template 'base' in manifest when initialized with alias 'fullstack'", async () => {
    const rawTemplateOption = "fullstack";
    const canonicalTemplate = normalizeTemplateName(rawTemplateOption);
    expect(canonicalTemplate).toBe("base");

    // In initialize.ts, normalizeTemplateName is called on options.template,
    // and the resulting canonical template is passed to buildManifest.
    const manifest = await buildManifest(
      "test-sha-123456",
      canonicalTemplate!,
      "my-fullstack-app",
      {
        docker: true,
        kubernetes: true,
        studio: true,
        observability: true,
      },
    );

    expect(manifest.template).toBe("base");
    expect(manifest.projectName).toBe("my-fullstack-app");
    expect(manifest.version).toBe(1);
    expect(manifest.features.kubernetes).toBe(true);
  });

  it("records canonical template 'web' with template-appropriate features", async () => {
    const rawTemplateOption = "web";
    const canonicalTemplate = normalizeTemplateName(rawTemplateOption);
    expect(canonicalTemplate).toBe("web");

    const manifest = await buildManifest(
      "test-sha-123456",
      canonicalTemplate!,
      "my-web-app",
      {
        docker: true,
        kubernetes: false,
        studio: true,
        observability: false,
      },
    );

    expect(manifest.template).toBe("web");
    expect(manifest.features.kubernetes).toBe(false);
    expect(manifest.features.observability).toBe(false);
  });

  it("validates template option rejecting invalid templates", () => {
    const validateOption = (template?: string): string | null => {
      if (!template) return null;
      const normalized = normalizeTemplateName(template);
      if (!normalized) {
        return `Invalid template: ${template}. Choose from: base, web, api`;
      }
      return null;
    };

    expect(validateOption("base")).toBeNull();
    expect(validateOption("web")).toBeNull();
    expect(validateOption("api")).toBeNull();
    expect(validateOption("fullstack")).toBeNull();

    expect(validateOption("unknown")).toBe(
      "Invalid template: unknown. Choose from: base, web, api",
    );
    expect(validateOption("nextjs")).toBe(
      "Invalid template: nextjs. Choose from: base, web, api",
    );
  });
});
