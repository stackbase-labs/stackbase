import { Ratelimit } from '@upstash/ratelimit';
import { createRateLimiter } from '../create';

/**
 * Purpose: Prevent abuse of transactional email sending and protect deliverability.
 * Scope: Transactional email send operations.
 * Applied to: Notification, confirmation, and alert email endpoints.
 * Policy: 10 requests per 1 hour per user.
 */
export const sendEmailRateLimiter = createRateLimiter({
  prefix: 'email:send',
  limiter: Ratelimit.slidingWindow(10, '1 h'),
});

/**
 * Purpose: Reduce email verification abuse and account enumeration attempts.
 * Scope: Auth email verification flow.
 * Applied to: POST /api/auth/send-verification-email
 * Policy: 3 requests per 1 hour per user.
 */
export const verifyEmailRateLimiter = createRateLimiter({
  prefix: 'auth:verify-email',
  limiter: Ratelimit.slidingWindow(3, '1 h'),
});

/**
 * Purpose: Prevent change-email spam and account takeover abuse.
 * Scope: Email address change flow.
 * Applied to: Change email endpoint and related email update operations.
 * Policy: 2 requests per 24 hours per user.
 */
export const changeEmailRateLimiter = createRateLimiter({
  prefix: 'auth:change-email',
  limiter: Ratelimit.slidingWindow(2, '24 h'),
});

/**
 * Purpose: Prevent welcome-email abuse and preserve sender reputation.
 * Scope: Welcome email dispatch during onboarding.
 * Applied to: Account creation flow and welcome email endpoint.
 * Policy: 5 requests per 1 hour per user.
 */
export const welcomeEmailRateLimiter = createRateLimiter({
  prefix: 'email:welcome',
  limiter: Ratelimit.slidingWindow(5, '1 h'),
});
