import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { getRecentErrors } from '../errorLog';
import { asyncHandler } from '../util/asyncHandler';

export const adminRouter = Router();

adminRouter.get(
  '/errors',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'Owner' && req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Only Owners and Admins can view captured errors' });
      return;
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const errors = await getRecentErrors(limit);
    res.json({ errors });
  })
);
