import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { asyncHandler } from '../util/asyncHandler';

export const auditRouter = Router();

auditRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'Owner' && req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Only Owners and Admins can view the audit log' });
      return;
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    const rows = await pool.query(
      `select a.id, a.action, a.target_type, a.target_id, a.meta, a.created_at,
              u.email as user_email, u.name as user_name
       from audit_log a
       left join users u on u.id = a.user_id
       where ($1::timestamptz is null or a.created_at < $1)
       order by a.created_at desc
       limit $2`,
      [before, limit]
    );
    res.json({ entries: rows.rows });
  })
);
