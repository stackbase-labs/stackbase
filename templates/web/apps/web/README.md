# Next.js Turborepo App

This is a Next.js application managed in a Turborepo monorepo setup. It comes with database and authentication setup.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then, update the variables in your `.env.local` file:

#### Database

Set your database connection URL:

```env
DATABASE_URL=your-database-connection-string
```

For example, a PostgreSQL URL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

> [!NOTE]
> You also need to update the same DATABASE_URL in the packages/db/.env.local file (by copying the contents of .env.example in the packages/db/ directory), as Prisma reads it from there.

#### Auth.js Secret

Set your Better Auth development secret:

```env
BETTER_AUTH_SECRET=your-dev-secret
```

You can generate a random secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

Run migrations or generate the client:

- Navigate to the `packages/db` directory and run:

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run the App

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app running.
