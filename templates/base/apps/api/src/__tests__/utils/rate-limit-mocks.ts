import { vi } from 'vitest';

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const defaultRateLimitResult = (): RateLimitResult => ({
  success: true,
  limit: 100,
  remaining: 99,
  reset: Date.now() + 60000,
});

export const createRateLimitPackageMock = (
  limit: unknown = vi.fn(() => Promise.resolve(defaultRateLimitResult())),
) => ({
  createRateLimiter: vi.fn(() => ({
    limit: limit as (...args: unknown[]) => Promise<RateLimitResult>,
  })),
  slidingWindow: vi.fn((requests: number, window: string) => ({
    requests,
    window,
  })),
});
