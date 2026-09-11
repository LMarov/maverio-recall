import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { createTestUser, resetDb } from './testDb';

const app = createApp();

async function authedRequest(overrides?: Parameters<typeof createTestUser>[0]) {
  const user = await createTestUser(overrides);
  const login = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  return { user, token: login.body.token as string };
}

beforeEach(async () => {
  await resetDb();
});

describe('GET /health/ready', () => {
  it('reports ok when the database is reachable', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('GET /metrics', () => {
  it('exposes prometheus-format metrics including our custom counters', async () => {
    await request(app).get('/health'); // generate at least one recorded request first
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });

  it('requires the bearer token when METRICS_TOKEN is set', async () => {
    // env.ts reads process.env once at import time (matches how the rest of
    // the app treats config as fixed for the process's lifetime), so
    // exercising the token-gated branch needs a fresh module graph rather
    // than mutating process.env under the already-imported `app`/`env`.
    process.env.METRICS_TOKEN = 'secret-token';
    vi.resetModules();
    try {
      const { createApp: createGatedApp } = await import('./app');
      const protectedApp = createGatedApp();

      const unauthed = await request(protectedApp).get('/metrics');
      expect(unauthed.status).toBe(401);

      const authed = await request(protectedApp).get('/metrics').set('Authorization', 'Bearer secret-token');
      expect(authed.status).toBe(200);
    } finally {
      delete process.env.METRICS_TOKEN;
      vi.resetModules();
    }
  });
});

describe('request id + error capture', () => {
  it('stamps every response with an x-request-id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
  });

  it('returns a requestId on a real server error and persists it to /admin/errors', async () => {
    const { token } = await authedRequest({ role: 'Owner' });

    const failing = await request(app).get('/meetings/not-a-valid-uuid').set('Authorization', `Bearer ${token}`);
    expect(failing.status).toBe(500);
    expect(failing.body.requestId).toEqual(expect.any(String));

    const errors = await request(app).get('/admin/errors').set('Authorization', `Bearer ${token}`);
    expect(errors.status).toBe(200);
    expect(errors.body.errors[0]).toMatchObject({ requestId: failing.body.requestId, statusCode: 500, path: '/meetings/not-a-valid-uuid' });
  });

  it('rejects a Member from reading captured errors', async () => {
    const { token } = await authedRequest({ role: 'Member' });
    const res = await request(app).get('/admin/errors').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
