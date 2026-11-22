import { describe, expect, it } from 'vitest';
import { getRedisConnection, keys } from '../index';

describe('Queue Module', () => {
  it('reads default Redis environment keys', () => {
    const env = keys();
    expect(env.REDIS_HOST).toBeDefined();
    expect(env.REDIS_PORT).toBe(6379);
  });

  it('generates connection options from default config', () => {
    const conn = getRedisConnection();
    expect(conn).toHaveProperty('host', '127.0.0.1');
    expect(conn).toHaveProperty('port', 6379);
  });

  it('allows overriding connection options', () => {
    const conn = getRedisConnection({
      host: 'redis.internal',
      port: 6380,
      password: 'secret',
    });
    expect(conn).toHaveProperty('host', 'redis.internal');
    expect(conn).toHaveProperty('port', 6380);
    expect(conn).toHaveProperty('password', 'secret');
  });
});
