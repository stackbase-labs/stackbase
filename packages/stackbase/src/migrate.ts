import { constants } from "node:fs";
import { access, copyFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { cancel, confirm, isCancel, log } from "@clack/prompts";
import {
  LEGACY_MANIFEST_BACKUP_FILE,
  LEGACY_MANIFEST_FILE,
  MANIFEST_VERSION,
  isSafeManifestFilePath,
  writeManifest,
  type ManifestFeatures,
  type StackbaseManifest,
} from "./manifest.js";
import { normalizeTemplateName } from "./templates.js";
import { upgrade } from "./upgrade.js";

type JsonRecord = Record<string, unknown>;

export interface LegacyBuildElevateManifest {
  version?: number;
  commit: string;
  template: string;
  projectName: string;
  scaffoldedAt: string;
  features?: Partial<ManifestFeatures>;
  files: Record<string, string>;
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

export const parseLegacyManifest = (
  content: string,
): LegacyBuildElevateManifest => {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    throw new Error(`${LEGACY_MANIFEST_FILE} contains invalid JSON.`);
  }

  if (!isRecord(value)) {
    throw new Error(`${LEGACY_MANIFEST_FILE} must contain a JSON object.`);
  }

  const requiredStrings = [
    "commit",
    "template",
    "projectName",
    "scaffoldedAt",
  ] as const;
  for (const field of requiredStrings) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      throw new Error(
        `${LEGACY_MANIFEST_FILE} is missing a valid ${field} field.`,
      );
    }
  }

  if (!isStringRecord(value.files)) {
    throw new Error(`${LEGACY_MANIFEST_FILE} is missing a valid files field.`);
  }

  const unsafeFilePath = Object.keys(value.files).find(
    (filePath) => !isSafeManifestFilePath(filePath),
  );
  if (unsafeFilePath) {
    throw new Error(
      `${LEGACY_MANIFEST_FILE} contains an unsafe file path: ${unsafeFilePath}`,
    );
  }

  if (value.features !== undefined && !isRecord(value.features)) {
    throw new Error(`${LEGACY_MANIFEST_FILE} has an invalid features field.`);
  }

  const features = isRecord(value.features)
    ? {
        docker:
          typeof value.features.docker === "boolean"
            ? value.features.docker
            : undefined,
        kubernetes:
          typeof value.features.kubernetes === "boolean"
            ? value.features.kubernetes
            : undefined,
        studio:
          typeof value.features.studio === "boolean"
            ? value.features.studio
            : undefined,
        observability:
          typeof value.features.observability === "boolean"
            ? value.features.observability
            : undefined,
      }
    : undefined;

  return {
    version: typeof value.version === "number" ? value.version : undefined,
    commit: value.commit as string,
    template: value.template as string,
    projectName: value.projectName as string,
    scaffoldedAt: value.scaffoldedAt as string,
    features,
    files: value.files,
  };
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const convertLegacyManifest = async (
  manifest: LegacyBuildElevateManifest,
  projectRoot: string = process.cwd(),
): Promise<StackbaseManifest> => {
  const template = normalizeTemplateName(manifest.template);
  if (!template) {
    throw new Error(
      `Unsupported Build Elevate template "${manifest.template}". Expected fullstack, base, web, or api.`,
    );
  }

  const detectedFeatures: ManifestFeatures = {
    docker:
      manifest.features?.docker ??
      (await pathExists(join(projectRoot, "docker-compose.prod.yml"))),
    kubernetes:
      manifest.features?.kubernetes ??
      (await pathExists(join(projectRoot, "k8s"))),
    studio:
      manifest.features?.studio ??
      (await pathExists(join(projectRoot, "apps", "studio"))),
    observability:
      template === "web"
        ? false
        : (manifest.features?.observability ??
          (await pathExists(
            join(projectRoot, "docker-compose.observability.yml"),
          ))),
  };

  return {
    version: MANIFEST_VERSION,
    commit: manifest.commit,
    template,
    projectName: manifest.projectName,
    scaffoldedAt: manifest.scaffoldedAt,
    features: detectedFeatures,
    files: { ...manifest.files },
    source: "build-elevate",
  };
};

const readLegacyManifest = async (): Promise<LegacyBuildElevateManifest> => {
  const content = await readFile(LEGACY_MANIFEST_FILE, "utf8");
  return parseLegacyManifest(content);
};

const persistMigration = async (manifest: StackbaseManifest): Promise<void> => {
  await writeManifest(manifest);
  await copyFile(
    LEGACY_MANIFEST_FILE,
    LEGACY_MANIFEST_BACKUP_FILE,
    constants.COPYFILE_EXCL,
  );
  await unlink(LEGACY_MANIFEST_FILE);
};

export const migrate = async (
  options: { yes?: boolean; dry?: boolean; force?: boolean } = {},
): Promise<void> => {
  try {
    if (await pathExists(".stackbase.json")) {
      log.error(
        "A .stackbase.json manifest already exists. This project is already managed by Stackbase.",
      );
      process.exitCode = 1;
      return;
    }

    if (!(await pathExists(LEGACY_MANIFEST_FILE))) {
      log.error(
        `No ${LEGACY_MANIFEST_FILE} found. Run this command from a Build Elevate project root.`,
      );
      process.exitCode = 1;
      return;
    }

    if (!options.dry && (await pathExists(LEGACY_MANIFEST_BACKUP_FILE))) {
      log.error(
        `${LEGACY_MANIFEST_BACKUP_FILE} already exists. Move or remove that backup before migrating.`,
      );
      process.exitCode = 1;
      return;
    }

    const legacyManifest = await readLegacyManifest();
    const manifest = await convertLegacyManifest(legacyManifest);

    if (!options.yes && !options.dry) {
      const accepted = await confirm({
        message:
          "Migrate this Build Elevate project to the latest Stackbase template? User-modified files will be kept.",
        initialValue: true,
      });

      if (isCancel(accepted) || !accepted) {
        cancel("Migration cancelled.");
        return;
      }
    }

    await upgrade({
      dry: options.dry,
      force: options.force,
      manifest,
      persistManifest: persistMigration,
      title: "stackbase migrate",
      operation: "migration",
    });

    if (!options.dry) {
      log.info(
        `Original manifest saved as ${LEGACY_MANIFEST_BACKUP_FILE}. Delete it after the migrated project passes your checks.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(message);
    process.exitCode = 1;
  }
};
