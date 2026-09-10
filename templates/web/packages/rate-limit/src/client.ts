import { Redis } from '@upstash/redis';
import { keys } from './keys';

const env = keys();

// Initialize Redis client
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
