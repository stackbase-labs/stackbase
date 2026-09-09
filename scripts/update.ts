import { readFile, rm, writeFile } from "node:fs/promises";
import { envsByTemplate, getDescription } from "./utils.js";

export const updateTurboLintEnv = async (template: string) => {
  const turboPath = "turbo.json";
  const content = await readFile(turboPath, "utf8");
  const turbo = JSON.parse(content);
  if (!turbo.tasks?.lint) return;
  turbo.tasks.lint.env = envsByTemplate[template];
  await writeFile(turboPath, JSON.stringify(turbo, null, 2) + "\n");
};

// Remove client.ts and related artifacts for API-only template
export const removeAuthClientArtifactsForApi = async (template: string) => {
  if (template === "api") {
    try {
      await rm("packages/auth/src/client.ts", { force: true });
    } catch (error) {
      // Ignore if file doesn't exist
    }
    const indexPath = "packages/auth/src/index.ts";
    try {
      const indexContent = await readFile(indexPath, "utf8");
      await writeFile(indexPath, applyAuthIndexCleanup(indexContent));
    } catch (error) {
      // Ignore if file doesn't exist
    }

    const pkgPath = "packages/auth/package.json";
    try {
      const pkgContent = await readFile(pkgPath, "utf8");
      await writeFile(pkgPath, applyAuthPackageJsonCleanup(pkgContent));
    } catch (error) {
      // Ignore if file doesn't exist
    }

    const keysPath = "packages/auth/src/keys.ts";
    try {
      const keysContent = await readFile(keysPath, "utf8");
      await writeFile(keysPath, applyAuthKeysCleanup(keysContent));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
};

// Pure string-based versions (used by upgrade)
// These apply the exact same transformations as the filesystem versions above,
// but operate on strings so upgrade can apply them to fetched GitHub content
// before hashing or writing — ensuring hashes are comparable to the manifest.

/**
 * Mirrors updateTurboLintEnv() — strips env vars not relevant to the template.
 */
export const applyTurboLintEnv = (
  content: string,
  template: string,
): string => {
  let turbo: any;
  try {
    turbo = JSON.parse(content);
  } catch {
    return content;
  }
  if (!turbo.tasks?.lint) return content;
  turbo.tasks.lint.env = envsByTemplate[template];
  return JSON.stringify(turbo, null, 2) + "\n";
};

/**
 * Mirrors cleanupPackageJson() in initialize.ts — removes CLI-specific fields
 * and resets version to 1.0.0.
 */
export const applyPackageJsonCleanup = (
  content: string,
  template: string,
  includeDocker: boolean = true,
  includeKubernetes: boolean = true,
): string => {
  let pkg: any;
  try {
    pkg = JSON.parse(content);
  } catch {
    return content;
  }

  delete pkg.bin;
  delete pkg.files;
  delete pkg.homepage;
  delete pkg.repository;
  delete pkg.keywords;
  delete pkg.bugs;
  delete pkg.author;

  if (pkg.scripts) {
    delete pkg.scripts["build:cli"];
    delete pkg.scripts.prepublish;
    if (!includeDocker) {
      delete pkg.scripts["docker:dev"];
      delete pkg.scripts["docker:observability"];
      delete pkg.scripts["docker:prod"];
    } else if (template === "web") {
      delete pkg.scripts["docker:observability"];
    }
    if (!includeKubernetes) {
      delete pkg.scripts["k8s:deploy"];
      delete pkg.scripts["k8s:verify"];
    }
  }

  delete pkg.dependencies;

  if (pkg.devDependencies) {
    delete pkg.devDependencies["@types/degit"];
    delete pkg.devDependencies.tsup;
  }

  pkg.description = getDescription(template);
  pkg.version = "1.0.0";

  return JSON.stringify(pkg, null, 2) + "\n";
};

/**
 * Mirrors updatePnpmCatalog() in initialize.ts — removes catalog sections
 * not relevant to the template.
 */
export const applyPnpmCatalogCleanup = (
  content: string,
  template: string,
): string => {
  let updated = content;

  // Always remove the cli catalog
  updated = updated.replace(/\n  cli:[\s\S]*?(?=\n  \w+:|$)/s, "");

  if (template === "api") {
    updated = updated.replace(/\n  web:[\s\S]*?(?=\n  \w+:|$)/s, "");
  } else if (template === "web") {
    updated = updated.replace(/\n  server:[\s\S]*?(?=\n  \w+:|$)/s, "");
  }

  return updated;
};

/**
 * Mirrors the packages/auth/src/index.ts mutation in removeAuthClientArtifactsForApi().
 */
export const applyAuthIndexCleanup = (content: string): string => {
  let updated = content;
  updated = updated.replace(
    /^\/\/ Client auth \(for React components - only import in client-side code\)\s*\n?/m,
    "",
  );
  updated = updated.replace(/^export \* from '.\/client';\s*\n?/m, "");
  return updated;
};

/**
 * Mirrors the packages/auth/package.json mutation in removeAuthClientArtifactsForApi().
 */
export const applyAuthPackageJsonCleanup = (content: string): string => {
  let pkg: any;
  try {
    pkg = JSON.parse(content);
  } catch {
    return content;
  }
  if (pkg.exports && pkg.exports["./client"]) {
    delete pkg.exports["./client"];
  }
  return JSON.stringify(pkg, null, 2) + "\n";
};

/**
 * Mirrors the packages/auth/src/keys.ts mutation in removeAuthClientArtifactsForApi().
 */
export const applyAuthKeysCleanup = (content: string): string => {
  let updated = content;
  updated = updated.replace(/\s*client:\s*{[^}]*},?\n?/m, "\n");
  updated = updated.replace(
    /\s*NEXT_PUBLIC_BASE_URL: process\.env\.NEXT_PUBLIC_BASE_URL,?\n?/m,
    "\n",
  );
  return updated;
};

/**
 * Mirrors updateDockerComposeForTemplate() — removes services not relevant to the template.
 */
export const applyDockerComposeCleanup = (
  content: string,
  template: string,
): string => {
  let updated = content;

  if (template === "web") {
    // Remove API service and its Dockerfile
    updated = updated.replace(/\n  api:[\s\S]*?(?=\n  \w+:|$)/, "");
    // Remove API dependency from web service
    updated = updated.replace(
      /\n      api:\n        condition: service_started/,
      "",
    );
  } else if (template === "api") {
    // Remove web service and its Dockerfile
    updated = updated.replace(/\n  web:[\s\S]*?(?=\n  \w+:|$)/, "");
  }

  return updated;
};

export const TEMPLATE_DOCKERHUB_USERNAME = "vijaysingh2219";
export const DOCKERHUB_USERNAME_PLACEHOLDER = "your-dockerhub-username";

// Files that embed the registry username (image: field or shell variable).
export const K8S_DOCKERHUB_FILES = [
  "deploy.sh",
  "k8s/api-deployment.yml",
  "k8s/web-deployment.yml",
];

export const applyDockerHubUsernameCleanup = (
  content: string,
  username: string = DOCKERHUB_USERNAME_PLACEHOLDER,
): string => content.replaceAll(TEMPLATE_DOCKERHUB_USERNAME, username);

export const applyDomainName = (
  content: string,
  domainName: string,
): string => {
  let updated = content;
  if (!domainName) return updated;

  // Uncomment TLS setup
  updated = updated.replace(
    /^\s*#\s*cert-manager\.io\/cluster-issuer:\s*"letsencrypt-prod"/m,
    '    cert-manager.io/cluster-issuer: "letsencrypt-prod"',
  );
  updated = updated.replace(/^\s*#\s*tls:/m, "  tls:");
  updated = updated.replace(/^\s*#\s*-\s*hosts:/m, "    - hosts:");
  updated = updated.replace(
    /^\s*#\s*-\s*yourdomain\.com/m,
    `        - ${domainName}`,
  );
  updated = updated.replace(
    /^\s*#\s*secretName:\s*build-elevate-tls/m,
    "      secretName: build-elevate-tls",
  );

  // Add host to rules
  // Find the 'rules:' section and the '- http:' part under it, and inject 'host: domainName'
  updated = updated.replace(
    /rules:\s*\n\s*-\s*http:/m,
    `rules:\n    - host: ${domainName}\n      http:`,
  );

  return updated;
};

export const applyConfigMapCleanup = (
  content: string,
  template: string,
): string => {
  if (template !== "web") return content;
  // Drop the API_INTERNAL_URL line and its preceding comment.
  return content.replace(/\n\s*#[^\n]*\n\s*API_INTERNAL_URL:[^\n]*/, "");
};

/**
 * Mirrors updateDockerfilesForPackageManager() — replaces pnpm commands with npm or bun.
 */
export const applyDockerfilesPackageManagerCleanup = (
  content: string,
  packageManager: string,
): string => {
  if (packageManager === "pnpm") return content;

  let updated = content;
  // Regex to match the pnpm install block with flexible whitespace
  const pnpmBlock =
    /# ✅ Install pnpm and manually configure PNPM_HOME\s*\nENV PNPM_HOME="[^"]*"\s*\nENV PATH="[^"]*"\s*\nRUN npm install -g pnpm\s*\\\s*\n\s*&&\s*pnpm config set global-bin-dir "\$PNPM_HOME"\s*\\\s*\n\s*&&\s*pnpm add -g turbo\s*\n?/g;
  // Regex to match the pnpm cache mount with flexible whitespace
  const cacheMount =
    /--mount=type=cache,id=pnpm,target=\/root\/\.local\/share\/pnpm\/store\s*\\\s*\n\s*/g;
  // Regex for the install command
  const installRegex = /pnpm install --frozen-lockfile --ignore-scripts/g;
  // Regex for the db:generate command
  const generateRegex = /pnpm --filter @workspace\/db db:generate/g;
  // Regex for the turbo build command
  const buildRegex = /pnpm turbo build/g;

  if (packageManager === "npm") {
    // Replace pnpm install block with npm version
    updated = updated.replace(
      pnpmBlock,
      "# ✅ Install turbo globally\nRUN npm install -g turbo\n",
    );
    // Remove pnpm cache mount
    updated = updated.replace(cacheMount, "");
    // Replace install command
    updated = updated.replace(installRegex, "npm install --ignore-scripts");
    // Replace db:generate command
    updated = updated.replace(
      generateRegex,
      "cd packages/db && npm run db:generate",
    );
    // Replace turbo build command
    updated = updated.replace(buildRegex, "turbo build");
  } else if (packageManager === "bun") {
    // Replace pnpm install block with bun version
    updated = updated.replace(
      pnpmBlock,
      '# ✅ Install bun and add to PATH\nENV PATH="/root/.bun/bin:$PATH"\nRUN apk add --no-cache curl bash \\\n  && curl -fsSL https://bun.sh/install | bash \\\n  && /root/.bun/bin/bun install -g turbo\n\n',
    );
    // Remove pnpm cache mount
    updated = updated.replace(cacheMount, "");
    // Replace install command
    updated = updated.replace(installRegex, "bun install");
    // Replace db:generate command
    updated = updated.replace(
      generateRegex,
      "cd packages/db && bun run db:generate",
    );
    // Replace turbo build command
    updated = updated.replace(buildRegex, "turbo build");
  }

  return updated;
};
