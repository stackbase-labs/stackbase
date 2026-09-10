import { Router } from 'express';
import { globalRateLimit } from '../middleware/rate-limit';
import storageRoutes from './storage.routes';
import userRoutes from './user.routes';

/**
 * Main API Router
 * All routes defined here are prefixed with /api
 */
const router: Router = Router();

/**
 * Apply global rate limiting to all API routes
 * This prevents abuse and ensures fair usage across all endpoints
 */
router.use(globalRateLimit);

/**
 * User Routes
 * Mounted at: /api/users
 * Handles all user-related endpoints
 */
router.use('/users', userRoutes);

/**
 * Storage Routes
 * Mounted at: /api/storage
 * Handles presigned URL generation and file management
 */
router.use('/storage', storageRoutes);

export default router;
