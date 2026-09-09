import { describe, expect, it } from 'vitest';
import { mapClients, mapMeeting, mapTeam, scopeSpeakerKey, shortDate } from './sync';
import type { ClientRow, MeetingRow, TeamMemberRow } from './api';

describe('scopeSpeakerKey', () => {
  it('scopes a bare Deepgram "?N" transcript-line key to the meeting', () => {
    expect(scopeSpeakerKey('m1', '?0')).toBe('?m1:0');
  });

  it('scopes a Claude analysis "Speaker N" action-who key to the meeting', () => {
    expect(scopeSpeakerKey('m1', 'Speaker 2')).toBe('?m1:2');
  });

  it('never collides two different meetings\' "speaker 0"', () => {
    expect(scopeSpeakerKey('m1', '?0')).not.toBe(scopeSpeakerKey('m2', '?0'));
  });

  it('leaves an already-named or already-scoped key untouched', () => {
    expect(scopeSpeakerKey('m1', 'lana@maverio.com')).toBe('lana@maverio.com');
    expect(scopeSpeakerKey('m1', '?m2:0')).toBe('?m2:0');
  });
});

function baseMeetingRow(overrides: Partial<MeetingRow> = {}): MeetingRow {
  return {
    id: 'm1',
    title: 'Pilot scope walkthrough',
    titleEdited: false,
    clientId: 'c1',
    practice: 'Consulting',
    occurredAt: '2026-01-15T10:00:00.000Z',
    durationSeconds: 1800,
    stage: 'done',
    people: [],
    unknownCount: 0,
    summary: '',
    objective: '',
    objectiveCite: '',
    decisions: [],
    actions: [],
    gaps: [],
    fields: [],
    lines: [],
    speakerSuggestions: {},
    published: false,
    publishedBy: null,
    publishedAt: null,
    pipelineError: null,
    createdBy: 'u1',
    createdAt: '2026-01-15T10:00:00.000Z',
    ...overrides
  };
}

describe('mapMeeting', () => {
  it('scopes speaker keys consistently across people, lines and actions', () => {
    const row = baseMeetingRow({
      people: ['?0', '?1'],
      lines: [{ t: '00:01', k: '?0', text: 'Hello' }],
      actions: [{ who: 'Speaker 0', text: 'Follow up', due: '', src: '' }]
    });
    const meeting = mapMeeting(row, { c1: 'Hartline Logistics' });
    expect(meeting.people).toEqual(['?m1:0', '?m1:1']);
    expect(meeting.lines[0].k).toBe('?m1:0');
    expect(meeting.actions[0].who).toBe('?m1:0');
  });

  it('scopes speakerSuggestions keys the same way people/lines are scoped', () => {
    // Server sends these keyed by raw Deepgram speaker index ("0", not "?0").
    const row = baseMeetingRow({ speakerSuggestions: { '0': { label: 'Priya Raman', score: 0.87 } } });
    const meeting = mapMeeting(row, {});
    expect(meeting.speakerSuggestions).toEqual({ '?m1:0': { label: 'Priya Raman', score: 0.87 } });
  });

  it('falls back to "Unfiled" for a meeting whose client was archived/deleted', () => {
    const meeting = mapMeeting(baseMeetingRow({ clientId: 'nonexistent' }), {});
    expect(meeting.client).toBe('Unfiled');
  });

  it('shows a processing placeholder summary for a meeting still being transcribed/analysed', () => {
    const meeting = mapMeeting(baseMeetingRow({ stage: 'transcribing', summary: '' }), {});
    expect(meeting.summary).toBe('Processing…');
  });
});

describe('mapClients', () => {
  it('keys client data by name and builds both id<->name lookup maps', () => {
    const rows: ClientRow[] = [
      {
        id: 'c1',
        name: 'Hartline Logistics',
        practice: 'Consulting',
        stage: 'Active',
        address: null,
        phone: null,
        site: null,
        notes: null,
        archived: false,
        contacts: [{ id: 'ct1', name: 'Ines Kovač', role: 'COO', email: 'ines@hartline.example', phone: null }]
      }
    ];
    const { clientData, nameToId, idToName } = mapClients(rows);
    expect(clientData['Hartline Logistics'].contacts).toEqual([{ name: 'Ines Kovač', role: 'COO', email: 'ines@hartline.example', phone: '' }]);
    expect(nameToId['Hartline Logistics']).toBe('c1');
    expect(idToName['c1']).toBe('Hartline Logistics');
  });
});

describe('mapTeam', () => {
  it('labels an active member as joined and a pending invite as invited, using their creation date', () => {
    const rows: TeamMemberRow[] = [
      { email: 'lana@maverio.com', name: 'Lana Marov', role: 'Owner', scope: 'all', status: 'active', created_at: '2026-01-01T00:00:00.000Z' },
      { email: 'new.hire@maverio.com', name: null, role: 'Member', scope: 'all', status: 'pending', created_at: '2026-01-02T00:00:00.000Z' }
    ];
    const [active, pending] = mapTeam(rows);
    expect(active.seen).toBe('joined ' + shortDate('2026-01-01T00:00:00.000Z'));
    expect(active.vp).toBe('enrolled');
    expect(pending.seen).toBe('invited ' + shortDate('2026-01-02T00:00:00.000Z'));
    expect(pending.name).toBeUndefined();
  });
});
