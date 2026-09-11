export const templateNames = ["base", "web", "api"] as const;

export type TemplateName = (typeof templateNames)[number];

export const templateAliases = {
  fullstack: "base",
} as const satisfies Record<string, TemplateName>;

export interface TemplateCapabilities {
  docker: boolean;
  kubernetes: boolean;
  observability: boolean;
  studio: boolean;
}

export interface TemplateInfo {
  path: string;
  label: string;
  hint: string;
  capabilities: TemplateCapabilities;
}

export const templateRegistry: Record<TemplateName, TemplateInfo> = {
  base: {
    path: "templates/base",
    label: "Base Application",
    hint: "Complete setup: Web + API + Database + Auth",
    capabilities: {
      docker: true,
      kubernetes: true,
      observability: true,
      studio: true,
    },
  },
  web: {
    path: "templates/web",
    label: "Web Application",
    hint: "Next.js app with authentication and UI packages",
    capabilities: {
      docker: true,
      kubernetes: false,
      observability: false,
      studio: true,
    },
  },
  api: {
    path: "templates/api",
    label: "API Application",
    hint: "Express REST API with database and auth packages",
    capabilities: {
      docker: true,
      kubernetes: false,
      observability: true,
      studio: true,
    },
  },
};

export const normalizeTemplateName = (
  template: string,
): TemplateName | null => {
  if (template in templateRegistry) {
    return template as TemplateName;
  }

  if (template in templateAliases) {
    return templateAliases[template as keyof typeof templateAliases];
  }

  return null;
};

export const getTemplatePath = (template: string): string => {
  const normalized = normalizeTemplateName(template);
  return templateRegistry[normalized ?? "base"].path;
};

export const getTemplateFilePath = (
  template: string,
  filePath: string,
): string => {
  const normalized = filePath.replace(/\\/g, "/");
  return `${getTemplatePath(template)}/${normalized}`;
};
