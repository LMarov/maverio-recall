// Maps backend (id-keyed) rows to the client-name-keyed shapes the rest of the
// app already works with, so derive.ts / components need almost no changes.

import type { ClientRecord, Meeting, MeetingType, PracticeName, ScheduledMeeting, TeamMember } from './data';
import type { ClientRow, MeetingRow, ScheduledRow, TeamMemberRow } from './api';

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Deepgram/Claude diarize speakers per-recording only ("?0", "?1", ... in
 * transcript lines; "Speaker 0", "Speaker 1", ... in the analysis' action
 * "who" field). Neither is a person the app otherwise knows about, so both
 * get rewritten to the same meeting-scoped unnamed-voice key ("?<meetingId>:N")
 * the rest of the app (speaker(), the namer modal, voiceNames) already
 * expects — never a bare "?0" that could collide with an unrelated meeting's
 * speaker 0, and never a raw "Speaker N" that isn't a recognized voice key at all.
 */
export function scopeSpeakerKey(meetingId: string, raw: string): string {
  const bareUnnamed = /^\?(\d+)$/.exec(raw);
  if (bareUnnamed) return '?' + meetingId + ':' + bareUnnamed[1];
  const speakerLabel = /^Speaker (\d+)$/i.exec(raw);
  if (speakerLabel) return '?' + meetingId + ':' + speakerLabel[1];
  return raw;
}


export function mapClients(rows: ClientRow[]): { clientData: Record<string, ClientRecord>; nameToId: Record<string, string>; idToName: Record<string, string> } {
  const clientData: Record<string, ClientRecord> = {};
  const nameToId: Record<string, string> = {};
  const idToName: Record<string, string> = {};
  for (const row of rows) {
    clientData[row.name] = {
      practice: row.practice as PracticeName,
      stage: row.stage || '',
      address: row.address || '',
      phone: row.phone || '',
      site: row.site || '',
      notes: row.notes || '',
      contacts: row.contacts.map((c) => ({ name: c.name || '', role: c.role || '', email: c.email || '', phone: c.phone || '' }))
    };
    nameToId[row.name] = row.id;
    idToName[row.id] = row.name;
  }
  return { clientData, nameToId, idToName };
}

export function mapTeam(rows: TeamMemberRow[]): TeamMember[] {
  return rows.map((r) => ({
    name: r.name || undefined,
    email: r.email,
    role: r.role,
    status: r.status,
    seen: r.status === 'active' ? 'joined ' + shortDate(r.created_at) : 'invited ' + shortDate(r.created_at),
    vp: r.status === 'active' ? 'enrolled' : 'awaiting first call',
    scope: r.scope
  }));
}

export function mapMeeting(row: MeetingRow, idToName: Record<string, string>): Meeting {
  const d = new Date(row.occurredAt);
  const mins = row.durationSeconds ? Math.max(1, Math.round(row.durationSeconds / 60)) : 0;
  const lines = row.lines.map((l) => ({ ...l, k: scopeSpeakerKey(row.id, l.k) }));
  const people = row.people.map((p) => scopeSpeakerKey(row.id, p));
  const actions = row.actions.map((a) => ({ ...a, who: scopeSpeakerKey(row.id, a.who) }));
  return {
    id: row.id,
    title: row.title,
    client: idToName[row.clientId] || 'Unfiled',
    practice: row.practice as PracticeName,
    dow: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
    day: String(d.getDate()),
    mon: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    dur: mins + ' min',
    dec: row.decisions.length,
    act: row.actions.length,
    people,
    unknown: row.unknownCount,
    summary: row.summary || (row.stage !== 'done' ? 'Processing…' : ''),
    decisions: row.decisions,
    objective: row.objective,
    objectiveCite: row.objectiveCite,
    gaps: row.gaps,
    actions,
    fields: row.fields,
    lines,
    stage: row.stage,
    date: row.occurredAt,
    published: row.published,
    publishedBy: row.publishedBy || undefined,
    publishedAt: row.publishedAt ? shortDate(row.publishedAt) : undefined,
    titleEdited: row.titleEdited
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function mapScheduled(row: ScheduledRow, idToName: Record<string, string>): ScheduledMeeting {
  const dt = new Date(row.scheduledAt);
  return {
    id: row.id,
    title: row.title,
    client: idToName[row.clientId] || 'Unfiled',
    practice: row.practice as PracticeName,
    date: `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`,
    time: `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`,
    durationMin: row.durationMin,
    place: row.place || '',
    type: row.type as MeetingType,
    agenda: row.agenda,
    outcomes: row.outcomes,
    attendees: row.attendees,
    guests: row.guests
  };
}
