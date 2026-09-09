import type { IncomingMessage } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { verifyToken } from '../auth/jwt';

export type RealtimeEvent =
  | { type: 'meeting.created'; meetingId: string }
  | { type: 'meeting.stage'; meetingId: string; stage: 'transcribing' | 'analysing' | 'done' }
  | { type: 'meeting.published'; meetingId: string; published: boolean }
  | { type: 'meeting.updated'; meetingId: string }
  | { type: 'client.updated'; clientId: string }
  | { type: 'scheduled.created'; scheduledId: string }
  | { type: 'scheduled.removed'; scheduledId: string }
  | { type: 'team.invited'; email: string }
  | { type: 'team.joined'; email: string };

const clients = new Set<WebSocket>();

export function initRealtime(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token') || '';
      verifyToken(token);
    } catch {
      ws.close(1008, 'unauthorized');
      return;
    }

    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

export function broadcast(event: RealtimeEvent) {
  const payload = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}
