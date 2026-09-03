import { Express } from 'express';
import { Server } from 'http';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAuthMiddlewareMock } from '../utils/auth-mocks';
import { createRateLimitPackageMock } from '../utils/rate-limit-mocks';

vi.mock('@workspace/auth', () => ({
  authClient: {},
  auth: {},
}));

vi.mock('@workspace/rate-limit', () => createRateLimitPackageMock());

vi.mock('../../middleware/auth', () => createAuthMiddlewareMock());

describe('API Server', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    const { createServer } = await import('../../server.js');
    app = createServer();
    server = app.listen(0);
  }, 30_000);

  afterAll(() => {
    server.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await supertest(app).get('/health').expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return a valid ISO timestamp', async () => {
      const response = await supertest(app).get('/health').expect(200);

      expect(() => new Date(response.body.timestamp).toISOString()).not.toThrow();
    });
  });

  describe('GET /metrics', () => {
    it('should return 200 with Prometheus metrics in text format', async () => {
      const response = await supertest(app).get('/metrics').expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('build_elevate_');
      expect(response.text).toContain('build_elevate_http_requests_total');
      expect(response.text).toContain('build_elevate_http_request_duration_seconds');
      expect(response.text).toContain('build_elevate_http_requests_in_flight');
    });

    it('should track requests in http_requests_total metric', async () => {
      // Send a request to an endpoint
      await supertest(app).get('/health').expect(200);

      // Scrape metrics and verify route was recorded
      const metricsResponse = await supertest(app).get('/metrics').expect(200);
      expect(metricsResponse.text).toMatch(
        /build_elevate_http_requests_total\{.*route="\/health".*\}\s+[1-9]\d*/,
      );
    });
  });

  describe('404 handling', () => {
    it.each(['/non-existent-route', '/api/non-existent'])(
      'should return 404 for %s',
      async (path) => {
        const response = await supertest(app).get(path).expect(404);

        expect(response.body).toHaveProperty('error', 'Route not found');
        expect(response.body).toHaveProperty('path', path);
      },
    );
  });

  describe('CORS', () => {
    beforeAll(async () => vi.spyOn(console, 'error').mockImplementation(() => {}));
    afterAll(async () => vi.restoreAllMocks());

    it('should set CORS headers for allowed origin', async () => {
      const response = await supertest(app)
        .get('/health')
        .set('Origin', 'https://example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject disallowed origin with CORS error', async () => {
      const response = await supertest(app).get('/health').set('Origin', 'https://evil.example');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });

    it('should block requests with missing origin by default', async () => {
      const response = await supertest(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });
  });

  describe('Security headers', () => {
    it('should set helmet security headers', async () => {
      const response = await supertest(app).get('/health');

      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
