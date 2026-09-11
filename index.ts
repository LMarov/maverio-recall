import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import { env } from './env';
import { createApp } from './app';
import { logger } from './logger';
import { recordError } from './errorLog';
import { initRealtime } from './realtime/hub';
import { startAudioRetentionJob } from './jobs/retention';

// A process left running after an uncaught error is in unknown state — log it
// with everything we've got, best-effort persist it (may itself fail if e.g.
// the DB connection is what broke), then exit so the process manager
// (docker-compose's restart policy, etc.) restarts us clean.
function crash(kind: string, err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.fatal({ err: error, kind }, 'crashing process after unrecoverable error');
  recordError({ message: `[${kind}] ${error.message}`, stack: error.stack }).finally(() => process.exit(1));
}
process.on('uncaughtException', (err) => crash('uncaughtException', err));
process.on('unhandledRejection', (err) => crash('unhandledRejection', err));

const app = createApp();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
initRealtime(wss);

server.listen(env.port, () => {
  logger.info(`Maverio Recall server listening on :${env.port}`);
  startAudioRetentionJob();
});
