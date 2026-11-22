import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  select,
  spinner,
} from "@clack/prompts";
import degit from "degit";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_NAME, REPO } from "./branding.js";
import {
  hashFile,
  manifestExists,
  readManifest,
  writeManifest,
} from "./manifest.js";
import { getAvailableModules, getModule } from "./modules.js";
import { getModulesStatus, list } from "./list.js";
import { findAvailableApps, linkPackageToApp } from "./transformers/appLink.js";
import {
  adaptPackageDependencies,
  getTargetWorkspaceCatalogs,
} from "./transformers/catalog.js";
import { mergeDockerComposeService } from "./transformers/dockerCompose.js";
import { mergeEnvExample } from "./transformers/env.js";
import { adaptScope, detectWorkspaceScope } from "./transformers/scope.js";
import { directoryExists, exec, execSyncOpts, isGitClean } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const branch = process.env.STACKBASE_BRANCH ?? "main";

export interface AddOptions {
  app?: string;
  skipInstall?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  allowDirty?: boolean;
  list?: boolean;
}

const detectPackageManager = async (projectRoot: string): Promise<string> => {
  const lockfiles: [string, string][] = [
    ["pnpm-lock.yaml", "pnpm"],
    ["package-lock.json", "npm"],
    ["bun.lockb", "bun"],
    ["bun.lock", "bun"],
    ["yarn.lock", "yarn"],
  ];

  for (const [lockfile, pm] of lockfiles) {
    if (await directoryExists(join(projectRoot, lockfile))) {
      return pm;
    }
  }

  // Check packageJson packageManager field
  try {
    const pkg = JSON.parse(
      await readFile(join(projectRoot, "package.json"), "utf8"),
    ) as {
      packageManager?: string;
    };
    if (pkg.packageManager) {
      const pm = pkg.packageManager.split("@")[0];
      if (pm) return pm;
    }
  } catch {
    // ignore
  }

  return "pnpm";
};

const resolveModuleSourcePath = async (
  sourcePackageName: string,
): Promise<{ path: string; cleanup?: () => Promise<void> }> => {
  if (process.env.STACKBASE_LOCAL_TEMPLATES_DIR) {
    return {
      path: join(
        process.env.STACKBASE_LOCAL_TEMPLATES_DIR,
        "templates/base/packages",
        sourcePackageName,
      ),
    };
  }

  // Check if running directly in the stackbase workspace
  const repoTemplatesPath = join(
    __dirname,
    "../../../templates/base/packages",
    sourcePackageName,
  );
  if (await directoryExists(repoTemplatesPath)) {
    return { path: repoTemplatesPath };
  }

  // Fallback to degit clone of repository
  const tempDir = await mkdtemp(join(tmpdir(), "stackbase-add-"));
  const emitter = degit(`${REPO}#${branch}`, {
    cache: false,
    force: true,
    verbose: false,
  });
  await emitter.clone(tempDir);

  return {
    path: join(tempDir, "templates/base/packages", sourcePackageName),
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
};

export const add = async (
  moduleArg?: string,
  options: AddOptions = {},
): Promise<void> => {
  const projectRoot = process.cwd();

  // If --list flag is provided, display available modules and exit
  if (options.list) {
    await list(projectRoot);
    return;
  }

  intro(`${PRODUCT_NAME} Add Module`);

  // 1. Verify we are in a Turborepo workspace
  const isTurborepo =
    (await directoryExists(join(projectRoot, "turbo.json"))) ||
    (await directoryExists(join(projectRoot, "package.json")));

  if (!isTurborepo) {
    log.error(
      "Could not find turbo.json or package.json in current directory.",
    );
    cancel(
      "Please run this command from the root of your Turborepo workspace.",
    );
    process.exit(1);
  }

  // 2. Git Working Tree Protection
  if (!options.allowDirty && !options.yes) {
    const clean = await isGitClean(projectRoot);
    if (!clean) {
      log.warn("Your git working tree has uncommitted changes.");
      const proceed = await confirm({
        message:
          "Proceed anyway? (Uncommitted changes may make it harder to review or revert)",
        initialValue: false,
      });

      if (isCancel(proceed) || !proceed) {
        cancel(
          "Operation cancelled. Please commit or stash your changes before adding modules.",
        );
        process.exit(0);
      }
    }
  }

  const pm = await detectPackageManager(projectRoot);
  const scope = await detectWorkspaceScope(projectRoot);

  log.info(`Workspace detected: Package Manager = ${pm}, Scope = ${scope}`);

  // 3. Resolve module to add
  let selectedModuleName = moduleArg;
  if (!selectedModuleName) {
    const statuses = await getModulesStatus(projectRoot);
    const uninstalled = statuses.filter((s) => !s.installed);

    if (uninstalled.length === 0) {
      log.info("All official modules are already installed in this workspace.");
      outro("Nothing to add.");
      return;
    }

    const selection = await select({
      message: "Select a module to add to your workspace:",
      options: statuses.map((mod) => ({
        value: mod.name,
        label: mod.installed ? `${mod.name} (installed)` : mod.name,
        hint: mod.installed
          ? "Already installed in packages/"
          : mod.description,
      })),
    });

    if (isCancel(selection)) {
      cancel("Operation cancelled.");
      process.exit(0);
    }
    selectedModuleName = selection as string;
  }

  const moduleDef = getModule(selectedModuleName);
  if (!moduleDef) {
    log.error(`Unknown module "${selectedModuleName}".`);
    log.info(
      `Available modules: ${getAvailableModules()
        .map((m) => m.name)
        .join(", ")}`,
    );
    cancel("Operation aborted.");
    process.exit(1);
  }

  // 3. Collision Detection
  const targetPackageDir = join(projectRoot, "packages", moduleDef.name);
  if (await directoryExists(targetPackageDir)) {
    log.error(`Directory "packages/${moduleDef.name}" already exists.`);
    cancel("Collision detected. Module is already present in this workspace.");
    process.exit(1);
  }

  // 4. Dry Run handling
  if (options.dryRun) {
    log.warn("[DRY RUN] Previewing operations without writing to disk:");
    log.info(`• Would create: packages/${moduleDef.name}/`);
    log.info(`• Would name package: ${scope}/${moduleDef.name}`);
    if (moduleDef.dockerService) {
      log.info(
        `• Would verify docker-compose.yml service: ${moduleDef.dockerService.name}`,
      );
    }
    log.info(
      `• Would update root .env.example with required environment variables`,
    );
    outro("Dry run complete. No changes made.");
    return;
  }

  // 5. Fetch and Copy Package
  const s = spinner();
  s.start(`Fetching module "${moduleDef.name}"...`);

  let sourceInfo: { path: string; cleanup?: () => Promise<void> };
  try {
    sourceInfo = await resolveModuleSourcePath(moduleDef.sourcePackageName);
  } catch (error) {
    s.stop("Failed to retrieve module.");
    log.error(error instanceof Error ? error.message : String(error));
    cancel("Could not retrieve module template files.");
    process.exit(1);
  }

  try {
    s.message(`Injecting packages/${moduleDef.name}...`);

    await cp(sourceInfo.path, targetPackageDir, {
      recursive: true,
      filter: (src) => {
        const basename = src.split(/[\\/]/).pop();
        return (
          basename !== "node_modules" &&
          basename !== ".turbo" &&
          basename !== "dist" &&
          basename !== "build" &&
          basename !== "tsconfig.tsbuildinfo"
        );
      },
    });

    // 6. Adapt Scope and Catalogs in target package
    const pkgJsonPath = join(targetPackageDir, "package.json");
    if (await directoryExists(pkgJsonPath)) {
      const pkgContent = await readFile(pkgJsonPath, "utf8");
      let pkgObj = JSON.parse(pkgContent) as Record<string, unknown>;

      // Scope replacement in package name
      if (typeof pkgObj.name === "string") {
        pkgObj.name = adaptScope(pkgObj.name, scope);
      }

      // Catalog adaptation for non-pnpm or non-catalog workspaces
      const targetCatalogs = await getTargetWorkspaceCatalogs(projectRoot);
      pkgObj = adaptPackageDependencies(pkgObj, targetCatalogs, pm);

      await writeFile(pkgJsonPath, JSON.stringify(pkgObj, null, 2) + "\n");
    }

    // Adapt README.md if present
    const readmePath = join(targetPackageDir, "README.md");
    if (await directoryExists(readmePath)) {
      const readmeContent = await readFile(readmePath, "utf8");
      await writeFile(readmePath, adaptScope(readmeContent, scope));
    }

    s.stop(`Copied package to packages/${moduleDef.name}`);
  } finally {
    if (sourceInfo.cleanup) {
      await sourceInfo.cleanup();
    }
  }

  // 7. Merge environment variables into root .env.example
  const moduleEnvExamplePath = join(targetPackageDir, ".env.example");
  if (await directoryExists(moduleEnvExamplePath)) {
    const moduleEnvContent = await readFile(moduleEnvExamplePath, "utf8");
    const targetEnvPath = join(projectRoot, ".env.example");
    const { changed, addedKeys } = await mergeEnvExample(
      moduleEnvContent,
      targetEnvPath,
    );
    if (changed && addedKeys.length > 0) {
      log.success(`Updated .env.example (added ${addedKeys.join(", ")})`);
    }
  }

  // 8. Merge Docker Compose backing service if needed
  if (moduleDef.dockerService) {
    const dockerComposePath = join(projectRoot, "docker-compose.yml");
    const { changed } = await mergeDockerComposeService(
      dockerComposePath,
      moduleDef.dockerService.name,
      {
        image: moduleDef.dockerService.image,
        ports: moduleDef.dockerService.ports,
        environment: moduleDef.dockerService.environment,
        restart: "unless-stopped",
      },
    );
    if (changed) {
      log.success(
        `Added ${moduleDef.dockerService.name} service to docker-compose.yml`,
      );
    }
  }

  // 9. App Linking
  const availableApps = await findAvailableApps(projectRoot);
  let appToLink: string | undefined = options.app;

  if (!appToLink && availableApps.length > 0) {
    if (options.yes) {
      if (
        moduleDef.recommendedApp &&
        availableApps.some((a) => a.name === moduleDef.recommendedApp)
      ) {
        appToLink = moduleDef.recommendedApp;
      }
    } else {
      const choices = [
        ...availableApps.map((a) => ({
          value: a.name,
          label: `apps/${a.name}`,
          hint: a.name === moduleDef.recommendedApp ? "Recommended" : undefined,
        })),
        {
          value: "none",
          label: "None (standalone package)",
        },
      ];

      const chosen = await select({
        message: `Which app should consume ${scope}/${moduleDef.name}?`,
        options: choices,
        initialValue: moduleDef.recommendedApp ?? availableApps[0]?.name,
      });

      if (!isCancel(chosen) && chosen !== "none") {
        appToLink = chosen as string;
      }
    }
  }

  if (appToLink && appToLink !== "none") {
    const targetApp = availableApps.find((a) => a.name === appToLink);
    if (targetApp) {
      const linked = await linkPackageToApp(
        targetApp.packageJsonPath,
        `${scope}/${moduleDef.name}`,
        pm,
      );
      if (linked) {
        log.success(
          `Added ${scope}/${moduleDef.name} to apps/${appToLink}/package.json`,
        );
      }
    }
  }

  // 10. Update .stackbase.json Manifest (if present)
  if (await manifestExists()) {
    try {
      const manifest = await readManifest();
      if (manifest) {
        const packageFiles = await walkFiles(targetPackageDir, projectRoot);
        for (const relFile of packageFiles) {
          const hash = await hashFile(join(projectRoot, relFile));
          if (hash) {
            manifest.files[relFile] = hash;
          }
        }
        await writeManifest(manifest, projectRoot);
        log.info("Updated .stackbase.json manifest tracking");
      }
    } catch {
      // ignore manifest update error
    }
  }

  // 11. Run Package Manager Install
  if (!options.skipInstall) {
    const installSpinner = spinner();
    installSpinner.start(`Installing dependencies with ${pm}...`);
    try {
      await exec(`${pm} install`, { ...execSyncOpts, cwd: projectRoot });
      installSpinner.stop("Dependencies installed successfully.");
    } catch {
      installSpinner.stop("Automatic dependency installation failed.");
      log.warn(`Please run "${pm} install" manually to finish linking.`);
    }
  }

  // 12. Completion Outro
  outro(
    `✔ Successfully added ${scope}/${moduleDef.name} to packages/${moduleDef.name}!`,
  );

  log.info(`Next steps:
  You can import ${scope}/${moduleDef.name} anywhere in your workspace:
    import { ... } from '${scope}/${moduleDef.name}';`);
};

const walkFiles = async (
  dir: string,
  root: string,
  results: string[] = [],
): Promise<string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = fullPath
        .replace(root, "")
        .replace(/^[\\/]/, "")
        .replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (
          entry.name !== "node_modules" &&
          entry.name !== ".turbo" &&
          entry.name !== "dist"
        ) {
          await walkFiles(fullPath, root, results);
        }
      } else {
        results.push(relPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
};
