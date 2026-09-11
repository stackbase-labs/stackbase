import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { intro, log, outro, spinner } from "@clack/prompts";
import {
  hashContent,
  hashFile,
  readManifest,
  writeManifest,
  manifestExists,
  resolveFeatures,
  MANIFEST_FILE,
  MANIFEST_VERSION,
  type ManifestFeatures,
} from "./manifest.js";
import { CLI_NAME, REPO, PRODUCT_NAME } from "./branding.js";
import {
  applyPackageJsonCleanup,
  applyDockerfilesPackageManagerCleanup,
  applyDockerHubUsernameCleanup,
  K8S_DOCKERHUB_FILES,
} from "./update.js";
import { applyProjectName } from "./utils.js";
import { getTemplatePath } from "./templates.js";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO}`;
const API_BASE = `https://api.github.com/repos/${REPO}`;

// Files/dirs we never write during upgrade — mirrors the skip logic in manifest.ts

// Single path segments (dir names) to always skip
const SKIP_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
]);

const SKIP_EXACT = new Set([
  MANIFEST_FILE,
  "README.md",
  "LICENSE",
  "pnpm-lock.yaml",
  "bun.lockb",
  "package-lock.json",
  "yarn.lock",
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

const shouldSkip = (filePath: string): boolean => {
  // Skip exact matches
  if (SKIP_EXACT.has(filePath)) return true;
  // Skip env files (any filename starting with .env except .env.example)
  const fileName = filePath.split("/").pop()!;
  if (fileName.startsWith(".env") && fileName !== ".env.example") return true;
  // Skip if any individual path segment is a skipped dir name
  if (filePath.split("/").some((seg) => SKIP_SEGMENTS.has(seg))) return true;
  // Skip by extension
  const ext = fileName.includes(".") ? "." + fileName.split(".").pop()! : "";
  if (SKIP_EXTENSIONS.has(ext)) return true;
  return false;
};

/**
 * The files and folders that belong to each optional feature. This matches what
 * init.ts deletes when a feature is turned down (removeDockerFiles,
 * removeKubernetesFiles, and the studio cleanup). Each entry is treated either
 * as an exact file path or as a folder prefix.
 */
const FEATURE_PATHS: Record<keyof ManifestFeatures, string[]> = {
  docker: [
    "docker-compose.prod.yml",
    "apps/api/Dockerfile.prod",
    "apps/web/Dockerfile.prod",
    ".dockerignore",
  ],
  observability: ["docker-compose.observability.yml", "deploy/observability"],
  kubernetes: ["k8s", "deploy.sh"],
  studio: ["apps/studio"],
};

/**
 * Returns true when a file belongs to a feature the user chose not to include.
 * This keeps the upgrade from bringing back Docker, Kubernetes, or Studio files
 * that were removed when the project was first created.
 */
const isExcludedByFeatures = (
  filePath: string,
  features: ManifestFeatures,
): boolean => {
  return (Object.keys(FEATURE_PATHS) as Array<keyof ManifestFeatures>).some(
    (feature) =>
      !features[feature] &&
      FEATURE_PATHS[feature].some(
        (p) => filePath === p || filePath.startsWith(p + "/"),
      ),
  );
};

export const getLatestCommit = async (): Promise<string> => {
  const res = await fetch(`${API_BASE}/commits/main`, {
    headers: { Accept: "application/vnd.github.sha" },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to resolve latest commit SHA from GitHub (${res.status}). Check your internet connection.`,
    );
  }
  return (await res.text()).trim();
};

const getFileAtCommit = async (
  commit: string,
  template: string,
  filePath: string,
): Promise<string | null> => {
  const templatePrefix = getTemplatePath(template);
  const res = await fetch(
    `${RAW_BASE}/${commit}/${templatePrefix}/${filePath}`,
  );
  if (res.ok) return res.text();

  return null;
};

/**
 * Minimal line diff — used only in the conflict report to show
 * what changed in the template between the two commits.
 * Capped at 60 lines so it doesn't flood the terminal.
 */
const simpleDiff = (oldContent: string, newContent: string): string => {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const output: string[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === undefined) {
      output.push(`+ ${newLine}`);
    } else if (newLine === undefined) {
      output.push(`- ${oldLine}`);
    } else if (oldLine !== newLine) {
      output.push(`- ${oldLine}`);
      output.push(`+ ${newLine}`);
    }
  }

  const capped = output.slice(0, 60);
  if (output.length > 60) {
    capped.push(`... (${output.length - 60} more lines)`);
  }
  return capped.join("\n");
};

/**
 * Applies the same per-file transformations that init.ts runs after cloning,
 * so fetched GitHub content is comparable to the user's post-init files.
 *
 * Order matters — projectName is applied first so downstream transforms
 * operate on already-replaced content (e.g. package.json description).
 */
const applyInitTransforms = (
  filePath: string,
  content: string,
  template: string,
  projectName: string,
  features: ManifestFeatures,
  packageManager: string = "pnpm",
): string => {
  // 1. Apply project name replacement first (all case formats)
  let result = applyProjectName(content, projectName);

  if (K8S_DOCKERHUB_FILES.includes(filePath)) {
    result = applyDockerHubUsernameCleanup(result);
  }

  // 2. Apply per-file init-time transformations.
  if (filePath === "package.json") {
    result = applyPackageJsonCleanup(
      result,
      template,
      features.docker,
      features.kubernetes,
      features.observability,
    );
  } else if (
    filePath === "apps/api/Dockerfile.prod" ||
    filePath === "apps/web/Dockerfile.prod"
  ) {
    result = applyDockerfilesPackageManagerCleanup(result, packageManager);
  }

  return result;
};

// Main upgrade function — compares manifest commit to latest template commit, identifies which files can be auto-updated, which have conflicts, and which are already in sync. Applies safe updates and reports the rest to the user.
export const upgrade = async (
  options: { yes?: boolean; dry?: boolean; force?: boolean } = {},
) => {
  try {
    intro(`${CLI_NAME} upgrade`);

    // 1. Check manifest exists
    if (!(await manifestExists())) {
      log.error(
        `No ${MANIFEST_FILE} found.\n\nThis project was either not scaffolded with ${PRODUCT_NAME}, or was created before Stackbase upgrade support was added.\n\nTo manually upgrade, compare your files against the latest template at:\nhttps://github.com/${REPO}/tree/main/templates/base`,
      );
      process.exit(1);
    }

    const manifest = await readManifest();
    if (!manifest) {
      log.error(`Failed to read ${MANIFEST_FILE}. It may be corrupted.`);
      process.exit(1);
    }

    const baseCommit = manifest.commit;
    const templatePrefix = `${getTemplatePath(manifest.template)}/`;

    // Find out which optional features this project includes. Older manifests
    // don't store this, so in that case we work it out from the files on disk,
    // which keeps the upgrade from re-adding features the user left out.
    const features = await resolveFeatures(manifest);

    // 2. Fetch latest commit SHA from GitHub
    const s = spinner();
    s.start("Checking for updates...");
    const latestCommit = await getLatestCommit();
    s.stop(
      `Current: ${baseCommit.slice(0, 7)}  →  Latest: ${latestCommit.slice(0, 7)}`,
    );

    if (baseCommit === latestCommit) {
      outro("✓ Already up to date.");
      return;
    }

    if (options.dry) {
      log.info("Running in dry-run mode — no files will be written.");
    }

    // 3. Build the full list of files to check:
    //    - Everything in the manifest (files the user received at scaffold time)
    //    - Everything in the latest commit tree (catches genuinely new files)
    const manifestFileSet = new Set(Object.keys(manifest.files));

    // Fetch the full file tree of the latest commit from GitHub
    const treeRes = await fetch(
      `${API_BASE}/git/trees/${latestCommit}?recursive=1`,
    );
    const treeData = (await treeRes.json()) as {
      tree: Array<{ path: string; type: string }>;
    };
    const latestTreePaths = treeData.tree
      .filter((entry) => entry.type === "blob")
      .map((entry) => entry.path);
    const templateTreeFiles = latestTreePaths
      .filter((path) => path.startsWith(templatePrefix))
      .map((path) => path.slice(templatePrefix.length));
    const latestTreeFiles =
      templateTreeFiles.length > 0 ? templateTreeFiles : latestTreePaths;

    // Union: existing manifest files + new files from latest commit
    const allFiles = new Set<string>([...manifestFileSet, ...latestTreeFiles]);

    const autoUpdated: string[] = [];
    const alreadySynced: string[] = [];
    const conflicts: Array<{ file: string; templateDiff: string }> = [];
    const forced: string[] = [];
    const newFiles: string[] = [];

    s.start("Comparing files against latest commit...");

    for (const filePath of allFiles) {
      // Never touch skipped paths (env files, lock files, internal dirs etc.)
      if (shouldSkip(filePath)) continue;
      // Don't bring back files for optional features the user chose to skip
      if (isExcludedByFeatures(filePath, features)) continue;

      const rawContent = await getFileAtCommit(
        latestCommit,
        manifest.template,
        filePath,
      );

      // File no longer exists in new template — skip, don't delete user files
      if (rawContent === null) continue;

      // Apply the same transformations init.ts runs after cloning so that
      // fetched content is directly comparable to the user's post-init files
      const newContent = applyInitTransforms(
        filePath,
        rawContent,
        manifest.template,
        manifest.projectName,
        features,
      );

      const newHash = hashContent(newContent);
      const savedHash = manifest.files[filePath];
      const currentHash = await hashFile(filePath);

      // New file added to template that wasn't in manifest
      if (!savedHash) {
        newFiles.push(filePath);
        if (!options.dry) {
          await mkdir(dirname(filePath), { recursive: true });
          await writeFile(filePath, newContent);
          manifest.files[filePath] = newHash;
        }
        continue;
      }

      // User's file already matches the new template — nothing to do
      if (currentHash === newHash) {
        alreadySynced.push(filePath);
        manifest.files[filePath] = newHash;
        continue;
      }

      // File is untouched since scaffold — safe to auto-update
      if (currentHash === savedHash) {
        autoUpdated.push(filePath);
        if (!options.dry) {
          await mkdir(dirname(filePath), { recursive: true });
          await writeFile(filePath, newContent);
          manifest.files[filePath] = newHash;
        }
        continue;
      }

      // Template didn't change this file — user's local edits are irrelevant, skip
      if (newHash === savedHash) {
        alreadySynced.push(filePath);
        continue;
      }

      // Both user AND template changed this file — genuine conflict.
      // With --force, record the template's hash as the new base (file left
      // untouched on disk) so the conflict clears but the user's edits survive
      // and are never auto-overwritten on later runs.
      if (options.force) {
        forced.push(filePath);
        if (!options.dry) manifest.files[filePath] = newHash;
        continue;
      }

      // Fetch old template version and apply same transforms for an accurate diff
      const rawOldContent = await getFileAtCommit(
        baseCommit,
        manifest.template,
        filePath,
      );
      const oldContent =
        rawOldContent !== null
          ? applyInitTransforms(
              filePath,
              rawOldContent,
              manifest.template,
              manifest.projectName,
              features,
            )
          : null;
      const templateDiff =
        oldContent !== null
          ? simpleDiff(oldContent, newContent)
          : "(new file added in this update)";

      conflicts.push({ file: filePath, templateDiff });
      // Don't update manifest hash for conflicts — keep base hash so
      // the next upgrade run still correctly identifies this as a conflict
    }

    s.stop("Done comparing files.");

    // 4. Report
    console.log("");

    if (autoUpdated.length > 0) {
      log.success(
        `Auto-updated ${autoUpdated.length} file(s):\n${autoUpdated.map((f) => `  ✔ ${f}`).join("\n")}`,
      );
    }

    if (newFiles.length > 0) {
      log.success(
        `Added ${newFiles.length} new file(s) from template:\n${newFiles.map((f) => `  + ${f}`).join("\n")}`,
      );
    }

    if (forced.length > 0) {
      log.success(
        `Advanced ${forced.length} file(s) to latest, keeping your local edits:\n${forced.map((f) => `  ↷ ${f}`).join("\n")}`,
      );
    }

    if (conflicts.length > 0) {
      log.warn(
        `${conflicts.length} file(s) were modified by you and could not be upgraded automatically:\n\n` +
          conflicts.map((c) => `  ⚠ ${c.file}`).join("\n") +
          `\n\nRun \`${CLI_NAME} diff <file>\` to see exactly what changed in the template.`,
      );
    }

    // 5. Update manifest commit to latest (even if there are conflicts)
    if (!options.dry) {
      // Save the version and features we just worked out, so that older
      // manifests get updated and we only have to look at the disk once.
      manifest.version = MANIFEST_VERSION;
      manifest.features = features;
      // Only advance the commit pointer if all conflicts are resolved.
      // If conflicts remain, keep manifest.commit at the base so
      // `${CLI_NAME} diff <file>` can still show what needs to be applied.
      if (conflicts.length === 0) {
        manifest.commit = latestCommit;
      }
      await writeManifest(manifest);
    }

    // 6. Done
    if (conflicts.length === 0) {
      const forcedNote =
        forced.length > 0
          ? `\n${forced.length} file(s) were force-advanced — your local edits were kept; review them with \`git diff\`.`
          : "";
      outro(
        `✓ Upgraded to ${latestCommit.slice(0, 7)} successfully!${forcedNote}\nRun your package manager install to apply any dependency changes.`,
      );
    } else {
      outro(
        `Upgraded to ${latestCommit.slice(0, 7)} with ${conflicts.length} conflict(s) to resolve manually.\nSee above for the list of affected files.`,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Upgrade failed: ${error}`;
    log.error(message);
    process.exit(1);
  }
};
