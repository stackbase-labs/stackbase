import { NextFunction, Request, Response } from 'express';
import allowedOrigins from '../config/allowedOrigins';

/**
 * Middleware to handle credentials based on the allowed origins.
 */
const credentials = (req: Request, res: Response, next: NextFunction): void => {
  // Extract the origin from the request headers
  const origin = req.headers.origin as string;

  // Check if the request origin is in the allowedOrigins array
  if (allowedOrigins.includes(origin)) {
    // Set the 'Access-Control-Allow-Credentials' header to 'true'
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  // Continue to the next middleware or route handler
  next();
};

export default credentials;
