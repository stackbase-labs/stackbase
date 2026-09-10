import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const redirectMock = vi.fn((url: URL) => ({ type: 'redirect', url: url.toString() }));
const nextMock = vi.fn(() => ({ type: 'next' }));

vi.mock('@workspace/auth/server', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => redirectMock(url),
    next: () => nextMock(),
  },
}));

interface MockNextRequest {
  nextUrl: URL;
  headers: Headers;
}

function makeRequest(url: string): MockNextRequest {
  return {
    nextUrl: new URL(url),
    headers: new Headers(),
  };
}

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users from protected routes', async () => {
    getSessionMock.mockResolvedValue(null);

    await proxy(makeRequest('https://example.com/dashboard?tab=activity') as NextRequest);

    expect(redirectMock).toHaveBeenCalledTimes(1);
    const redirectedTo = redirectMock.mock.calls[0]![0]!.toString();
    expect(redirectedTo).toContain('/sign-in?callbackUrl=%2Fdashboard%3Ftab%3Dactivity');
  });

  it('redirects authenticated users away from auth routes', async () => {
    getSessionMock.mockResolvedValue({ user: { id: '1' } });

    await proxy(makeRequest('https://example.com/sign-in') as NextRequest);

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock.mock.calls[0]![0]!.toString()).toBe('https://example.com/');
  });

  it('allows public routes for unauthenticated users', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await proxy(makeRequest('https://example.com/sign-up') as NextRequest);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ type: 'next' });
  });
});
