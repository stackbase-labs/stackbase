# @workspace/auth

This package provides authentication features for the monorepo, including:

- Email and password authentication
- Google OAuth integration
- Two-factor authentication (2FA)
- Email verification and password reset flows
- Session management powered by [Better Auth](https://www.better-auth.com/)

## Usage

Import and use authentication utilities in your apps:

```ts
// Client-side (React components)
import { signIn, signOut, useSession } from '@workspace/auth';

// Server-side (API routes, server components)
import { auth } from '@workspace/auth/server';
```

## Features

- **Email/Password Auth**: Secure credential-based authentication with email verification
- **OAuth Providers**: Google sign-in integration
- **Two-Factor Auth**: Additional security layer with TOTP support
- **Rate Limiting**: Built-in protection against abuse
- **Email Integration**: Automated verification and password reset emails
- **Type-Safe**: Full TypeScript support with Better Auth

## Setup

1. Configure required environment variables:
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
   - `NEXT_PUBLIC_BASE_URL`: Your application's base URL
   - `DATABASE_URL`: PostgreSQL connection string (from @workspace/db)
   - Email configuration (from @workspace/email)

2. The auth package automatically integrates with:
   - `@workspace/db` for database storage
   - `@workspace/email` for sending verification emails
   - `@workspace/rate-limit` for request rate limiting

## Client-Side API

```ts
import { signIn, signOut, signUp, useSession, twoFactor } from '@workspace/auth';

// Sign in
await signIn.email({ email, password });
await signIn.social({ provider: 'google' });

// Get session in React components
const { data: session } = useSession();

// Sign out
await signOut();
```

## Server-Side API

```ts
import { auth } from '@workspace/auth/server';

// Get session in API routes or server components
const session = await auth.api.getSession({ headers: request.headers });

// Protect API routes
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```
