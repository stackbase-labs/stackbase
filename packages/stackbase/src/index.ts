import { program } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initialize } from "./initialize.js";
import { upgrade } from "./upgrade.js";
import { diff } from "./diff.js";
import { CLI_NAME, PRODUCT_NAME } from "./branding.js";

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
);

program
  .name(CLI_NAME)
  .description(
    `${PRODUCT_NAME} CLI for scaffolding production-ready full-stack Turborepo applications`,
  )
  .version(packageJson.version);

program
  .command("init [project-name]")
  .description("Create a new project")
  .option("-t, --template <type>", "Project type: base, web, or api")
  .option(
    "-p, --package-manager <manager>",
    "Package manager: pnpm, npm, or bun",
  )
  .option("--no-git", "Skip Git repository initialization")
  .option("--skip-install", "Skip dependency installation")
  .option("--docker", "Include Docker configuration")
  .option("--no-docker", "Skip Docker configuration")
  .option("--k8s, --kubernetes", "Include Kubernetes manifests")
  .option("--no-k8s, --no-kubernetes", "Skip Kubernetes manifests")
  .option("--observability", "Include observability configuration")
  .option("--no-observability", "Skip observability setup")
  .option("--studio", "Include Prisma Studio")
  .option("--no-studio", "Skip Prisma Studio")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("-v, --verbose", "Show detailed output")
  .action(initialize);

program
  .command("upgrade")
  .description(
    `Upgrade your project to the latest ${PRODUCT_NAME} template version.\n\n` +
      "Files you have not modified are updated automatically.\n" +
      "Files you have modified are listed as conflicts for manual review.\n\n" +
      "Run `stackbase diff <file>` to inspect what changed in the template for any conflict.",
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .option(
    "--dry-run",
    "Preview what would be changed without writing any files",
  )
  .option(
    "--force",
    "Advance to the latest commit, keeping your local edits and clearing current conflicts",
  )
  .action((options) =>
    upgrade({
      yes: options.yes,
      dry: options.dryRun,
      force: options.force,
    }),
  );

program
  .command("diff <file>")
  .description(
    "Show what changed in the Stackbase template for a specific file.\n\n" +
      "Compares the file between your scaffolded version and the latest template version.\n" +
      "Use this to understand what you need to manually apply after an upgrade conflict.\n\n" +
      "Example:\n" +
      "  stackbase diff apps/web/next.config.ts\n" +
      "  stackbase diff apps/api/src/config/corsOptions.ts",
  )
  .action((filePath: string) => diff(filePath));

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
