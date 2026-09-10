import express, { type Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Get current authenticated user session
 *
 * Security layers:
 * 1. Global rate limit (100 req/min by IP) - Applied at /api level
 * 2. Authentication check - Validates session
 *
 * Note: Rate limiting is applied at the /api level BEFORE this route,
 * which protects against brute force and DoS attacks on auth endpoints.
 */
router.get('/session', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    session: req.session,
  });
});

export default router;
