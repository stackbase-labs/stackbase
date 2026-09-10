import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      RESEND_TOKEN: z.string().optional(),
      RESEND_EMAIL_FROM: z.string().email().optional(),
      NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    },
    runtimeEnv: {
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM,
      NODE_ENV: process.env.NODE_ENV,
    },
  });
