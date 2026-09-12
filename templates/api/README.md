# Stackbase API App

A backend-focused TypeScript monorepo built with Express, Better Auth, Prisma, PostgreSQL, and Turborepo.

Built with [Stackbase](https://github.com/stackbase-labs/stackbase).

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Update environment values

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `apps/api/.env.local`            | API server, CORS, and auth setup |
| `packages/db/.env.local`         | PostgreSQL connection string     |
| `packages/email/.env.local`      | Email provider credentials       |
| `packages/storage/.env.local`    | S3-compatible storage settings   |
| `packages/rate-limit/.env.local` | Redis rate-limit settings        |

### 3. Start the development server

```bash
pnpm dev
```

### Default local services

| Service       | URL                                            |
| ------------- | ---------------------------------------------- |
| API server    | [http://localhost:4000](http://localhost:4000) |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) |

### Documentation

[stackbase-labs.vercel.app/docs](https://stackbase-labs.vercel.app/docs)

## Structure

```txt
stackbase/
├── apps/
│   ├── api/              # Express REST API server
│   └── studio/           # Prisma Studio wrapper
├── packages/
│   ├── auth/             # Better Auth integration and session management
│   ├── contracts/        # Shared API and storage contracts
│   ├── db/               # Prisma ORM and database client
│   ├── email/            # Email template library with Resend
│   ├── logger/           # Structured logging with Pino
│   ├── rate-limit/       # API rate limiting with Upstash Redis
│   ├── storage/          # S3-compatible storage helpers
│   ├── utils/            # Shared utilities
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── prettier-config/  # Shared Prettier configuration
│   ├── typescript-config/# Shared TypeScript compiler options
│   └── vitest-presets/   # Shared Vitest presets
├── package.json          # Root package configuration
├── pnpm-workspace.yaml   # Monorepo workspace configuration
├── turbo.json            # Turborepo pipeline configuration
└── docker-compose.yml    # Local development services
```

## Scripts

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `pnpm build`                | Build all apps and packages       |
| `pnpm clean`                | Clean generated artifacts         |
| `pnpm dev`                  | Start development mode            |
| `pnpm docker:dev`           | Start development Docker services |
| `pnpm docker:observability` | Start observability services      |
| `pnpm docker:prod`          | Start production Docker services  |
| `pnpm lint`                 | Run linting                       |
| `pnpm lint:fix`             | Fix lint issues                   |
| `pnpm format`               | Format all files                  |
| `pnpm format:path <path>`   | Format a specific path            |
| `pnpm format:check`         | Check formatting                  |
| `pnpm check-types`          | Run TypeScript checks             |
| `pnpm start`                | Start built applications          |
| `pnpm test`                 | Run tests                         |

## Database

### 1. Generate the Prisma client

```bash
pnpm --filter @workspace/db db:generate
```

### 2. Run migrations

```bash
pnpm --filter @workspace/db db:migrate
```

### 3. Open Prisma Studio

```bash
pnpm --filter @workspace/db studio
```

## Docker

### 1. Start the local Docker services

```bash
pnpm docker:dev
```

### 2. Start the production Docker stack

```bash
pnpm docker:prod
```

### 3. Start Prometheus and Grafana

```bash
pnpm docker:observability
```

Grafana runs at <http://localhost:3002> and Prometheus runs at <http://localhost:9090>.

## License

[MIT License](LICENSE)
