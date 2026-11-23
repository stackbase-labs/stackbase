import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import yaml from "yaml";
import { DEFAULT_CATALOGS } from "../transformers/catalog.js";
import { directoryExists } from "../utils.js";
import type { CheckGroup, CheckResult } from "./types.js";

interface WorkspacePackageInfo {
  name: string;
  dir: string;
  relPath: string;
  dependencies: Record<string, string>;
}

/**
 * Collects all package.json manifests across root, apps/*, and packages/*.
 */
export const discoverWorkspacePackages = async (
  projectRoot: string,
): Promise<WorkspacePackageInfo[]> => {
  const packages: WorkspacePackageInfo[] = [];

  const readManifestAt = async (dir: string) => {
    const pkgPath = join(dir, "package.json");
    if (!(await directoryExists(pkgPath))) return;
    try {
      const raw = await readFile(pkgPath, "utf8");
      const parsed = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };

      const deps: Record<string, string> = {
        ...parsed.peerDependencies,
        ...parsed.devDependencies,
        ...parsed.dependencies,
      };

      const relPath =
        relative(projectRoot, dir).replaceAll("\\", "/") || "package.json";
      packages.push({
        name: parsed.name ?? relPath,
        dir,
        relPath:
          relPath === "package.json"
            ? "package.json"
            : `${relPath}/package.json`,
        dependencies: deps,
      });
    } catch {
      // Ignore malformed package.json
    }
  };

  await readManifestAt(projectRoot);

  for (const parent of ["apps", "packages"]) {
    const parentDir = join(projectRoot, parent);
    if (!(await directoryExists(parentDir))) continue;

    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        await readManifestAt(join(parentDir, entry.name));
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return packages;
};

/**
 * Parses pnpm-workspace.yaml to retrieve default `catalog` and named `catalogs`.
 */
export const readPnpmWorkspaceCatalogs = async (
  projectRoot: string,
): Promise<{
  exists: boolean;
  defaultCatalog: Record<string, string>;
  namedCatalogs: Record<string, Record<string, string>>;
}> => {
  const wsPath = join(projectRoot, "pnpm-workspace.yaml");
  if (!(await directoryExists(wsPath))) {
    return { exists: false, defaultCatalog: {}, namedCatalogs: {} };
  }

  try {
    const raw = await readFile(wsPath, "utf8");
    const doc = yaml.parse(raw) as {
      catalog?: Record<string, string>;
      catalogs?: Record<string, Record<string, string>>;
    };
    return {
      exists: true,
      defaultCatalog: doc?.catalog ?? {},
      namedCatalogs: doc?.catalogs ?? {},
    };
  } catch {
    return { exists: true, defaultCatalog: {}, namedCatalogs: {} };
  }
};

/**
 * Checks catalog consistency and workspace:* references across all workspace packages.
 */
export const checkWorkspace = async (
  projectRoot: string = process.cwd(),
): Promise<CheckGroup> => {
  const checks: CheckResult[] = [];
  const packages = await discoverWorkspacePackages(projectRoot);

  if (packages.length === 0) {
    checks.push({
      id: "workspace-root",
      label: "Monorepo workspace",
      status: "fail",
      detail: "No package.json found in current directory",
      remedy: "Run `stackbase doctor` from the root of your Stackbase monorepo",
    });
    return {
      name: "workspace",
      title: "Catalog & Workspace Consistency",
      checks,
    };
  }

  const knownPackageNames = new Set(packages.map((p) => p.name));
  const catalogData = await readPnpmWorkspaceCatalogs(projectRoot);

  const brokenWorkspaceRefs: Array<{
    pkgFile: string;
    depName: string;
    specifier: string;
  }> = [];

  const brokenCatalogRefs: Array<{
    pkgFile: string;
    depName: string;
    catalogName: string;
    reason: string;
    fallbackVersion?: string;
  }> = [];

  let totalWorkspaceRefs = 0;
  let totalCatalogRefs = 0;

  for (const pkg of packages) {
    for (const [depName, specifier] of Object.entries(pkg.dependencies)) {
      if (typeof specifier !== "string") continue;

      // 1. Check workspace:* references
      if (specifier.startsWith("workspace:")) {
        totalWorkspaceRefs++;
        if (!knownPackageNames.has(depName)) {
          brokenWorkspaceRefs.push({
            pkgFile: pkg.relPath,
            depName,
            specifier,
          });
        }
      }

      // 2. Check catalog: references
      if (specifier.startsWith("catalog:")) {
        totalCatalogRefs++;
        const catalogName = specifier.slice("catalog:".length).trim();

        if (!catalogData.exists) {
          brokenCatalogRefs.push({
            pkgFile: pkg.relPath,
            depName,
            catalogName: catalogName || "default",
            reason: "pnpm-workspace.yaml is missing",
          });
          continue;
        }

        if (!catalogName || catalogName === "default") {
          if (!catalogData.defaultCatalog[depName]) {
            brokenCatalogRefs.push({
              pkgFile: pkg.relPath,
              depName,
              catalogName: "default",
              reason: `"${depName}" is missing in root catalog of pnpm-workspace.yaml`,
            });
          }
        } else {
          const namedCatalog = catalogData.namedCatalogs[catalogName];
          const fallbackVersion = DEFAULT_CATALOGS[catalogName]?.[depName];
          if (!namedCatalog) {
            brokenCatalogRefs.push({
              pkgFile: pkg.relPath,
              depName,
              catalogName,
              reason: `Catalog "${catalogName}" is not defined in pnpm-workspace.yaml`,
              fallbackVersion,
            });
          } else if (!namedCatalog[depName]) {
            brokenCatalogRefs.push({
              pkgFile: pkg.relPath,
              depName,
              catalogName,
              reason: `"${depName}" is missing in catalogs.${catalogName}`,
              fallbackVersion,
            });
          }
        }
      }
    }
  }

  // Evaluate workspace references check
  if (brokenWorkspaceRefs.length > 0) {
    const details = brokenWorkspaceRefs
      .map((b) => `${b.depName} (${b.specifier}) in ${b.pkgFile}`)
      .join(", ");
    checks.push({
      id: "workspace-refs",
      label: "Workspace package references",
      status: "fail",
      detail: `Found ${brokenWorkspaceRefs.length} unresolved workspace reference(s): ${details}`,
      remedy:
        "Install the missing module with `stackbase add <module>` or remove the dangling dependency from package.json",
    });
  } else {
    checks.push({
      id: "workspace-refs",
      label: `Workspace references (${packages.length} packages)`,
      status: "pass",
      detail:
        totalWorkspaceRefs > 0
          ? `All ${totalWorkspaceRefs} workspace:* dependencies resolve to local packages`
          : `Discovered ${packages.length} workspace packages`,
    });
  }

  // Evaluate catalog consistency check
  if (brokenCatalogRefs.length > 0) {
    const details = brokenCatalogRefs
      .map(
        (b) =>
          `${b.depName} (catalog:${b.catalogName === "default" ? "" : b.catalogName}) in ${b.pkgFile}`,
      )
      .join(", ");

    const fixableRefs = brokenCatalogRefs.filter(
      (b) =>
        b.fallbackVersion && catalogData.exists && b.catalogName !== "default",
    );

    checks.push({
      id: "catalog-consistency",
      label: "Catalog consistency",
      status: "fail",
      detail: `Found ${brokenCatalogRefs.length} unresolved catalog reference(s): ${details}`,
      remedy:
        fixableRefs.length > 0
          ? "Add the missing entry to `pnpm-workspace.yaml` under `catalogs:` or run `stackbase doctor --fix`"
          : "Define the missing package version in `pnpm-workspace.yaml` under `catalogs:`",
      fixable: fixableRefs.length > 0,
      fix:
        fixableRefs.length > 0
          ? async () => {
              const wsPath = join(projectRoot, "pnpm-workspace.yaml");
              const raw = await readFile(wsPath, "utf8");
              const doc = yaml.parseDocument(raw);

              const repaired: string[] = [];
              for (const item of fixableRefs) {
                if (!item.fallbackVersion) continue;
                doc.setIn(
                  ["catalogs", item.catalogName, item.depName],
                  item.fallbackVersion,
                );
                repaired.push(`${item.catalogName}.${item.depName}`);
              }

              await writeFile(wsPath, doc.toString());
              return `Added missing catalog entries (${repaired.join(", ")}) to pnpm-workspace.yaml`;
            }
          : undefined,
    });
  } else if (catalogData.exists || totalCatalogRefs > 0) {
    const catalogCount = Object.keys(catalogData.namedCatalogs).length;
    checks.push({
      id: "catalog-consistency",
      label: "Catalog consistency",
      status: "pass",
      detail: `All ${totalCatalogRefs} catalog:* references resolve across ${catalogCount} catalog(s)`,
    });
  } else {
    checks.push({
      id: "catalog-consistency",
      label: "Catalog consistency",
      status: "skip",
      detail: "No pnpm catalog references used in this workspace",
    });
  }

  // Check if node_modules exists
  const hasNodeModules = await directoryExists(
    join(projectRoot, "node_modules"),
  );
  if (!hasNodeModules) {
    checks.push({
      id: "workspace-node-modules",
      label: "Dependencies installed (node_modules)",
      status: "warn",
      detail: "Root node_modules directory is missing",
      remedy: "Run `pnpm install` to install workspace dependencies",
    });
  } else {
    checks.push({
      id: "workspace-node-modules",
      label: "Dependencies installed (node_modules)",
      status: "pass",
      detail: "Root node_modules directory is present",
    });
  }

  return {
    name: "workspace",
    title: "Catalog & Workspace Consistency",
    checks,
  };
};
