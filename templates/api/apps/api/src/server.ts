import { logger } from '@workspace/logger';
import { formatDuration } from '@workspace/utils/helpers';
import cors from 'cors';
import express, { type Express, type Request, json, urlencoded } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import corsOptions from './config/corsOptions';
import { register } from './metrics';
import credentials from './middleware/credentials';
import { errorHandler } from './middleware/error';
import { metricsMiddleware } from './middleware/metrics';
import routes from './routes';

const isProd = process.env.NODE_ENV === 'production';

// Liveness/readiness probes and metrics scraping are hit constantly (K8s/Prometheus) and add only noise.
const IGNORED_LOG_ROUTES = new Set(['/', '/health', '/healthz', '/readyz', '/metrics']);

export const createServer = (): Express => {
  const app = express();

  // In production the app sits behind the K8s ingress / a reverse proxy, so
  // trust X-Forwarded-* to recover the real client IP (req.ip) for logs and
  // rate limiting. `1` = one proxy hop; raise it to match your proxy chain.
  if (isProd) {
    app.set('trust proxy', 1);
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
    }),
  );

  // Request logging via pino-http: one line per request, and a per-request
  // child logger on `req.log` (carries the request id) for handlers to use.
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => IGNORED_LOG_ROUTES.has(req.url ?? ''),
      },
      customSuccessMessage: (req, res, responseTime) =>
        `${req.method} ${req.url} ${res.statusCode} (${Math.round(responseTime)}ms)`,
      customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
      // Add the real client IP (req.ip, resolved via trust proxy) and the
      // authenticated user to each request log. Other access-log fields (status,
      // size, referrer, user-agent) already live in the serialized req/res.
      customProps: (req) => {
        const { ip, user } = req as Request;
        return { ip, userId: user?.id };
      },
    }),
  );

  // Prometheus HTTP RED metrics collection
  app.use(metricsMiddleware);

  // Body parsing
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Apply credentials middleware before CORS middleware
  app.use(credentials);

  // CORS
  app.use(cors(corsOptions));

  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to the Build Elevate API!',
      service: 'build-elevate-api',
      pod: process.env.POD_NAME || 'unknown',
      time: new Date().toISOString(),
    });
  });

  app.get('/readyz', (req, res) => {
    res.status(200).send('ready');
  });

  app.get('/healthz', (req, res) => {
    res.status(200).send('ok');
  });

  // Prometheus metrics scraping endpoint
  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  // Health check route
  app.get('/health', (_, res) => {
    const uptimeInSeconds = process.uptime();
    const uptime = formatDuration({ seconds: Math.floor(uptimeInSeconds) });
    const timestamp = new Date().toISOString();

    res.status(200).json({
      ok: true,
      uptime,
      timestamp,
    });
  });

  // API Routes
  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
