# @workspace/db

This package provides database access and schema management for the monorepo, including:

- Database client powered by [Prisma](https://www.prisma.io/)
- PostgreSQL database schema and models
- Type-safe database queries
- Shared database configuration and migrations

## Usage

Import and use the database client in your apps:

```ts
import { prisma } from '@workspace/db';
```

## Features

- **Prisma Client**: Type-safe database access with auto-completion
- **Database Models**: User, Session, Account, TwoFactor, and Verification models
- **Migration Management**: Version-controlled database schema changes
- **Singleton Pattern**: Optimized client instantiation for development and production

## Setup

1. Configure database connection in your environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
2. Run migrations to set up your database schema.

## Available Scripts

- **db:generate**: Generate Prisma Client from schema
- **db:migrate**: Create and apply new migrations
- **db:deploy**: Deploy migrations to production
- **db:reset**: Reset database and apply all migrations (development only)

## Database Schema

The package includes the following models:

- **User**: User accounts with email verification and two-factor support
- **Session**: User sessions with IP address and user agent tracking
- **Account**: OAuth provider accounts (Google, GitHub, etc.)
- **TwoFactor**: Two-factor authentication settings
- **Verification**: Email verification tokens

## Example

```ts
import { prisma } from '@workspace/db';

// Query users
const users = await prisma.user.findMany({
  where: { emailVerified: true },
  include: { sessions: true },
});

// Create a new user
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});
```

## Migrations

To create a new migration after modifying the schema:

```bash
pnpm db:migrate
```

To apply migrations in production:

```bash
pnpm db:deploy
```
