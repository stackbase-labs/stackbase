# Stackbase App

A full-stack TypeScript monorepo built with Next.js, Express, Better Auth, Prisma, and Turborepo.

Built with [Stackbase](https://github.com/stackbase-labs/stackbase).

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Update environment values

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `apps/web/.env.local`            | Web app and auth callback URLs   |
| `apps/api/.env.local`            | API server, CORS, and auth setup |
| `packages/db/.env.local`         | PostgreSQL connection string     |
| `packages/email/.env.local`      | Email provider credentials       |
| `packages/storage/.env.local`    | S3-compatible storage settings   |
| `packages/rate-limit/.env.local` | Redis rate-limit settings        |

### 3. Start the development servers

```bash
pnpm dev
```

### Default local services

| Service       | URL                                            |
| ------------- | ---------------------------------------------- |
| Web app       | [http://localhost:3000](http://localhost:3000) |
| API           | [http://localhost:4000](http://localhost:4000) |
| Email preview | [http://localhost:3002](http://localhost:3002) |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) |

### Documentation

[stackbase-labs.vercel.app/docs](https://stackbase-labs.vercel.app/docs)

## Structure

```txt
stackbase/
├── apps/
│   ├── web/              # Next.js frontend application
│   ├── api/              # Express REST API server
│   ├── email/            # React Email template development
│   └── studio/           # Prisma Studio wrapper
├── packages/
│   ├── auth/             # Better Auth integration and session management
│   ├── contracts/        # Shared API and storage contracts
│   ├── db/               # Prisma ORM and database client
│   ├── email/            # Email template library with Resend
│   ├── logger/           # Structured logging with Pino
│   ├── rate-limit/       # API rate limiting with Upstash Redis
│   ├── storage/          # S3-compatible storage helpers
│   ├── ui/               # React component library
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
| `pnpm k8s:deploy`           | Deploy to Kubernetes              |
| `pnpm k8s:verify`           | Verify the Kubernetes deployment  |

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

### 2. Start Prometheus and Grafana

```bash
pnpm docker:observability
```

Grafana runs at <http://localhost:3003> and Prometheus runs at <http://localhost:9090>.

## Kubernetes

Kubernetes manifests live in `k8s/`.

```bash
pnpm k8s:deploy
pnpm k8s:verify
```

Review the manifests and environment values before deploying to a real cluster.

## License

This project is licensed under the [MIT License](LICENSE).
