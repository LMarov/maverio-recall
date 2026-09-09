import crypto from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { env } from '../env';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';
import { email as emailAdapter } from '../email';
import { rateLimit } from '../util/rateLimit';

export const teamRouter = Router();

const inviteLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: 'team-invite' });

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
  inviteLimit,
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

    emailAdapter
      .send({
        to: email,
        subject: `${req.user!.name} invited you to Maverio Recall`,
        text:
          `${req.user!.name} has invited you to join the Maverio Recall workspace.\n\n` +
          `Open the app, choose "Join the workspace", and enter this invite code:\n\n` +
          `${token}\n\n` +
          `(${env.appUrl})`
      })
      .catch((err) => console.error('Failed to send invite email:', err));

    // Also hand back the token directly — useful in dev (console email driver)
    // and as a fallback the inviter can relay manually if delivery fails.
    res.json({ email, joinToken: token });
  })
);
