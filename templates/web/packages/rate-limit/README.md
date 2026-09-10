# @workspace/rate-limit

This package provides rate limiting features for the monorepo, including:

- Rate limiting powered by [Upstash Redis](https://upstash.com/)
- Pre-configured rate limiters for authentication flows
- Customizable rate limiting strategies
- Shared rate limiting configuration and types

## Usage

Import and use rate limiting utilities in your apps:

```ts
import { createRateLimiter, verifyEmailRateLimiter } from '@workspace/rate-limit';
```

## Features

- Predefined rate limiters for common authentication operations
- Flexible rate limiter creation with custom configurations
- Built-in sliding window algorithm for rate limiting
- Type-safe rate limiting APIs

## Setup

1. Configure Upstash Redis credentials in your environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Use predefined rate limiters or create custom ones as needed.

## Predefined Rate Limiters

The package includes rate limiters for common authentication flows:

- **verifyEmailRateLimiter**: 3 requests per hour
- **changeEmailRateLimiter**: 2 requests per 24 hours
- **resetPasswordRateLimiter**: 3 requests per hour

## Example

```ts
import { verifyEmailRateLimiter } from '@workspace/rate-limit';

const { success, limit, remaining, reset } = await verifyEmailRateLimiter.limit(userId);

if (!success) {
  throw new Error('Rate limit exceeded');
}
```
