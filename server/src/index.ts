import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import { env } from './env';
import { createApp } from './app';
import { initRealtime } from './realtime/hub';
import { startAudioRetentionJob } from './jobs/retention';

const app = createApp();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
initRealtime(wss);

server.listen(env.port, () => {
  console.log(`Maverio Recall server listening on :${env.port}`);
  startAudioRetentionJob();
});
