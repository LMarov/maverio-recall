import { describe, expect, it } from 'vitest';
import {
  P,
  attendeeFromContact,
  attendeeFromTeamMember,
  colorForKey,
  nameFromEmail,
  resolveAttendeeKey,
  TEAM_COLORS,
  type TeamMember
} from './data';

const demoKey = Object.keys(P)[0] as keyof typeof P;

describe('nameFromEmail', () => {
  it('title-cases a simple local part', () => {
    expect(nameFromEmail('lana@maverio.com')).toBe('Lana');
  });

  it('splits on dots, underscores and hyphens into separate words', () => {
    expect(nameFromEmail('priya.raman@maverio.com')).toBe('Priya Raman');
    expect(nameFromEmail('marcus_boyle@maverio.com')).toBe('Marcus Boyle');
    expect(nameFromEmail('tom-lasky@maverio.com')).toBe('Tom Lasky');
  });
});

describe('colorForKey', () => {
  it('always returns one of the fixed team colors', () => {
    for (const key of ['lana@maverio.com', 'someone.else@maverio.com', 'x', '']) {
      expect(TEAM_COLORS).toContain(colorForKey(key));
    }
  });

  it('is deterministic for the same key', () => {
    expect(colorForKey('priya@maverio.com')).toBe(colorForKey('priya@maverio.com'));
  });
});

describe('attendeeFromTeamMember', () => {
  it('resolves a fixed demo person (with k) via the P dictionary', () => {
    const member: TeamMember = { k: demoKey, email: 'demo@maverio.com', role: 'Owner', status: 'active', seen: '', vp: '', scope: 'all' };
    const attendee = attendeeFromTeamMember(member);
    expect(attendee).toEqual({ key: demoKey, name: P[demoKey].n, color: P[demoKey].c, role: P[demoKey].r });
  });

  // This is the exact shape that used to crash liveSpeakers/voicePicks/speaker()
  // before Phase 5: a real invited teammate has no `k`, and may not have set
  // their name yet (a pending invite that was just accepted, for instance).
  it('falls back to nameFromEmail for a real teammate with no name set yet', () => {
    const member: TeamMember = { email: 'nadia.farah@maverio.com', role: 'Member', status: 'active', seen: '', vp: '', scope: 'all' };
    const attendee = attendeeFromTeamMember(member);
    expect(attendee.key).toBe('nadia.farah@maverio.com');
    expect(attendee.name).toBe('Nadia Farah');
    expect(attendee.role).toBe('Member · Maverio');
  });

  it('prefers a real teammate\'s set name over deriving one from their email', () => {
    const member: TeamMember = { email: 'r@maverio.com', name: 'Ruth Adeyemi', role: 'Admin', status: 'active', seen: '', vp: '', scope: 'all' };
    expect(attendeeFromTeamMember(member).name).toBe('Ruth Adeyemi');
  });
});

describe('attendeeFromContact', () => {
  it('keys by email when present, else by name', () => {
    const withEmail = attendeeFromContact({ name: 'Ines Kovač', role: 'COO', email: 'ines@hartline.example' }, 'Hartline Logistics');
    expect(withEmail.key).toBe('ines@hartline.example');
    expect(withEmail.role).toBe('COO · Hartline Logistics');

    const withoutEmail = attendeeFromContact({ name: 'Sam Petrie' }, 'Hartline Logistics');
    expect(withoutEmail.key).toBe('Sam Petrie');
    expect(withoutEmail.role).toBe('Contact · Hartline Logistics');
  });
});

describe('resolveAttendeeKey', () => {
  const team: TeamMember[] = [
    { k: demoKey, email: 'demo@maverio.com', role: 'Owner', status: 'active', seen: '', vp: '', scope: 'all' },
    { email: 'nadia.farah@maverio.com', role: 'Member', status: 'active', seen: '', vp: '', scope: 'all' }
  ];
  const contacts = [{ name: 'Ines Kovač', role: 'COO', email: 'ines@hartline.example' }];

  it('resolves a fixed demo PersonKey directly', () => {
    expect(resolveAttendeeKey(demoKey, team, contacts)).toEqual({ name: P[demoKey].n, color: P[demoKey].c });
  });

  it('resolves a real team member by email', () => {
    const result = resolveAttendeeKey('nadia.farah@maverio.com', team, contacts);
    expect(result.name).toBe('Nadia Farah');
  });

  it('resolves a client contact by email', () => {
    const result = resolveAttendeeKey('ines@hartline.example', team, contacts);
    expect(result.name).toBe('Ines Kovač');
  });

  it('falls back to deriving a name from the key itself when nothing else matches', () => {
    // This is what a still-unnamed Deepgram speaker key used to crash on
    // (P[k as PersonKey].n where k was never actually a PersonKey).
    const result = resolveAttendeeKey('unknown.speaker@maverio.com', team, contacts);
    expect(result.name).toBe('Unknown Speaker');
    expect(TEAM_COLORS).toContain(result.color);
  });
});
