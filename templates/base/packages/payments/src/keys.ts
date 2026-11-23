import { createEnv } from '@t3-oss/env-nextjs';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const keys = () =>
  createEnv({
    server: {
      STRIPE_SECRET_KEY: z.string().optional(),
      STRIPE_WEBHOOK_SECRET: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  });
