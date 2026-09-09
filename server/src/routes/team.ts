import crypto from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { env } from '../env';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';

export const teamRouter = Router();

teamRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await pool.query('select email, name, role, scope, created_at from users order by created_at asc');
    const invites = await pool.query('select email, role, scope, created_at from invites where accepted_at is null order by created_at asc');
    res.json({
      members: [
        ...users.rows.map((u) => ({ ...u, status: 'active' as const })),
        ...invites.rows.map((i) => ({ ...i, name: null, status: 'pending' as const }))
      ]
    });
  })
);

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['Owner', 'Admin', 'Member']),
  scope: z.enum(['all', 'attended'])
});

teamRouter.post(
  '/invite',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'Owner' && req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Only the owner and admins can invite. Ask an owner to add a seat.' });
      return;
    }
    const body = inviteSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    if (!email.endsWith('@' + env.allowedEmailDomain)) {
      res.status(422).json({ error: `Outside addresses cannot be invited — the library is company-only (@${env.allowedEmailDomain}).` });
      return;
    }
    const existingUser = await pool.query('select 1 from users where email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'That person already has an account' });
      return;
    }
    const existingInvite = await pool.query('select 1 from invites where email = $1 and accepted_at is null', [email]);
    if (existingInvite.rows.length > 0) {
      res.status(409).json({ error: 'That person already has a pending invite' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('insert into invites (email, role, scope, token, invited_by) values ($1,$2,$3,$4,$5)', [
      email,
      body.role,
      body.scope,
      token,
      req.user!.id
    ]);
    await audit(req.user!.id, 'invite', 'user', email);
    broadcast({ type: 'team.invited', email });
    // No email provider wired up yet — hand back the join link for the inviter to share directly.
    res.json({ email, joinToken: token });
  })
);
