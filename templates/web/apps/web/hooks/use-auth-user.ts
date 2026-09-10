import { useSession } from '@workspace/auth/client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

type AuthUser = NonNullable<ReturnType<typeof useSession>['data']>['user'];

interface UseAuthUserOptions {
  redirectOnUnauthenticated?: boolean;
  redirectTo?: string;
}

interface UseAuthUserReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: ReturnType<typeof useSession>['error'];
  refetch: ReturnType<typeof useSession>['refetch'];
}

interface UseRequiredAuthUserReturn {
  user: AuthUser;
  isLoading: false;
  error: ReturnType<typeof useSession>['error'];
  refetch: ReturnType<typeof useSession>['refetch'];
}

interface UseRequiredAuthUserLoadingReturn {
  user: null;
  isLoading: true;
  error: ReturnType<typeof useSession>['error'];
  refetch: ReturnType<typeof useSession>['refetch'];
}

/**
 * Hook for handling authentication state with optional auto-redirect functionality.
 *
 * @param options - Configuration options
 * @param options.redirectOnUnauthenticated - Whether to redirect when user is not authenticated
 * @param options.redirectTo - Custom redirect path (defaults to '/sign-in')
 * @returns Authentication state and user data
 */
export function useAuthUser(options?: UseAuthUserOptions): UseAuthUserReturn {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const shouldRedirect = options?.redirectOnUnauthenticated ?? false;
  const redirectTo = options?.redirectTo ?? '/sign-in';

  // Only redirect if explicitly enabled and not on auth pages
  useEffect(() => {
    if (!shouldRedirect) return;
    if (session.isPending) return;
    if (session.data?.user) return;

    // Avoid redirect loop by not redirecting if already on sign-in or sign-up page
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return;
    }

    router.replace(redirectTo);
  }, [shouldRedirect, session.isPending, session.data?.user, router, pathname, redirectTo]);

  useEffect(() => {
    if (!session.data?.user) return;

    let interval: NodeJS.Timeout;

    const ping = () => {
      fetch('/api/session/ping', { method: 'POST' })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Session ping failed');
          }
        })
        .catch(() => {});
    };

    const startInterval = () => {
      interval = setInterval(ping, 5 * 60 * 1000);
    };

    const stopInterval = () => {
      if (interval) clearInterval(interval);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping(); // refresh immediately
        startInterval();
      } else {
        stopInterval();
      }
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session.data?.user]);

  return {
    user: session.data?.user || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error,
    refetch: session.refetch,
  };
}

/**
 * Hook that guarantees an authenticated user is present.
 * Automatically redirects to sign-in if not authenticated.
 * Should only be used in components that require authentication.
 *
 * @returns Either user data when authenticated or loading state during auth check/redirect
 */
export function useRequiredAuthUser():
  | UseRequiredAuthUserReturn
  | UseRequiredAuthUserLoadingReturn {
  const { user, isLoading, isAuthenticated, error, refetch } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  if (isLoading || !isAuthenticated || !user) {
    return {
      user: null,
      isLoading: true,
      error,
      refetch,
    };
  }

  // This hook guarantees user is not null when not loading
  return {
    user,
    isLoading: false,
    error,
    refetch,
  };
}
