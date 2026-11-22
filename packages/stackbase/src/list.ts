import { intro, log, outro } from "@clack/prompts";
import { join } from "node:path";
import { PRODUCT_NAME } from "./branding.js";
import { getAvailableModules } from "./modules.js";
import { directoryExists } from "./utils.js";

export interface ModuleStatus {
  name: string;
  label: string;
  description: string;
  installed: boolean;
}

/**
 * Checks the installation status of all known modules in the current workspace.
 */
export const getModulesStatus = async (
  projectRoot: string = process.cwd(),
): Promise<ModuleStatus[]> => {
  const modules = getAvailableModules();
  const results: ModuleStatus[] = [];

  for (const mod of modules) {
    const pkgDir = join(projectRoot, "packages", mod.name);
    const installed = await directoryExists(pkgDir);
    results.push({
      name: mod.name,
      label: mod.label,
      description: mod.description,
      installed,
    });
  }

  return results;
};

/**
 * Displays a formatted list of all available and installed modules.
 */
export const list = async (
  projectRoot: string = process.cwd(),
): Promise<void> => {
  intro(`${PRODUCT_NAME} Modules`);

  const statuses = await getModulesStatus(projectRoot);

  const nameColWidth = Math.max(...statuses.map((s) => s.name.length), 10);
  const statusColWidth = 12;

  const header = `  ${"MODULE".padEnd(nameColWidth)}  ${"STATUS".padEnd(statusColWidth)}  DESCRIPTION`;
  const separator = `  ${"─".repeat(nameColWidth)}  ${"─".repeat(statusColWidth)}  ${"─".repeat(40)}`;

  const lines = statuses.map((s) => {
    const statusText = s.installed ? "✔ installed" : "○ available";
    return `  ${s.name.padEnd(nameColWidth)}  ${statusText.padEnd(statusColWidth)}  ${s.description}`;
  });

  log.info(
    `Available modules for your Turborepo workspace:\n\n${header}\n${separator}\n${lines.join("\n")}`,
  );

  const hasAvailable = statuses.some((s) => !s.installed);
  if (hasAvailable) {
    outro("Run `stackbase add <name>` to install any available module.");
  } else {
    outro("All official modules are already installed in this workspace.");
  }
};
