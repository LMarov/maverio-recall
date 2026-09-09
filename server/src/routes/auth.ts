import { Router } from 'express';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const { rows } = await pool.query('select * from users where email = $1', [body.email.toLowerCase()]);
    const row = rows[0];
    if (!row || !(await verifyPassword(body.password, row.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const user = { id: row.id, email: row.email, name: row.name, role: row.role, scope: row.scope };
    const token = signToken(user);
    await audit(user.id, 'login');
    res.json({ token, user });
  })
);

const acceptInviteSchema = z.object({ token: z.string().min(1), name: z.string().min(1), password: z.string().min(8) });

authRouter.post(
  '/accept-invite',
  asyncHandler(async (req, res) => {
    const body = acceptInviteSchema.parse(req.body);
    const { rows } = await pool.query('select * from invites where token = $1 and accepted_at is null', [body.token]);
    const invite = rows[0];
    if (!invite) {
      res.status(404).json({ error: 'Invite not found or already used' });
      return;
    }
    const existing = await pool.query('select 1 from users where email = $1', [invite.email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account already exists for this email' });
      return;
    }

    const passwordHash = await hashPassword(body.password);
    const client = await pool.connect();
    let user: { id: string; email: string; name: string; role: string; scope: string };
    try {
      await client.query('begin');
      const inserted = await client.query(
        'insert into users (email, name, password_hash, role, scope) values ($1,$2,$3,$4,$5) returning id, email, name, role, scope',
        [invite.email, body.name, passwordHash, invite.role, invite.scope]
      );
      user = inserted.rows[0];
      await client.query('update invites set accepted_at = now() where id = $1', [invite.id]);
      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }

    const token = signToken(user as any);
    await audit(user.id, 'accept_invite');
    broadcast({ type: 'team.joined', email: user.email });
    res.json({ token, user });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);
