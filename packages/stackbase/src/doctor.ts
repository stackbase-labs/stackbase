import { intro, log, outro } from "@clack/prompts";
import { PRODUCT_NAME } from "./branding.js";
import { checkDocker, type DockerCheckDeps } from "./checks/docker.js";
import { checkEnv } from "./checks/env.js";
import { checkRuntime, type RuntimeCheckDeps } from "./checks/runtime.js";
import type {
  CheckGroup,
  CheckResult,
  CheckStatus,
  DoctorOptions,
  DoctorReport,
} from "./checks/types.js";
import { checkWorkspace } from "./checks/workspace.js";

export interface DoctorTestDeps {
  runtime?: RuntimeCheckDeps;
  docker?: DockerCheckDeps;
}

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "✔",
  warn: "⚠",
  fail: "✖",
  skip: "○",
};

/**
 * Runs all diagnostic checks and optionally executes available auto-fixes.
 */
export const runDoctorChecks = async (
  options: DoctorOptions = {},
  deps: DoctorTestDeps = {},
): Promise<{ report: DoctorReport; fixLogs: string[] }> => {
  const projectRoot = options.cwd ?? process.cwd();
  const fixLogs: string[] = [];

  const collectGroups = async (): Promise<CheckGroup[]> => {
    const [runtimeGroup, dockerGroup, envGroup, workspaceGroup] =
      await Promise.all([
        checkRuntime(projectRoot, deps.runtime),
        checkDocker(projectRoot, deps.docker),
        checkEnv(projectRoot),
        checkWorkspace(projectRoot),
      ]);
    return [runtimeGroup, dockerGroup, envGroup, workspaceGroup];
  };

  let groups = await collectGroups();
  let fixedCount = 0;

  if (options.fix) {
    // Collect unique fix actions (e.g., avoid running `docker compose up -d` 4 times)
    const executedFixIds = new Set<string>();

    for (const group of groups) {
      for (const check of group.checks) {
        if (
          (check.status === "fail" || check.status === "warn") &&
          check.fixable &&
          check.fix
        ) {
          const dedupeKey = check.id.startsWith("port-")
            ? "docker-compose-up"
            : check.id;
          if (executedFixIds.has(dedupeKey)) continue;
          executedFixIds.add(dedupeKey);

          try {
            const msg = await check.fix();
            fixedCount++;
            if (msg) fixLogs.push(msg);
          } catch (error) {
            fixLogs.push(
              `Failed to auto-fix ${check.label}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }
    }

    if (fixedCount > 0) {
      groups = await collectGroups();
    }
  }

  let passed = 0;
  let warnings = 0;
  let errors = 0;
  let skipped = 0;

  for (const group of groups) {
    for (const check of group.checks) {
      if (check.status === "pass") passed++;
      else if (check.status === "warn") warnings++;
      else if (check.status === "fail") errors++;
      else if (check.status === "skip") skipped++;
    }
  }

  const report: DoctorReport = {
    projectRoot,
    groups,
    summary: {
      passed,
      warnings,
      errors,
      skipped,
      fixed: fixedCount,
    },
    healthy: errors === 0,
  };

  return { report, fixLogs };
};

/**
 * Formats a single check line for terminal output.
 */
const formatCheckLine = (
  check: CheckResult,
  verbose: boolean = false,
): string => {
  const icon = STATUS_ICON[check.status];
  const lines: string[] = [];

  if (check.status === "pass" && !verbose) {
    const suffix = check.detail ? ` — ${check.detail}` : "";
    lines.push(`  ${icon} ${check.label}${suffix}`);
  } else {
    const suffix = check.detail ? ` — ${check.detail}` : "";
    lines.push(`  ${icon} ${check.label}${suffix}`);
    if ((check.status === "fail" || check.status === "warn") && check.remedy) {
      lines.push(`    └─ Remedy: ${check.remedy}`);
    }
  }

  return lines.join("\n");
};

/**
 * CLI action handler for `stackbase doctor`.
 */
export const doctor = async (
  options: DoctorOptions = {},
  deps: DoctorTestDeps = {},
): Promise<void> => {
  if (!options.json) {
    intro(`${PRODUCT_NAME} Doctor — Environment & Monorepo Health Check`);
  }

  const { report, fixLogs } = await runDoctorChecks(options, deps);

  if (options.json) {
    const serializableReport = {
      ...report,
      groups: report.groups.map((g) => ({
        name: g.name,
        title: g.title,
        checks: g.checks.map((c) => ({
          id: c.id,
          label: c.label,
          status: c.status,
          detail: c.detail,
          remedy: c.remedy,
          fixable: c.fixable,
        })),
      })),
      fixesApplied: fixLogs,
    };
    console.log(JSON.stringify(serializableReport, null, 2));
    if (!report.healthy) {
      process.exitCode = 1;
    }
    return;
  }

  if (fixLogs.length > 0) {
    log.success(
      `Applied ${fixLogs.length} automatic fix(es):\n${fixLogs.map((l) => `  • ${l}`).join("\n")}`,
    );
  }

  for (const group of report.groups) {
    const hasFailure = group.checks.some((c) => c.status === "fail");
    const hasWarning = group.checks.some((c) => c.status === "warn");

    const renderedChecks = group.checks
      .map((c) => formatCheckLine(c, options.verbose))
      .join("\n");

    const section = `${group.title}\n${renderedChecks}`;

    if (hasFailure) {
      log.error(section);
    } else if (hasWarning) {
      log.warn(section);
    } else {
      log.info(section);
    }
  }

  const { passed, warnings, errors, skipped, fixed } = report.summary;
  const parts = [
    `${passed} passed`,
    warnings > 0 ? `${warnings} warning(s)` : null,
    errors > 0 ? `${errors} error(s)` : null,
    skipped > 0 ? `${skipped} skipped` : null,
    fixed > 0 ? `${fixed} auto-fixed` : null,
  ].filter(Boolean);

  const hasFixableRemaining = report.groups.some((g) =>
    g.checks.some(
      (c) => (c.status === "fail" || c.status === "warn") && c.fixable,
    ),
  );

  if (report.healthy) {
    outro(`Workspace is healthy! (${parts.join(", ")})`);
  } else {
    const fixHint =
      !options.fix && hasFixableRemaining
        ? " Run `stackbase doctor --fix` to resolve fixable issues automatically."
        : "";
    outro(`Doctor found ${errors} issue(s) (${parts.join(", ")}).${fixHint}`);
    process.exitCode = 1;
  }
};
