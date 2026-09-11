import { writeFile } from "node:fs/promises";
import { templateDescriptions, toTitleCase, toKebabCase } from "./utils.js";

type Template = "fullstack" | "web" | "api";

interface ReadmeContext {
  projectName: string;
  template: Template;
  includeDocker: boolean;
  includeKubernetes: boolean;
  packageManager: "pnpm" | "npm" | "bun";
  scriptPrefix: string;
}

const buildHeroSection = ({
  projectName,
  template,
}: ReadmeContext): string => `\
# ${toTitleCase(projectName)}

${templateDescriptions[template]}

Built with [build-elevate](https://github.com/stackbase-labs/stackbase) - A production-grade full-stack starter.
`;

const buildGettingStartedSection = ({
  packageManager,
  scriptPrefix,
}: ReadmeContext): string => `\
## Getting Started

### Prerequisites

- Node.js 20+
- ${packageManager}
- PostgreSQL database

### Setup

#### 1. Install dependencies

\`\`\`bash
${packageManager} install
\`\`\`

#### 2. Configure environment variables

- Copy \`.env.example\` files to \`.env.local\` or \`.env\` in respective packages
- Update database connection strings and API keys

#### 3. Generate Prisma client and run migrations

\`\`\`bash
cd packages/db
${scriptPrefix} db:generate
${scriptPrefix} db:migrate
cd ../..
\`\`\`

#### 4. Start development server

\`\`\`bash
${scriptPrefix} dev
\`\`\`
`;

const buildAvailableScriptsSection = ({
  scriptPrefix,
  includeDocker,
  includeKubernetes,
  template,
}: ReadmeContext): string => `\
## Available Scripts

- \`${scriptPrefix} dev\` - Start development servers
- \`${scriptPrefix} build\` - Build all packages
- \`${scriptPrefix} check-types\` - Check TypeScript types
- \`${scriptPrefix} lint\` - Run ESLint
- \`${scriptPrefix} lint:fix\` - Fix ESLint issues
- \`${scriptPrefix} format\` - Format code with Prettier
- \`${scriptPrefix} format:path\` - Format specific files with Prettier (e.g. \`${scriptPrefix} format:path src/index.ts\`)
- \`${scriptPrefix} format:check\` - Check code formatting with Prettier
- \`${scriptPrefix} test\` - Run tests
- \`${scriptPrefix} prepare\` - Prepare Husky git hooks
${
  includeDocker
    ? `- \`${scriptPrefix} docker:dev\` - Run with Docker (development)
${template !== "web" ? `- \`${scriptPrefix} docker:observability\` - Run Prometheus and Grafana locally\n` : ""}\
- \`${scriptPrefix} docker:prod\` - Run with Docker (production)`
    : ""
}
${
  includeKubernetes
    ? `- \`${scriptPrefix} k8s:deploy\` - Build, push, and deploy to Kubernetes
- \`${scriptPrefix} k8s:verify\` - Verify the Kubernetes deployment`
    : ""
}

### Database Commands (run from packages/db)

- \`${scriptPrefix} db:generate\` - Generate Prisma client
- \`${scriptPrefix} db:migrate\` - Run database migrations
`;

const buildStructureSection = ({
  projectName,
  template,
}: ReadmeContext): string => {
  const treeLines = [
    `${toKebabCase(projectName)}/`,
    "├── apps/",
    template !== "api" ? "│   ├── web/" : "",
    template !== "web" ? "│   ├── api/" : "",
    "│   ├── email/",
    "│   └── studio/",
    "├── packages/",
    "│   ├── auth/",
    "│   ├── contracts/",
    "│   ├── db/",
    "│   ├── email/",
    "│   ├── eslint-config/",
    "│   ├── logger/",
    "│   ├── prettier-config/",
    "│   ├── rate-limit/",
    "│   ├── storage/",
    "│   ├── typescript-config/",
    template !== "api" ? "│   ├── ui/" : "",
    "│   ├── utils/",
    "│   └── vitest-presets/",
    "└── turbo.json",
  ]
    .filter(Boolean)
    .join("\n");

  return `\
## Structure

\`\`\`plaintext
${treeLines}
\`\`\`
`;
};

const buildBuiltWithSection = ({
  template,
  includeDocker,
}: ReadmeContext): string => {
  const links: string[] = [];

  if (template !== "api") {
    links.push(
      "[Next.js 16](https://nextjs.org/)",
      "[shadcn/ui](https://ui.shadcn.com/)",
      "[Tailwind CSS](https://tailwindcss.com/)",
    );
  }
  if (template !== "web") {
    links.unshift("[Express](https://expressjs.com/)");
  }

  links.push(
    "[Turborepo](https://turbo.build/)",
    "[TypeScript](https://www.typescriptlang.org/)",
    "[pnpm](https://pnpm.io/)",
    "[ESLint](https://eslint.org/)",
    "[Prettier](https://prettier.io/)",
    "[Vitest](https://vitest.dev/)",
    "[GitHub Actions](https://github.com/features/actions)",
  );

  if (template !== "web") {
    links.push(
      "[Prisma](https://www.prisma.io/)",
      "[PostgreSQL](https://www.postgresql.org/)",
      "[AWS S3 / Cloudflare R2](https://aws.amazon.com/s3/)",
    );
  }

  links.push("[Better Auth](https://www.better-auth.com/)");

  if (template === "fullstack") {
    links.push(
      "[React Email](https://react.email/)",
      "[Resend](https://resend.com/)",
      "[Tanstack Query](https://tanstack.com/query/latest)",
    );
  }

  if (includeDocker) {
    links.push("[Docker](https://www.docker.com/)");
  }

  return `## Built With\n\n${links.join(" · ")}\n`;
};

const buildDocumentationSection = ({ template }: ReadmeContext): string => {
  const docs: string[] = [];

  if (template !== "api") {
    docs.push(
      "- [Web App Documentation](apps/web/README.md) - Next.js application",
    );
    docs.push(
      "- [UI Components Guide](packages/ui/README.md) - shadcn/ui components",
    );
  }
  if (template !== "web") {
    docs.push("- [API Documentation](apps/api/README.md) - Express server");
    docs.push(
      "- [Storage Package Documentation](packages/storage/README.md) - S3/R2/MinIO storage client",
    );
  }
  if (template === "api") {
    docs.push(
      "- [UI Components Guide](packages/ui/README.md) - shadcn/ui components",
    );
  }

  return `## Documentation\n\n${docs.join("\n")}\n`;
};

const buildDockerSection = ({
  template,
  scriptPrefix,
}: ReadmeContext): string => {
  const services: string[] = [];

  if (template !== "api") services.push("- **Web app** → `localhost:3000`");
  if (template !== "web") services.push("- **API server** → `localhost:4000`");
  services.push("- **PostgreSQL** → `localhost:5432`");

  return `\
## Docker Deployment

Production-ready Docker setup with docker-compose:

Development:

\`\`\`bash
${scriptPrefix} docker:dev
\`\`\`

Production:

\`\`\`bash
${scriptPrefix} docker:prod
\`\`\`

${
  template !== "web"
    ? `Observability:

\`\`\`bash
${scriptPrefix} docker:observability
\`\`\`
`
    : ""
}

${services.join("\n")}

Features:

- Multi-stage builds for minimal image size
- Non-root user execution for security
- Turbo pruning for optimized workspace dependencies
`;
};

const buildKubernetesSection = ({ scriptPrefix }: ReadmeContext): string => `\
## Kubernetes Deployment

Deploy to any Kubernetes cluster using the manifests in \`k8s/\` and the deploy script:

\`\`\`bash
# Set your Docker Hub username in deploy.sh and k8s/*-deployment.yml, then:
${scriptPrefix} k8s:deploy
\`\`\`

After deploying, verify the rollout:

\`\`\`bash
${scriptPrefix} k8s:verify
\`\`\`

See [Kubernetes docs](https://build-elevate.vercel.app/docs/deployment/kubernetes) for the full guide.
`;

/**
 * Scaffold a fresh README for the project from context.
 * No file reading or regex patching — pure construction.
 */
export const createProjectReadme = async (
  projectName: string,
  template: string,
  includeDocker: boolean,
  packageManager: "pnpm" | "npm" | "bun" = "pnpm",
  includeKubernetes: boolean = false,
) => {
  const ctx: ReadmeContext = {
    projectName,
    template: template as Template,
    includeDocker,
    includeKubernetes,
    packageManager,
    scriptPrefix:
      packageManager === "pnpm" ? packageManager : `${packageManager} run`,
  };

  const sections: string[] = [
    buildHeroSection(ctx),
    buildBuiltWithSection(ctx),
    buildGettingStartedSection(ctx),
    buildAvailableScriptsSection(ctx),
    buildStructureSection(ctx),
    ...(includeDocker ? [buildDockerSection(ctx)] : []),
    ...(includeKubernetes ? [buildKubernetesSection(ctx)] : []),
    buildDocumentationSection(ctx),
  ];

  const content = sections.join("\n");
  await writeFile("README.md", content, "utf8");
};
