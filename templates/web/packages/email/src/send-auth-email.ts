import React from 'react';
import { emailTemplates } from './constants';
import { sendEmail } from './send-email';
import type { EmailPropsMap, EmailType } from './types';

interface RateLimiter {
  limit(email: string): Promise<{ success: boolean }>;
}

/**
 * Consolidated helper for sending auth-related emails.
 * Handles rate limiting, template lookup, and sending in one call.
 */
export async function sendAuthEmail<T extends EmailType>({
  emailType,
  limiter,
  user,
  data,
}: {
  emailType: T;
  limiter: RateLimiter;
  user: { email: string; name: string };
  data: EmailPropsMap[T];
}) {
  const { success: rateLimitSuccess } = await limiter.limit(user.email);
  if (!rateLimitSuccess) {
    console.log('Rate limit exceeded. Please try again later.');
    return;
  }

  // Type-safe template dispatch with proper type mapping
  let subject = '';
  let react: React.ReactNode;

  if (emailType === 'welcome') {
    subject = emailTemplates.welcome.subject;
    react = emailTemplates.welcome.render(data as EmailPropsMap['welcome']);
  } else if (emailType === 'verify-email') {
    subject = emailTemplates['verify-email'].subject;
    react = emailTemplates['verify-email'].render(data as EmailPropsMap['verify-email']);
  } else if (emailType === 'change-email') {
    subject = emailTemplates['change-email'].subject;
    react = emailTemplates['change-email'].render(data as EmailPropsMap['change-email']);
  } else if (emailType === 'reset-password') {
    subject = emailTemplates['reset-password'].subject;
    react = emailTemplates['reset-password'].render(data as EmailPropsMap['reset-password']);
  }

  await sendEmail({
    to: user.email,
    subject,
    react,
  });
}
