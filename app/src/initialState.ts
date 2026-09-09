import { CLIENT_DATA, INITIAL_TEAM, MEET } from './data';
import type { ScheduledMeeting } from './data';
import type { AppState } from './types';

function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedScheduledMeetings(): ScheduledMeeting[] {
  return [
    {
      id: 'sch1',
      title: 'Pilot check-in',
      client: 'Hartline Logistics',
      practice: 'Consulting',
      date: isoDatePlusDays(1),
      time: '10:00',
      durationMin: 45,
      place: 'Zoom',
      type: 'Video call',
      agenda: ['Depot pilot metrics so far', 'Any blockers on the data pull'],
      outcomes: ['Confirm the pilot is still tracking to the 6% gate'],
      attendees: ['DO', 'TL'],
      guests: 0
    },
    {
      id: 'sch2',
      title: 'Renewal terms review',
      client: 'Verdon Health',
      practice: 'Growth iQ',
      date: isoDatePlusDays(3),
      time: '14:00',
      durationMin: 60,
      place: 'Verdon Health HQ, Reading',
      type: 'In person',
      agenda: ['Walk through the data addendum terms', 'Confirm the Q4 budget line'],
      outcomes: ['Ray signs off the addendum figure'],
      attendees: ['PR', 'MB'],
      guests: 1
    },
    {
      id: 'sch3',
      title: 'Cohort 2 kickoff',
      client: 'Kessler & Roe',
      practice: 'Capability',
      date: isoDatePlusDays(7),
      time: '11:00',
      durationMin: 60,
      place: 'Google Meet',
      type: 'Video call',
      agenda: ['Recap cohort 1 outcomes', 'Confirm cohort 2 participant list', 'Walk the revised review checklist'],
      outcomes: ['Cohort 2 dates locked', 'Hybrid attendee confirmed'],
      attendees: ['NF', 'MB'],
      guests: 0
    }
  ];
}

export function createInitialState(): AppState {
  return {
    authToken: null,
    authUser: null,
    authView: 'login',
    authEmail: '',
    authPassword: '',
    authName: '',
    authInviteToken: '',
    authResetToken: '',
    authError: null,
    authInfo: null,
    authLoading: false,
    lastInviteToken: null,
    clientIds: {},

    theme: 'light',
    screen: 'library',
    meetingId: 'm1',
    tab: 'summary',
    query: '',
    draft: '',
    chat: [
      { role: 'user', text: 'What did we decide about the Hartline timeline?' },
      {
        role: 'ai',
        text:
          'You phased it. Ines Kovač refused a 90-day national programme, so delivery starts with a Midlands depot pilot and national rollout is gated on a 6% cost-to-serve improvement. Tom will be on site two days a week rather than delivering remote.',
        cites: [
          { id: 'm1', label: 'Diagnostic readout · 18:42' },
          { id: 'm1', label: 'Diagnostic readout · 52:19' }
        ]
      }
    ],
    thinking: false,
    recording: false,
    secs: 0,
    captureMode: null,
    client: null,
    practice: null,

    namerOpen: false,
    namerDraft: '',
    namerApplyAll: true,
    namerFor: null,

    voiceNames: {},
    redact: false,
    redactNames: false,
    copied: false,

    settings: { disclosure: true, autoCal: true, keepAudio: false, sysAudio: true, mic: true },
    auditLog: [],
    auditLoading: false,
    auditError: null,

    w: typeof window !== 'undefined' ? window.innerWidth : 1400,
    railOpen: false,
    playing: null,

    me: 'lana@maverio.com',
    accountMenu: false,

    clientMode: 'list',
    clientSel: null,
    notesLog: {},
    noteDraft: '',
    noteSaved: false,

    newClient: { name: '', practice: 'Consulting', stage: 'Discovery', address: '', phone: '', site: '', notes: '' },
    newContacts: [],
    ctName: '',
    ctRole: '',
    ctEmail: '',
    ctPhone: '',
    clientSaved: false,

    clientData: JSON.parse(JSON.stringify(CLIENT_DATA)),

    prepTitle: 'Pilot scope walkthrough',
    prepClient: 'Hartline Logistics',
    prepPractice: 'Consulting',
    agenda: [
      'Confirm Midlands depot as the pilot site',
      'Data request: eight-week route history',
      'Walk the 6% cost-to-serve gate',
      'Fee schedule and invoicing dates'
    ],
    outcomes: ['Ines names a finance owner for the pilot budget', 'Depot walkthrough booked with the ops supervisor'],
    attendees: ['DO', 'TL', 'IK'],
    guests: 1,
    agendaDraft: '',
    outcomeDraft: '',

    scheduleDate: '',
    scheduleTime: '',
    scheduleDuration: 60,
    schedulePlace: '',
    scheduleType: 'Video call',
    scheduleSaved: false,
    scheduledMeetings: seedScheduledMeetings(),
    railTab: 'ask',

    publishOverrides: {},
    publishFilter: 'all',

    meetings: [...MEET],
    newMeetings: [],
    justFinished: null,
    fieldsOpen: false,
    gapAnswers: {},
    gapDraft: {},

    titles: {},
    editTitle: false,
    titleDraft: '',

    fieldEdits: {},
    editField: null,
    fieldDraft: '',
    fieldSync: null,

    archived: ['Alcove Foods'],
    archiveOpen: false,

    inviteEmail: '',
    inviteRole: 'Member',
    inviteScope: 'all',
    copiedLink: false,
    inviteSent: false,
    rowNote: {},

    team: JSON.parse(JSON.stringify(INITIAL_TEAM)),

    captureError: null,
    analysisError: null
  };
}
