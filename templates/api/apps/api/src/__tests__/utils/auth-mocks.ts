import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

export const mockRequirePermission = vi.fn(() => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
});

export const mockRequireRole = vi.fn(() => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
});

export const mockRequireAuth = vi.fn((req: Request, _res: Response, next: NextFunction) => {
  Object.assign(req, {
    user: { id: 'test-user-123' },
    session: { id: 'test-session-123' },
  });
  next();
});

export const createAuthMiddlewareMock = () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
  requireRole: mockRequireRole,
});
