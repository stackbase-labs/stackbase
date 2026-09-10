import { auth } from '@workspace/auth/server';
import { NextRequest, NextResponse } from 'next/server';

// Auth pages — redirect logged-in users away
const AUTH_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/two-factor',
  '/forgot-password',
  '/reset-password',
  '/goodbye',
];

// Routes accessible to everyone
const PUBLIC_ROUTES = [...AUTH_ROUTES, '/error'];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const session = await auth.api.getSession({ headers: req.headers });
  const isLoggedIn = !!session?.user;

  const { pathname, search } = req.nextUrl;

  const isPublicRoute =
    pathname === '/' || PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public|api).*)'],
};
