import type { ClientRecord, Meeting, MeetingType, PracticeName, Role, Scope, ScheduledMeeting, TeamMember } from './data';
import type { AuditEntryRow, AuthUser } from './api';

export interface ChatCite {
  id: string;
  label: string;
}

export interface ChatMsg {
  role: 'user' | 'ai';
  text: string;
  cites?: ChatCite[];
}

export interface NamerTarget {
  k: string;
  label: string;
  meta: string;
  hint: string;
  seed: number;
  suggest: string[];
}

export interface NewClientDraft {
  name: string;
  practice: PracticeName;
  stage: string;
  address: string;
  phone: string;
  site: string;
  notes: string;
}

export interface CaptureSettings {
  disclosure: boolean;
  autoCal: boolean;
  keepAudio: boolean;
  sysAudio: boolean;
  mic: boolean;
}

export interface NoteEntry {
  meta: string;
  text: string;
}

export type ScreenKey =
  | 'library'
  | 'search'
  | 'meeting'
  | 'voices'
  | 'export'
  | 'clients'
  | 'prep'
  | 'team'
  | 'settings';

export type ClientMode = 'list' | 'new' | 'edit' | 'detail';
export type Tab = 'summary' | 'transcript' | 'export';

export type AuthView = 'login' | 'accept-invite' | 'forgot-password' | 'reset-password';

export interface AppState {
  authToken: string | null;
  authUser: AuthUser | null;
  authView: AuthView;
  authEmail: string;
  authPassword: string;
  authName: string;
  authInviteToken: string;
  authResetToken: string;
  authError: string | null;
  authInfo: string | null;
  authLoading: boolean;
  lastInviteToken: string | null;
  /** Maps the client-name keys the rest of the app uses back to backend ids, for network calls. */
  clientIds: Record<string, string>;

  theme: 'light' | 'dark';
  screen: ScreenKey;
  meetingId: string;
  tab: Tab;
  query: string;
  draft: string;
  chat: ChatMsg[];
  thinking: boolean;
  recording: boolean;
  secs: number;
  /** Whether the in-progress recording actually captured system audio, or fell back to mic-only. */
  captureMode: 'both' | 'mic-only' | null;
  client: string | null;
  practice: PracticeName | null;

  namerOpen: boolean;
  namerDraft: string;
  namerApplyAll: boolean;
  namerFor: NamerTarget | null;

  voiceNames: Record<string, string>;
  redact: boolean;
  redactNames: boolean;
  copied: boolean;

  settings: CaptureSettings;
  auditLog: AuditEntryRow[];
  auditLoading: boolean;
  auditError: string | null;

  w: number;
  railOpen: boolean;
  playing: string | null;

  me: string;
  accountMenu: boolean;

  clientMode: ClientMode;
  clientSel: string | null;
  notesLog: Record<string, NoteEntry[]>;
  noteDraft: string;
  noteSaved: boolean;

  newClient: NewClientDraft;
  newContacts: { name: string; role: string; email: string; phone: string }[];
  ctName: string;
  ctRole: string;
  ctEmail: string;
  ctPhone: string;
  clientSaved: boolean;

  clientData: Record<string, ClientRecord>;

  prepTitle: string;
  prepClient: string;
  prepPractice: PracticeName;
  agenda: string[];
  outcomes: string[];
  attendees: string[];
  guests: number;
  agendaDraft: string;
  outcomeDraft: string;

  scheduleDate: string;
  scheduleTime: string;
  scheduleDuration: number;
  schedulePlace: string;
  scheduleType: MeetingType;
  scheduleSaved: boolean;
  scheduledMeetings: ScheduledMeeting[];
  railTab: 'ask' | 'scheduled';

  publishOverrides: Record<string, { published: boolean; by: string; at: string }>;
  publishFilter: 'all' | 'drafts' | 'published';

  /** Backend-sourced meetings shared across the team (replaces the old static MEET seed once logged in). */
  meetings: Meeting[];
  newMeetings: Meeting[];
  justFinished: string | null;
  fieldsOpen: boolean;
  gapAnswers: Record<string, string>;
  gapDraft: Record<string, string>;

  titles: Record<string, string>;
  editTitle: boolean;
  titleDraft: string;

  fieldEdits: Record<string, string>;
  editField: string | null;
  fieldDraft: string;
  fieldSync: { key: string; client: string; target: string } | null;

  archived: string[];
  archiveOpen: boolean;

  inviteEmail: string;
  inviteRole: Role;
  inviteScope: Scope;
  copiedLink: boolean;
  inviteSent: boolean;
  rowNote: Record<string, string>;

  team: TeamMember[];

  /** Surfaced when starting real capture fails (permissions denied, no mic, etc). */
  captureError: string | null;
  /** Surfaced when the real transcribe/analyze pipeline fails for a recording. */
  analysisError: string | null;
}

export type StatePatch = Partial<AppState> | ((prev: AppState) => Partial<AppState>);
