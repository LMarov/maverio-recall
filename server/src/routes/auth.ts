import crypto from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';
import { email as emailAdapter } from '../email';
import { rateLimit } from '../util/rateLimit';

export const authRouter = Router();

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'login' });
const acceptInviteLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'accept-invite' });
const forgotPasswordLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'forgot-password' });
const resetPasswordLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'reset-password' });

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post(
  '/login',
  loginLimit,
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
  acceptInviteLimit,
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

const forgotPasswordSchema = z.object({ email: z.string().email() });

authRouter.post(
  '/forgot-password',
  forgotPasswordLimit,
  asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const email = body.email.trim().toLowerCase();
    const { rows } = await pool.query('select id, name from users where email = $1', [email]);
    const user = rows[0];

    // Always respond the same way whether or not the account exists, so this
    // endpoint can't be used to find out who has a Recall account.
    if (user) {
      const token = crypto.randomBytes(24).toString('hex');
      await pool.query("insert into password_resets (user_id, token, expires_at) values ($1,$2, now() + interval '1 hour')", [user.id, token]);
      emailAdapter
        .send({
          to: email,
          subject: 'Reset your Maverio Recall password',
          text:
            `Hi ${user.name},\n\n` +
            'Click to open the app and set a new password (or open it yourself and enter the code below). ' +
            "It expires in 1 hour and can only be used once:\n\n" +
            `maveriorecall://reset/${token}\n\n` +
            `Reset code: ${token}\n\n` +
            "If you didn't ask for this, ignore this email — your password hasn't changed."
        })
        .catch((err) => console.error('Failed to send password reset email:', err));
    }

    res.json({ ok: true });
  })
);

const resetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

authRouter.post(
  '/reset-password',
  resetPasswordLimit,
  asyncHandler(async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    const { rows } = await pool.query('select * from password_resets where token = $1 and used_at is null and expires_at > now()', [body.token]);
    const reset = rows[0];
    if (!reset) {
      res.status(404).json({ error: 'That reset code is invalid or has expired. Request a new one.' });
      return;
    }

    const passwordHash = await hashPassword(body.password);
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('update users set password_hash = $2 where id = $1', [reset.user_id, passwordHash]);
      await client.query('update password_resets set used_at = now() where id = $1', [reset.id]);
      await client.query('commit');
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }

    await audit(reset.user_id, 'reset_password');
    res.json({ ok: true });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);
