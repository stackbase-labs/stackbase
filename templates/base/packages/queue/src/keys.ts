import { createEnv } from '@t3-oss/env-nextjs';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const keys = () =>
  createEnv({
    server: {
      REDIS_URL: z.string().optional(),
      REDIS_HOST: z.string().default('127.0.0.1'),
      REDIS_PORT: z.coerce.number().default(6379),
      REDIS_PASSWORD: z.string().optional(),
    },
    runtimeEnv: {
      REDIS_URL: process.env.REDIS_URL,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    },
  });
