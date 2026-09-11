import { randomUUID } from 'crypto';
import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './env';
import { logger } from './logger';
import { pool } from './db/pool';
import { recordError } from './errorLog';
import { metricsRegistry, httpRequestsTotal, httpRequestDuration } from './metrics';
import { authRouter } from './routes/auth';
import { teamRouter } from './routes/team';
import { clientsRouter } from './routes/clients';
import { meetingsRouter } from './routes/meetings';
import { scheduledRouter } from './routes/scheduled';
import { audioRouter } from './routes/audio';
import { askRouter } from './routes/ask';
import { auditRouter } from './routes/audit';
import { adminRouter } from './routes/admin';

/** The Express app on its own, with no listening socket — importable directly by tests via supertest. */
export function createApp() {
  const app = express();

  // Only meaningful behind a reverse proxy/load balancer (set TRUST_PROXY=1) —
  // otherwise rate limiting and req.ip would see the proxy's address for every
  // request instead of the real client's.
  app.set('trust proxy', env.trustProxy);

  app.use(
    helmet({
      // This API's only cross-origin consumer is the desktop app fetching its
      // own audio files back (local storage driver) — same-origin (the
      // default) would block that in production.
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  // Runs in tests too (silenced via LOG_LEVEL, see logger.ts) so req.id/req.log
  // and the x-request-id response header behave the same as in production.
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
      // Default pino-http ids are a per-process incrementing counter — fine
      // within one instance, but collide across restarts/instances and are
      // useless for correlating a client-reported id with server logs. Honor
      // an inbound x-request-id (e.g. from a reverse proxy) if present.
      genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID()
    })
  );
  app.use((req, res, next) => {
    res.setHeader('x-request-id', String((req as any).id));
    next();
  });

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      // req.route is only set once Express has matched a router path, so this
      // falls back to the raw URL for 404s — fine, since prom label
      // cardinality only matters for the routes that actually exist.
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      httpRequestsTotal.inc(labels);
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      httpRequestDuration.observe(labels, seconds);
    });
    next();
  });

  const corsOptions: cors.CorsOptions = env.corsOrigins.includes('*')
    ? {}
    : { origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)) };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Liveness (/health) only says the process is up; readiness also checks the
  // dependency the app can't function without, so an orchestrator can tell
  // "restart me" apart from "don't route to me yet/anymore".
  app.get('/health/ready', async (_req, res) => {
    try {
      await pool.query('select 1');
      res.json({ ok: true });
    } catch (err: any) {
      res.status(503).json({ ok: false, error: err?.message || 'not ready' });
    }
  });

  app.get('/metrics', async (req, res) => {
    if (env.metricsToken) {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
      if (token !== env.metricsToken) {
        res.status(401).end();
        return;
      }
    }
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  app.use('/auth', authRouter);
  app.use('/team', teamRouter);
  app.use('/clients', clientsRouter);
  app.use('/meetings', meetingsRouter);
  app.use('/scheduled', scheduledRouter);
  app.use('/audio', audioRouter);
  app.use('/ask', askRouter);
  app.use('/audit', auditRouter);
  app.use('/admin', adminRouter);

  if (env.storageDriver === 'local') {
    app.use('/audio-files', express.static(path.resolve(env.localStorageDir)));
  }

  app.use(async (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = (req as any).id;
    const reqLogger = (req as any).log || logger;
    reqLogger.error({ err, requestId }, 'request failed');

    if (err?.name === 'ZodError') {
      res.status(422).json({ error: 'Invalid request', details: err.issues, requestId });
      return;
    }

    const statusCode = 500;
    // Persisted before responding (rather than fire-and-forget) so a client
    // that immediately asks an operator to check /admin/errors for this
    // requestId won't lose the race with the insert. recordError() never
    // throws, so this can't turn one failure into a worse one.
    await recordError({
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      message: err?.message || 'Internal server error',
      stack: err?.stack,
      userId: req.user?.id
    });

    res.status(statusCode).json({ error: err?.message || 'Internal server error', requestId });
  });

  return app;
}
