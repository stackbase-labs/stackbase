import type { Request } from 'express';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

/**
 * Shared Prometheus Registry
 */
export const register = new Registry();

// Set default labels applied to all metrics in this process
register.setDefaultLabels({
  app: 'stackbase-api',
});

// Enable standard Node.js and system runtime metrics (CPU, Memory, Event Loop, GC)
collectDefaultMetrics({
  register,
  prefix: 'stackbase_',
});

/**
 * Total incoming HTTP requests counter
 * Labeled by HTTP method, matched route pattern, and response status code
 */
export const httpRequestsTotal = new Counter({
  name: 'stackbase_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

/**
 * HTTP request duration histogram in seconds
 * Latency buckets tailored for web services (5ms to 10s)
 */
export const httpRequestDurationSeconds = new Histogram({
  name: 'stackbase_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Current in-flight requests gauge
 */
export const httpRequestsInFlight = new Gauge({
  name: 'stackbase_http_requests_in_flight',
  help: 'Number of HTTP requests currently being handled',
  labelNames: ['method'] as const,
  registers: [register],
});

/**
 * Extracts a normalized route pattern from an Express request
 * to prevent metric cardinality explosion.
 */
export const normalizeRoute = (req: Request): string => {
  // If matched by an Express route handler
  if (req.route?.path) {
    const baseUrl = req.baseUrl || '';
    const routePath =
      typeof req.route.path === 'string' ? req.route.path : req.route.path.toString();
    return `${baseUrl}${routePath}`;
  }

  // Top-level known endpoints
  const path = req.path || req.url || '';
  if (['/', '/health', '/healthz', '/readyz', '/metrics'].includes(path)) {
    return path;
  }

  // Normalize 404s or unmatched routes to avoid unbounded cardinality
  return req.res?.statusCode === 404 ? 'not_found' : 'other';
};
