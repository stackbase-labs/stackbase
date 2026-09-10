import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const isProd = process.env.NODE_ENV === 'production';

  // `req.log` is the per-request child logger attached by pino-http; it carries
  // the request id and method/url so the error line is correlated to its request.
  req.log.error({ err }, 'Unhandled request error');

  if (isProd) {
    res.status(500).json({
      error: 'Internal Server Error',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    name: err.name,
    message: err.message,
  });
};
