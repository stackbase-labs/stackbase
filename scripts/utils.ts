import { type ExecSyncOptions, exec as execRaw } from "node:child_process";
import { randomBytes } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { REPO } from "./branding.js";

export const url = REPO;

export const execSyncOpts: ExecSyncOptions = { stdio: "ignore" };
export const execOpts = { stdio: "ignore" as const };

export const internalContentDirs = ["scripts", "apps/docs", "assets"];

export const internalContentFiles = [
  "CONTRIBUTING.md",
  "SECURITY.md",
  "SCREENSHOTS.md",
  "tsup.config.ts",
  "tsconfig.scripts.json",
  ".npmignore",
  "CHANGELOG.md",
  ".markdownlint.yaml",
];

export const allInternalContent = [
  ...internalContentDirs,
  ...internalContentFiles,
];

export const exec = promisify(execRaw);

export const supportedPackageManagers = ["npm", "bun", "pnpm"];

export const validateProjectName = (name: string): string | undefined => {
  if (!name || name.trim().length === 0) {
    return "Project name cannot be empty";
  }

  if (name.length > 214) {
    return "Project name must be less than 214 characters";
  }

  if (name.startsWith(".") || name.startsWith("_")) {
    return "Project name cannot start with . or _";
  }

  if (!/^[a-zA-Z0-9-_@/ ]+$/.test(name)) {
    return "Project name can only contain letters, numbers, hyphens, underscores, spaces, @, and /";
  }

  if (name.includes("..")) {
    return "Project name cannot contain ..";
  }

  const reserved = [
    "node_modules",
    "favicon.ico",
    "con",
    "prn",
    "aux",
    "nul",
    "com1",
    "lpt1",
  ];
  if (reserved.includes(name.toLowerCase())) {
    return `Project name "${name}" is reserved and cannot be used`;
  }

  return undefined;
};

export const directoryExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const isCommandAvailable = async (command: string): Promise<boolean> => {
  try {
    await exec(`${command} --version`, { ...execSyncOpts, encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
};

// Case conversion utilities
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
};

export const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""));
};

export const toPascalCase = (str: string): string => {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
};

export const toCapitalCase = (str: string): string => {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const toConstantCase = (str: string): string => {
  return toSnakeCase(str).toUpperCase();
};

export const toTitleCase = (str: string): string => {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Replace utility functions
export const replaceInFile = async (
  filePath: string,
  search: string | RegExp,
  replace: string,
) => {
  const content = await readFile(filePath, "utf8");
  const updated = content.replace(search, replace);
  await writeFile(filePath, updated);
};

export const replaceAllInFile = async (
  filePath: string,
  search: string | RegExp,
  replace: string,
) => {
  const content = await readFile(filePath, "utf8");
  const updated = content.replaceAll(search, replace);
  await writeFile(filePath, updated);
};

export const applyProjectName = (
  content: string,
  projectName: string,
): string => {
  let result = content;
  result = result.replaceAll("stackbase_", `${toSnakeCase(projectName)}_`);
  result = result.replaceAll("STACKBASE_", `${toConstantCase(projectName)}_`);
  result = result.replaceAll("stackbase", toKebabCase(projectName));
  result = result.replaceAll("Stackbase", toTitleCase(projectName));
  result = result.replaceAll("STACKBASE", toConstantCase(projectName));
  result = result.replaceAll("build-elevate", toKebabCase(projectName));
  result = result.replaceAll("buildElevate", toCamelCase(projectName));
  result = result.replaceAll("BuildElevate", toPascalCase(projectName));
  result = result.replaceAll("build_elevate", toSnakeCase(projectName));
  result = result.replaceAll("BUILD_ELEVATE", toConstantCase(projectName));
  result = result.replaceAll("BUILD ELEVATE", toCapitalCase(projectName));
  result = result.replaceAll("Build Elevate", toTitleCase(projectName));
  return result;
};

export const replaceProjectName = async (
  filePath: string,
  newProjectName: string,
) => {
  const content = await readFile(filePath, "utf8");
  await writeFile(filePath, applyProjectName(content, newProjectName));
};

// Files to replace project name in
export const getFilesToReplaceProjectName = (): string[] => {
  return [
    "package.json",
    "apps/api/.env.example",
    "apps/web/.env.example",
    "apps/web/app/(home)/page.tsx",
    "apps/web/config/metadata.ts",
    "apps/web/config/site-shared.ts",
    "apps/web/config/site.ts",
    "apps/api/src/metrics/index.ts",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "docker-compose.observability.yml",
    "deploy/observability/prometheus.yml",
    "deploy/observability/grafana/provisioning/dashboards/stackbase.yml",
    "deploy/observability/grafana/dashboards/api-overview.json",
    "deploy.sh",
    "k8s/namespace.yml",
    "k8s/configmap.yml",
    "k8s/api-deployment.yml",
    "k8s/api-service.yml",
    "k8s/web-deployment.yml",
    "k8s/web-service.yml",
    "k8s/api-ingress.yml",
    "k8s/web-ingress.yml",
    "k8s/api-hpa.yml",
    "k8s/web-hpa.yml",
    "k8s/verify.sh",
    "packages/db/.env.example",
    "packages/auth/.env.example",
    "packages/storage/.env.example",
    "packages/auth/src/server.ts",
    "packages/email/src/branding.ts",
    "packages/rate-limit/src/create.ts",
  ];
};

// Replace project name across all relevant files
export const replaceProjectNameInAll = async (newProjectName: string) => {
  const files = getFilesToReplaceProjectName();

  for (const file of files) {
    try {
      await replaceProjectName(file, newProjectName);
    } catch (error) {
      // Skip files that don't exist (based on template)
    }
  }
};

// Generate a secure random secret
export const generateSecret = (length: number = 32): string => {
  return randomBytes(length).toString("base64");
};

// Update BETTER_AUTH_SECRET in env files
export const updateAuthSecretInEnvFile = async (
  filePath: string,
  secret: string,
) => {
  try {
    const content = await readFile(filePath, "utf8");
    const updated = content.replace(
      /BETTER_AUTH_SECRET=.*/,
      `BETTER_AUTH_SECRET="${secret}"`,
    );
    await writeFile(filePath, updated);
  } catch (error) {
    // Skip if file doesn't exist
  }
};

// Descriptions for each template
export const templateDescriptions: Record<string, string> = {
  fullstack:
    "Full-stack application with Next.js frontend, Express backend, authentication and PostgreSQL database",
  web: "Frontend application with Next.js, authentication, and modern UI",
  api: "Backend API with Express, PostgreSQL, and authentication",
};

// Get description for a given template
export const getDescription = (template: string): string => {
  return templateDescriptions[template] || "";
};

// Environment variables required by each template
export const envsByTemplate: Record<string, string[]> = {
  fullstack: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXT_PUBLIC_BASE_URL",
    "API_INTERNAL_URL",
    "NODE_ENV",
    "PORT",
    "ALLOWED_ORIGINS",
    "CORS_ALLOW_MISSING_ORIGIN",
    "BETTER_AUTH_URL",
    "RESEND_TOKEN",
    "RESEND_EMAIL_FROM",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "LOG_LEVEL",
    "POD_NAME",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_ENDPOINT",
    "S3_PUBLIC_URL",
    "S3_FORCE_PATH_STYLE",
  ],
  web: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NEXT_PUBLIC_BASE_URL",
    "API_INTERNAL_URL",
    "NODE_ENV",
    "BETTER_AUTH_URL",
    "RESEND_TOKEN",
    "RESEND_EMAIL_FROM",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "LOG_LEVEL",
    "POD_NAME",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_ENDPOINT",
    "S3_PUBLIC_URL",
    "S3_FORCE_PATH_STYLE",
  ],
  api: [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "NODE_ENV",
    "PORT",
    "ALLOWED_ORIGINS",
    "CORS_ALLOW_MISSING_ORIGIN",
    "BETTER_AUTH_URL",
    "RESEND_TOKEN",
    "RESEND_EMAIL_FROM",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "LOG_LEVEL",
    "POD_NAME",
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_ENDPOINT",
    "S3_PUBLIC_URL",
    "S3_FORCE_PATH_STYLE",
  ],
};
