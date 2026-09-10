import { createRateLimiter, slidingWindow, type Ratelimit } from '@workspace/rate-limit';
import type { NextFunction, Request, Response } from 'express';

/**
 * Rate Limiters
 * Define different rate limiters for different API endpoints
 */

// Global API rate limiter: 100 requests per minute (lenient, prevents abuse)
const globalApiLimiter = createRateLimiter({
  prefix: 'api-global',
  limiter: slidingWindow(100, '1 m'),
});

// User endpoints rate limiter: 60 requests per minute
const userApiLimiter = createRateLimiter({
  prefix: 'api-user',
  limiter: slidingWindow(60, '1 m'),
});

/**
 * Generic rate limit middleware factory
 * Creates a middleware that uses a specific rate limiter
 *
 * @param limiter - The rate limiter instance
 * @param getIdentifier - Optional function to extract the identifier from the request
 */
const createRateLimitMiddleware = (
  limiter: Ratelimit,
  getIdentifier?: (req: Request) => string,
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getIdentifier ? getIdentifier(req) : req.ip || 'anonymous';
      const { success, limit, remaining, reset } = await limiter.limit(id);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', reset.toString());

      if (!success) {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      req.log.error({ err: error }, 'Rate limit middleware error');
      // Fail open - allow request to proceed if rate limiting fails
      next();
    }
  };
};

/**
 * Exported middleware functions
 */

// Global rate limiter - use this on all routes (by IP)
export const globalRateLimit = createRateLimitMiddleware(
  globalApiLimiter,
  (req) => req.ip || 'anonymous',
);

// User-specific rate limiter (by user ID)
export const userRateLimit = createRateLimitMiddleware(
  userApiLimiter,
  (req) => req.user?.id || req.ip || 'anonymous',
);
