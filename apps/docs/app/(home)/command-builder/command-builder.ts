export const runners = ["pnpm", "npm", "bun"] as const;
export const packageManagers = ["pnpm", "npm", "bun"] as const;
export const templateNames = ["base", "web", "api"] as const;

export type Runner = (typeof runners)[number];
export type PackageManager = (typeof packageManagers)[number];
export type TemplateName = (typeof templateNames)[number];

export interface BuilderState {
  projectName: string;
  runner: Runner;
  packageManager: PackageManager;
  template: TemplateName;
  docker: boolean;
  kubernetes: boolean;
  observability: boolean;
  studio: boolean;
  git: boolean;
  install: boolean;
  verbose: boolean;
}

interface TemplateDefinition {
  label: string;
  hint: string;
  apps: readonly string[];
  capabilities: {
    kubernetes: boolean;
    observability: boolean;
  };
}

export const templates = {
  base: {
    label: "Base",
    hint: "Web + API",
    apps: ["Web", "API"],
    capabilities: { kubernetes: true, observability: true },
  },
  web: {
    label: "Web",
    hint: "Next.js",
    apps: ["Web"],
    capabilities: { kubernetes: false, observability: false },
  },
  api: {
    label: "API",
    hint: "Express",
    apps: ["API"],
    capabilities: { kubernetes: false, observability: true },
  },
} as const satisfies Record<TemplateName, TemplateDefinition>;

export const initialBuilderState: BuilderState = {
  projectName: "my-app",
  runner: "pnpm",
  packageManager: "pnpm",
  template: "base",
  docker: true,
  kubernetes: false,
  observability: true,
  studio: true,
  git: true,
  install: true,
  verbose: false,
};

const runnerCommands: Record<Runner, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  bun: "bunx",
};

const reservedProjectNames = new Set([
  "node_modules",
  "favicon.ico",
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "lpt1",
]);

export function validateProjectName(name: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return "Enter a project name.";
  }

  if (name.length > 214) {
    return "Use fewer than 214 characters.";
  }

  if (name.startsWith(".") || name.startsWith("_")) {
    return "The name cannot start with a period or underscore.";
  }

  if (!/^[a-zA-Z0-9-_@/ ]+$/.test(name)) {
    return "Use letters, numbers, hyphens, underscores, spaces, @, or /.";
  }

  if (name.includes("..")) {
    return "The name cannot contain two consecutive periods.";
  }

  if (reservedProjectNames.has(name.toLowerCase())) {
    return `"${name}" is a reserved name.`;
  }

  return undefined;
}

export function normalizeBuilderState(state: BuilderState): BuilderState {
  const capabilities = templates[state.template].capabilities;

  return {
    ...state,
    kubernetes: state.docker && capabilities.kubernetes && state.kubernetes,
    observability:
      state.docker && capabilities.observability && state.observability,
  };
}

function quoteArgument(value: string): string {
  return value.includes(" ") ? `"${value}"` : value;
}

export function buildCommand(input: BuilderState): string {
  const state = normalizeBuilderState(input);
  const capabilities = templates[state.template].capabilities;
  const parts = [
    runnerCommands[state.runner],
    "stackbase@latest init",
    quoteArgument(state.projectName.trim() || "<project-name>"),
    `--template ${state.template}`,
    `--package-manager ${state.packageManager}`,
    state.docker ? "--docker" : "--no-docker",
  ];

  if (state.docker && capabilities.kubernetes) {
    parts.push(state.kubernetes ? "--k8s" : "--no-k8s");
  }

  if (state.docker && capabilities.observability) {
    parts.push(state.observability ? "--observability" : "--no-observability");
  }

  parts.push(state.studio ? "--studio" : "--no-studio");

  if (!state.git) parts.push("--no-git");
  if (!state.install) parts.push("--skip-install");
  if (state.verbose) parts.push("--verbose");

  return parts.join(" ");
}

export function getResultSummary(input: BuilderState) {
  const state = normalizeBuilderState(input);
  const apps: string[] = [...templates[state.template].apps];
  const operations: string[] = [];

  if (state.studio) apps.push("Studio");
  if (state.docker) operations.push("Docker");
  if (state.kubernetes) operations.push("Kubernetes");
  if (state.observability) operations.push("Observability");

  return {
    template: templates[state.template].label,
    apps,
    operations,
  };
}
