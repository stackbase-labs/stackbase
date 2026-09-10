# @workspace/contracts

Shared API contracts, validation schemas, and TypeScript types used across the monorepo.

This package centralizes all request and response validation logic so frontend apps, backend services, and shared libraries use the same source of truth.

## Features

- **Shared Validation Schemas**: Reusable Zod schemas for API requests and responses
- **Centralized Contracts**: Keep frontend and backend validation fully aligned
- **Type Safety**: Infer TypeScript types directly from schemas
- **Modular Exports**: Import only the contracts you need
- **Monorepo Friendly**: Designed for shared usage across apps and packages

## Usage

Import schemas and inferred types in your apps or services:

```ts
import { emailSchema, signInSchema } from '@workspace/contracts';
import type { SignInFormValues } from '@workspace/contracts';
```

## Example

```ts
import { emailSchema } from '@workspace/contracts';

// Validation
const result = emailSchema.safeParse('user@example.com');
if (result.success) {
  console.log('Valid email:', result.data);
}
```
