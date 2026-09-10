import { fromNodeHeaders } from '@workspace/auth/node-handlers';
import { auth } from '@workspace/auth/server';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to get the session from Better Auth and attach it to the request object.
 * This middleware extracts the session from cookies/headers and makes it available
 * on req.session and req.user for subsequent middleware and route handlers.
 */
export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Use Better Auth's fromNodeHeaders helper to convert Node.js headers
    // to the Headers object format expected by Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // Attach session and user to request object
    req.session = session;
    req.user = session?.user || null;

    next();
  } catch (error) {
    req.log.error({ err: error }, 'Error getting session');
    req.session = null;
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication.
 * Returns 401 if no valid session is found.
 * Use this middleware on routes that require authentication.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // First get the session if not already attached
  if (req.session === undefined) {
    await getSession(req, res, () => {});
  }

  if (!req.session || !req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  next();
};
