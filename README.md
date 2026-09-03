<!-- markdownlint-disable MD033 -->
<h1 align="center">build-elevate</h1>

<div align="center">

[![Quick Start](https://img.shields.io/badge/Quick_Start-blue?style=for-the-badge)](./README.md#-quick-start)
[![CI](https://img.shields.io/github/actions/workflow/status/vijaysingh2219/build-elevate/ci.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/vijaysingh2219/build-elevate/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/build-elevate?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/build-elevate)
[![npm downloads](https://img.shields.io/npm/dy/build-elevate?style=for-the-badge&color=20c997)](https://www.npmjs.com/package/build-elevate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/Documentation-Live-6366f1?style=for-the-badge&logo=vercel)](https://build-elevate.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-333?style=for-the-badge&logo=github)](https://github.com/vijaysingh2219/build-elevate)

<!-- markdownlint-disable MD036 -->

**Launch your SaaS product faster. Everything you need is built in.**

<p align="center">
  <img src="assets/og-image.png" alt="Build Elevate" />
</p>

<!-- markdownlint-enable MD036 -->

<!-- markdownlint-enable MD033 -->

</div>

---

> [!TIP]
> **Perfect for SaaS teams, startups, and developers tired of reinventing the same setup.** Skip weeks of boilerplate, onboard new developers in hours, and ship features on day one. build-elevate has you covered.

**You're launching tomorrow. Your backend isn't designed. Your auth isn't configured. Your database isn't connected. And you have 3 other things to do.**

build-elevate is a production-ready monorepo starter that bundles everything you need — authentication, database, email templates, UI components, rate limiting, and deployment configs — into a single, cohesive foundation.

Built with **Turborepo**, **Next.js 16**, **Express**, **Better Auth**, **Prisma**, and **shadcn/ui**, it's designed for teams that want to focus on their product, not boilerplate. **Launch in days. Deploy with confidence.**

---

## 📑 Table of Contents

- [Who is this for?](#-who-is-this-for)
- [What's Included](#-whats-included)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Applications](#-applications)
- [Packages](#-packages)
- [Technology Stack](#-technology-stack)
- [Development](#-development)
- [Docker](#-docker)
- [Kubernetes](#-kubernetes)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Security](#-security)
- [Support](#-support)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🎯 Who is this for?

<!-- markdownlint-disable MD033 -->
<table>
  <tr>
    <td width="33%" valign="top">
      <h3>🚀 Startup Founders & Solo Builders</h3>
      <p>You need a working product yesterday. Spend zero time on architecture decisions and infrastructure. Full-stack, production-ready, deployable in hours. Everything you need to launch an MVP without the pain.</p>
    </td>
    <td width="33%" valign="top">
      <h3>👨‍💼 SaaS & Agency Teams</h3>
      <p>Onboard new developers in hours instead of weeks. Unified monorepo structure, shared patterns, beautiful components, and consistent tooling. Engineers spend time on features, not setup guides.</p>
    </td>
    <td width="33%" valign="top">
      <h3>🎓 Junior Developers & Students</h3>
      <p>Learn how a production SaaS is actually built. See authentication, database design, API patterns, and deployment in action. A real starter template that teaches you more than any tutorial.</p>
    </td>
  </tr>
</table>
<!-- markdownlint-enable MD033 -->

---

## 📋 What's Included

<!-- markdownlint-disable MD033 -->
<table>
<tr>
<td width="50%" valign="top">
<h3>✅ Production Ready</h3>
<p>Comes with authentication, database, email, rate limiting, and deployment configs. No "setup guide hell" — everything works out of the box.</p>
</td>
<td width="50%" valign="top">
<h3>⚡ Developer Experience</h3>
<p>Full TypeScript, hot reload, Vitest testing, ESLint, Prettier, Docker, and a Turborepo monorepo that actually makes sense. Ship faster with better tools.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🏗️ Modular Architecture</h3>
<p>Authentication, database, email, UI components, and utilities are all separate, reusable packages. Share code between frontend and backend effortlessly.</p>
</td>
<td width="50%" valign="top">
<h3>🚀 Deploy Anywhere</h3>
<p>Vercel for frontend. Railway, Heroku, or AWS for API. PostgreSQL anywhere. Mix and match platforms without rewriting anything.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>👥 Designed for Teams</h3>
<p>Consistent patterns, shared linting config, unified deployment. New team members don't need weeks to understand the codebase structure.</p>
</td>
<td width="50%" valign="top">
<h3>📖 Fully Documented</h3>
<p>Comprehensive documentation built with Fumadocs. From installation to deployment, troubleshooting to API reference — everything explained.</p>
</td>
</tr>
</table>
<!-- markdownlint-enable MD033 -->

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** ([download](https://nodejs.org))
- **pnpm 10.32+** (recommended) or npm/bun
- For Docker: [Docker Desktop](https://docker.com)

### 1. Install Prerequisites

You'll need Node.js 20+ and pnpm (or npm/bun):

```bash
# Check Node.js
node --version  # Should be v20+

# Install pnpm (recommended)
npm install -g pnpm@latest
```

### 2. Create Your Project

The fastest way to get started:

```bash
pnpm dlx build-elevate@latest init my-project
```

This interactive CLI will:

- Ask for your project name
- Help you choose a package manager
- Optionally include Docker
- Optionally include Prisma Studio
- Scaffold everything and install dependencies

### 3. Start Building

```bash
cd my-project
pnpm dev
```

Your full stack is now running:

- **Web Frontend**: <http://localhost:3000>
- **REST API**: <http://localhost:4000>
- **Email Preview**: <http://localhost:3002>
- **Database UI**: <http://localhost:5555>

That's it. No more setup. Start building features.

---

## 📂 Project Structure

```txt
build-elevate/
├── apps/
│   ├── web/              # Next.js frontend application
│   ├── api/              # Express REST API server
│   ├── email/            # React Email template development
│   ├── studio/           # Prisma Studio (database UI)
│   └── docs/             # Fumadocs documentation site
├── packages/
│   ├── auth/             # Better Auth integration & session management
│   ├── db/               # Prisma ORM & database client
│   ├── ui/               # React component library (shadcn/ui)
│   ├── email/            # Email template library with Resend
│   ├── utils/            # Shared utilities & TypeScript types
│   ├── rate-limit/       # API rate limiting with Upstash Redis
│   ├── eslint-config/    # Unified ESLint configuration
│   ├── prettier-config/  # Code formatting configuration
│   ├── typescript-config/# Shared TypeScript compiler options
│   └── vitest-presets/   # Testing presets for Node.js & React
├── package.json          # Root package configuration
├── pnpm-workspace.yaml   # Monorepo workspace configuration
├── turbo.json            # Turborepo pipeline configuration
└── docker-compose.yml    # Local development database (PostgreSQL)
```

## 📦 Applications

| Application | Port | Description                                        |
| ----------- | ---- | -------------------------------------------------- |
| **Web**     | 3000 | Next.js frontend with authentication and dashboard |
| **API**     | 4000 | Express REST API with middleware and endpoints     |
| **Email**   | 3002 | React Email template preview and development       |
| **Studio**  | 5555 | Prisma Studio for database management              |

## 📚 Packages

### Application Packages

- **[@workspace/auth](packages/auth/)** - Better Auth integration, session management, and OAuth flows
- **[@workspace/db](packages/db/)** - Prisma ORM, database schema, and PostgreSQL client
- **[@workspace/ui](packages/ui/)** - React component library built with shadcn/ui and Tailwind CSS
- **[@workspace/email](packages/email/)** - Email templates using React Email and Resend integration
- **[@workspace/utils](packages/utils/)** - Shared utility functions and type definitions
- **[@workspace/rate-limit](packages/rate-limit/)** - API rate limiting with Upstash Redis

### Configuration Packages

- **[@workspace/eslint-config](packages/eslint-config/)** - Unified ESLint rules and linting setup
- **[@workspace/prettier-config](packages/prettier-config/)** - Consistent code formatting configuration
- **[@workspace/typescript-config](packages/typescript-config/)** - Shared TypeScript compiler options
- **[@workspace/vitest-presets](packages/vitest-presets/)** - Testing configuration for Node.js and React

## 🧰 Technology Stack

| Layer                | Technology                                                         | Purpose                                       |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| **Build System**     | [Turborepo](https://turborepo.org)                                 | High-performance monorepo orchestration       |
| **Frontend**         | [Next.js 16](https://nextjs.org)                                   | React framework with App Router and Turbopack |
| **Backend**          | [Express](https://expressjs.com)                                   | Lightweight, unopinionated web framework      |
| **Database**         | [Prisma](https://prisma.io) + [PostgreSQL](https://postgresql.org) | Modern ORM and relational database            |
| **Authentication**   | [Better Auth](https://better-auth.com)                             | Session-based auth with OAuth support         |
| **UI Components**    | [shadcn/ui](https://ui.shadcn.com)                                 | Accessible component library                  |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com)                            | Utility-first CSS framework                   |
| **Email**            | [React Email](https://react.email) + [Resend](https://resend.com)  | Email template development & delivery         |
| **Rate Limiting**    | [Upstash Redis](https://upstash.com)                               | Serverless Redis for rate limiting            |
| **Testing**          | [Vitest](https://vitest.dev)                                       | JavaScript testing framework                  |
| **Linting**          | [ESLint](https://eslint.org)                                       | JavaScript linting and code quality           |
| **Formatting**       | [Prettier](https://prettier.io)                                    | Code formatter                                |
| **Language**         | [TypeScript](https://www.typescriptlang.org)                       | JavaScript with static typing                 |
| **Containerization** | [Docker](https://docker.com)                                       | Container-based deployment                    |
| **Orchestration**    | [Kubernetes](https://kubernetes.io)                                | Container orchestration                       |

## 🚀 Development

### Running All Applications

Start all services in development mode with hot reload:

```bash
pnpm dev
```

### Running Individual Applications

```bash
# Start only the web app
pnpm dev --filter=web

# Start only the API
pnpm dev --filter=api

# Start a specific package
pnpm dev --filter=@workspace/auth
```

### Common Commands

```bash
# Build all applications and packages
pnpm build

# Check TypeScript types across the monorepo
pnpm check-types

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Run tests
pnpm test

# Clean build artifacts and node_modules
pnpm clean
```

### Database

```bash
# Generate Prisma client (required after schema changes)
pnpm db:generate

# Create a new migration
pnpm db:migrate

# Reset the database (⚠️ deletes all data)
pnpm db:reset

# Open Prisma Studio UI
pnpm studio
```

### Environment Variables

Each application requires environment variables. Copy the example files and update them:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp packages/db/.env.example packages/db/.env
```

See [Environment Variables Documentation](https://build-elevate.vercel.app/docs/configuration/environment-variables) for a complete reference.

## 🐳 Docker

### Local Development

Using Docker Compose for PostgreSQL:

```bash
docker-compose up -d
```

This starts a PostgreSQL database at `postgresql://postgres:password@localhost:5432/build-elevate-app`.

### Production Deployment

Build and run services as containers:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Services include:

- **Web** (Next.js) on port 3000
- **API** (Express) on port 4000
- **PostgreSQL** on port 5432
- Health checks and restart policies configured

See [Docker Documentation](https://build-elevate.vercel.app/docs/configuration/docker) for more details.

### Local Observability

Run Prometheus and Grafana locally to visualize the API metrics exposed at `http://localhost:4000/metrics`:

```bash
pnpm --filter api dev
pnpm docker:observability
```

Then open:

- **Prometheus**: <http://localhost:9090>
- **Grafana**: <http://localhost:3002> (`admin` / `admin`)

The provisioned Grafana dashboard is named **Build Elevate API Overview** and includes request rate, status codes, p95 latency, per-route latency, and in-flight request panels. Generate a little traffic with `curl http://localhost:4000/health` or an API route if the dashboard is empty at first.

## ⛵ Kubernetes

Production-ready manifests for deploying both the Next.js frontend and Express API to any Kubernetes cluster (EKS, GKE, AKS, k3s, minikube) live in the [`k8s/`](k8s/) directory — Deployments, Services, nginx Ingress, HorizontalPodAutoscalers (2 → 10 pods), and a post-deploy health-check script.

Once your cluster has an nginx Ingress controller and the Metrics Server installed, deploy and verify with:

```bash
pnpm k8s:deploy   # build & push images, create secrets, apply manifests, wait for rollout
pnpm k8s:verify   # check pods, endpoints, in-cluster HTTP, ingress, and HPA metrics
```

See the [Kubernetes Deployment Guide](https://build-elevate.vercel.app/docs/deployment/kubernetes) for cluster requirements, TLS/cert-manager setup, traffic flow, and troubleshooting.

## 📖 Documentation

Visit [https://build-elevate.vercel.app/docs](https://build-elevate.vercel.app/docs) to view the documentation.

## 🚢 Deployment

### Vercel

Deploy the Next.js frontend to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/vijaysingh2219/build-elevate)

See [Vercel Deployment Guide](https://build-elevate.vercel.app/docs/deployment/vercel) for detailed instructions.

### Other Platforms

The modular structure makes it easy to deploy to any platform:

- **Web (Next.js)**: Vercel, Netlify, Railway, Heroku
- **API (Express)**: Railway, Heroku, AWS, DigitalOcean
- **Database (PostgreSQL)**: AWS RDS, Heroku Postgres, Railway, Neon

---

## 🤝 Contributing

Contributions are welcome! Whether it's a bug fix, a new feature, or a documentation improvement, we'd love your help.

1. Fork the repository and create your branch from `main`.
2. Install dependencies with `pnpm install`.
3. Make your changes, then run `pnpm lint`, `pnpm check-types`, and `pnpm test`.
4. Open a pull request with a clear description of what and why.

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guidelines and development workflow.

## 🔒 Security

If you discover a security vulnerability, please **do not** open a public issue. Review our [Security Policy](./SECURITY.md) for instructions on reporting it responsibly.

## 💬 Support

- 📖 **Documentation** — [build-elevate.vercel.app/docs](https://build-elevate.vercel.app/docs)
- 🐛 **Bugs & feature requests** — [open an issue](https://github.com/vijaysingh2219/build-elevate/issues)
- 💡 **Questions & ideas** — [start a discussion](https://github.com/vijaysingh2219/build-elevate/discussions)
- 📸 **Screenshots** — see [SCREENSHOTS.md](./SCREENSHOTS.md)
- 📝 **Release notes** — see [CHANGELOG.md](./CHANGELOG.md)

If build-elevate saves you time, consider giving it a ⭐ — it helps others discover the project.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

build-elevate is built on top of amazing open-source projects:

- [Turborepo](https://turbo.build/repo) - Monorepo build system
- [Next.js](https://nextjs.org) - React framework
- [Express](https://expressjs.com) - Web framework
- [Better Auth](https://better-auth.com) - Authentication
- [Prisma](https://prisma.io) - ORM
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [React Email](https://react.email) - Email templates
- [Turbopack](https://turbo.build/pack) - Rust-based bundler

---
