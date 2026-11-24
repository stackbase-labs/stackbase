export const runners = ["pnpm", "npm", "bun"] as const;
export const packageManagers = ["pnpm", "npm", "bun"] as const;
export const templateNames = ["base", "web", "api"] as const;
export const commandModes = ["init", "add", "doctor", "upgrade"] as const;

export type Runner = (typeof runners)[number];
export type PackageManager = (typeof packageManagers)[number];
export type TemplateName = (typeof templateNames)[number];
export type CommandMode = (typeof commandModes)[number];

export const addModules = [
  "payments",
  "ai",
  "analytics",
  "queue",
  "storage",
  "email",
  "rate-limit",
  "auth",
] as const;
export type AddModule = (typeof addModules)[number];

export const optInModules: ReadonlySet<AddModule> = new Set([
  "payments",
  "ai",
  "analytics",
]);

export const targetApps = ["none", "api", "web", "api,web"] as const;
export type TargetApp = (typeof targetApps)[number];

export interface ModuleDefinition {
  name: AddModule;
  label: string;
  hint: string;
  description: string;
  category: "growth" | "infrastructure";
  isOptIn: boolean;
  services?: string;
  techBadges: readonly string[];
  recommendedApp?: string;
  recommendedApps?: readonly string[];
}

export const modules: Record<AddModule, ModuleDefinition> = {
  payments: {
    name: "payments",
    label: "Payments",
    hint: "Stripe",
    description:
      "Stripe billing, checkout sessions, webhooks, and customer portal",
    category: "growth",
    isOptIn: true,
    services: "Stripe Webhooks & Customer Portal",
    techBadges: ["Stripe", "Webhooks", "Billing"],
    recommendedApp: "api",
    recommendedApps: ["api", "web"],
  },
  ai: {
    name: "ai",
    label: "AI",
    hint: "Vercel AI SDK",
    description:
      "Vercel AI SDK integration with tool calling and provider fallbacks",
    category: "growth",
    isOptIn: true,
    services: "OpenAI, Anthropic, & Groq Provider Adapters",
    techBadges: ["Vercel AI SDK", "Multi-Provider", "Tool Calling"],
    recommendedApp: "api",
    recommendedApps: ["api", "web"],
  },
  analytics: {
    name: "analytics",
    label: "Analytics",
    hint: "PostHog",
    description: "PostHog client and server event tracking and feature flags",
    category: "growth",
    isOptIn: true,
    services: "PostHog Analytics Client & Server SDK",
    techBadges: ["PostHog", "Client + Server", "Feature Flags"],
    recommendedApp: "web",
    recommendedApps: ["web", "api"],
  },
  queue: {
    name: "queue",
    label: "Queue",
    hint: "BullMQ + Redis",
    description: "Distributed job queues and background worker pipelines",
    category: "infrastructure",
    isOptIn: false,
    services: "Redis Docker service (port 6379)",
    techBadges: ["BullMQ", "Redis 7", "Worker Pipelines"],
    recommendedApp: "api",
  },
  storage: {
    name: "storage",
    label: "Storage",
    hint: "S3 / R2",
    description: "Presigned URL generation and asset upload pipeline",
    category: "infrastructure",
    isOptIn: false,
    services: "MinIO Docker service (ports 9000, 9001)",
    techBadges: ["S3 / R2", "MinIO", "Presigned URLs"],
    recommendedApp: "api",
  },
  email: {
    name: "email",
    label: "Email",
    hint: "React Email + Resend",
    description: "Type-safe transactional email templates and client",
    category: "infrastructure",
    isOptIn: false,
    services: "React Email previewer & Resend Client",
    techBadges: ["React Email", "Resend", "Templates"],
    recommendedApp: "api",
  },
  "rate-limit": {
    name: "rate-limit",
    label: "Rate Limiting",
    hint: "Upstash / Redis",
    description: "Sliding window rate-limiting middleware",
    category: "infrastructure",
    isOptIn: false,
    services: "Upstash / Redis rate limiter middleware",
    techBadges: ["Upstash", "Sliding Window", "Redis"],
    recommendedApp: "api",
  },
  auth: {
    name: "auth",
    label: "Auth",
    hint: "Better Auth",
    description: "Full-stack authentication with database adapter",
    category: "infrastructure",
    isOptIn: false,
    services: "Better Auth Prisma adapter & session cookies",
    techBadges: ["Better Auth", "Prisma Adapter", "Sessions"],
    recommendedApp: "api",
  },
};

export interface CommandModeDefinition {
  name: CommandMode;
  label: string;
  hint: string;
  description: string;
}

export const commandModeDefinitions: Record<
  CommandMode,
  CommandModeDefinition
> = {
  init: {
    name: "init",
    label: "init",
    hint: "Create project",
    description: "Scaffold a new production-ready Turborepo monorepo.",
  },
  add: {
    name: "add",
    label: "add",
    hint: "Add package",
    description: "Incrementally add official packages and backing services.",
  },
  doctor: {
    name: "doctor",
    label: "doctor",
    hint: "Diagnose issues",
    description: "Diagnose runtime, Docker, ports, and catalog consistency.",
  },
  upgrade: {
    name: "upgrade",
    label: "upgrade",
    hint: "Upgrade template",
    description: "Upgrade workspace files to the latest template commit.",
  },
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  tag?: string;
  icon?: string;
  patch: Partial<BuilderState>;
}

export const presetsByMode: Record<CommandMode, Preset[]> = {
  init: [
    {
      id: "fullstack-saas",
      label: "Full-Stack SaaS",
      description: "Base template with Docker, Studio, and Observability",
      tag: "Next.js + Express",
      icon: "Rocket",
      patch: {
        template: "base",
        docker: true,
        observability: true,
        studio: true,
        kubernetes: false,
        git: true,
        install: true,
      },
    },
    {
      id: "minimal-web",
      label: "Minimal Next.js",
      description: "Frontend-only Web template without container overhead",
      tag: "Next.js only",
      icon: "Globe",
      patch: {
        template: "web",
        docker: false,
        observability: false,
        studio: false,
        kubernetes: false,
        install: true,
      },
    },
    {
      id: "backend-api",
      label: "Backend Service",
      description: "Standalone Express API with Docker and Observability",
      tag: "Express only",
      icon: "Server",
      patch: {
        template: "api",
        docker: true,
        observability: true,
        studio: true,
        kubernetes: false,
        install: true,
      },
    },
  ],
  add: [
    {
      id: "stripe-billing",
      label: "Stripe Billing",
      description: "Payments module linked to API and Web apps",
      tag: "api + web",
      icon: "CreditCard",
      patch: {
        addModule: "payments",
        targetApp: "api,web",
        addYes: true,
        addList: false,
      },
    },
    {
      id: "ai-sdk",
      label: "AI Engine",
      description: "Vercel AI SDK integration linked to API service",
      tag: "api",
      icon: "Bot",
      patch: {
        addModule: "ai",
        targetApp: "api",
        addYes: true,
        addList: false,
      },
    },
    {
      id: "background-queue",
      label: "BullMQ Queue",
      description: "Distributed job queue module with Redis",
      tag: "api + redis",
      icon: "Zap",
      patch: {
        addModule: "queue",
        targetApp: "api",
        addList: false,
      },
    },
    {
      id: "posthog",
      label: "PostHog Analytics",
      description: "Analytics event tracking linked to Web app",
      tag: "web",
      icon: "BarChart3",
      patch: {
        addModule: "analytics",
        targetApp: "web",
        addList: false,
      },
    },
  ],
  doctor: [
    {
      id: "auto-fix",
      label: "Auto-Fix Issues",
      description: "Automatically resolve .env and catalog discrepancies",
      tag: "--fix",
      icon: "Wrench",
      patch: {
        doctorFix: true,
        doctorVerbose: false,
        doctorJson: false,
      },
    },
    {
      id: "verbose-diagnostics",
      label: "Verbose Inspection",
      description: "Show granular check logs for Docker, ports, and Node",
      tag: "--verbose",
      icon: "Search",
      patch: {
        doctorFix: false,
        doctorVerbose: true,
        doctorJson: false,
      },
    },
    {
      id: "ci-pipeline",
      label: "CI JSON Output",
      description: "Machine-readable output for GitHub Actions pipelines",
      tag: "--json",
      icon: "FileJson",
      patch: {
        doctorFix: false,
        doctorVerbose: false,
        doctorJson: true,
      },
    },
  ],
  upgrade: [
    {
      id: "dry-run-preview",
      label: "Dry Run Preview",
      description: "Inspect template diffs without writing any files",
      tag: "--dry-run",
      icon: "Search",
      patch: {
        upgradeDryRun: true,
        upgradeForce: false,
        upgradeCommit: false,
      },
    },
    {
      id: "commit-updates",
      label: "Update & Commit",
      description: "Apply template updates and create a git commit",
      tag: "--commit",
      icon: "GitCommit",
      patch: {
        upgradeDryRun: false,
        upgradeForce: false,
        upgradeCommit: true,
      },
    },
    {
      id: "force-resolve",
      label: "Force Advance",
      description: "Clear conflict blockers while keeping local file edits",
      tag: "--force",
      icon: "RefreshCw",
      patch: {
        upgradeDryRun: false,
        upgradeForce: true,
        upgradeCommit: false,
      },
    },
  ],
};

export interface BuilderState {
  mode: CommandMode;
  runner: Runner;

  // init options
  projectName: string;
  packageManager: PackageManager;
  template: TemplateName;
  docker: boolean;
  kubernetes: boolean;
  observability: boolean;
  studio: boolean;
  git: boolean;
  install: boolean;
  verbose: boolean;

  // add options
  addModule: AddModule | "none";
  targetApp: TargetApp;
  addYes: boolean;
  addDryRun: boolean;
  addSkipInstall: boolean;
  addAllowDirty: boolean;
  addVerbose: boolean;
  addList: boolean;

  // doctor options
  doctorFix: boolean;
  doctorVerbose: boolean;
  doctorJson: boolean;

  // upgrade options
  upgradeCommit: boolean;
  upgradeDryRun: boolean;
  upgradeForce: boolean;
  upgradeVerbose: boolean;
}

interface TemplateDefinition {
  label: string;
  hint: string;
  apps: readonly string[];
  techBadges: readonly string[];
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
    techBadges: ["Next.js 16", "Express", "Prisma", "Docker"],
    capabilities: { kubernetes: true, observability: true },
  },
  web: {
    label: "Web",
    hint: "Next.js",
    apps: ["Web"],
    techBadges: ["Next.js 16", "Tailwind v4", "Prisma"],
    capabilities: { kubernetes: false, observability: false },
  },
  api: {
    label: "API",
    hint: "Express",
    apps: ["API"],
    techBadges: ["Express API", "Prisma ORM", "Docker"],
    capabilities: { kubernetes: false, observability: true },
  },
} as const satisfies Record<TemplateName, TemplateDefinition>;

export const initialBuilderState: BuilderState = {
  mode: "init",
  runner: "pnpm",
  projectName: "my-app",
  packageManager: "pnpm",
  template: "base",
  docker: true,
  kubernetes: false,
  observability: true,
  studio: true,
  git: true,
  install: true,
  verbose: false,

  // add
  addModule: "payments",
  targetApp: "none",
  addYes: false,
  addDryRun: false,
  addSkipInstall: false,
  addAllowDirty: false,
  addVerbose: false,
  addList: false,

  // doctor
  doctorFix: false,
  doctorVerbose: false,
  doctorJson: false,

  // upgrade
  upgradeCommit: false,
  upgradeDryRun: false,
  upgradeForce: false,
  upgradeVerbose: false,
};

export function getInitialModeState(mode: CommandMode): Partial<BuilderState> {
  switch (mode) {
    case "init":
      return {
        projectName: initialBuilderState.projectName,
        template: initialBuilderState.template,
        packageManager: initialBuilderState.packageManager,
        docker: initialBuilderState.docker,
        kubernetes: initialBuilderState.kubernetes,
        observability: initialBuilderState.observability,
        studio: initialBuilderState.studio,
        git: initialBuilderState.git,
        install: initialBuilderState.install,
        verbose: initialBuilderState.verbose,
      };
    case "add":
      return {
        addModule: initialBuilderState.addModule,
        targetApp: initialBuilderState.targetApp,
        addYes: initialBuilderState.addYes,
        addDryRun: initialBuilderState.addDryRun,
        addSkipInstall: initialBuilderState.addSkipInstall,
        addAllowDirty: initialBuilderState.addAllowDirty,
        addVerbose: initialBuilderState.addVerbose,
        addList: initialBuilderState.addList,
      };
    case "doctor":
      return {
        doctorFix: initialBuilderState.doctorFix,
        doctorVerbose: initialBuilderState.doctorVerbose,
        doctorJson: initialBuilderState.doctorJson,
      };
    case "upgrade":
      return {
        upgradeCommit: initialBuilderState.upgradeCommit,
        upgradeDryRun: initialBuilderState.upgradeDryRun,
        upgradeForce: initialBuilderState.upgradeForce,
        upgradeVerbose: initialBuilderState.upgradeVerbose,
      };
  }
}

export const runnerCommands: Record<Runner, string> = {
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

function formatCommandParts(
  baseParts: string[],
  flagParts: string[],
  multiLine?: boolean,
): string {
  if (!multiLine || flagParts.length === 0) {
    return [...baseParts, ...flagParts].join(" ");
  }

  const base = baseParts.join(" ");
  const flags = flagParts.map((flag, index) => {
    const isLast = index === flagParts.length - 1;
    return `  ${flag}${isLast ? "" : " \\"}`;
  });

  return `${base} \\\n${flags.join("\n")}`;
}

export function buildCommand(
  input: BuilderState,
  options?: { multiLine?: boolean },
): string {
  const state = normalizeBuilderState(input);
  const runner = runnerCommands[state.runner];
  const multiLine = options?.multiLine;

  switch (state.mode) {
    case "init": {
      const capabilities = templates[state.template].capabilities;
      const baseParts = [
        runner,
        "stackbase@latest init",
        quoteArgument(state.projectName.trim() || "<project-name>"),
      ];
      const flagParts = [
        `--template ${state.template}`,
        `--package-manager ${state.packageManager}`,
        state.docker ? "--docker" : "--no-docker",
      ];

      if (state.docker && capabilities.kubernetes) {
        flagParts.push(state.kubernetes ? "--k8s" : "--no-k8s");
      }

      if (state.docker && capabilities.observability) {
        flagParts.push(
          state.observability ? "--observability" : "--no-observability",
        );
      }

      flagParts.push(state.studio ? "--studio" : "--no-studio");

      if (!state.git) flagParts.push("--no-git");
      if (!state.install) flagParts.push("--skip-install");
      if (state.verbose) flagParts.push("--verbose");

      return formatCommandParts(baseParts, flagParts, multiLine);
    }

    case "add": {
      const baseParts = [runner, "stackbase@latest add"];
      const flagParts: string[] = [];

      if (state.addList) {
        flagParts.push("--list");
        if (state.addVerbose) flagParts.push("--verbose");
        return formatCommandParts(baseParts, flagParts, multiLine);
      }

      if (state.addModule && state.addModule !== "none") {
        baseParts.push(state.addModule);
      }

      if (state.targetApp && state.targetApp !== "none") {
        flagParts.push(`--app ${state.targetApp}`);
      }

      if (state.addYes) flagParts.push("--yes");
      if (state.addDryRun) flagParts.push("--dry-run");
      if (state.addSkipInstall) flagParts.push("--skip-install");
      if (state.addAllowDirty) flagParts.push("--allow-dirty");
      if (state.addVerbose) flagParts.push("--verbose");

      return formatCommandParts(baseParts, flagParts, multiLine);
    }

    case "doctor": {
      const baseParts = [runner, "stackbase@latest doctor"];
      const flagParts: string[] = [];

      if (state.doctorFix) flagParts.push("--fix");
      if (state.doctorVerbose) flagParts.push("--verbose");
      if (state.doctorJson) flagParts.push("--json");

      return formatCommandParts(baseParts, flagParts, multiLine);
    }

    case "upgrade": {
      const baseParts = [runner, "stackbase@latest upgrade"];
      const flagParts: string[] = [];

      if (state.upgradeCommit) flagParts.push("--commit");
      if (state.upgradeDryRun) flagParts.push("--dry-run");
      if (state.upgradeForce) flagParts.push("--force");
      if (state.upgradeVerbose) flagParts.push("--verbose");

      return formatCommandParts(baseParts, flagParts, multiLine);
    }
  }
}

export interface WorkspaceNode {
  name: string;
  type: "folder" | "file";
  badge?: string;
  badgeVariant?: "default" | "added" | "primary" | "muted";
  children?: WorkspaceNode[];
  highlight?: boolean;
}

export function getWorkspaceTree(input: BuilderState): WorkspaceNode {
  const state = normalizeBuilderState(input);

  switch (state.mode) {
    case "init": {
      const template = state.template;
      const appsChildren: WorkspaceNode[] = [];

      if (template === "base" || template === "web") {
        appsChildren.push({
          name: "web",
          type: "folder",
          badge: "Next.js 16",
          badgeVariant: "primary",
        });
      }

      if (template === "base" || template === "api") {
        appsChildren.push({
          name: "api",
          type: "folder",
          badge: "Express",
          badgeVariant: "primary",
        });
      }

      if (state.studio) {
        appsChildren.push({
          name: "studio",
          type: "folder",
          badge: "Prisma Studio",
          badgeVariant: "default",
          highlight: true,
        });
      }

      const packagesChildren: WorkspaceNode[] = [
        { name: "ui", type: "folder", badge: "Tailwind v4" },
        { name: "db", type: "folder", badge: "Prisma ORM" },
        { name: "auth", type: "folder", badge: "Better Auth" },
        { name: "typescript-config", type: "folder" },
      ];

      const rootChildren: WorkspaceNode[] = [
        {
          name: "apps",
          type: "folder",
          children: appsChildren,
        },
        {
          name: "packages",
          type: "folder",
          children: packagesChildren,
        },
      ];

      if (state.docker) {
        rootChildren.push({
          name: "docker-compose.yml",
          type: "file",
          badge: "PostgreSQL",
          badgeVariant: "default",
          highlight: true,
        });
      }

      if (state.observability) {
        rootChildren.push({
          name: "deploy/observability",
          type: "folder",
          badge: "Grafana + Prometheus",
          badgeVariant: "default",
          highlight: true,
        });
      }

      if (state.kubernetes) {
        rootChildren.push({
          name: "k8s",
          type: "folder",
          badge: "Manifests",
          badgeVariant: "default",
          highlight: true,
        });
      }

      rootChildren.push({
        name: "turbo.json",
        type: "file",
      });

      rootChildren.push({
        name: ".stackbase.json",
        type: "file",
        badge: "Manifest",
        badgeVariant: "muted",
      });

      return {
        name: state.projectName.trim() || "my-app",
        type: "folder",
        children: rootChildren,
      };
    }

    case "add": {
      const activeModule =
        state.addModule !== "none" ? modules[state.addModule] : undefined;
      const targetApp = state.targetApp;

      const appsChildren: WorkspaceNode[] = [
        {
          name: "web",
          type: "folder",
          badge:
            targetApp === "web" || targetApp === "api,web"
              ? "Linked"
              : undefined,
          badgeVariant:
            targetApp === "web" || targetApp === "api,web"
              ? "added"
              : undefined,
          highlight: targetApp === "web" || targetApp === "api,web",
        },
        {
          name: "api",
          type: "folder",
          badge:
            targetApp === "api" || targetApp === "api,web"
              ? "Linked"
              : undefined,
          badgeVariant:
            targetApp === "api" || targetApp === "api,web"
              ? "added"
              : undefined,
          highlight: targetApp === "api" || targetApp === "api,web",
        },
      ];

      const packagesChildren: WorkspaceNode[] = [];

      if (activeModule && !state.addList) {
        packagesChildren.push({
          name: activeModule.name,
          type: "folder",
          badge: "+ Added",
          badgeVariant: "added",
          highlight: true,
        });
      }

      packagesChildren.push(
        { name: "ui", type: "folder", badgeVariant: "muted" },
        { name: "db", type: "folder", badgeVariant: "muted" },
      );

      const rootChildren: WorkspaceNode[] = [
        {
          name: "apps",
          type: "folder",
          children: appsChildren,
        },
        {
          name: "packages",
          type: "folder",
          children: packagesChildren,
        },
      ];

      if (activeModule?.name === "queue") {
        rootChildren.push({
          name: "docker-compose.yml",
          type: "file",
          badge: "+ Redis 7",
          badgeVariant: "added",
          highlight: true,
        });
      } else if (activeModule?.name === "storage") {
        rootChildren.push({
          name: "docker-compose.yml",
          type: "file",
          badge: "+ MinIO S3",
          badgeVariant: "added",
          highlight: true,
        });
      }

      rootChildren.push({
        name: ".stackbase.json",
        type: "file",
        badge: "Updated",
        badgeVariant: "muted",
      });

      return {
        name: "workspace",
        type: "folder",
        children: rootChildren,
      };
    }

    case "doctor": {
      return {
        name: "diagnostics-targets",
        type: "folder",
        children: [
          {
            name: "Runtime & Node Engine",
            type: "file",
            badge: "Node >= 24",
            badgeVariant: "primary",
          },
          {
            name: "Docker Services & Ports",
            type: "file",
            badge: "5432, 6379, 9000",
            badgeVariant: "default",
          },
          {
            name: "Environment Files (.env)",
            type: "file",
            badge: state.doctorFix ? "Auto-synced" : "Audited",
            badgeVariant: state.doctorFix ? "added" : "default",
          },
          {
            name: "Catalog Consistency",
            type: "file",
            badge: "pnpm-workspace.yaml",
            badgeVariant: "muted",
          },
        ],
      };
    }

    case "upgrade": {
      return {
        name: "template-sync",
        type: "folder",
        children: [
          {
            name: ".stackbase.json",
            type: "file",
            badge: state.upgradeForce ? "Force advanced" : "Baseline commit",
            badgeVariant: state.upgradeForce ? "added" : "primary",
            highlight: state.upgradeForce,
          },
          {
            name: "apps/ (Auto-updated)",
            type: "folder",
            badge: state.upgradeDryRun ? "Diff preview" : "Synced",
            badgeVariant: state.upgradeDryRun ? "default" : "added",
          },
          {
            name: "packages/ (Preserved)",
            type: "folder",
            badge: "Local edits kept",
            badgeVariant: "muted",
          },
          {
            name: "turbo.json",
            type: "file",
            badge: "Updated",
            badgeVariant: "muted",
          },
        ],
      };
    }
  }
}

export interface ResultSummary {
  mode: CommandMode;
  template: string;
  apps: string[];
  operations: string[];
  details: { label: string; value: string }[];
}

export function getResultSummary(input: BuilderState): ResultSummary {
  const state = normalizeBuilderState(input);

  switch (state.mode) {
    case "init": {
      const apps: string[] = [...templates[state.template].apps];
      const operations: string[] = [];

      if (state.studio) apps.push("Studio");
      if (state.docker) operations.push("Docker");
      if (state.kubernetes) operations.push("Kubernetes");
      if (state.observability) operations.push("Observability");

      return {
        mode: "init",
        template: templates[state.template].label,
        apps,
        operations,
        details: [
          { label: "Command", value: "init" },
          { label: "Template", value: templates[state.template].label },
          { label: "Apps", value: apps.join(", ") },
          {
            label: "Operations",
            value: operations.join(", ") || "None",
          },
        ],
      };
    }

    case "add": {
      const flags: string[] = [];
      if (state.addList) flags.push("--list");
      if (state.addYes) flags.push("--yes");
      if (state.addDryRun) flags.push("--dry-run");
      if (state.addSkipInstall) flags.push("--skip-install");
      if (state.addAllowDirty) flags.push("--allow-dirty");
      if (state.addVerbose) flags.push("--verbose");

      const targetAppLabel =
        state.targetApp === "none" ? "None (unspecified)" : state.targetApp;
      const moduleLabel =
        state.addModule === "none"
          ? "Interactive prompt"
          : (modules[state.addModule]?.label ?? state.addModule);

      const details: { label: string; value: string }[] = [
        { label: "Command", value: "add" },
      ];

      if (state.addList) {
        details.push({ label: "Mode", value: "List modules (--list)" });
      } else {
        details.push(
          { label: "Module", value: moduleLabel },
          { label: "Target app", value: targetAppLabel },
        );
      }

      details.push({
        label: "Flags",
        value: flags.join(" ") || "None",
      });

      return {
        mode: "add",
        template: "N/A",
        apps: state.targetApp === "none" ? [] : [state.targetApp],
        operations: flags,
        details,
      };
    }

    case "doctor": {
      const flags: string[] = [];
      if (state.doctorFix) flags.push("--fix");
      if (state.doctorVerbose) flags.push("--verbose");
      if (state.doctorJson) flags.push("--json");

      return {
        mode: "doctor",
        template: "N/A",
        apps: [],
        operations: flags,
        details: [
          { label: "Command", value: "doctor" },
          {
            label: "Fix mode",
            value: state.doctorFix ? "Auto-fix (--fix)" : "Diagnostics only",
          },
          {
            label: "Output",
            value: state.doctorJson ? "JSON (--json)" : "Terminal text",
          },
          {
            label: "Flags",
            value: flags.join(" ") || "None",
          },
        ],
      };
    }

    case "upgrade": {
      const flags: string[] = [];
      if (state.upgradeCommit) flags.push("--commit");
      if (state.upgradeDryRun) flags.push("--dry-run");
      if (state.upgradeForce) flags.push("--force");
      if (state.upgradeVerbose) flags.push("--verbose");

      let strategy = "Safe template update";
      if (state.upgradeForce) {
        strategy = "Force past conflicts (--force)";
      } else if (state.upgradeDryRun) {
        strategy = "Dry run preview (--dry-run)";
      }

      return {
        mode: "upgrade",
        template: "N/A",
        apps: [],
        operations: flags,
        details: [
          { label: "Command", value: "upgrade" },
          { label: "Strategy", value: strategy },
          {
            label: "Flags",
            value: flags.join(" ") || "None",
          },
        ],
      };
    }
  }
}
