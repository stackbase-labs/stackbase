import { exec } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";

const rootDir = resolve(".");
const testDir = join(rootDir, ".test-scaffolds");
const cliPath = join(rootDir, "packages/stackbase/dist/index.js");

function runExec(command, cwd, env = {}) {
  return new Promise((res) => {
    const start = Date.now();
    exec(
      command,
      {
        cwd,
        maxBuffer: 20 * 1024 * 1024,
        env: { ...process.env, ...env },
      },
      (error, stdout, stderr) => {
        res({
          code: error ? error.code || 1 : 0,
          stdout: stdout || "",
          stderr: stderr || "",
          durationMs: Date.now() - start,
        });
      },
    );
  });
}

async function cleanDir(dirPath) {
  if (process.platform === "win32") {
    await runExec(
      `cmd.exe /c "if exist \"${dirPath}\" rd /s /q \"${dirPath}\""`,
      rootDir,
    );
  } else {
    await runExec(`rm -rf "${dirPath}"`, rootDir);
  }
}

export async function testApp(appConfig) {
  const {
    name,
    template,
    pm,
    docker,
    k8s,
    obs,
    studio,
    cleanupOnPass = true,
  } = appConfig;
  const targetAppDir = join(testDir, name);

  console.log(`\n============================================================`);
  console.log(`TESTING CONFIG: ${name}`);
  console.log(
    `Template: ${template} | PM: ${pm} | Docker: ${docker} | K8s: ${k8s} | Obs: ${obs} | Studio: ${studio}`,
  );
  console.log(`============================================================`);

  await cleanDir(targetAppDir);
  await mkdir(testDir, { recursive: true });

  const flags = [
    `"${cliPath}"`,
    "init",
    name,
    "-t",
    template,
    "-p",
    pm,
    "--no-git",
    "-y",
  ];

  if (docker === true) flags.push("--docker");
  if (docker === false) flags.push("--no-docker");
  if (k8s === true) flags.push("--k8s");
  if (k8s === false) flags.push("--no-k8s");
  if (obs === true) flags.push("--observability");
  if (obs === false) flags.push("--no-observability");
  if (studio === true) flags.push("--studio");
  if (studio === false) flags.push("--no-studio");

  const scaffoldCmd = `node ${flags.join(" ")}`;
  console.log(`[1/6] Scaffolding: ${scaffoldCmd}`);

  const scaffoldResult = await runExec(scaffoldCmd, testDir, {
    STACKBASE_LOCAL_TEMPLATES_DIR: rootDir,
  });

  if (scaffoldResult.code !== 0) {
    console.error(
      `? Scaffolding failed for ${name} (exit code ${scaffoldResult.code})`,
    );
    console.error(scaffoldResult.stderr || scaffoldResult.stdout);
    return {
      name,
      success: false,
      failedStep: "scaffold",
      error: scaffoldResult.stderr || scaffoldResult.stdout,
    };
  }
  console.log(
    `? Scaffolded in ${(scaffoldResult.durationMs / 1000).toFixed(1)}s`,
  );

  const runScript = async (stepName, scriptName) => {
    console.log(`Running check: ${stepName} (${pm} run ${scriptName})...`);
    const cmd = `${pm} run ${scriptName}`;
    const res = await runExec(cmd, targetAppDir);
    if (res.code !== 0) {
      console.error(
        `? Check ${stepName} failed for ${name} (exit code ${res.code}):`,
      );
      const output = (res.stderr ? res.stderr + "\n" : "") + res.stdout;
      console.error(output.slice(-2000));
      return { success: false, output };
    }
    console.log(
      `? ${stepName} passed in ${(res.durationMs / 1000).toFixed(1)}s`,
    );
    return { success: true, durationMs: res.durationMs };
  };

  const steps = [
    { name: "check-types", script: "check-types" },
    { name: "lint", script: "lint" },
    { name: "format:check", script: "format:check" },
    { name: "test", script: "test" },
    { name: "build", script: "build" },
  ];

  const stepResults = {};
  for (const step of steps) {
    const res = await runScript(step.name, step.script);
    stepResults[step.name] = res.success ? "PASS" : "FAIL";
    if (!res.success) {
      return {
        name,
        success: false,
        failedStep: step.name,
        details: stepResults,
        error: res.output,
      };
    }
  }

  console.log(`?? ALL 5 CHECKS PASSED FOR ${name}!`);
  if (cleanupOnPass) {
    console.log(`Cleaning up test directory ${targetAppDir}...`);
    await cleanDir(targetAppDir);
  }

  return { name, success: true, details: stepResults };
}

async function main() {
  const mode = process.argv[2] || "tier1";

  const tier1Configs = [
    {
      name: "app-base-pnpm-full",
      template: "base",
      pm: "pnpm",
      docker: true,
      k8s: true,
      obs: true,
      studio: true,
    },
    {
      name: "app-base-pnpm-min",
      template: "base",
      pm: "pnpm",
      docker: false,
      k8s: false,
      obs: false,
      studio: false,
    },
    {
      name: "app-base-npm-full",
      template: "base",
      pm: "npm",
      docker: true,
      k8s: true,
      obs: true,
      studio: true,
    },
    {
      name: "app-base-npm-min",
      template: "base",
      pm: "npm",
      docker: false,
      k8s: false,
      obs: false,
      studio: false,
    },
    {
      name: "app-web-pnpm-full",
      template: "web",
      pm: "pnpm",
      docker: true,
      k8s: false,
      obs: false,
      studio: true,
    },
    {
      name: "app-web-pnpm-min",
      template: "web",
      pm: "pnpm",
      docker: false,
      k8s: false,
      obs: false,
      studio: false,
    },
    {
      name: "app-web-npm-full",
      template: "web",
      pm: "npm",
      docker: true,
      k8s: false,
      obs: false,
      studio: true,
    },
    {
      name: "app-api-pnpm-full",
      template: "api",
      pm: "pnpm",
      docker: true,
      k8s: false,
      obs: true,
      studio: true,
    },
    {
      name: "app-api-npm-min",
      template: "api",
      pm: "npm",
      docker: false,
      k8s: false,
      obs: false,
      studio: false,
    },
  ];

  const targetConfigs =
    mode === "single"
      ? [
          tier1Configs.find((c) => c.name === process.argv[3]) ||
            tier1Configs[0],
        ]
      : tier1Configs;

  console.log(
    `Starting Stackbase Matrix Testing (Total: ${targetConfigs.length} configurations)...`,
  );

  const results = [];
  for (const config of targetConfigs) {
    const res = await testApp(config);
    results.push(res);
    if (!res.success) {
      console.error(`Stopping run due to failure on ${res.name}`);
      break;
    }
  }

  console.log("\n============================================================");
  console.log("FINAL RESULTS SUMMARY");
  console.log("============================================================");
  console.table(
    results.map((r) => ({
      Config: r.name,
      Status: r.success ? "? PASS" : "? FAIL",
      FailedAt: r.failedStep || "-",
    })),
  );

  const allPassed = results.every((r) => r.success);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Runner crashed:", err);
  process.exit(1);
});
