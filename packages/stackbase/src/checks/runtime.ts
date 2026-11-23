import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { directoryExists, exec } from "../utils.js";
import type { CheckGroup, CheckResult } from "./types.js";

export interface RuntimeCheckDeps {
  nodeVersion?: string;
  execCommand?: (cmd: string) => Promise<{ stdout: string; stderr: string }>;
}

/**
 * Parses a version string like "v24.2.0" or ">=24" into major/minor/patch numbers.
 */
export const parseSemver = (
  version: string,
): { major: number; minor: number; patch: number } | null => {
  const cleaned = version.trim().replace(/^[^\d]*/, "");
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    major: Number.parseInt(match[1] ?? "0", 10),
    minor: Number.parseInt(match[2] ?? "0", 10),
    patch: Number.parseInt(match[3] ?? "0", 10),
  };
};

/**
 * Extracts minimum major version from an engines.node range (e.g. ">=24", ">=24.0.0", "^24").
 */
export const parseMinMajorVersion = (
  engineRange: string | undefined,
  defaultMajor: number = 24,
): number => {
  if (!engineRange) return defaultMajor;
  const parsed = parseSemver(engineRange);
  return parsed ? parsed.major : defaultMajor;
};

/**
 * Detects which package manager is configured for the project.
 */
export const detectProjectPackageManager = async (
  projectRoot: string,
): Promise<{
  manager: "pnpm" | "npm" | "bun";
  expectedVersion?: string;
  source: string;
}> => {
  try {
    const pkgPath = join(projectRoot, "package.json");
    const raw = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { packageManager?: string };

    if (pkg.packageManager) {
      const [name, version] = pkg.packageManager.split("@");
      if (name === "pnpm" || name === "npm" || name === "bun") {
        return {
          manager: name,
          expectedVersion: version,
          source: `packageManager (${pkg.packageManager})`,
        };
      }
    }
  } catch {
    // Fallback to lockfile detection
  }

  if (await directoryExists(join(projectRoot, "pnpm-lock.yaml"))) {
    return { manager: "pnpm", source: "pnpm-lock.yaml" };
  }
  if (await directoryExists(join(projectRoot, "pnpm-workspace.yaml"))) {
    return { manager: "pnpm", source: "pnpm-workspace.yaml" };
  }
  if (
    (await directoryExists(join(projectRoot, "bun.lockb"))) ||
    (await directoryExists(join(projectRoot, "bun.lock")))
  ) {
    return { manager: "bun", source: "bun.lock" };
  }
  if (await directoryExists(join(projectRoot, "package-lock.json"))) {
    return { manager: "npm", source: "package-lock.json" };
  }

  return { manager: "pnpm", source: "default" };
};

/**
 * Checks Node.js version (>= 24) and package manager compatibility.
 */
export const checkRuntime = async (
  projectRoot: string = process.cwd(),
  deps: RuntimeCheckDeps = {},
): Promise<CheckGroup> => {
  const checks: CheckResult[] = [];
  const currentNode = deps.nodeVersion ?? process.versions.node;
  const runCmd =
    deps.execCommand ??
    ((cmd: string) => exec(cmd, { cwd: projectRoot, encoding: "utf8" }));

  // 1. Read root package.json engines.node
  let engineConstraint = ">=24";
  try {
    const pkgRaw = await readFile(join(projectRoot, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw) as { engines?: { node?: string } };
    if (pkg.engines?.node) {
      engineConstraint = pkg.engines.node;
    }
  } catch {
    // Use default >=24
  }

  const minMajor = Math.max(parseMinMajorVersion(engineConstraint, 24), 24);
  const parsedNode = parseSemver(currentNode);

  if (!parsedNode) {
    checks.push({
      id: "node-version",
      label: `Node.js (${currentNode})`,
      status: "warn",
      detail: "Could not parse current Node.js version",
    });
  } else if (parsedNode.major < minMajor) {
    checks.push({
      id: "node-version",
      label: `Node.js v${currentNode}`,
      status: "fail",
      detail: `Requires Node.js >= ${minMajor} (configured: ${engineConstraint})`,
      remedy: `Switch to Node.js ${minMajor}+ (e.g. \`nvm install ${minMajor} && nvm use ${minMajor}\` or \`fnm use ${minMajor}\`)`,
    });
  } else {
    checks.push({
      id: "node-version",
      label: `Node.js v${currentNode}`,
      status: "pass",
      detail: `Satisfies engines.node (${engineConstraint})`,
    });
  }

  // 2. Check package manager compatibility
  const pmInfo = await detectProjectPackageManager(projectRoot);
  try {
    const { stdout } = await runCmd(`${pmInfo.manager} --version`);
    const installedVersion = stdout.trim();
    const installedSemver = parseSemver(installedVersion);
    const expectedSemver = pmInfo.expectedVersion
      ? parseSemver(pmInfo.expectedVersion)
      : null;

    if (
      expectedSemver &&
      installedSemver &&
      installedSemver.major !== expectedSemver.major
    ) {
      checks.push({
        id: "package-manager",
        label: `${pmInfo.manager} v${installedVersion}`,
        status: "warn",
        detail: `Workspace expects ${pmInfo.manager}@${pmInfo.expectedVersion} (major version mismatch)`,
        remedy: `Run \`corepack enable && corepack prepare ${pmInfo.manager}@${pmInfo.expectedVersion} --activate\``,
      });
    } else {
      checks.push({
        id: "package-manager",
        label: `${pmInfo.manager} v${installedVersion}`,
        status: "pass",
        detail: pmInfo.expectedVersion
          ? `Compatible with ${pmInfo.source}`
          : `Detected via ${pmInfo.source}`,
      });
    }
  } catch {
    checks.push({
      id: "package-manager",
      label: `${pmInfo.manager} not found`,
      status: "fail",
      detail: `Required package manager "${pmInfo.manager}" (${pmInfo.source}) is not installed or not in PATH`,
      remedy:
        pmInfo.manager === "pnpm"
          ? "Run `corepack enable pnpm` or `npm install -g pnpm`"
          : `Install ${pmInfo.manager} and ensure it is available in your PATH`,
    });
  }

  return {
    name: "runtime",
    title: "Runtime & Package Manager",
    checks,
  };
};
