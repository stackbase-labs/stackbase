import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface AvailableApp {
  name: string;
  path: string;
  packageJsonPath: string;
}

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Finds all available applications under apps/* in the workspace.
 */
export const findAvailableApps = async (
  projectRoot: string = process.cwd(),
): Promise<AvailableApp[]> => {
  const appsDir = join(projectRoot, "apps");
  const apps: AvailableApp[] = [];

  try {
    const entries = await readdir(appsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pkgPath = join(appsDir, entry.name, "package.json");
      if (await fileExists(pkgPath)) {
        apps.push({
          name: entry.name,
          path: join(appsDir, entry.name),
          packageJsonPath: pkgPath,
        });
      }
    }
  } catch {
    // apps directory doesn't exist
  }

  return apps;
};

/**
 * Injects the package into the chosen app's dependencies in package.json.
 */
export const linkPackageToApp = async (
  packageJsonPath: string,
  packageName: string,
  packageManager: string = "pnpm",
): Promise<boolean> => {
  try {
    const content = await readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      [key: string]: unknown;
    };

    if (!pkg.dependencies) {
      pkg.dependencies = {};
    }

    if (pkg.dependencies[packageName]) {
      return false; // already present
    }

    const versionSpec = packageManager === "npm" ? "*" : "workspace:*";
    pkg.dependencies[packageName] = versionSpec;

    // Keep dependencies sorted
    const sortedDeps: Record<string, string> = {};
    for (const key of Object.keys(pkg.dependencies).sort()) {
      const val = pkg.dependencies[key];
      if (val !== undefined) {
        sortedDeps[key] = val;
      }
    }
    pkg.dependencies = sortedDeps;

    await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
};
