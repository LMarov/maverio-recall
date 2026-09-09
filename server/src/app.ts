import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { authRouter } from './routes/auth';
import { teamRouter } from './routes/team';
import { clientsRouter } from './routes/clients';
import { meetingsRouter } from './routes/meetings';
import { scheduledRouter } from './routes/scheduled';
import { audioRouter } from './routes/audio';
import { askRouter } from './routes/ask';
import { auditRouter } from './routes/audit';

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
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  const corsOptions: cors.CorsOptions = env.corsOrigins.includes('*')
    ? {}
    : { origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)) };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/team', teamRouter);
  app.use('/clients', clientsRouter);
  app.use('/meetings', meetingsRouter);
  app.use('/scheduled', scheduledRouter);
  app.use('/audio', audioRouter);
  app.use('/ask', askRouter);
  app.use('/audit', auditRouter);

  if (env.storageDriver === 'local') {
    app.use('/audio-files', express.static(path.resolve(env.localStorageDir)));
  }

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    if (err?.name === 'ZodError') {
      res.status(422).json({ error: 'Invalid request', details: err.issues });
      return;
    }
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });

  return app;
}
