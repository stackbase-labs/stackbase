<!-- markdownlint-disable MD033 MD036 -->

<h1 align="center">Stackbase</h1>

<div align="center">

[![Quick Start](https://img.shields.io/badge/Quick_Start-blue?style=for-the-badge)](#quick-start)
[![CI](https://img.shields.io/github/actions/workflow/status/stackbase-labs/stackbase/ci.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/stackbase-labs/stackbase/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/stackbase?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/stackbase)
[![npm downloads](https://img.shields.io/npm/dy/stackbase?style=for-the-badge&color=20c997)](https://www.npmjs.com/package/stackbase)
[![build-elevate downloads](https://img.shields.io/npm/dy/build-elevate?style=for-the-badge&color=6b7280&label=build-elevate%20downloads)](https://www.npmjs.com/package/build-elevate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/Documentation-Live-6366f1?style=for-the-badge&logo=vercel)](https://stackbase-labs.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-333?style=for-the-badge&logo=github)](https://github.com/stackbase-labs/stackbase)

**A production-ready full-stack starter for shipping SaaS products faster.**

<p align="center">
  <img src="assets/banner.png" alt="Stackbase Banner" width="100%" />
</p>

</div>

<!-- markdownlint-enable MD033 MD036 -->

> [!TIP]
> **Built for SaaS teams, startups, and developers who want a production-ready foundation without rebuilding the same setup.**

Stackbase is a production-ready monorepo starter with authentication, database, email templates, UI components, rate limiting, and deployment configs already wired together.

Built with **Turborepo**, **Next.js 16**, **Express**, **Better Auth**, **Prisma**, and **shadcn/ui**, it gives you a cohesive base for shipping real products faster.

## Who It's For

Stackbase is built for teams and builders who want a real application foundation before they start product work.

- **Founders and solo builders** who want to ship an MVP without spending the first week wiring auth, database, email, and deployment basics.
- **SaaS and agency teams** that need consistent project structure, shared packages, and repeatable setup across client or product work.
- **Developers learning production architecture** who want to study a full-stack monorepo with real auth, database, API, UI, and deployment patterns.

## Contents

- [Who It's For](#who-its-for)
- [Quick Start](#quick-start)
- [Templates](#templates)
- [Generated Project](#generated-project)
- [What's Included](#whats-included)
- [Repository Layout](#repository-layout)
- [Development](#development)
- [Deployment](#deployment)
- [Build Elevate](#build-elevate)
- [Contributing](#contributing)
- [Security](#security)
- [Links](#links)

## Quick Start

### Requirements

- Node.js 20+
- pnpm, npm, or Bun
- Docker Desktop, if you enable Docker-based workflows

### 1. Create a Project

```bash
pnpm dlx stackbase@latest init my-app
```

### 2. Configure Environment Variables

Navigate into your project and update the generated `.env.local` files with your database credentials and secrets:

```bash
cd my-app
```

Key environment files:

| File                             | Purpose                                |
| -------------------------------- | -------------------------------------- |
| `packages/db/.env.local`         | PostgreSQL connection string           |
| `packages/auth/.env.local`       | Better Auth secret & OAuth credentials |
| `apps/web/.env.local`            | Web app and auth callback URLs         |
| `apps/api/.env.local`            | API server, CORS, and auth setup       |
| `packages/email/.env.local`      | Email provider credentials             |
| `packages/storage/.env.local`    | S3-compatible storage settings         |
| `packages/rate-limit/.env.local` | Redis rate-limit settings              |

> The CLI automatically initializes `.env.local` files from `.env.example` templates during project creation.

### 3. Start Development

```bash
pnpm dev
```

Default local services:

| Service       | URL                     |
| ------------- | ----------------------- |
| Web app       | <http://localhost:3000> |
| API           | <http://localhost:4000> |
| Email preview | <http://localhost:3002> |
| Prisma Studio | <http://localhost:5555> |

> For complete CLI commands, flags, and options, see the [CLI Documentation](https://stackbase-labs.vercel.app/docs/cli).

## Templates

Stackbase provides dedicated standalone templates in [`templates/`](templates/):

| Template | Best For                     | Includes                                                                      |
| -------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `base`   | Complete application starter | Web, API, auth, database, email, storage, Docker, Observability, Kubernetes   |
| `web`    | Frontend-led products        | Web app, UI, auth, database, email, storage packages, Docker                  |
| `api`    | Backend services             | API, database, auth, storage, contracts, rate limiting, Docker, Observability |

> `fullstack` is supported as a backwards-compatible alias for `base`.

## Generated Project

The full generated project uses this structure after `stackbase init`:

```txt
my-app/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # Express API
│   ├── email/            # React Email preview
│   └── studio/           # Prisma Studio wrapper
├── packages/
│   ├── auth/             # Better Auth setup
│   ├── db/               # Prisma schema and client
│   ├── ui/               # shadcn/ui component package
│   ├── email/            # Transactional email package
│   ├── storage/          # Object storage helpers
│   ├── rate-limit/       # Upstash Redis rate limits
│   ├── contracts/        # Shared validation schemas
│   ├── logger/           # Shared logging
│   ├── utils/            # Shared utilities
│   ├── eslint-config/
│   ├── prettier-config/
│   ├── typescript-config/
│   └── vitest-presets/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Each template contains only the applications and packages relevant to its target architecture.

## What's Included

| Area          | Stackbase Includes                                             |
| ------------- | -------------------------------------------------------------- |
| Frontend      | Next.js 16, React, Tailwind CSS, shadcn/ui, dashboard patterns |
| API           | Express, typed middleware, CORS, errors, health checks         |
| Auth          | Better Auth, sessions, OAuth-ready structure, 2FA flows        |
| Database      | Prisma, PostgreSQL, generated client, Studio workflow          |
| Email         | React Email templates with Resend integration                  |
| Storage       | S3-compatible upload and delete helpers                        |
| Rate limiting | Upstash Redis limiters for API and auth flows                  |
| Observability | Prometheus metrics and Grafana dashboard provisioning          |
| Deployment    | Docker Compose, production Dockerfiles, Kubernetes manifests   |
| Quality       | TypeScript, ESLint, Prettier, Vitest, shared workspace config  |
| Updates       | `.stackbase.json`, `stackbase upgrade`, conflict diffs         |

## Repository Layout

This repository is both the product source and the template registry.

```txt
stackbase/
├── apps/
│   └── docs/                  # Documentation site
├── packages/
│   └── stackbase/             # Public CLI package
├── templates/
│   ├── base/                  # Full-stack application template
│   ├── web/                   # Web application template
│   └── api/                   # API application template
├── assets/                    # Repository assets
├── CHANGELOG.md
├── pnpm-workspace.yaml
└── package.json
```

The CLI downloads the chosen template from `templates/` via the repository archive downloader and applies project-name replacement, package-manager configuration, environment setup, optional feature configuration, and manifest generation.

## Development

Install dependencies:

```bash
pnpm install
```

Run the docs app from the repository root:

```bash
pnpm dev
```

Work on the CLI:

```bash
pnpm --filter ./packages/stackbase check-types
pnpm --filter ./packages/stackbase build
node packages/stackbase/dist/index.js --help
```

Run checks:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm format:check
```

Template packages live under `templates/base`, but they are still part of the pnpm workspace so docs and CLI verification can resolve shared packages locally.

## Deployment

Generated projects include deployment assets:

- Docker Compose for local and production workflows
- Production Dockerfiles for `apps/web` and `apps/api`
- Kubernetes manifests under `k8s/`
- Prometheus and Grafana config under `deploy/observability/`

Deployment docs:

- [Docker](https://stackbase-labs.vercel.app/docs/configuration/docker)
- [Kubernetes](https://stackbase-labs.vercel.app/docs/deployment/kubernetes)
- [Vercel](https://stackbase-labs.vercel.app/docs/deployment/vercel)
- [Observability](https://stackbase-labs.vercel.app/docs/configuration/observability)

## Build Elevate

Stackbase is the successor to Build Elevate, with a separate package, repository identity, and release line.

- New projects should use `stackbase`.
- Existing Build Elevate projects should stay on the `build-elevate` package and separate maintenance branch.
- Stackbase projects use `.stackbase.json`; `.build-elevate.json` is not supported by the Stackbase CLI.
- Move old projects to Stackbase manually when you want the new template architecture.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch from `main`.
2. Install dependencies with `pnpm install`.
3. Make your changes.
4. Run `pnpm lint`, `pnpm check-types`, and `pnpm test`.
5. Open a pull request with a clear description.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Security

Please do not open public issues for vulnerabilities. Review [SECURITY.md](SECURITY.md) for responsible disclosure.

## Links

- Documentation: [stackbase-labs.vercel.app/docs](https://stackbase-labs.vercel.app/docs)
- npm: [stackbase](https://www.npmjs.com/package/stackbase)
- Issues: [github.com/stackbase-labs/stackbase/issues](https://github.com/stackbase-labs/stackbase/issues)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## License

MIT. See [LICENSE](LICENSE).
