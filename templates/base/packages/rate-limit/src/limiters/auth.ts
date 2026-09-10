import { Ratelimit } from '@upstash/ratelimit';
import { createRateLimiter } from '../create';

/**
 * Purpose: Prevent abuse of account creation and signup spam.
 * Scope: Public auth signup endpoint.
 * Applied to: /api/auth/sign-up
 * Policy: 3 requests per 1 hour per IP.
 */
export const signupRateLimiter = createRateLimiter({
  prefix: 'auth:signup',
  limiter: Ratelimit.slidingWindow(3, '1 h'),
});

/**
 * Purpose: Protect against brute-force and credential-stuffing sign-in attempts.
 * Scope: Public auth sign-in endpoints.
 * Applied to: /api/auth/sign-in/*
 * Policy: 3 requests per 15 minutes per IP.
 */
export const signinRateLimiter = createRateLimiter({
  prefix: 'auth:signin',
  limiter: Ratelimit.slidingWindow(3, '15 m'),
});

/**
 * Purpose: Reduce password-reset abuse, email spam, and takeover attempts.
 * Scope: Password reset request and reset flow endpoints.
 * Applied to: /api/auth/reset-password, /api/auth/request-password-reset
 * Policy: 3 requests per 1 hour per user.
 */
export const resetPasswordRateLimiter = createRateLimiter({
  prefix: 'auth:reset-password',
  limiter: Ratelimit.slidingWindow(3, '1 h'),
});
