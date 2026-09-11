import { getDescription } from "./utils.js";

type JsonObject = Record<string, unknown>;
type PackageJson = JsonObject & {
  scripts?: Record<string, string>;
  description?: string;
  version?: string;
};

/**
 * Cleans up root package.json for the chosen template and feature set.
 */
export const applyPackageJsonCleanup = (
  content: string,
  template: string,
  includeDocker: boolean = true,
  includeKubernetes: boolean = true,
  includeObservability: boolean = true,
): string => {
  let pkg: PackageJson;
  try {
    pkg = JSON.parse(content) as PackageJson;
  } catch {
    return content;
  }

  if (pkg.scripts) {
    if (!includeDocker) {
      delete pkg.scripts["docker:dev"];
      delete pkg.scripts["docker:observability"];
      delete pkg.scripts["docker:prod"];
    } else if (template === "web" || !includeObservability) {
      delete pkg.scripts["docker:observability"];
    }
    if (!includeKubernetes || template === "web" || template === "api") {
      delete pkg.scripts["k8s:deploy"];
      delete pkg.scripts["k8s:verify"];
    }
  }

  pkg.description = getDescription(template);
  pkg.version = "1.0.0";

  return JSON.stringify(pkg, null, 2) + "\n";
};

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
): string => content.replaceAll(DOCKERHUB_USERNAME_PLACEHOLDER, username);

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
    /^( {6})#\s*secretName:\s*([a-z0-9-]+-tls)/m,
    "$1secretName: $2",
  );

  // Add host to rules
  // Find the 'rules:' section and the '- http:' part under it, and inject 'host: domainName'
  updated = updated.replace(
    /rules:\s*\n\s*-\s*http:/m,
    `rules:\n    - host: ${domainName}\n      http:`,
  );

  return updated;
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
