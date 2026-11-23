import { createEnv } from '@t3-oss/env-nextjs';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const isConfiguredPostHogKey = (apiKey?: string): apiKey is string => {
  if (!apiKey) return false;
  const trimmed = apiKey.trim();
  return trimmed.length > 0 && !trimmed.startsWith('your-posthog-');
};

export const keys = () =>
  createEnv({
    server: {
      POSTHOG_API_KEY: z.string().optional(),
      POSTHOG_HOST: z.url().default('https://us.i.posthog.com'),
    },
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
      NEXT_PUBLIC_POSTHOG_HOST: z.url().default('https://us.i.posthog.com'),
    },
    runtimeEnv: {
      POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
      POSTHOG_HOST: process.env.POSTHOG_HOST,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    },
  });
