import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Detects the monorepo package scope prefix (e.g., '@workspace', '@repo', '@acme')
 * by inspecting existing packages under packages/* and apps/* or root package.json.
 */
export const detectWorkspaceScope = async (
  projectRoot: string = process.cwd(),
): Promise<string> => {
  const candidateDirs = [
    join(projectRoot, "packages"),
    join(projectRoot, "apps"),
  ];

  for (const dir of candidateDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pkgPath = join(dir, entry.name, "package.json");
        try {
          const content = await readFile(pkgPath, "utf8");
          const pkg = JSON.parse(content) as { name?: string };
          if (pkg.name && pkg.name.startsWith("@") && pkg.name.includes("/")) {
            const scope = pkg.name.split("/")[0];
            if (scope) return scope;
          }
        } catch {
          // ignore unreadable package.json
        }
      }
    } catch {
      // directory doesn't exist
    }
  }

  // Fallback to checking root package.json
  try {
    const rootPkgPath = join(projectRoot, "package.json");
    const content = await readFile(rootPkgPath, "utf8");
    const pkg = JSON.parse(content) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    if (pkg.name && pkg.name.startsWith("@") && pkg.name.includes("/")) {
      const scope = pkg.name.split("/")[0];
      if (scope) return scope;
    }

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const dep of Object.keys(allDeps)) {
      if (dep.startsWith("@workspace/")) return "@workspace";
      if (dep.startsWith("@repo/")) return "@repo";
    }
  } catch {
    // ignore
  }

  return "@workspace";
};

/**
 * Replaces '@workspace/' with the target workspace scope (e.g. '@repo/') in a string.
 */
export const adaptScope = (content: string, targetScope: string): string => {
  if (targetScope === "@workspace") {
    return content;
  }
  return content.replaceAll("@workspace/", `${targetScope}/`);
};
