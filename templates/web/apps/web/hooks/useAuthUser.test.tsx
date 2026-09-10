import { useAuthUser, useRequiredAuthUser } from '@/hooks/use-auth-user';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
const useSessionMock = vi.fn();
const refetchMock = vi.fn();

vi.mock('@workspace/auth/client', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/dashboard',
}));

describe('useAuthUser', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: refetchMock,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('returns normalized auth state', () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: '1', name: 'Vijay', email: 'vijay@example.com' } },
      isPending: false,
      error: null,
      refetch: refetchMock,
    });

    const { result } = renderHook(() => useAuthUser());

    expect(result.current.user?.email).toBe('vijay@example.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('redirects unauthenticated users when enabled', async () => {
    renderHook(() => useAuthUser({ redirectOnUnauthenticated: true, redirectTo: '/sign-in' }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('does not redirect while loading', () => {
    useSessionMock.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      refetch: refetchMock,
    });

    renderHook(() => useAuthUser({ redirectOnUnauthenticated: true }));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('pings session on visibility and interval for authenticated users', async () => {
    vi.useFakeTimers();
    useSessionMock.mockReturnValue({
      data: { user: { id: '1' } },
      isPending: false,
      error: null,
      refetch: refetchMock,
    });

    renderHook(() => useAuthUser());
    expect(fetch).toHaveBeenCalledWith('/api/session/ping', { method: 'POST' });

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('useRequiredAuthUser returns loading shape when unauthenticated', () => {
    const { result } = renderHook(() => useRequiredAuthUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });
});
