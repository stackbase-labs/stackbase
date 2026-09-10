import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function requireAuth(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    error: null,
    session,
  };
}

/**
 * Server Component guard. Loads the current session and redirects to sign-in
 * when unauthenticated. Returns the session with `user` and `session` narrowed
 * to non-null. `proxy.ts` remains the front-line gate; this provides the typed
 * session data to pages and defense-in-depth.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  return session;
}
