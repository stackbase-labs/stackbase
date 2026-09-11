import { intro, log } from "@clack/prompts";
import { MANIFEST_FILE, readManifest, manifestExists } from "./manifest.js";
import { getLatestCommit } from "./upgrade.js";
import { CLI_NAME, PRODUCT_NAME, REPO } from "./branding.js";
import { getTemplateFilePath } from "./templates.js";

const RAW_BASE = `https://raw.githubusercontent.com/${REPO}`;

const getFileAtCommit = async (
  commit: string,
  template: string,
  filePath: string,
): Promise<string | null> => {
  const res = await fetch(
    `${RAW_BASE}/${commit}/${getTemplateFilePath(template, filePath)}`,
  );
  if (res.ok) return res.text();

  return null;
};

const coloredDiff = (
  oldContent: string,
  newContent: string,
  filePath: string,
  fromCommit: string,
  toCommit: string,
): void => {
  const RESET = "\x1b[0m";
  const RED = "\x1b[31m";
  const GREEN = "\x1b[32m";
  const CYAN = "\x1b[36m";
  const DIM = "\x1b[2m";

  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  console.log(`\n${CYAN}--- ${filePath} (${fromCommit.slice(0, 7)})${RESET}`);
  console.log(`${CYAN}+++ ${filePath} (${toCommit.slice(0, 7)})${RESET}\n`);

  type Change = {
    type: "same" | "remove" | "add";
    line: string;
  };

  const changes: Change[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  const LOOKAHEAD = 8;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldIdx >= oldLines.length) {
      changes.push({ type: "add", line: newLine! });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      changes.push({ type: "remove", line: oldLine! });
      oldIdx++;
    } else if (oldLine === newLine) {
      changes.push({ type: "same", line: oldLine! });
      oldIdx++;
      newIdx++;
    } else {
      let foundInNew = -1;
      let foundInOld = -1;

      for (let k = 1; k <= LOOKAHEAD && newIdx + k < newLines.length; k++) {
        if (newLines[newIdx + k] === oldLine) {
          foundInNew = k;
          break;
        }
      }
      for (let k = 1; k <= LOOKAHEAD && oldIdx + k < oldLines.length; k++) {
        if (oldLines[oldIdx + k] === newLine) {
          foundInOld = k;
          break;
        }
      }

      if (
        foundInNew !== -1 &&
        (foundInOld === -1 || foundInNew <= foundInOld)
      ) {
        for (let k = 0; k < foundInNew; k++) {
          changes.push({ type: "add", line: newLines[newIdx + k]! });
        }
        newIdx += foundInNew;
      } else if (foundInOld !== -1) {
        for (let k = 0; k < foundInOld; k++) {
          changes.push({ type: "remove", line: oldLines[oldIdx + k]! });
        }
        oldIdx += foundInOld;
      } else {
        changes.push({ type: "remove", line: oldLine! });
        changes.push({ type: "add", line: newLine! });
        oldIdx++;
        newIdx++;
      }
    }
  }

  // Print with context (3 lines around each changed block)
  const CONTEXT = 3;
  const changedIndices = new Set<number>();
  changes.forEach((c, i) => {
    if (c.type !== "same") {
      for (
        let k = Math.max(0, i - CONTEXT);
        k <= Math.min(changes.length - 1, i + CONTEXT);
        k++
      ) {
        changedIndices.add(k);
      }
    }
  });

  if (changedIndices.size === 0) {
    console.log(`${DIM}(no differences found)${RESET}`);
    return;
  }

  let lastPrinted = -1;
  let oldLineNum = 1;
  let newLineNum = 1;
  let totalAdded = 0;
  let totalRemoved = 0;

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i]!;

    if (c.type === "add") totalAdded++;
    if (c.type === "remove") totalRemoved++;

    if (changedIndices.has(i)) {
      if (lastPrinted !== -1 && i > lastPrinted + 1) {
        console.log(`${DIM}  ...${RESET}`);
      }

      if (c.type === "same") {
        console.log(
          `${DIM} ${String(oldLineNum).padStart(4)} | ${c.line}${RESET}`,
        );
      } else if (c.type === "remove") {
        console.log(
          `${RED}-${String(oldLineNum).padStart(4)} | ${c.line}${RESET}`,
        );
      } else {
        console.log(
          `${GREEN}+${String(newLineNum).padStart(4)} | ${c.line}${RESET}`,
        );
      }

      lastPrinted = i;
    }

    if (c.type !== "add") oldLineNum++;
    if (c.type !== "remove") newLineNum++;
  }

  const insertions = `${totalAdded} insertion${totalAdded === 1 ? "" : "s"}(+)`;
  const deletions = `${totalRemoved} deletion${totalRemoved === 1 ? "" : "s"}(-)`;
  console.log(`\n${GREEN}${insertions}${RESET}, ${RED}${deletions}${RESET}`);
};

// Main diff function - compares the file at the manifest commit vs the latest template commit and shows a colored diff in the terminal
export const diff = async (filePath: string) => {
  try {
    const normalizedPath = filePath.replace(/\\/g, "/");
    intro(`${CLI_NAME} diff: ${normalizedPath}`);

    // 1. Check manifest
    if (!(await manifestExists())) {
      log.error(
        `No ${MANIFEST_FILE} found. This project was not scaffolded with ${PRODUCT_NAME}.`,
      );
      process.exit(1);
    }

    const manifest = await readManifest();
    if (!manifest) {
      log.error(`Failed to read ${MANIFEST_FILE}.`);
      process.exit(1);
    }

    const fromCommit = manifest.commit;

    // 2. Get latest commit
    const toCommit = await getLatestCommit();

    if (fromCommit === toCommit) {
      log.info(
        `Already on the latest commit (${toCommit.slice(0, 7)}). No template diff to show.`,
      );
      return;
    }

    // 3. Fetch the file at both commits in parallel
    const [oldContent, newContent] = await Promise.all([
      getFileAtCommit(fromCommit, manifest.template, normalizedPath),
      getFileAtCommit(toCommit, manifest.template, normalizedPath),
    ]);

    if (oldContent === null && newContent === null) {
      log.warn(
        `${normalizedPath} doesn't exist in the template at either commit.`,
      );
    } else if (oldContent === null) {
      log.info(
        `${normalizedPath} is a NEW file added in ${toCommit.slice(0, 7)}.`,
      );
      console.log("\n" + newContent);
    } else if (newContent === null) {
      log.info(
        `${normalizedPath} was REMOVED from the template in ${toCommit.slice(0, 7)}.`,
      );
    } else if (oldContent === newContent) {
      log.info(
        `No template changes to ${normalizedPath} between ${fromCommit.slice(0, 7)} and ${toCommit.slice(0, 7)}.\nThe template did not touch this file — your local changes are yours to keep.`,
      );
    } else {
      log.info(
        `Template changes for: ${normalizedPath}\n  From ${fromCommit.slice(0, 7)} → ${toCommit.slice(0, 7)}`,
      );
      log.info(
        "How to read this diff:\n\n" +
          "  - Lines marked  +  were ADDED to the template\n" +
          "  - Lines marked  -  were REMOVED from the template\n\n" +
          `These are changes in ${PRODUCT_NAME}, not in your local file.\n` +
          "Apply the relevant parts manually to your file.",
      );
      coloredDiff(oldContent, newContent, normalizedPath, fromCommit, toCommit);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(message);
    process.exit(1);
  }
};
