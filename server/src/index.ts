import 'dotenv/config';
import http from 'http';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { WebSocketServer } from 'ws';
import { env } from './env';
import { authRouter } from './routes/auth';
import { teamRouter } from './routes/team';
import { clientsRouter } from './routes/clients';
import { meetingsRouter } from './routes/meetings';
import { scheduledRouter } from './routes/scheduled';
import { audioRouter } from './routes/audio';
import { initRealtime } from './realtime/hub';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/team', teamRouter);
app.use('/clients', clientsRouter);
app.use('/meetings', meetingsRouter);
app.use('/scheduled', scheduledRouter);
app.use('/audio', audioRouter);

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

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
initRealtime(wss);

server.listen(env.port, () => {
  console.log(`Maverio Recall server listening on :${env.port}`);
});
