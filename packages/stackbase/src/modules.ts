export interface ModuleDefinition {
  name: string;
  label: string;
  description: string;
  sourcePackageName: string; // within templates/base/packages/<name>
  optional?: boolean;
  dockerService?: {
    name: string;
    image: string;
    ports?: string[];
    environment?: Record<string, string>;
    volumes?: string[];
    healthcheck?: Record<string, unknown>;
  };
  recommendedApp?: string;
  recommendedApps?: string[];
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  queue: {
    name: "queue",
    label: "Queue (BullMQ + Redis)",
    description: "Distributed job queues and background worker pipelines",
    sourcePackageName: "queue",
    recommendedApp: "api",
    dockerService: {
      name: "redis",
      image: "redis:7-alpine",
      ports: ["127.0.0.1:6379:6379"],
    },
  },
  storage: {
    name: "storage",
    label: "Storage (S3 / R2)",
    description: "Presigned URL generation and asset upload pipeline",
    sourcePackageName: "storage",
    recommendedApp: "api",
    dockerService: {
      name: "minio",
      image: "cgr.dev/chainguard/minio:latest",
      ports: ["127.0.0.1:9000:9000", "127.0.0.1:9001:9001"],
    },
  },
  "rate-limit": {
    name: "rate-limit",
    label: "Rate Limiting (Upstash / Redis)",
    description: "Sliding window rate-limiting middleware",
    sourcePackageName: "rate-limit",
    recommendedApp: "api",
  },
  email: {
    name: "email",
    label: "Email (React Email + Resend)",
    description: "Type-safe transactional email templates and client",
    sourcePackageName: "email",
    recommendedApp: "api",
  },
  auth: {
    name: "auth",
    label: "Auth (Better Auth)",
    description: "Full-stack authentication with database adapter",
    sourcePackageName: "auth",
    recommendedApp: "api",
  },
  payments: {
    name: "payments",
    label: "Payments (Stripe)",
    description:
      "Stripe billing, checkout sessions, webhooks, and customer portal",
    sourcePackageName: "payments",
    optional: true,
    recommendedApp: "api",
    recommendedApps: ["api", "web"],
  },
  ai: {
    name: "ai",
    label: "AI (Vercel AI SDK)",
    description:
      "Vercel AI SDK integration with tool calling and provider fallbacks",
    sourcePackageName: "ai",
    optional: true,
    recommendedApp: "api",
    recommendedApps: ["api", "web"],
  },
  analytics: {
    name: "analytics",
    label: "Analytics (PostHog)",
    description: "PostHog client + server event tracking and feature flags",
    sourcePackageName: "analytics",
    optional: true,
    recommendedApp: "web",
    recommendedApps: ["web", "api"],
  },
};

const AVAILABLE_MODULES: ModuleDefinition[] = Object.values(MODULE_REGISTRY);
const OPTIONAL_MODULES: ModuleDefinition[] = AVAILABLE_MODULES.filter(
  (m) => m.optional,
);
export const OPTIONAL_MODULE_NAMES: ReadonlySet<string> = new Set(
  OPTIONAL_MODULES.map((m) => m.name),
);

export const getModule = (name: string): ModuleDefinition | undefined => {
  return MODULE_REGISTRY[name.toLowerCase()];
};

export const getAvailableModules = (): ModuleDefinition[] => {
  return AVAILABLE_MODULES;
};

export const getOptionalModules = (): ModuleDefinition[] => {
  return OPTIONAL_MODULES;
};
