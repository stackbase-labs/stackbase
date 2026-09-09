import { copyFile, readFile, readdir, rm, writeFile } from "node:fs/promises";
import yaml from "yaml";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import degit from "degit";
import { buildManifest, writeManifest } from "./manifest.js";
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
  directoryExists,
  exec,
  execSyncOpts,
  generateSecret,
  internalContentDirs,
  internalContentFiles,
  isCommandAvailable,
  replaceProjectNameInAll,
  updateAuthSecretInEnvFile,
  url,
  validateProjectName,
  toKebabCase,
} from "./utils.js";
import { createProjectReadme } from "./readme.js";
import {
  removeAuthClientArtifactsForApi,
  updateTurboLintEnv,
  applyPackageJsonCleanup,
  applyPnpmCatalogCleanup,
  applyDockerComposeCleanup,
  applyDockerfilesPackageManagerCleanup,
  applyDockerHubUsernameCleanup,
  applyDomainName,
  applyConfigMapCleanup,
  K8S_DOCKERHUB_FILES,
} from "./update.js";

const branch = process.env.BUILD_ELEVATE_BRANCH ?? "main";

const getLatestCommit = async (): Promise<string> => {
  const res = await fetch(
    `https://api.github.com/repos/vijaysingh2219/build-elevate/commits/${branch}`,
    { headers: { Accept: "application/vnd.github.sha" } },
  );
  if (!res.ok) throw new Error("Failed to resolve latest commit SHA");
  return (await res.text()).trim(); // returns just the SHA string with this Accept header
};

const cloneBuildElevate = async (name: string): Promise<string> => {
  const commitHash = await getLatestCommit();

  const emitter = degit(`${url}#${branch}`, {
    cache: false,
    force: true,
    verbose: false,
  });

  await emitter.clone(name);

  return commitHash;
};

const deleteInternalContent = async () => {
  const errors: string[] = [];

  // Parallelize folder deletion
  const folderPromises = internalContentDirs.map(async (folder) => {
    try {
      await rm(folder, { recursive: true, force: true });
    } catch (error) {
      errors.push(
        `Failed to delete ${folder}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  // Parallelize file deletion
  const filePromises = internalContentFiles.map(async (file) => {
    try {
      await rm(file, { force: true });
    } catch (error) {
      errors.push(
        `Failed to delete ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await Promise.all([...folderPromises, ...filePromises]);

  if (errors.length > 0) {
    log.warn(`Some internal files could not be deleted:\n${errors.join("\n")}`);
  }
};

const removeDockerFiles = async () => {
  const dockerFiles = [
    "docker-compose.prod.yml",
    "docker-compose.observability.yml",
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

  await Promise.all([
    ...deletePromises,
    rm("deploy/observability", { recursive: true, force: true }),
  ]);

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
        // file doesn't exist - already removed by template pruning
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
        // file doesn't exist - already removed by template pruning
      }
    }),
  );
};

const updateK8sForTemplate = async (template: string) => {
  if (template !== "web" && template !== "api") return;

  const dropRole = template === "web" ? "api" : "web";
  const dropFiles = [
    `k8s/${dropRole}-deployment.yml`,
    `k8s/${dropRole}-service.yml`,
    `k8s/${dropRole}-ingress.yml`,
    `k8s/${dropRole}-hpa.yml`,
  ];

  try {
    await Promise.all(dropFiles.map((file) => rm(file, { force: true })));

    const configMapPath = "k8s/configmap.yml";
    const content = await readFile(configMapPath, "utf8");
    const updated = applyConfigMapCleanup(content, template);
    if (updated !== content) {
      await writeFile(configMapPath, updated);
    }
  } catch (error) {
    log.warn(
      `Failed to update Kubernetes manifests for ${template} template: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const updateDockerComposeForTemplate = async (template: string) => {
  const dockerComposePath = "docker-compose.prod.yml";

  try {
    const content = await readFile(dockerComposePath, "utf8");
    const updated = applyDockerComposeCleanup(content, template);
    if (updated !== content) {
      await writeFile(dockerComposePath, updated);
    }
    if (template === "api") {
      await rm("apps/web/Dockerfile.prod", { force: true });
    } else if (template === "web") {
      await rm("apps/api/Dockerfile.prod", { force: true });
      await rm("docker-compose.observability.yml", { force: true });
      await rm("deploy/observability", { recursive: true, force: true });
    }
  } catch (error) {
    log.warn(
      `Failed to update docker-compose.prod.yml: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const removeAppsByTemplate = async (template: string) => {
  const errors: string[] = [];

  try {
    if (template === "web") {
      // Remove API and email apps
      await rm("apps/api", { recursive: true, force: true });
      await rm("apps/email", { recursive: true, force: true });
    } else if (template === "api") {
      // Remove web and email apps
      await rm("apps/web", { recursive: true, force: true });
      await rm("apps/email", { recursive: true, force: true });
      await rm("packages/ui", { recursive: true, force: true });
    }
    // For 'fullstack', keep everything
  } catch (error) {
    throw new Error(
      `Failed to remove apps for ${template} template: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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

const findAllPackageJsons = async (dir: string): Promise<string[]> => {
  let results: string[] = [];
  const list = await readdir(dir, { withFileTypes: true });
  for (const file of list) {
    const filePath = join(dir, file.name);
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

  const packageJsonFiles = await findAllPackageJsons(".");

  const rootPackageJson = resolve(cwd(), "package.json");
  const allFiles = new Set<string>();

  for (const file of packageJsonFiles) {
    allFiles.add(resolve(file));
  }

  allFiles.add(rootPackageJson);

  const normalizedFiles = Array.from(allFiles);

  for (const filePath of normalizedFiles) {
    const content = await readFile(filePath, "utf8");
    let packageJson: any;
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

  const packageJsonFiles = await findAllPackageJsons(".");

  const rootPackageJson = resolve(cwd(), "package.json");
  const allFiles = new Set<string>();

  for (const file of packageJsonFiles) {
    allFiles.add(resolve(file));
  }

  allFiles.add(rootPackageJson);

  const normalizedFiles = Array.from(allFiles);

  for (const filePath of normalizedFiles) {
    const content = await readFile(filePath, "utf8");
    let packageJson: any;
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
    } catch (error) {
      // Ignore if file doesn't exist (template may have removed it)
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
    } catch {}
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
    } catch {}
    try {
      await rm("pnpm-workspace.yaml", { force: true });
    } catch {}
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
    'git commit --no-verify -m "✨ Initial commit from Build Elevate"',
    execSyncOpts,
  );
};

const setupEnvironmentVariables = async (includeDocker: boolean) => {
  const files = [
    { source: join("apps", "api"), target: ".env.local" },
    { source: join("apps", "web"), target: ".env.local" },
    { source: join("packages", "auth"), target: ".env.local" },
    { source: join("packages", "db"), target: ".env" },
    { source: join("packages", "rate-limit"), target: ".env" },
    { source: join("packages", "email"), target: ".env" },
    { source: join("packages", "storage"), target: ".env" },
  ];

  // Generate a single auth secret to share across all env files
  const authSecret = generateSecret(32);

  // Parallelize env file creation
  const envFilePromises = files.map(async ({ source, target }) => {
    try {
      await copyFile(join(source, ".env.example"), join(source, target));
      await updateAuthSecretInEnvFile(join(source, target), authSecret);
    } catch (error) {
      // Skip if source app doesn't exist (based on template choice)
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
      } catch (error) {
        // Skip if source app doesn't exist (based on template choice)
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
) => {
  const packageJsonPath = "package.json";
  const content = await readFile(packageJsonPath, "utf8");
  const updated = applyPackageJsonCleanup(
    content,
    template,
    includeDocker,
    includeKubernetes,
  );
  await writeFile(packageJsonPath, updated);
};

const updateLicense = async (projectName: string) => {
  const licensePath = "LICENSE";
  const currentYear = new Date().getFullYear();

  const content = await readFile(licensePath, "utf8");

  // Replace the copyright line with new project name and current year
  const updated = content.replace(
    /Copyright \(c\) \d{4} .+/,
    `Copyright (c) ${currentYear} ${projectName}`,
  );

  await writeFile(licensePath, updated);
};

const updatePnpmCatalog = async (template: string) => {
  const workspacePath = "pnpm-workspace.yaml";
  const workspaceFile = await readFile(workspacePath, "utf8");
  const updatedContent = applyPnpmCatalogCleanup(workspaceFile, template);
  await writeFile(workspacePath, updatedContent);
};

const getName = async () => {
  const value = await text({
    message: "What is your project named?",
    placeholder: "my app",
    validate(value: string) {
      if (value.length === 0) {
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
    options: [
      {
        value: "fullstack",
        label: "🚀 Full-Stack Application",
        hint: "Complete setup: Web + API + Database + Auth",
      },
      {
        value: "web",
        label: "🎨 Frontend Application",
        hint: "Next.js app with authentication & UI",
      },
      {
        value: "api",
        label: "⚡ Backend API",
        hint: "Express REST API with database & auth",
      },
    ],
    initialValue: "fullstack",
  });

  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value.toString() as "fullstack" | "web" | "api";
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
  } = {},
) => {
  try {
    intro("Let's start a Build Elevate project!");

    // Validate template if provided
    if (
      options.template &&
      !["fullstack", "web", "api"].includes(options.template)
    ) {
      log.error(
        `Invalid template: ${options.template}. Choose from: fullstack, web, api`,
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
      options.template ||
      (options.yes ? "fullstack" : await getProjectTemplate());

    const packageManager = await getPackageManager(
      options.packageManager,
      options.yes,
    );

    // Handle --no-git flag
    const shouldInitGit = options.git !== false;

    const includeDocker = options.yes ? true : await getDockerChoice();

    // Kubernetes runs the Docker images, so it's only offered when Docker is
    // included. It's opt-in (default No) and skipped entirely under --yes.
    const includeKubernetes =
      includeDocker && !options.yes ? await getKubernetesChoice() : false;

    let dockerHubUsername = "your-dockerhub-username";
    let domainName = "";
    if (includeKubernetes) {
      dockerHubUsername = await getDockerHubUsername();
      domainName = await getDomainName();
    }

    const includeStudio = options.yes ? true : await getStudioChoice();

    const s = spinner();
    const projectDir = join(cwd, toKebabCase(name));

    // Validate prerequisites before starting
    s.start("Validating prerequisites...");
    await validatePrerequisites(name, projectDir, !shouldInitGit);
    s.stop("✓ Prerequisites validated");

    s.start("Cloning Build Elevate...");
    let commitHash: string;
    try {
      commitHash = await cloneBuildElevate(toKebabCase(name));
      if (options.verbose) log.info("✓ Cloned repository");
    } catch (error) {
      throw new Error(
        `Failed to clone repository. Check your internet connection and try again. ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    s.message("Moving into repository...");
    process.chdir(projectDir);
    if (options.verbose) log.info(`✓ Changed directory to ${projectDir}`);

    if (template !== "fullstack") {
      s.message(`Configuring ${template} project...`);
      await removeAppsByTemplate(template);
      // Remove client.ts from auth for API-only template
      await removeAuthClientArtifactsForApi(template);
      if (options.verbose) log.info(`✓ Configured ${template} template`);
    }

    s.message("Configuring turbo.json lint env for template...");
    await updateTurboLintEnv(template);
    if (options.verbose) log.info("✓ Updated turbo.json lint env");

    s.message("Replacing project name...");
    await replaceProjectNameInAll(name);
    if (options.verbose) log.info("✓ Replaced project name in all files");

    s.message("Cleaning up package.json...");
    await cleanupPackageJson(template, includeDocker, includeKubernetes);
    if (options.verbose) log.info("✓ Cleaned up package.json");

    s.message("Updating LICENSE...");
    await updateLicense(name);
    if (options.verbose) log.info("✓ Updated LICENSE");

    s.message("Updating pnpm catalog...");
    await updatePnpmCatalog(template);
    if (options.verbose) log.info("✓ Updated pnpm catalog");

    s.message(`Configuring for ${packageManager}...`);
    await configurePackageManager(packageManager);
    if (options.verbose) log.info("✓ Configured package manager");

    s.message("Setting up environment variable files...");
    await setupEnvironmentVariables(includeDocker);
    if (options.verbose) log.info("✓ Environment files created");

    s.message("Deleting internal content...");
    await deleteInternalContent();
    if (options.verbose) log.info("✓ Deleted internal content");

    if (!includeStudio) {
      s.message("Removing Prisma Studio app...");
      await rm("apps/studio", { recursive: true, force: true });
      if (options.verbose) log.info("✓ Removed Prisma Studio app");
    }

    if (!includeDocker) {
      s.message("Removing Docker files...");
      await removeDockerFiles();
      if (options.verbose) log.info("✓ Removed Docker files");
    } else if (template !== "fullstack") {
      s.message("Updating Docker configuration for template...");
      await updateDockerComposeForTemplate(template);
      if (options.verbose)
        log.info(`✓ Updated Docker configuration for ${template} template`);
    }

    if (!includeKubernetes) {
      s.message("Removing Kubernetes files...");
      await removeKubernetesFiles();
      if (options.verbose) log.info("✓ Removed Kubernetes files");
    } else {
      s.message("Configuring Kubernetes manifests...");
      await replaceDockerHubUsername(dockerHubUsername);
      await replaceDomainName(domainName);
      if (template !== "fullstack") {
        await updateK8sForTemplate(template);
      }
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
      } catch {}
    } else {
      if (options.verbose) log.info("⊘ Skipped dependency installation");
    }

    // Update README.md with project details
    s.message("Creating project README...");
    await createProjectReadme(
      name,
      template,
      includeDocker,
      packageManager as "npm" | "pnpm" | "bun",
      includeKubernetes,
    );

    s.message("Writing upgrade manifest...");
    const manifest = await buildManifest(commitHash, template, name, {
      docker: includeDocker,
      kubernetes: includeKubernetes,
      studio: includeStudio,
    });
    await writeManifest(manifest);
    if (options.verbose) log.info("✓ Written .build-elevate.json manifest");

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
      `🎉 Your Build Elevate project is ready!\n\nNext steps:\n  ${cdCommand}${installCommand}\n  Update .env files with your database and API keys\n  ${devCommand}`,
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
