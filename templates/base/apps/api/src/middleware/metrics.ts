import type { NextFunction, Request, Response } from 'express';
import {
  httpRequestDurationSeconds,
  httpRequestsInFlight,
  httpRequestsTotal,
  normalizeRoute,
} from '../metrics';

// Probe and scraper routes to exclude from application RED metrics
const EXCLUDED_PATHS = new Set(['/metrics', '/healthz', '/readyz']);

/**
 * Express middleware to collect RED (Rate, Errors, Duration) metrics
 * for HTTP requests.
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.path || req.url || '';

  // Avoid polluting application performance metrics with probe/scraper traffic
  if (EXCLUDED_PATHS.has(path)) {
    next();
    return;
  }

  const method = req.method;
  const start = process.hrtime.bigint();

  httpRequestsInFlight.inc({ method });

  res.once('finish', () => {
    httpRequestsInFlight.dec({ method });

    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1e9;
    const route = normalizeRoute(req);
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      durationSeconds,
    );
  });

  next();
};
