<!-- markdownlint-disable MD033 MD036 -->

<h1 align="center">stackbase</h1>

<div align="center">

[![npm version](https://img.shields.io/npm/v/stackbase?style=for-the-badge&color=CB3837&logo=npm)](https://www.npmjs.com/package/stackbase)
[![npm downloads](https://img.shields.io/npm/dy/stackbase?style=for-the-badge&color=20c997)](https://www.npmjs.com/package/stackbase)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/CLI_Docs-Live-6366f1?style=for-the-badge&logo=vercel)](https://stackbase-labs.vercel.app/docs/cli)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-333?style=for-the-badge&logo=github)](https://github.com/stackbase-labs/stackbase)

**The official CLI for scaffolding and upgrading production-ready full-stack Turborepo applications.**

</div>

<!-- markdownlint-enable MD033 MD036 -->

---

## Quick Start

Create a new project interactively:

```bash
pnpm dlx stackbase@latest init my-app
```

Or using your package manager of choice:

```bash
# npm
npx stackbase@latest init my-app

# Bun
bunx stackbase@latest init my-app
```

### Next Steps

1. **Navigate to your project**:

   ```bash
   cd my-app
   ```

2. **Configure environment variables**:
   Update the generated `.env.local` files across apps and packages:

   | File                             | Purpose                                       |
   | -------------------------------- | --------------------------------------------- |
   | `packages/db/.env.local`         | PostgreSQL connection string (`DATABASE_URL`) |
   | `packages/auth/.env.local`       | Better Auth secret & OAuth credentials        |
   | `packages/email/.env.local`      | Resend API key & sender address               |
   | `packages/storage/.env.local`    | S3-compatible storage credentials             |
   | `packages/rate-limit/.env.local` | Upstash Redis rate-limit settings             |
   | `apps/web/.env.local`            | Web app & auth callback URLs                  |
   | `apps/api/.env.local`            | Express REST API & CORS settings              |

   > **Note**: The CLI automatically creates `.env.local` from `.env.example` templates and generates a shared `BETTER_AUTH_SECRET` during setup.

3. **Start local development**:

   ```bash
   pnpm dev
   ```

### Default Local Services

| Service       | Local URL                                      |
| ------------- | ---------------------------------------------- |
| Web app       | [http://localhost:3000](http://localhost:3000) |
| REST API      | [http://localhost:4000](http://localhost:4000) |
| Email preview | [http://localhost:3002](http://localhost:3002) |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) |

---

## Templates

Stackbase provides dedicated standalone templates:

| Template           | Best For                | Architecture                                                                                                                   |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `base` _(default)_ | Full-stack applications | Next.js 16 web app, Express API, email preview, Prisma Studio, Better Auth, shared packages, Docker, Observability, Kubernetes |
| `web`              | Frontend-led products   | Next.js 16 web app, Prisma Studio, shadcn/ui, Better Auth, database, email, storage packages, Docker                           |
| `api`              | Backend microservices   | Express REST API, Prisma Studio, Better Auth, contracts, rate-limiting, database, storage packages, Docker, Observability      |

> `fullstack` is supported as a backwards-compatible alias for `base`.

---

## Commands

### `stackbase init`

Scaffolds a new project from a Stackbase template.

```bash
pnpm dlx stackbase@latest init [project-name] [options]
```

#### Flags & Options

| Option                         | Description                                  | Default       |
| ------------------------------ | -------------------------------------------- | ------------- |
| `-t, --template <name>`        | Template to use (`base`, `web`, or `api`)    | `base`        |
| `-p, --package-manager <name>` | Package manager (`pnpm`, `npm`, or `bun`)    | Auto-detected |
| `-y, --yes`                    | Skip interactive prompts and accept defaults | `false`       |
| `--no-git`                     | Skip Git repository initialization           | `false`       |
| `--skip-install`               | Skip dependency installation                 | `false`       |
| `-v, --verbose`                | Show verbose setup output                    | `false`       |

#### Examples

```bash
# Interactive setup
pnpm dlx stackbase@latest init

# Non-interactive full-stack project with defaults
pnpm dlx stackbase@latest init my-app -y

# Frontend-only starter with Bun
pnpm dlx stackbase@latest init my-web-app -t web -p bun

# Backend API without git initialization
pnpm dlx stackbase@latest init my-api -t api --no-git
```

---

### `stackbase migrate`

Moves an existing Build Elevate project onto the Stackbase release line. The command reads `.build-elevate.json`, updates safe files to the latest Stackbase template, and preserves locally modified files as conflicts.

```bash
# Preview the migration
pnpm dlx stackbase@latest migrate --dry-run

# Migrate and keep a backup of the old manifest
pnpm dlx stackbase@latest migrate
```

Use `--force` to accept the latest Stackbase template as the new baseline while keeping conflicting local files unchanged. The original manifest is saved as `.build-elevate.json.bak`. Delete the backup after the migrated project passes your checks.

See the [migration guide](https://stackbase-labs.vercel.app/docs/migrate) for the complete workflow.

---

### `stackbase upgrade`

Safely updates your project with upstream improvements from the Stackbase template using a 3-way commit SHA and file hash strategy.

```bash
pnpm dlx stackbase@latest upgrade [options]
```

- **Auto-updates** template files you haven't modified.
- **Preserves** any files you have edited locally.
- **Reports conflicts** if both you and the upstream template modified the same file.

#### Flags & Options

| Option          | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `--dry-run`     | Preview files that would be updated without writing changes          |
| `--force`       | Advance the manifest commit pointer while preserving all local edits |
| `-y, --yes`     | Skip confirmation prompts                                            |
| `-v, --verbose` | Show detailed step logs                                              |

```bash
# Preview upstream changes
pnpm dlx stackbase@latest upgrade --dry-run

# Run upgrade
pnpm dlx stackbase@latest upgrade
```

---

### `stackbase diff`

Shows a colored line-by-line diff of what changed in the upstream template for a specific file between your scaffolded commit and the latest release.

```bash
pnpm dlx stackbase@latest diff <file-path>
```

```bash
# View template changes for next.config.ts
pnpm dlx stackbase@latest diff apps/web/next.config.ts
```

---

## System Requirements

- **Node.js**: `v20.0.0` or higher
- **Package Manager**: `pnpm` (recommended), `npm`, or `bun`
- **Docker**: Optional, required for containerized workflows

---

## Documentation & Links

- **Documentation**: [https://stackbase-labs.vercel.app/docs](https://stackbase-labs.vercel.app/docs)
- **CLI Reference**: [https://stackbase-labs.vercel.app/docs/cli](https://stackbase-labs.vercel.app/docs/cli)
- **GitHub Repository**: [github.com/stackbase-labs/stackbase](https://github.com/stackbase-labs/stackbase)
- **Issues**: [github.com/stackbase-labs/stackbase/issues](https://github.com/stackbase-labs/stackbase/issues)

## License

[MIT](https://github.com/stackbase-labs/stackbase/blob/main/LICENSE) © [Stackbase](https://github.com/stackbase-labs)
