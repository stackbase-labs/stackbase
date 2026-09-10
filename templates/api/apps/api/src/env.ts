import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  const localEnv = path.resolve(__dirname, '../.env.local');
  dotenv.config({ path: existsSync(localEnv) ? localEnv : path.resolve(__dirname, '../.env') });
}
