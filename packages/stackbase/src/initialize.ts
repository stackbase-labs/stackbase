import {
  copyFile,
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import yaml from "yaml";
import { join } from "node:path";
import { tmpdir } from "node:os";
import degit from "degit";
import { buildManifest, writeManifest } from "./manifest.js";
import { MANIFEST_FILE, PRODUCT_NAME, REPO } from "./branding.js";
import {
  cancel,
  intro,
  isCancel,
  log,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import {
  normalizeTemplateName,
  templateNames,
  templateRegistry,
  type TemplateName,
} from "./templates.js";
import {
  directoryExists,
  exec,
  execSyncOpts,
  generateSecret,
  isCommandAvailable,
  replaceProjectNameInAll,
  updateAuthSecretInEnvFile,
  validateProjectName,
  toKebabCase,
} from "./utils.js";
import {
  applyPackageJsonCleanup,
  applyDockerfilesPackageManagerCleanup,
  applyDockerHubUsernameCleanup,
  applyDomainName,
  DOCKERHUB_USERNAME_PLACEHOLDER,
  K8S_DOCKERHUB_FILES,
} from "./update.js";

type PackageJson = {
  packageManager?: string;
  workspaces?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

const branch = process.env.STACKBASE_BRANCH ?? "main";

const getLatestCommit = async (): Promise<string> => {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/commits/${branch}`,
    { headers: { Accept: "application/vnd.github.sha" } },
  );
  if (!res.ok) throw new Error("Failed to resolve latest commit SHA");
  return (await res.text()).trim(); // returns just the SHA string with this Accept header
};

/**
 * Downloads the selected template from GitHub using degit strictly as the
 * repository archive downloader. Degit fetches the repository tarball into a
 * temporary directory, after which only the selected template directory is
 * copied to the destination project path.
 */
const downloadTemplate = async (
  name: string,
  template: TemplateName,
): Promise<string> => {
  if (process.env.STACKBASE_LOCAL_TEMPLATES_DIR) {
    const localTemplatePath = join(
      process.env.STACKBASE_LOCAL_TEMPLATES_DIR,
      templateRegistry[template].path,
    );
    await cp(localTemplatePath, name, {
      recursive: true,
      force: true,
      filter: (source) => {
        const basename = source.split(/[\\/]/).pop();
        return (
          basename !== "node_modules" &&
          basename !== ".turbo" &&
          basename !== ".next" &&
          basename !== "dist"
        );
      },
    });
    return "local-test-commit";
  }

  const commitHash = await getLatestCommit();
  const tempDir = await mkdtemp(join(tmpdir(), "stackbase-"));

  const emitter = degit(`${REPO}#${branch}`, {
    cache: false,
    force: true,
    verbose: false,
  });

  try {
    await emitter.clone(tempDir);
    await cp(join(tempDir, templateRegistry[template].path), name, {
      recursive: true,
      force: true,
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  return commitHash;
};

const removeObservabilityFiles = async () => {
  try {
    await Promise.all([
      rm("docker-compose.observability.yml", { force: true }),
      rm("deploy/observability", { recursive: true, force: true }),
    ]);
  } catch (error) {
    log.warn(
      `Some Observability files could not be deleted: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const removeDockerFiles = async () => {
  const dockerFiles = [
    "docker-compose.prod.yml",
    "apps/api/Dockerfile.prod",
    "apps/web/Dockerfile.prod",
    ".dockerignore",
  ];

  const errors: string[] = [];

  // Parallelize file deletion
  const deletePromises = dockerFiles.map(async (file) => {
    try {
      await rm(file, { force: true });
    } catch (error) {
      errors.push(
        `Failed to delete ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await Promise.all([...deletePromises, removeObservabilityFiles()]);

  if (errors.length > 0) {
    log.warn(`Some Docker files could not be deleted:\n${errors.join("\n")}`);
  }
};

const removeKubernetesFiles = async () => {
  try {
    await Promise.all([
      rm("k8s", { recursive: true, force: true }),
      rm("deploy.sh", { force: true }),
    ]);
  } catch (error) {
    log.warn(
      `Some Kubernetes files could not be deleted: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const replaceDockerHubUsername = async (username: string) => {
  await Promise.all(
    K8S_DOCKERHUB_FILES.map(async (file) => {
      try {
        const content = await readFile(file, "utf8");
        const updated = applyDockerHubUsernameCleanup(content, username);
        if (updated !== content) {
          await writeFile(file, updated);
        }
      } catch {
        // File doesn't exist in the selected template
      }
    }),
  );
};

const replaceDomainName = async (domainName: string) => {
  if (!domainName) return;
  const ingressFiles = ["k8s/api-ingress.yml", "k8s/web-ingress.yml"];
  await Promise.all(
    ingressFiles.map(async (file) => {
      try {
        const content = await readFile(file, "utf8");
        const updated = applyDomainName(content, domainName);
        if (updated !== content) {
          await writeFile(file, updated);
        }
      } catch {
        // File doesn't exist in the selected template
      }
    }),
  );
};

const getPackageManager = async (provided?: string, yes?: boolean) => {
  if (provided) return provided;

  const availablePMs = await Promise.all([
    isCommandAvailable("npm").then((available) => ({
      value: "npm" as const,
      available,
    })),
    isCommandAvailable("pnpm").then((available) => ({
      value: "pnpm" as const,
      available,
    })),
    isCommandAvailable("bun").then((available) => ({
      value: "bun" as const,
      available,
    })),
  ]);

  const installedPMs = availablePMs.filter((pm) => pm.available);

  if (installedPMs.length === 0) {
    throw new Error(
      "No package manager found. Please install npm, pnpm, or bun.",
    );
  }

  const defaultPM = installedPMs[0];
  if (!defaultPM) {
    throw new Error("Failed to determine a default package manager.");
  }

  // Show detection results
  const statusLines = availablePMs.map(
    (pm) =>
      `  ${pm.available ? "✓" : "✗"} ${pm.value}: ${pm.available ? "Installed" : "Not found"}`,
  );
  log.info(`Detected package managers:\n${statusLines.join("\n")}`);

  if (yes) {
    const preference = ["pnpm", "bun", "npm"] as const;
    for (const preferred of preference) {
      const found = installedPMs.find((pm) => pm.value === preferred);
      if (found) {
        return found.value;
      }
    }
    return defaultPM.value;
  }

  // Show only installed in the selection prompt
  const options = installedPMs.map((pm) => ({
    value: pm.value,
    label: pm.value,
    hint: "Ready to use",
  }));

  const pm = await select({
    message: "Which package manager would you like to use?",
    options,
    initialValue: defaultPM.value,
  });

  if (isCancel(pm)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }
  return pm as string;
};

const findAllPackageJsons = async (dir: string = "."): Promise<string[]> => {
  let results: string[] = [];
  const list = await readdir(dir, { withFileTypes: true });
  for (const file of list) {
    const filePath = join(dir, file.name).replace(/\\/g, "/");
    if (file.isDirectory()) {
      if (
        file.name === "node_modules" ||
        file.name === ".turbo" ||
        file.name === ".next" ||
        file.name === "dist" ||
        file.name === "build"
      ) {
        continue;
      }
      results = results.concat(await findAllPackageJsons(filePath));
    } else if (file.name === "package.json") {
      results.push(filePath);
    }
  }
  return results;
};

const replaceCatalogVersions = async () => {
  const workspacePath = "pnpm-workspace.yaml";
  const workspaceContent = await readFile(workspacePath, "utf8");
  const workspace = yaml.parse(workspaceContent) as {
    catalogs?: Record<string, Record<string, string>>;
  };

  if (!workspace.catalogs) {
    log.warn("No catalogs found in pnpm-workspace.yaml");
    return;
  }

  const catalogLookups: Record<string, Record<string, string>> = {};
  for (const [catalogName, packages] of Object.entries(workspace.catalogs)) {
    catalogLookups[catalogName] = packages;
  }

  const packageJsonFiles = await findAllPackageJsons();

  for (const filePath of packageJsonFiles) {
    const content = await readFile(filePath, "utf8");
    let packageJson: PackageJson;
    try {
      packageJson = JSON.parse(content);
    } catch (error) {
      log.warn(
        `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    let fileChanged = false;
    const dependencyFields = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ] as const;

    for (const field of dependencyFields) {
      if (!packageJson[field] || typeof packageJson[field] !== "object") {
        continue;
      }

      for (const [packageName, version] of Object.entries(packageJson[field])) {
        if (typeof version === "string" && version.startsWith("workspace:")) {
          continue;
        }

        if (typeof version === "string" && version.startsWith("catalog:")) {
          const catalogName = version.replace("catalog:", "");
          const catalog = catalogLookups[catalogName];

          if (!catalog) {
            log.warn(
              `Catalog "${catalogName}" not found for package "${packageName}" in ${filePath}`,
            );
            continue;
          }

          const catalogVersion = catalog[packageName];
          if (!catalogVersion) {
            log.warn(
              `Package "${packageName}" not found in catalog "${catalogName}" (${filePath})`,
            );
            continue;
          }

          packageJson[field][packageName] = catalogVersion;
          fileChanged = true;
        }
      }
    }

    if (fileChanged) {
      try {
        const updatedContent = JSON.stringify(packageJson, null, 2) + "\n";
        await writeFile(filePath, updatedContent);
      } catch (error) {
        log.warn(
          `Failed to write ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
};

const replaceWorkspaceProtocols = async (packageManager: string) => {
  if (packageManager === "pnpm" || packageManager === "bun") {
    return;
  }

  const packageJsonFiles = await findAllPackageJsons();

  for (const filePath of packageJsonFiles) {
    const content = await readFile(filePath, "utf8");
    let packageJson: PackageJson;
    try {
      packageJson = JSON.parse(content);
    } catch (error) {
      log.warn(
        `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    let fileChanged = false;
    const dependencyFields = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ] as const;

    for (const field of dependencyFields) {
      if (!packageJson[field] || typeof packageJson[field] !== "object") {
        continue;
      }

      for (const [packageName, version] of Object.entries(packageJson[field])) {
        if (typeof version === "string" && version.startsWith("workspace:")) {
          packageJson[field][packageName] = "*";
          fileChanged = true;
        }
      }
    }

    if (fileChanged) {
      try {
        const updatedContent = JSON.stringify(packageJson, null, 2) + "\n";
        await writeFile(filePath, updatedContent);
      } catch (error) {
        log.warn(
          `Failed to write ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
};

const addWorkspacesField = async () => {
  const workspacePath = "pnpm-workspace.yaml";
  let workspacePackages: string[] = [];

  try {
    const workspaceContent = await readFile(workspacePath, "utf8");
    const workspace = yaml.parse(workspaceContent) as {
      packages?: string[];
    };
    if (workspace.packages) {
      workspacePackages = workspace.packages;
    }
  } catch (error) {
    log.warn(
      `Failed to read ${workspacePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
    workspacePackages = ["apps/*", "packages/*"];
  }

  const packageJsonPath = "package.json";
  const content = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(content);

  packageJson.workspaces = workspacePackages;

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
};

const updateDockerfilesForPackageManager = async (packageManager: string) => {
  const dockerfiles = ["apps/api/Dockerfile.prod", "apps/web/Dockerfile.prod"];

  for (const dockerfile of dockerfiles) {
    try {
      const content = await readFile(dockerfile, "utf8");
      const updated = applyDockerfilesPackageManagerCleanup(
        content,
        packageManager,
      );
      if (updated !== content) {
        await writeFile(dockerfile, updated);
      }
    } catch {
      // Ignore if file doesn't exist in the selected template
    }
  }
};

const configurePackageManager = async (packageManager: string) => {
  const packageJsonPath = "package.json";

  if (packageManager !== "pnpm") {
    await replaceCatalogVersions();
    await replaceWorkspaceProtocols(packageManager);
    if (packageManager === "npm" || packageManager === "bun") {
      await addWorkspacesField();
    }
  }

  let packageJson;
  try {
    const content = await readFile(packageJsonPath, "utf8");
    packageJson = JSON.parse(content);
  } catch {
    packageJson = undefined;
  }

  // Update Dockerfiles for selected package manager
  await updateDockerfilesForPackageManager(packageManager);

  if (packageManager === "bun") {
    if (packageJson) {
      packageJson.packageManager = "bun@1.3.14";
      // Add @tailwindcss/postcss to dependencies if not present
      if (!packageJson.dependencies) packageJson.dependencies = {};
      if (!packageJson.dependencies["@tailwindcss/postcss"]) {
        packageJson.dependencies["@tailwindcss/postcss"] = "^4.3.0";
      }
      await writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
      );
    }
    try {
      await rm("pnpm-lock.yaml", { force: true });
    } catch {
      // Lockfile might not exist
    }
  } else if (packageManager === "npm") {
    if (packageJson) {
      packageJson.packageManager = "npm@11.7.0";
      await writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
      );
    }
    try {
      await rm("pnpm-lock.yaml", { force: true });
    } catch {
      // Lockfile might not exist
    }
    try {
      await rm("pnpm-workspace.yaml", { force: true });
    } catch {
      // Workspace file might not exist
    }
  }

  if (packageJson && packageManager !== "pnpm") {
    const pmCmd = packageManager;
    for (const key of Object.keys(packageJson.scripts || {})) {
      if (typeof packageJson.scripts[key] === "string") {
        packageJson.scripts[key] = packageJson.scripts[key]
          .replace(/pnpm /g, pmCmd + " ")
          .replace(/pnpm\./g, pmCmd + ".");
      }
    }
    await writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );
  }
};

const installDependencies = async (packageManager: string) => {
  if (packageManager === "pnpm") {
    await exec("pnpm install");
  } else if (packageManager === "bun") {
    await exec("bun install");
  } else {
    await exec("npm install");
  }
};

const formatTurboJson = async (packageManager: string) => {
  if (packageManager === "pnpm") {
    await exec("pnpm run format:path turbo.json", execSyncOpts);
  } else if (packageManager === "bun") {
    await exec("bun run format:path turbo.json", execSyncOpts);
  } else {
    await exec("npm run format:path -- turbo.json", execSyncOpts);
  }
};

const initializeGit = async () => {
  await exec("git init", execSyncOpts);
  await exec("git branch -M main", execSyncOpts);
  await exec("git add .", execSyncOpts);
  await exec(
    `git commit --no-verify -m "✨ Initial commit from ${PRODUCT_NAME}"`,
    execSyncOpts,
  );
};

const setupEnvironmentVariables = async (includeDocker: boolean) => {
  const files = [
    { source: join("apps", "api"), target: ".env.local" },
    { source: join("apps", "web"), target: ".env.local" },
    { source: join("packages", "auth"), target: ".env.local" },
    { source: join("packages", "db"), target: ".env.local" },
    { source: join("packages", "rate-limit"), target: ".env.local" },
    { source: join("packages", "email"), target: ".env.local" },
    { source: join("packages", "storage"), target: ".env.local" },
  ];

  // Generate a single auth secret to share across all env files
  const authSecret = generateSecret(32);

  // Parallelize env file creation
  const envFilePromises = files.map(async ({ source, target }) => {
    try {
      await copyFile(join(source, ".env.example"), join(source, target));
      await updateAuthSecretInEnvFile(join(source, target), authSecret);
    } catch {
      // Skip if package or app is not part of the selected template
    }
  });

  await Promise.all(envFilePromises);

  // Create production env files if Docker is included
  if (includeDocker) {
    const prodFiles = [
      { source: join("apps", "api"), target: ".env.production" },
      { source: join("apps", "web"), target: ".env.production" },
      { source: join("packages", "auth"), target: ".env.production" },
      { source: join("packages", "db"), target: ".env.production" },
      { source: join("packages", "rate-limit"), target: ".env.production" },
      { source: join("packages", "email"), target: ".env.production" },
      { source: join("packages", "storage"), target: ".env.production" },
    ];

    // Parallelize production env file creation
    const prodEnvFilePromises = prodFiles.map(async ({ source, target }) => {
      try {
        await copyFile(join(source, ".env.example"), join(source, target));
        await updateAuthSecretInEnvFile(join(source, target), authSecret);
      } catch {
        // Skip if package or app is not part of the selected template
      }
    });

    await Promise.all(prodEnvFilePromises);
  }
};

const buildWorkspacePackages = async (selectedManager: string) => {
  await exec(`${selectedManager} run build`, execSyncOpts);
};

const cleanupPackageJson = async (
  template: string,
  includeDocker: boolean,
  includeKubernetes: boolean,
  includeObservability: boolean,
) => {
  const packageJsonPath = "package.json";
  const content = await readFile(packageJsonPath, "utf8");
  const updated = applyPackageJsonCleanup(
    content,
    template,
    includeDocker,
    includeKubernetes,
    includeObservability,
  );
  await writeFile(packageJsonPath, updated);
};

const updateLicense = async (projectName: string) => {
  const licensePath = "LICENSE";
  const currentYear = new Date().getFullYear();

  const content = await readFile(licensePath, "utf8");

  // Replace the copyright line with new project name and current year
  const updated = content.replace(
    /Copyright \(c\) (?:\d{4} .+|\[year\] \[fullname\])/,
    `Copyright (c) ${currentYear} ${projectName}`,
  );

  await writeFile(licensePath, updated);
};

const getName = async () => {
  const value = await text({
    message: "What is your project named?",
    placeholder: "my app",
    validate(value?: string) {
      if (!value || value.length === 0) {
        return "Please enter a project name.";
      }
      const error = validateProjectName(value);
      if (error) {
        return error;
      }
    },
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value.toString();
};

const getProjectTemplate = async () => {
  const value = await select({
    message: "What type of project would you like to create?",
    options: templateNames.map((template) => ({
      value: template,
      label: templateRegistry[template].label,
      hint: templateRegistry[template].hint,
    })),
    initialValue: "base",
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value.toString() as TemplateName;
};

const getDockerChoice = async () => {
  const value = await select({
    message: "Include Docker configuration?",
    options: [
      {
        value: true,
        label: "Yes",
        hint: "Include Dockerfiles and docker-compose",
      },
      { value: false, label: "No", hint: "Skip Docker setup" },
    ],
    initialValue: true,
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value as boolean;
};

const getKubernetesChoice = async () => {
  const value = await select({
    message: "Include Kubernetes manifests?",
    options: [
      {
        value: false,
        label: "No",
        hint: "Skip Kubernetes setup",
      },
      {
        value: true,
        label: "Yes",
        hint: "Deployment manifests, deploy & verify scripts",
      },
    ],
    initialValue: false,
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value as boolean;
};

const getDockerHubUsername = async () => {
  const value = await text({
    message: "What is your Docker Hub username?",
    placeholder: "your-dockerhub-username",
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value.toString() || "your-dockerhub-username";
};

const getDomainName = async () => {
  const value = await text({
    message: "What domain will you use for production? (Leave blank to skip)",
    placeholder: "example.com",
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value.toString();
};

const getStudioChoice = async () => {
  const value = await select({
    message: "Include Prisma Studio app?",
    options: [
      {
        value: true,
        label: "Yes",
        hint: "Database management UI",
      },
      { value: false, label: "No", hint: "Skip Prisma Studio" },
    ],
    initialValue: true,
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value as boolean;
};

const getObservabilityChoice = async () => {
  const value = await select({
    message: "Include observability configuration?",
    options: [
      {
        value: true,
        label: "Yes",
        hint: "Prometheus and Grafana local stack",
      },
      { value: false, label: "No", hint: "Skip observability setup" },
    ],
    initialValue: true,
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value as boolean;
};

const validatePrerequisites = async (
  name: string,
  projectDir: string,
  disableGit: boolean,
) => {
  // Check if pnpm is installed
  const hasPnpm = await isCommandAvailable("pnpm");
  if (!hasPnpm) {
    throw new Error(
      "pnpm is required but not installed. Install it with: npm install -g pnpm",
    );
  }

  // Check if git is installed (unless disabled)
  if (!disableGit) {
    const hasGit = await isCommandAvailable("git");
    if (!hasGit) {
      throw new Error(
        "git is required but not installed. Install it or use --disable-git flag.",
      );
    }
  }

  // Check if directory already exists
  const exists = await directoryExists(projectDir);
  if (exists) {
    // Extract the directory name from the path for better error message
    const dirName = projectDir.split(/[\\/]/).pop() || name;
    throw new Error(
      `Directory "${dirName}" already exists. Please choose a different name or remove the existing directory.`,
    );
  }

  // Validate project name
  const nameError = validateProjectName(name);
  if (nameError) {
    throw new Error(`Invalid project name: ${nameError}`);
  }
};

export const initialize = async (
  projectName?: string,
  options: {
    template?: string;
    git?: boolean;
    skipInstall?: boolean;
    yes?: boolean;
    verbose?: boolean;
    packageManager?: string;
    docker?: boolean;
    kubernetes?: boolean;
    observability?: boolean;
    studio?: boolean;
    dockerHubUsername?: string;
    domainName?: string;
  } = {},
) => {
  try {
    intro(`Let's start a ${PRODUCT_NAME} project!`);

    // Validate template if provided
    const providedTemplate = options.template
      ? normalizeTemplateName(options.template)
      : null;

    if (options.template && !providedTemplate) {
      log.error(
        `Invalid template: ${options.template}. Choose from: base, web, api`,
      );
      process.exit(1);
    }

    // Validate package manager if provided
    if (
      options.packageManager &&
      !["pnpm", "npm", "bun"].includes(options.packageManager)
    ) {
      log.error(
        `Invalid package manager: ${options.packageManager}. Choose from: pnpm, npm, bun`,
      );
      process.exit(1);
    }

    const cwd = process.cwd();

    // Handle project name - use positional argument or prompt
    const name = projectName || (options.yes ? "my-app" : await getName());

    const template =
      providedTemplate || (options.yes ? "base" : await getProjectTemplate());

    const packageManager = await getPackageManager(
      options.packageManager,
      options.yes,
    );

    const templateConfig = templateRegistry[template];

    // Handle --no-git flag
    const shouldInitGit = options.git !== false;

    // Docker is prompted only if the template supports it
    const includeDocker = templateConfig.capabilities.docker
      ? options.docker !== undefined
        ? options.docker
        : options.yes
          ? true
          : await getDockerChoice()
      : false;

    // Kubernetes is offered only if the template supports it AND Docker is included
    const includeKubernetes =
      templateConfig.capabilities.kubernetes && includeDocker
        ? options.kubernetes !== undefined
          ? options.kubernetes
          : !options.yes
            ? await getKubernetesChoice()
            : false
        : false;

    let dockerHubUsername =
      options.dockerHubUsername || DOCKERHUB_USERNAME_PLACEHOLDER;
    let domainName = options.domainName || "";
    if (includeKubernetes && !options.dockerHubUsername && !options.yes) {
      dockerHubUsername = await getDockerHubUsername();
      domainName = await getDomainName();
    }

    // Observability is offered only if the template supports it AND Docker is included
    const includeObservability =
      templateConfig.capabilities.observability && includeDocker
        ? options.observability !== undefined
          ? options.observability
          : options.yes
            ? true
            : await getObservabilityChoice()
        : false;

    // Studio is offered if the template supports it
    const includeStudio = templateConfig.capabilities.studio
      ? options.studio !== undefined
        ? options.studio
        : options.yes
          ? true
          : await getStudioChoice()
      : false;

    const s = spinner();
    const projectDir = join(cwd, toKebabCase(name));

    // Validate prerequisites before starting
    s.start("Validating prerequisites...");
    await validatePrerequisites(name, projectDir, !shouldInitGit);
    s.stop("✓ Prerequisites validated");

    s.start(`Downloading ${PRODUCT_NAME} template...`);
    let commitHash: string;
    try {
      commitHash = await downloadTemplate(toKebabCase(name), template);
      if (options.verbose) log.info("✓ Downloaded template");
    } catch (error) {
      throw new Error(
        `Failed to download template. Check your internet connection and try again. ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    s.message("Preparing project directory...");
    process.chdir(projectDir);
    if (options.verbose) log.info(`✓ Changed directory to ${projectDir}`);

    s.message("Replacing project name...");
    await replaceProjectNameInAll(name);
    if (options.verbose) log.info("✓ Replaced project name in all files");

    s.message("Cleaning up package.json...");
    await cleanupPackageJson(
      template,
      includeDocker,
      includeKubernetes,
      includeObservability,
    );
    if (options.verbose) log.info("✓ Cleaned up package.json");

    s.message("Updating LICENSE...");
    await updateLicense(name);
    if (options.verbose) log.info("✓ Updated LICENSE");

    s.message(`Configuring for ${packageManager}...`);
    await configurePackageManager(packageManager);
    if (options.verbose) log.info("✓ Configured package manager");

    s.message("Setting up environment variable files...");
    await setupEnvironmentVariables(includeDocker);
    if (options.verbose) log.info("✓ Environment files created");

    if (!includeStudio) {
      s.message("Removing Prisma Studio app...");
      await rm("apps/studio", { recursive: true, force: true });
      if (options.verbose) log.info("✓ Removed Prisma Studio app");
    }

    if (!includeDocker) {
      s.message("Removing Docker files...");
      await removeDockerFiles();
      if (options.verbose) log.info("✓ Removed Docker files");
    } else if (!includeObservability) {
      s.message("Removing Observability files...");
      await removeObservabilityFiles();
      if (options.verbose) log.info("✓ Removed Observability files");
    }

    if (!includeKubernetes) {
      s.message("Removing Kubernetes files...");
      await removeKubernetesFiles();
      if (options.verbose) log.info("✓ Removed Kubernetes files");
    } else {
      s.message("Configuring Kubernetes manifests...");
      await replaceDockerHubUsername(dockerHubUsername);
      await replaceDomainName(domainName);
      if (options.verbose) log.info("✓ Configured Kubernetes manifests");
    }

    // Handle --skip-install flag
    if (!options.skipInstall) {
      s.message("Installing dependencies...");
      await installDependencies(packageManager);
      if (options.verbose) log.info("✓ Installed dependencies");

      s.message("Formatting turbo.json...");
      try {
        await formatTurboJson(packageManager);
        if (options.verbose) log.info("✓ Formatted turbo.json");
      } catch {
        log.warn("Could not format turbo.json automatically.");
      }

      // Build workspace packages
      try {
        await buildWorkspacePackages(packageManager);
      } catch {
        // Initial package build failure is non-fatal
      }
    } else {
      if (options.verbose) log.info("⊘ Skipped dependency installation");
    }

    s.message("Writing upgrade manifest...");
    const manifest = await buildManifest(commitHash, template, name, {
      docker: includeDocker,
      kubernetes: includeKubernetes,
      studio: includeStudio,
      observability: includeObservability,
    });
    await writeManifest(manifest);
    if (options.verbose) log.info(`✓ Written ${MANIFEST_FILE} manifest`);

    if (shouldInitGit) {
      s.message("Initializing Git repository...");
      await initializeGit();
      if (options.verbose) {
        log.info("✓ Initialized Git repository");
      }
    }

    s.stop("Project initialized successfully!");

    // Adjust next steps based on skipInstall flag
    const cdCommand = `cd ${toKebabCase(name)}`;
    const installCommand = options.skipInstall
      ? `\n  ${packageManager === "pnpm" ? "pnpm" : packageManager} install`
      : "";
    const devCommand =
      packageManager === "pnpm" ? "pnpm dev" : packageManager + " run dev";
    outro(
      `🎉 Your ${PRODUCT_NAME} project is ready!\n\nNext steps:\n  ${cdCommand}${installCommand}\n  Update .env files with your database and API keys\n  ${devCommand}`,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Failed to initialize project: ${error}`;

    log.error(message);
    process.exit(1);
  }
};
