import { createHash } from "node:crypto";
import { readFile, writeFile, access, readdir } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { MANIFEST_FILE } from "./branding.js";
import { toKebabCase } from "./utils.js";

export { MANIFEST_FILE };

// Increase this number whenever we change the shape of the manifest, so the
// upgrade and diff commands can tell which version of the file they're reading.
export const MANIFEST_VERSION = 2;

export const LEGACY_MANIFEST_FILE = ".build-elevate.json";
export const LEGACY_MANIFEST_BACKUP_FILE = ".build-elevate.json.bak";

export interface ManifestFeatures {
  docker: boolean;
  kubernetes: boolean;
  studio: boolean;
  observability?: boolean;
}

export interface StackbaseManifest {
  version: number; // which version of the manifest format this file uses (see MANIFEST_VERSION)
  commit: string; // exact git SHA cloned from main — source of truth for upgrade comparisons
  template: string;
  projectName: string;
  scaffoldedAt: string;
  features: ManifestFeatures; // the optional features the user chose to include when the project was created
  files: Record<string, string>; // filePath -> sha256 hash (first 12 chars)
  // Present until the first Build Elevate migration reaches a Stackbase commit.
  source?: "build-elevate";
}

/**
 * Works out which optional features a project includes.
 *
 * Newer manifests record this directly in the `features` field. Older manifests
 * were written before that field existed, so for those we figure it out by
 * looking at the project on disk: when a feature is turned down at setup time
 * its files are deleted, so a missing folder or file tells us it was left out.
 */
export const resolveFeatures = async (
  manifest: StackbaseManifest,
  projectRoot: string = process.cwd(),
): Promise<ManifestFeatures> => {
  const exists = async (p: string): Promise<boolean> => {
    try {
      await access(join(projectRoot, p));
      return true;
    } catch {
      return false;
    }
  };

  if (manifest.features) {
    return {
      docker: manifest.features.docker,
      kubernetes: manifest.features.kubernetes,
      studio: manifest.features.studio,
      observability:
        manifest.features.observability ??
        (manifest.template === "web"
          ? false
          : manifest.features.docker &&
            (await exists("docker-compose.observability.yml"))),
    };
  }

  return {
    docker: await exists("docker-compose.prod.yml"),
    kubernetes: await exists("k8s"),
    studio: await exists("apps/studio"),
    observability: await exists("docker-compose.observability.yml"),
  };
};

export const hashContent = (content: string): string => {
  const normalized = content.replace(/\r\n/g, "\n");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
};

export const hashFile = async (filePath: string): Promise<string | null> => {
  try {
    const content = await readFile(filePath, "utf8");
    return hashContent(content);
  } catch {
    return null;
  }
};

export const isSafeManifestFilePath = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.length > 0 &&
    !isAbsolute(filePath) &&
    !normalized.startsWith("/") &&
    !normalized.split("/").includes("..")
  );
};

export const resolveManifestFilePath = (
  projectRoot: string,
  filePath: string,
): string => {
  if (!isSafeManifestFilePath(filePath)) {
    throw new Error(`Manifest contains an unsafe file path: ${filePath}`);
  }

  const root = resolve(projectRoot);
  const target = resolve(root, filePath);
  const relativePath = relative(root, target);
  if (
    relativePath.length === 0 ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error(`Manifest contains an unsafe file path: ${filePath}`);
  }

  return target;
};

export const manifestExists = async (): Promise<boolean> => {
  try {
    await access(MANIFEST_FILE);
    return true;
  } catch {
    return false;
  }
};

export const legacyManifestExists = async (): Promise<boolean> => {
  try {
    await access(LEGACY_MANIFEST_FILE);
    return true;
  } catch {
    return false;
  }
};

const readManifestFile = async (
  filePath: string,
): Promise<StackbaseManifest | null> => {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as StackbaseManifest;
  } catch {
    return null;
  }
};

export const readManifest = async (): Promise<StackbaseManifest | null> => {
  return readManifestFile(MANIFEST_FILE);
};

export const writeManifest = async (
  manifest: StackbaseManifest,
  projectRoot: string = process.cwd(),
): Promise<void> => {
  await writeFile(
    join(projectRoot, MANIFEST_FILE),
    JSON.stringify(manifest, null, 2) + "\n",
  );
};

/**
 * Directories and files to never hash.
 * These are either user-owned, generated, or environment-specific.
 */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
  ".react-email",
  "packages/db/generated",
]);

const SKIP_FILES = new Set([
  // env files — user fills these in, never overwrite
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  // lock files — regenerated by package manager
  "pnpm-lock.yaml",
  "bun.lockb",
  "package-lock.json",
  "yarn.lock",
  // tsconfig build info — environment-specific
  "tsconfig.tsbuildinfo",
  // the manifest itself
  ".stackbase.json",
  LEGACY_MANIFEST_FILE,
  LEGACY_MANIFEST_BACKUP_FILE,
]);

const SKIP_EXTENSIONS = new Set([
  ".gz",
  ".zip",
  ".tar",
  ".tgz",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".map",
]);

/**
 * Recursively walk the directory and return all file paths relative to the root,
 * excluding any in SKIP_DIRS or SKIP_FILES or with SKIP_EXTENSIONS.
 * Normalize all paths to use forward slashes for cross-platform consistency.
 */
const walkDir = async (
  dir: string,
  root: string,
  results: string[] = [],
): Promise<string[]> => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    // Normalize to forward slashes for cross-platform consistency
    const relPath = relative(root, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      // Skip if the dir name itself is in SKIP_DIRS
      if (SKIP_DIRS.has(entry.name)) continue;
      // Skip if the relative path matches (e.g. "packages/db/generated")
      if (SKIP_DIRS.has(relPath)) continue;
      await walkDir(fullPath, root, results);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (SKIP_FILES.has(relPath)) continue;
      const ext = entry.name.includes(".")
        ? "." + entry.name.split(".").pop()!
        : "";
      if (SKIP_EXTENSIONS.has(ext)) continue;
      results.push(relPath);
    }
  }

  return results;
};

/**
 * Build the manifest by hashing all relevant files in the project directory.
 * The manifest includes the commit hash, template name, project name, timestamp, and a mapping of file paths to their content hashes.
 * Only files that are not in SKIP_DIRS, SKIP_FILES, or with SKIP_EXTENSIONS are included.
 */
export const buildManifest = async (
  commit: string,
  template: string,
  projectName: string,
  features: ManifestFeatures,
  projectRoot: string = process.cwd(),
): Promise<StackbaseManifest> => {
  const allFiles = await walkDir(projectRoot, projectRoot);
  const files: Record<string, string> = {};

  await Promise.all(
    allFiles.map(async (filePath) => {
      const hash = await hashFile(join(projectRoot, filePath));
      if (hash !== null) {
        files[filePath] = hash;
      }
    }),
  );

  return {
    version: MANIFEST_VERSION,
    commit,
    template,
    projectName: toKebabCase(projectName),
    scaffoldedAt: new Date().toISOString(),
    features,
    files,
  };
};
