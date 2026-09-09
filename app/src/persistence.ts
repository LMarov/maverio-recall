import type { AppState } from './types';

declare global {
  interface Window {
    recallAPI?: {
      isElectron: true;
      store: { load: () => Promise<unknown>; save: (data: unknown) => Promise<boolean> };
      getScreenSource: () => Promise<{ id: string; name: string }[]>;
      getPermissionStatus: () => Promise<{ mic: string; screen: string }>;
      requestMic: () => Promise<boolean>;
      saveRecording: (buffer: ArrayBuffer, meetingId: string) => Promise<string>;
      transcribe: (filePath: string) => Promise<{ lines: { t: string; k: string; text: string }[]; speakerCount: number; fullText: string }>;
      analyze: (
        fullText: string,
        lines: { t: string; k: string; text: string }[],
        context: { title: string; client: string; agenda: string[] }
      ) => Promise<{
        summary: string;
        objective: string;
        objectiveCite: string;
        decisions: { text: string; cite: string }[];
        actions: { who: string; text: string; due: string; src: string }[];
        gaps: { q: string; why: string; cite: string }[];
        fields: Record<string, string>;
      }>;
      onDeepLink: (callback: (link: { kind: 'join' | 'reset'; token: string }) => void) => () => void;
    };
  }
}

export const PERSISTED_KEYS = [
  'authToken',
  'clientIds',
  'meetings',
  'theme',
  'me',
  'chat',
  'voiceNames',
  'redact',
  'redactNames',
  'settings',
  'clientMode',
  'clientSel',
  'notesLog',
  'clientData',
  'newMeetings',
  'titles',
  'fieldEdits',
  'archived',
  'team',
  'gapAnswers',
  'scheduledMeetings',
  'publishOverrides'
] as const;

export type PersistedSlice = Pick<AppState, (typeof PERSISTED_KEYS)[number]>;

const LOCAL_STORAGE_KEY = 'maverio-recall-store-v1';

export async function loadPersisted(): Promise<Partial<PersistedSlice> | null> {
  if (typeof window === 'undefined') return null;
  if (window.recallAPI) {
    try {
      const data = await window.recallAPI.store.load();
      return (data as Partial<PersistedSlice>) || null;
    } catch {
      return null;
    }
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedSlice>) : null;
  } catch {
    return null;
  }
}

export function savePersisted(state: AppState) {
  if (typeof window === 'undefined') return;
  const slice: Partial<PersistedSlice> = {};
  for (const k of PERSISTED_KEYS) (slice as any)[k] = (state as any)[k];

  if (window.recallAPI) {
    window.recallAPI.store.save(slice).catch(() => {});
    return;
  }
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // storage full or unavailable — persistence is best-effort
  }
}
