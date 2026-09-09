import { describe, expect, it, vi } from 'vitest';
import { buildView, type Methods } from './derive';
import { createInitialState } from './initialState';
import type { AppState, ScreenKey } from './types';
import type { ClientRecord, Meeting, TeamMember } from './data';

// derive.ts's buildView computes the ENTIRE view-model unconditionally on
// every render, regardless of which screen is actually active — that's what
// makes an unsafe lookup on one screen's data crash every other screen too.
// This is exactly the bug class that caused two real production crashes in
// earlier phases (an unnamed real teammate treated as a fixed demo person;
// a real per-meeting speaker key treated the same way) — these tests target
// that pattern directly, across every screen, not just the "current" one.

function noopMethods(): Methods {
  return {
    patch: vi.fn(),
    go: vi.fn(),
    stopAndFile: vi.fn(),
    toggleRecord: vi.fn(),
    open: vi.fn(),
    ask: vi.fn(),
    speaker: vi.fn(() => ({ name: 'Someone', color: '#000', conf: 'unknown' })),
    md: vi.fn(() => ''),
    pushToClient: vi.fn(),
    openNamerFor: vi.fn(),
    scheduleMeeting: vi.fn(),
    loadScheduled: vi.fn(),
    removeScheduled: vi.fn(),
    publishMeeting: vi.fn(),
    unpublishMeeting: vi.fn(),
    login: vi.fn(),
    acceptInvite: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn()
  } as unknown as Methods;
}

const ALL_SCREENS: ScreenKey[] = ['library', 'search', 'meeting', 'voices', 'export', 'clients', 'prep', 'team', 'settings'];

describe('buildView on a brand-new, empty workspace', () => {
  it('does not throw on any screen', () => {
    const state = createInitialState();
    for (const screen of ALL_SCREENS) {
      expect(() => buildView({ ...state, screen }, noopMethods())).not.toThrow();
    }
  });
});

describe('buildView with a real (non-demo) team member', () => {
  // The real bug: attendeeFromTeamMember/resolveAttendeeKey exist precisely
  // because code used to do P[k as PersonKey] on a teammate who has no `k`
  // at all (a real invited person, not one of the fixed 8 demo people).
  function stateWithRealTeammate(): AppState {
    const base = createInitialState();
    const realMember: TeamMember = {
      email: 'nadia.farah@maverio.com',
      role: 'Member',
      status: 'active',
      seen: 'joined recently',
      vp: 'awaiting first call',
      scope: 'all'
    };
    return { ...base, team: [...base.team, realMember], me: 'nadia.farah@maverio.com' };
  }

  it('does not throw on any screen', () => {
    const state = stateWithRealTeammate();
    for (const screen of ALL_SCREENS) {
      expect(() => buildView({ ...state, screen }, noopMethods())).not.toThrow();
    }
  });

  it('resolves the real teammate\'s attendee chip with a name derived from their email, not a crash', () => {
    const state = { ...stateWithRealTeammate(), screen: 'prep' as ScreenKey };
    const view = buildView(state, noopMethods());
    // voicePicks renders just the first name on the chip itself.
    const chip = view.voicePicks.find((v: { name: string }) => v.name === 'Nadia');
    expect(chip).toBeDefined();
  });
});

describe('buildView with a real per-meeting unnamed speaker', () => {
  // The other real bug: a Deepgram/Claude speaker key scoped to one meeting
  // ("?m1:0") is not a PersonKey either, and used to crash the Voices screen
  // and the Recording pill's live-speaker resolution the same way.
  function realMeeting(): Meeting {
    return {
      id: 'm1',
      title: 'Pilot scope walkthrough',
      client: 'Hartline Logistics',
      practice: 'Consulting',
      dow: 'THU',
      day: '15',
      mon: 'JAN',
      time: '10:00',
      dur: '30 min',
      dec: 0,
      act: 0,
      people: ['?m1:0'],
      unknown: 1,
      summary: 'Discussed pilot scope.',
      decisions: [],
      objective: '',
      objectiveCite: '',
      gaps: [],
      actions: [],
      fields: [],
      lines: [{ t: '00:01', k: '?m1:0', text: 'Let\'s confirm the pilot site.' }],
      speakerSuggestions: { '?m1:0': { label: 'Priya Raman', score: 0.87 } },
      stage: 'done'
    };
  }

  function stateWithRealMeeting(): AppState {
    const base = createInitialState();
    const clientData: Record<string, ClientRecord> = {
      ...base.clientData,
      'Hartline Logistics': { practice: 'Consulting', stage: '', address: '', phone: '', site: '', notes: '', contacts: [] }
    };
    return { ...base, meetings: [realMeeting()], clientData };
  }

  it('does not throw on any screen', () => {
    const state = stateWithRealMeeting();
    for (const screen of ALL_SCREENS) {
      expect(() => buildView({ ...state, screen }, noopMethods())).not.toThrow();
    }
  });

  it('surfaces the voiceprint suggestion as a namer prefill, not an auto-applied name', () => {
    const state = { ...stateWithRealMeeting(), screen: 'voices' as ScreenKey };
    const view = buildView(state, noopMethods());
    const pendingVoice = view.pending.find((p: { k: string }) => p.k === '?m1:0');
    expect(pendingVoice).toBeDefined();
    expect(pendingVoice!.suggest).toEqual(['Priya Raman']);
    expect(pendingVoice!.hint).toContain('Priya Raman');
    // Still pending, not already named — a suggestion never applies itself.
    expect(view.hasPending).toBe(true);
  });
});
