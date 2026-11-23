import { copyFile, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { mergeEnvExample } from "../transformers/env.js";
import {
  directoryExists,
  generateSecret,
  updateAuthSecretInEnvFile,
} from "../utils.js";
import type { CheckGroup, CheckResult } from "./types.js";

/**
 * Parses an .env or .env.example file into a key -> value map.
 */
export const parseEnvFileMap = (content: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match?.[1]) {
      const key = match[1];
      const rawValue = (match[2] ?? "").trim();
      const unquoted = rawValue.replace(/^["']|["']$/g, "");
      map.set(key, unquoted);
    }
  }
  return map;
};

const PLACEHOLDER_PATTERNS: Record<string, RegExp[]> = {
  BETTER_AUTH_SECRET: [
    /^your-betterauth-secret/i,
    /^replace[-_]?me/i,
    /^changeme/i,
  ],
  GOOGLE_CLIENT_ID: [/^your-google-client-id/i],
  GOOGLE_CLIENT_SECRET: [/^GOCSPX-x+$/i, /^your-google-client-secret/i],
  RESEND_TOKEN: [/^re_x+$/i, /^your-resend/i],
};

/**
 * Discovers all directories in the monorepo (root, apps/*, packages/*) that contain an .env.example file.
 */
export const discoverEnvDirectories = async (
  projectRoot: string,
): Promise<string[]> => {
  const dirs: string[] = [];

  if (await directoryExists(join(projectRoot, ".env.example"))) {
    dirs.push(projectRoot);
  }

  for (const parent of ["apps", "packages"]) {
    const parentDir = join(projectRoot, parent);
    if (!(await directoryExists(parentDir))) continue;

    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidateDir = join(parentDir, entry.name);
        if (await directoryExists(join(candidateDir, ".env.example"))) {
          dirs.push(candidateDir);
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return dirs;
};

/**
 * Scans .env.example vs .env across the workspace to flag missing or misconfigured environment variables.
 */
export const checkEnv = async (
  projectRoot: string = process.cwd(),
): Promise<CheckGroup> => {
  const checks: CheckResult[] = [];
  const envDirs = await discoverEnvDirectories(projectRoot);

  if (envDirs.length === 0) {
    checks.push({
      id: "env-none",
      label: "Environment files (.env.example)",
      status: "skip",
      detail: "No .env.example files found in workspace",
    });
    return {
      name: "env",
      title: "Environment Variables (.env.example vs .env)",
      checks,
    };
  }

  // Pre-scan directories to detect whether workspace uses .env.local convention and whether a valid BETTER_AUTH_SECRET already exists
  const dirRecords = await Promise.all(
    envDirs.map(async (dir) => {
      const relDir = relative(projectRoot, dir).replaceAll("\\", "/") || ".";
      const examplePath = join(dir, ".env.example");
      const dotEnvPath = join(dir, ".env");
      const dotEnvLocalPath = join(dir, ".env.local");

      const [hasDotEnv, hasDotEnvLocal, exampleContent] = await Promise.all([
        directoryExists(dotEnvPath),
        directoryExists(dotEnvLocalPath),
        readFile(examplePath, "utf8"),
      ]);

      return {
        dir,
        relDir,
        examplePath,
        dotEnvPath,
        dotEnvLocalPath,
        hasDotEnv,
        hasDotEnvLocal,
        exampleContent,
        exampleMap: parseEnvFileMap(exampleContent),
      };
    }),
  );

  const usesEnvLocalConvention = dirRecords.some(
    (r) => r.hasDotEnvLocal && !r.hasDotEnv,
  );

  // Discover any existing valid BETTER_AUTH_SECRET so --fix keeps secrets synchronized across apps/api, apps/web, packages/auth
  const authSecretLocations: Array<{
    labelPrefix: string;
    envPath: string;
    secret: string;
  }> = [];
  let existingValidSecret: string | undefined;

  for (const rec of dirRecords) {
    const envMap = new Map<string, string>();
    if (rec.hasDotEnv) {
      const content = await readFile(rec.dotEnvPath, "utf8");
      for (const [k, v] of parseEnvFileMap(content)) envMap.set(k, v);
    }
    if (rec.hasDotEnvLocal) {
      const content = await readFile(rec.dotEnvLocalPath, "utf8");
      for (const [k, v] of parseEnvFileMap(content)) envMap.set(k, v);
    }
    const secret = envMap.get("BETTER_AUTH_SECRET");
    if (secret) {
      const activeFile = rec.hasDotEnvLocal ? ".env.local" : ".env";
      const labelPrefix =
        rec.relDir === "." ? activeFile : `${rec.relDir}/${activeFile}`;
      const isPlaceholder = (
        PLACEHOLDER_PATTERNS.BETTER_AUTH_SECRET ?? []
      ).some((re) => re.test(secret));
      if (!isPlaceholder && secret.length >= 32) {
        if (!existingValidSecret) existingValidSecret = secret;
        authSecretLocations.push({
          labelPrefix,
          envPath: join(rec.dir, activeFile),
          secret,
        });
      }
    }
  }

  const sharedAuthSecret = existingValidSecret ?? generateSecret(32);

  for (const rec of dirRecords) {
    const {
      dir,
      relDir,
      examplePath,
      dotEnvPath,
      dotEnvLocalPath,
      hasDotEnv,
      hasDotEnvLocal,
      exampleContent,
      exampleMap,
    } = rec;

    const exampleLabel =
      relDir === "." ? ".env.example" : `${relDir}/.env.example`;

    // Prefer existing file; when missing, use .env.local for sub-packages if workspace uses .env.local convention
    const defaultTargetFile =
      relDir !== "." && usesEnvLocalConvention ? ".env.local" : ".env";
    const activeEnvFile = hasDotEnv
      ? ".env"
      : hasDotEnvLocal
        ? ".env.local"
        : defaultTargetFile;
    const envPath = join(dir, activeEnvFile);
    const labelPrefix =
      relDir === "." ? activeEnvFile : `${relDir}/${activeEnvFile}`;

    if (!hasDotEnv && !hasDotEnvLocal) {
      checks.push({
        id: `env-missing-file-${relDir}`,
        label: labelPrefix,
        status: "fail",
        detail: `Missing ${labelPrefix} (found ${exampleLabel} with ${exampleMap.size} variables)`,
        remedy: `Copy \`${exampleLabel}\` to \`${labelPrefix}\` or run \`stackbase doctor --fix\``,
        fixable: true,
        fix: async () => {
          await copyFile(examplePath, envPath);
          if (exampleMap.has("BETTER_AUTH_SECRET")) {
            await updateAuthSecretInEnvFile(envPath, sharedAuthSecret);
          }
          return `Created ${labelPrefix} from ${exampleLabel}`;
        },
      });
      continue;
    }

    // Merge keys if both .env and .env.local exist (.env.local overrides .env)
    const envMap = new Map<string, string>();
    if (hasDotEnv) {
      const content = await readFile(dotEnvPath, "utf8");
      for (const [k, v] of parseEnvFileMap(content)) {
        envMap.set(k, v);
      }
    }
    if (hasDotEnvLocal) {
      const content = await readFile(dotEnvLocalPath, "utf8");
      for (const [k, v] of parseEnvFileMap(content)) {
        envMap.set(k, v);
      }
    }

    const missingKeys: string[] = [];
    const emptyKeys: string[] = [];
    const placeholderWarnings: string[] = [];

    for (const [key, defaultVal] of exampleMap.entries()) {
      if (!envMap.has(key)) {
        missingKeys.push(key);
        continue;
      }

      const actualVal = envMap.get(key) ?? "";
      if (actualVal.length === 0 && defaultVal.length > 0) {
        emptyKeys.push(key);
        continue;
      }

      // Check for misconfigured BETTER_AUTH_SECRET length or placeholder values
      if (key === "BETTER_AUTH_SECRET") {
        const patterns = PLACEHOLDER_PATTERNS.BETTER_AUTH_SECRET ?? [];
        if (patterns.some((re) => re.test(actualVal))) {
          placeholderWarnings.push(`${key} uses default template placeholder`);
        } else if (actualVal.length < 32) {
          placeholderWarnings.push(
            `${key} is shorter than 32 characters (${actualVal.length} chars)`,
          );
        }
      } else if (PLACEHOLDER_PATTERNS[key]) {
        const patterns = PLACEHOLDER_PATTERNS[key] ?? [];
        if (patterns.some((re) => re.test(actualVal))) {
          placeholderWarnings.push(`${key} uses placeholder value`);
        }
      }
    }

    if (missingKeys.length > 0 || emptyKeys.length > 0) {
      const issues: string[] = [];
      if (missingKeys.length > 0) {
        issues.push(`missing: ${missingKeys.join(", ")}`);
      }
      if (emptyKeys.length > 0) {
        issues.push(`empty: ${emptyKeys.join(", ")}`);
      }

      checks.push({
        id: `env-keys-${relDir}`,
        label: labelPrefix,
        status: "fail",
        detail: `Out of sync with ${exampleLabel} (${issues.join("; ")})`,
        remedy:
          missingKeys.length > 0
            ? `Run \`stackbase doctor --fix\` to append missing keys (${missingKeys.join(", ")}) to ${labelPrefix}`
            : `Set non-empty values for ${emptyKeys.join(", ")} in ${labelPrefix}`,
        fixable: missingKeys.length > 0,
        fix:
          missingKeys.length > 0
            ? async () => {
                const res = await mergeEnvExample(exampleContent, envPath);
                if (res.addedKeys.includes("BETTER_AUTH_SECRET")) {
                  await updateAuthSecretInEnvFile(envPath, sharedAuthSecret);
                }
                return `Added missing keys (${res.addedKeys.join(", ")}) to ${labelPrefix}`;
              }
            : undefined,
      });
    } else if (placeholderWarnings.length > 0) {
      const hasPlaceholderAuthSecret = placeholderWarnings.some((w) =>
        w.startsWith("BETTER_AUTH_SECRET"),
      );
      checks.push({
        id: `env-keys-${relDir}`,
        label: labelPrefix,
        status: "warn",
        detail: `All ${exampleMap.size} keys present, but found placeholder/weak values: ${placeholderWarnings.join(", ")}`,
        remedy: hasPlaceholderAuthSecret
          ? `Run \`stackbase doctor --fix\` to generate a secure BETTER_AUTH_SECRET or update credentials in ${labelPrefix}`
          : `Update third-party credentials in ${labelPrefix} when using those integrations`,
        fixable: hasPlaceholderAuthSecret,
        fix: hasPlaceholderAuthSecret
          ? async () => {
              await updateAuthSecretInEnvFile(envPath, sharedAuthSecret);
              return `Generated secure BETTER_AUTH_SECRET in ${labelPrefix}`;
            }
          : undefined,
      });
    } else {
      checks.push({
        id: `env-keys-${relDir}`,
        label: labelPrefix,
        status: "pass",
        detail: `All ${exampleMap.size} variables synced with ${exampleLabel}`,
      });
    }
  }

  // Verify BETTER_AUTH_SECRET consistency across workspace packages
  const distinctSecrets = new Set(authSecretLocations.map((l) => l.secret));
  if (distinctSecrets.size > 1) {
    const filesList = authSecretLocations.map((l) => l.labelPrefix).join(", ");
    checks.push({
      id: "env-auth-secret-sync",
      label: "BETTER_AUTH_SECRET consistency",
      status: "warn",
      detail: `Mismatched BETTER_AUTH_SECRET values across ${filesList}`,
      remedy:
        "Ensure BETTER_AUTH_SECRET is identical across apps/api, apps/web, and packages/auth, or run `stackbase doctor --fix`",
      fixable: true,
      fix: async () => {
        await Promise.all(
          authSecretLocations.map((loc) =>
            updateAuthSecretInEnvFile(loc.envPath, sharedAuthSecret),
          ),
        );
        return `Synchronized BETTER_AUTH_SECRET across ${filesList}`;
      },
    });
  }

  return {
    name: "env",
    title: "Environment Variables (.env.example vs .env)",
    checks,
  };
};
