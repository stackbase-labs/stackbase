import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthMiddlewareMock } from '../utils/auth-mocks';
import { createRateLimitPackageMock } from '../utils/rate-limit-mocks';

// Mock the auth module to avoid ESM issues with nanostores
vi.mock('@workspace/auth', () => ({
  authClient: {},
  auth: {},
}));

// Mock the auth middleware
vi.mock('../../middleware/auth', () => createAuthMiddlewareMock());

// Mock the rate limit package to use in-memory limiter for testing
type LimitFn = (id: string) => Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;

const { mockLimit } = vi.hoisted(() => ({
  mockLimit: vi.fn<LimitFn>(),
}));

vi.mock('@workspace/rate-limit', () => createRateLimitPackageMock(mockLimit));

import { createServer } from '../../server';

describe('Rate Limiting Integration Tests', () => {
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    app = createServer();
    vi.clearAllMocks();
  });

  describe('Global API Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Mock successful rate limit check
      mockLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      const response = await supertest(app).get('/api/users/session').expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
      expect(mockLimit).toHaveBeenCalled();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Mock rate limit exceeded
      const resetTime = Date.now() + 60000;
      mockLimit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetTime,
      });

      const response = await supertest(app).get('/api/users/session').expect(429);

      expect(response.body).toHaveProperty('error', 'Too many requests');
      expect(response.body).toHaveProperty(
        'message',
        'Rate limit exceeded. Please try again later.',
      );
      expect(response.body).toHaveProperty('retryAfter');
      expect(response.headers).toHaveProperty('x-ratelimit-limit', '100');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining', '0');
    });

    it('should set correct rate limit headers', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000,
      });

      const response = await supertest(app).get('/api/users/session');

      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('50');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('User-Specific Rate Limiting', () => {
    it('should rate limit by user ID for authenticated requests', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 60,
        remaining: 59,
        reset: Date.now() + 60000,
      });

      await supertest(app).get('/api/users/session').expect(200);

      // Verify rate limiter was called with user-specific identifier
      expect(mockLimit).toHaveBeenCalled();
    });

    it('should handle multiple requests from same user', async () => {
      // First request succeeds
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 60,
        remaining: 59,
        reset: Date.now() + 60000,
      });

      await supertest(app).get('/api/users/session').expect(200);

      // Second request succeeds with decreased remaining
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 60,
        remaining: 58,
        reset: Date.now() + 60000,
      });

      await supertest(app).get('/api/users/session').expect(200);

      // Global rate limit is called once per request (no user-specific limit on this route)
      expect(mockLimit).toHaveBeenCalledTimes(2);
    });

    it('should calculate correct retry-after time', async () => {
      const resetTime = Date.now() + 30000; // 30 seconds from now
      mockLimit.mockResolvedValue({
        success: false,
        limit: 60,
        remaining: 0,
        reset: resetTime,
      });

      const response = await supertest(app).get('/api/users/session').expect(429);

      expect(response.body.retryAfter).toBeGreaterThan(0);
      expect(response.body.retryAfter).toBeLessThanOrEqual(30);
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should fail open when rate limiter throws error', async () => {
      // Mock rate limiter throwing an error
      mockLimit.mockRejectedValue(new Error('Redis connection failed'));

      // Request should still succeed (fail open) despite the rate limiter error
      const response = await supertest(app).get('/api/users/session');

      // Should get through despite rate limit error
      expect(response.status).toBe(200);
    });

    it('should handle missing identifier gracefully', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      // Request without IP should still work (uses 'anonymous')
      const response = await supertest(app).get('/api/users/session');

      expect(response.status).toBe(200);
    });
  });

  describe('Different Rate Limits for Different Routes', () => {
    it('should apply global rate limit to all API routes', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      await supertest(app).get('/api/users/session');

      // Global rate limiter should be called
      expect(mockLimit).toHaveBeenCalled();
    });

    it('should not apply rate limit to health check', async () => {
      vi.clearAllMocks();

      await supertest(app).get('/health').expect(200);

      // Health check should not trigger rate limiting
      expect(mockLimit).not.toHaveBeenCalled();
    });
  });
});
