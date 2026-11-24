import {
  access,
  copyFile,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { generateSecret, updateAuthSecretInEnvFile } from "../utils.js";

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const AUTH_SECRET_PLACEHOLDER_PATTERNS: RegExp[] = [
  /^your-betterauth-secret/i,
  /^replace[-_]?me/i,
  /^changeme/i,
];

const parseEnvKeyValues = (content: string): Map<string, string> => {
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

const collectWorkspaceDirs = async (projectRoot: string): Promise<string[]> => {
  const dirs: string[] = [projectRoot];

  for (const parent of ["apps", "packages"]) {
    const parentDir = join(projectRoot, parent);
    if (!(await fileExists(parentDir))) continue;

    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          dirs.push(join(parentDir, entry.name));
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return dirs;
};

/**
 * Detects whether the workspace uses `.env.local` (default, as initialized by `stackbase init`)
 * or `.env` across its packages and apps.
 */
export const detectWorkspaceEnvFileName = async (
  projectRoot: string,
): Promise<".env.local" | ".env"> => {
  const dirs = await collectWorkspaceDirs(projectRoot);
  let hasDotEnvLocal = false;
  let hasDotEnv = false;

  for (const dir of dirs) {
    const [dotEnvLocalExists, dotEnvExists] = await Promise.all([
      fileExists(join(dir, ".env.local")),
      fileExists(join(dir, ".env")),
    ]);
    if (dotEnvLocalExists) hasDotEnvLocal = true;
    if (dotEnvExists) hasDotEnv = true;
  }

  if (hasDotEnvLocal) return ".env.local";
  if (hasDotEnv) return ".env";
  return ".env.local";
};

/**
 * Finds an existing valid (>= 32 chars, non-placeholder) BETTER_AUTH_SECRET in the workspace.
 */
export const findWorkspaceAuthSecret = async (
  projectRoot: string,
): Promise<string | undefined> => {
  const dirs = await collectWorkspaceDirs(projectRoot);

  for (const dir of dirs) {
    const envMap = new Map<string, string>();
    const dotEnvPath = join(dir, ".env");
    const dotEnvLocalPath = join(dir, ".env.local");

    if (await fileExists(dotEnvPath)) {
      const content = await readFile(dotEnvPath, "utf8");
      for (const [k, v] of parseEnvKeyValues(content)) {
        envMap.set(k, v);
      }
    }
    if (await fileExists(dotEnvLocalPath)) {
      const content = await readFile(dotEnvLocalPath, "utf8");
      for (const [k, v] of parseEnvKeyValues(content)) {
        envMap.set(k, v);
      }
    }

    const secret = envMap.get("BETTER_AUTH_SECRET");
    if (
      secret &&
      secret.length >= 32 &&
      !AUTH_SECRET_PLACEHOLDER_PATTERNS.some((re) => re.test(secret))
    ) {
      return secret;
    }
  }

  return undefined;
};

export interface InitializeModuleEnvResult {
  created: boolean;
  envFileName: ".env.local" | ".env";
  envFilePath: string;
}

/**
 * Initializes `packages/<module>/.env.local` (or `.env` if the workspace uses `.env`)
 * from `packages/<module>/.env.example`, and synchronizes `BETTER_AUTH_SECRET` if present.
 */
export const initializeModuleEnv = async (
  packageDir: string,
  projectRoot: string = resolve(packageDir, "../.."),
): Promise<InitializeModuleEnvResult> => {
  const examplePath = join(packageDir, ".env.example");
  const envFileName = (await fileExists(join(packageDir, ".env")))
    ? ".env"
    : (await fileExists(join(packageDir, ".env.local")))
      ? ".env.local"
      : await detectWorkspaceEnvFileName(projectRoot);
  const envFilePath = join(packageDir, envFileName);

  if (!(await fileExists(examplePath))) {
    return { created: false, envFileName, envFilePath };
  }

  const exampleContent = await readFile(examplePath, "utf8");
  const exampleKeys = extractEnvKeys(exampleContent);

  let created = false;
  if (!(await fileExists(envFilePath))) {
    await copyFile(examplePath, envFilePath);
    created = true;
  } else {
    const merged = await mergeEnvExample(exampleContent, envFilePath);
    created = merged.changed;
  }

  if (exampleKeys.has("BETTER_AUTH_SECRET")) {
    const existingSecret = await findWorkspaceAuthSecret(projectRoot);
    const secret = existingSecret ?? generateSecret(32);
    await updateAuthSecretInEnvFile(envFilePath, secret);
  }

  return { created, envFileName, envFilePath };
};

/**
 * Parses variable keys present in an .env file.
 */
export const extractEnvKeys = (envContent: string): Set<string> => {
  const keys = new Set<string>();
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match?.[1]) {
      keys.add(match[1]);
    }
  }
  return keys;
};

/**
 * Merges missing environment variables from a module's .env.example into the target .env.example.
 * Only appends missing keys. Does not modify existing keys.
 */
export const mergeEnvExample = async (
  moduleEnvExampleContent: string,
  targetEnvExamplePath: string,
): Promise<{ changed: boolean; addedKeys: string[] }> => {
  const targetExists = await fileExists(targetEnvExamplePath);
  let targetContent = "";

  if (targetExists) {
    targetContent = await readFile(targetEnvExamplePath, "utf8");
  }

  const existingKeys = extractEnvKeys(targetContent);
  const moduleLines = moduleEnvExampleContent.split(/\r?\n/);
  const linesToAdd: string[] = [];
  const addedKeys: string[] = [];

  let currentCommentBlock: string[] = [];

  for (const line of moduleLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentCommentBlock = [];
      continue;
    }

    if (trimmed.startsWith("#")) {
      currentCommentBlock.push(line);
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match?.[1]) {
      const key = match[1];
      if (!existingKeys.has(key)) {
        if (currentCommentBlock.length > 0) {
          linesToAdd.push(...currentCommentBlock);
          currentCommentBlock = [];
        }
        linesToAdd.push(line);
        addedKeys.push(key);
      }
    }
    currentCommentBlock = [];
  }

  if (linesToAdd.length === 0) {
    return { changed: false, addedKeys: [] };
  }

  let newContent = targetContent;
  if (newContent.length > 0 && !newContent.endsWith("\n")) {
    newContent += "\n";
  }

  newContent += `\n# --- Added by Stackbase (${addedKeys.join(", ")}) ---\n`;
  newContent += linesToAdd.join("\n") + "\n";

  await writeFile(targetEnvExamplePath, newContent);
  return { changed: true, addedKeys };
};
