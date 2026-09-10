import pino, { type Logger, type LoggerOptions } from 'pino';

const nodeEnv = process.env.NODE_ENV;
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Sensitive keys stripped from every log object (including the req/res that
// pino-http serializes). Removed entirely rather than masked.
const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.secret',
];

const options: LoggerOptions = {
  // e.g. LOG_LEVEL=warn to quiet a noisy environment.
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  redact: { paths: redactPaths, remove: true },
  // Human-readable output for local dev. Prod and tests emit raw JSON to
  // stdout for the platform to collect.
  ...(isProd || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true,
            // Collapse the verbose request fields to keep the terminal scannable.
            // Dev-only: prod JSON keeps the full req/res for querying.
            ignore: 'pid,hostname,req,res,responseTime,reqId',
          },
        },
      }),
};

// Shared application logger - use this instead of `console`.
// `logger.child({ ... })` attaches persistent context to a scope.
export const logger: Logger = pino(options);

export type { Logger } from 'pino';
