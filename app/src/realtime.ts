import { WS_BASE } from './api';

export type RealtimeEvent =
  | { type: 'meeting.created'; meetingId: string }
  | { type: 'meeting.stage'; meetingId: string; stage: string }
  | { type: 'meeting.published'; meetingId: string; published: boolean }
  | { type: 'meeting.updated'; meetingId: string }
  | { type: 'client.updated'; clientId: string }
  | { type: 'scheduled.created'; scheduledId: string }
  | { type: 'scheduled.removed'; scheduledId: string }
  | { type: 'team.invited'; email: string }
  | { type: 'team.joined'; email: string };

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let listeners: ((e: RealtimeEvent) => void)[] = [];

export function connectRealtime(token: string) {
  disconnectRealtime();
  const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`);
  socket = ws;
  ws.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data) as RealtimeEvent;
      listeners.forEach((l) => l(event));
    } catch {
      // ignore malformed frames
    }
  };
  ws.onclose = () => {
    if (socket !== ws) return; // superseded by a newer connection
    reconnectTimer = window.setTimeout(() => connectRealtime(token), 2500);
  };
}

export function disconnectRealtime() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

export function onRealtimeEvent(cb: (e: RealtimeEvent) => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
