// Thin REST client for the Maverio Recall server (see /server). Every function
// here is a network-boundary call — the rest of the app keeps working with the
// same client-name-keyed shapes it always has; this module is where that gets
// translated to/from the backend's id-keyed rows.

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export { API_BASE, WS_BASE };

export class ApiError extends Error {}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(opts.headers as any) };
  if (authToken) headers.Authorization = 'Bearer ' + authToken;
  if (!(opts.body instanceof FormData) && opts.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });
const put = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });

// ---- auth ----
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'Owner' | 'Admin' | 'Member';
  scope: 'all' | 'attended';
}

export const authApi = {
  login: (email: string, password: string) => post<{ token: string; user: AuthUser }>('/auth/login', { email, password }),
  acceptInvite: (token: string, name: string, password: string) =>
    post<{ token: string; user: AuthUser }>('/auth/accept-invite', { token, name, password }),
  me: () => get<{ user: AuthUser }>('/auth/me')
};

// ---- team ----
export interface TeamMemberRow {
  email: string;
  name: string | null;
  role: 'Owner' | 'Admin' | 'Member';
  scope: 'all' | 'attended';
  status: 'active' | 'pending';
  created_at: string;
}

export const teamApi = {
  list: () => get<{ members: TeamMemberRow[] }>('/team'),
  invite: (email: string, role: string, scope: string) => post<{ email: string; joinToken: string }>('/team/invite', { email, role, scope })
};

// ---- clients ----
export interface ClientRow {
  id: string;
  name: string;
  practice: string;
  stage: string | null;
  address: string | null;
  phone: string | null;
  site: string | null;
  notes: string | null;
  archived: boolean;
  contacts: { id: string; name: string; role: string | null; email: string | null; phone: string | null }[];
  notes_list?: { id: string; text: string; author_id: string; created_at: string }[];
}

export const clientsApi = {
  list: () => get<{ clients: ClientRow[] }>('/clients'),
  create: (body: {
    name: string;
    practice: string;
    stage?: string;
    address?: string;
    phone?: string;
    site?: string;
    notes?: string;
    contacts?: { name: string; role?: string; email?: string; phone?: string }[];
  }) => post<{ client: ClientRow }>('/clients', body),
  update: (id: string, body: Partial<{ name: string; practice: string; stage: string; address: string; phone: string; site: string; notes: string }>) =>
    patch<{ ok: true }>(`/clients/${id}`, body),
  archive: (id: string, archived: boolean) => patch<{ ok: true }>(`/clients/${id}/archive`, { archived }),
  addNote: (id: string, text: string) => post<{ note: unknown }>(`/clients/${id}/notes`, { text }),
  addContact: (id: string, contact: { name: string; role?: string; email?: string; phone?: string }) =>
    post<{ contact: unknown }>(`/clients/${id}/contacts`, contact)
};

// ---- meetings ----
export interface MeetingRow {
  id: string;
  title: string;
  titleEdited: boolean;
  clientId: string;
  practice: string;
  occurredAt: string;
  durationSeconds: number | null;
  stage: 'transcribing' | 'analysing' | 'done';
  people: string[];
  unknownCount: number;
  summary: string;
  objective: string;
  objectiveCite: string;
  decisions: { text: string; cite: string }[];
  actions: { who: string; text: string; due: string; src: string }[];
  gaps: { q: string; why: string; cite: string; answer?: string }[];
  fields: { key: string; val: string; edited?: boolean }[];
  lines: { t: string; k: string; text: string }[];
  published: boolean;
  publishedBy: string | null;
  publishedAt: string | null;
  pipelineError: string | null;
  createdBy: string;
  createdAt: string;
}

export const meetingsApi = {
  list: () => get<{ meetings: MeetingRow[] }>('/meetings'),
  get: (id: string) => get<{ meeting: MeetingRow }>(`/meetings/${id}`),
  setTitle: (id: string, title: string) => patch<{ ok: true }>(`/meetings/${id}/title`, { title }),
  answerGap: (id: string, gapIndex: number, answer: string) => post<{ ok: true }>(`/meetings/${id}/gap-answers`, { gapIndex, answer }),
  editField: (id: string, key: string, value: string) => post<{ ok: true }>(`/meetings/${id}/field-edits`, { key, value }),
  publish: (id: string, published: boolean) => patch<{ ok: true }>(`/meetings/${id}/publish`, { published }),
  voiceNames: () => get<{ voiceNames: Record<string, string> }>('/meetings/meta/voice-names'),
  setVoiceName: (key: string, name: string) => put<{ ok: true }>(`/meetings/meta/voice-names/${encodeURIComponent(key)}`, { name })
};

// ---- scheduled meetings ----
export interface ScheduledRow {
  id: string;
  title: string;
  clientId: string;
  practice: string;
  scheduledAt: string;
  durationMin: number;
  place: string | null;
  type: string;
  agenda: string[];
  outcomes: string[];
  attendees: string[];
  guests: number;
}

export const scheduledApi = {
  list: () => get<{ scheduledMeetings: ScheduledRow[] }>('/scheduled'),
  create: (body: {
    title: string;
    clientId: string;
    practice: string;
    scheduledAt: string;
    durationMin: number;
    place?: string;
    type: string;
    agenda: string[];
    outcomes: string[];
    attendees: string[];
    guests: number;
  }) => post<{ scheduledMeeting: ScheduledRow }>('/scheduled', body),
  remove: (id: string) => del<{ ok: true }>(`/scheduled/${id}`)
};

// ---- audio upload ----
export async function uploadAudio(
  blob: Blob,
  meta: { title: string; clientId?: string; practice: string; agenda: string[]; occurredAt: string; durationSeconds: number }
): Promise<{ meetingId: string }> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  form.append('title', meta.title);
  if (meta.clientId) form.append('clientId', meta.clientId);
  form.append('practice', meta.practice);
  form.append('agenda', JSON.stringify(meta.agenda));
  form.append('occurredAt', meta.occurredAt);
  form.append('durationSeconds', String(meta.durationSeconds));
  return request<{ meetingId: string }>('/audio', { method: 'POST', body: form });
}
