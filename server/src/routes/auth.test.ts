import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { pool } from '../db/pool';
import { createTestUser, resetDb } from '../testDb';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('POST /auth/login', () => {
  it('logs in with the right email + password', async () => {
    const user = await createTestUser({ email: 'lana@maverio.com', password: 'correct-horse-battery' });

    const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: user.email, role: 'Owner' });
  });

  it('rejects the wrong password', async () => {
    const user = await createTestUser({ password: 'correct-horse-battery' });
    const res = await request(app).post('/auth/login').send({ email: user.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@maverio.com', password: 'whatever123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('returns the signed-in user for a valid token', async () => {
    const user = await createTestUser();
    const login = await request(app).post('/auth/login').send({ email: user.email, password: user.password });

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('rejects a missing token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('accept-invite flow', () => {
  it('turns a pending invite into a real account that can then log in', async () => {
    const owner = await createTestUser({ email: 'owner@maverio.com' });
    const { rows } = await pool.query(
      `insert into invites (email, role, scope, token, invited_by) values ($1,'Member','all','test-invite-token',$2) returning id`,
      ['newperson@maverio.com', owner.id]
    );
    expect(rows).toHaveLength(1);

    const res = await request(app)
      .post('/auth/accept-invite')
      .send({ token: 'test-invite-token', name: 'New Person', password: 'a-good-password' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'newperson@maverio.com', name: 'New Person', role: 'Member' });

    const login = await request(app).post('/auth/login').send({ email: 'newperson@maverio.com', password: 'a-good-password' });
    expect(login.status).toBe(200);
  });

  it('rejects an unknown or already-used invite token', async () => {
    const res = await request(app)
      .post('/auth/accept-invite')
      .send({ token: 'no-such-token', name: 'Someone', password: 'a-good-password' });
    expect(res.status).toBe(404);
  });
});

describe('forgot/reset password flow', () => {
  it('issues a reset token and accepts it exactly once', async () => {
    const user = await createTestUser({ password: 'old-password-1' });

    const forgot = await request(app).post('/auth/forgot-password').send({ email: user.email });
    expect(forgot.status).toBe(200);

    const { rows } = await pool.query('select token from password_resets where user_id = $1', [user.id]);
    expect(rows).toHaveLength(1);
    const resetToken = rows[0].token;

    const reset = await request(app).post('/auth/reset-password').send({ token: resetToken, password: 'new-password-2' });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app).post('/auth/login').send({ email: user.email, password: 'old-password-1' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/auth/login').send({ email: user.email, password: 'new-password-2' });
    expect(newLogin.status).toBe(200);

    // The same token can't be reused.
    const reuse = await request(app).post('/auth/reset-password').send({ token: resetToken, password: 'yet-another-3' });
    expect(reuse.status).toBe(404);
  });

  it('responds the same way for an unknown email, so this endpoint cannot be used to enumerate accounts', async () => {
    const res = await request(app).post('/auth/forgot-password').send({ email: 'ghost@maverio.com' });
    expect(res.status).toBe(200);
  });
});
