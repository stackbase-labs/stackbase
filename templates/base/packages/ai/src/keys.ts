import { createEnv } from '@t3-oss/env-nextjs';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const keys = () =>
  createEnv({
    server: {
      AI_DEFAULT_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
      OPENAI_API_KEY: z.string().optional(),
      OPENAI_MODEL: z.string().default('gpt-6-luna'),
      ANTHROPIC_API_KEY: z.string().optional(),
      ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
    },
    runtimeEnv: {
      AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    },
  });
