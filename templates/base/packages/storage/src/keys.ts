import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      S3_BUCKET: z.string().optional(),
      S3_REGION: z.string().default('us-east-1'),
      S3_ACCESS_KEY_ID: z.string().optional(),
      S3_SECRET_ACCESS_KEY: z.string().optional(),
      S3_ENDPOINT: z.string().optional(),
      S3_PUBLIC_URL: z.string().optional(),
      S3_FORCE_PATH_STYLE: z
        .string()
        .transform((val) => val === 'true' || val === '1')
        .optional(),
    },
    runtimeEnv: {
      S3_BUCKET: process.env.S3_BUCKET,
      S3_REGION: process.env.S3_REGION,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
      S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    },
  });
