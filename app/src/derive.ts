import {
  AQ1,
  AQ2,
  CLIENT_DOT_COLORS,
  CONTACT_COLORS,
  DURATION_OPTIONS,
  MEET,
  MEETING_TYPES,
  P,
  PENDING_VOICE_DEFS,
  PR,
  PRACTICES,
  STAGES,
  hm,
  ini,
  wave
} from './data';
import type { Meeting, PersonKey, PracticeName, ScheduledMeeting } from './data';
import type { AppState, ScreenKey } from './types';
import { clientsApi, meetingsApi, teamApi } from './api';

export interface Methods {
  patch: (update: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void;
  go: (screen: ScreenKey) => void;
  stopAndFile: () => void;
  toggleRecord: () => void;
  open: (id: string) => void;
  ask: (q: string) => void;
  speaker: (k: string) => { name: string; color: string; conf: string };
  md: (m: Meeting) => string;
  pushToClient: (m: Meeting, key: string, val: string) => void;
  openNamerFor: (target: { k: string; label: string; meta: string; hint: string; seed: number; suggest: string[] }) => void;
  scheduleMeeting: () => void;
  loadScheduled: (id: string, startNow: boolean) => void;
  removeScheduled: (id: string) => void;
  publishMeeting: (id: string) => void;
  unpublishMeeting: (id: string) => void;
  login: (email: string, password: string) => void;
  acceptInvite: (token: string, name: string, password: string) => void;
  logout: () => void;
}

const asPerson = (k: string) => P[k as PersonKey];

function publishState(s: AppState, m: Meeting) {
  const override = s.publishOverrides[m.id];
  if (override) return { published: override.published, by: override.by, at: override.at };
  return { published: !!m.published, by: m.publishedBy || '', at: m.publishedAt || '' };
}

function formatWhen(dateStr: string, timeStr: string): string {
  if (!dateStr) return 'not set';
  const target = new Date(dateStr + 'T' + (timeStr || '00:00'));
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86400000);
  const dayLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : target.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + target.getDate() + ' ' + target.toLocaleDateString('en-GB', { month: 'short' });
  return timeStr ? dayLabel + ' · ' + timeStr : dayLabel;
}

export function buildView(s: AppState, methods: Methods) {
  const { patch, go, open, ask, speaker, md, pushToClient, toggleRecord, openNamerFor, scheduleMeeting, loadScheduled, removeScheduled, publishMeeting, unpublishMeeting, login, acceptInvite, logout } =
    methods;
  const dark = s.theme === 'dark';
  const ALL: Meeting[] = [...s.newMeetings, ...s.meetings];
  const EMPTY_MEETING: Meeting = {
    id: '',
    title: 'No meetings yet',
    client: '',
    practice: 'Internal',
    dow: '',
    day: '',
    mon: '',
    time: '',
    dur: '0 min',
    dec: 0,
    act: 0,
    people: [],
    unknown: 0,
    summary: 'Record your first meeting to see it here.',
    decisions: [],
    objective: '',
    objectiveCite: '',
    gaps: [],
    actions: [],
    fields: [],
    lines: []
  };
  const cur = ALL.find((m) => m.id === s.meetingId) || ALL[0] || EMPTY_MEETING;
  const q = s.query.trim().toLowerCase();

  const decorate = (m: Meeting) => {
    // For the seed data this mirrors the original hardcoded '?1' check ('?1' is
    // the one recurring unnamed voice across the Hartline demo meetings). For a
    // real recording every unnamed speaker key is scoped to that meeting, so this
    // recomputes from the meeting's own lines instead of the demo-only key.
    const unresolvedKeys = new Set(m.lines.filter((l) => l.k[0] === '?' && !s.voiceNames[l.k]).map((l) => l.k));
    const pub = publishState(s, m);
    return {
      ...m,
      published: pub.published,
      publishedBy: pub.by,
      publishedAt: pub.at,
      statusLabel: pub.published ? 'PUBLISHED' : 'DRAFT',
      statusBg: pub.published ? 'rgba(39,172,83,.12)' : 'rgba(255,106,0,.12)',
      statusFg: pub.published ? '#27AC53' : '#FF6A00',
      title: s.titles[m.id] || m.title,
      day: m.day,
      dur: hm(m.dur),
      pColor: PR[m.practice].c,
      pTint: PR[m.practice].t,
      unknown: unresolvedKeys.size > 0,
      unknownLabel: unresolvedKeys.size + ' unnamed voice' + (unresolvedKeys.size > 1 ? 's' : ''),
      freshDisplay: s.justFinished === m.id ? 'inline-block' : 'none',
      freshLabel: m.stage === 'analysing' ? 'TRANSCRIPT READY' : 'JUST RECORDED',
      dec: m.decisions.length,
      act: m.actions.length,
      stats:
        m.stage === 'transcribing'
          ? 'transcribing…'
          : m.stage === 'analysing'
            ? 'transcript ready · analysing'
            : m.decisions.length + (m.decisions.length === 1 ? ' decision · ' : ' decisions · ') + m.actions.length + (m.actions.length === 1 ? ' action' : ' actions'),
      border: s.justFinished === m.id ? AQ2 : 'var(--line)',
      bg: s.justFinished === m.id ? 'var(--tint)' : 'var(--panel)',
      glow: s.justFinished === m.id ? '0 0 0 3px rgba(90,195,167,.18)' : 'none',
      people: m.people.map((k) => ({ ini: ini(asPerson(k).n), name: asPerson(k).n.split(' ')[0], color: asPerson(k).c })),
      open: () => open(m.id)
    };
  };

  let shown = ALL;
  if (s.client) shown = shown.filter((m) => m.client === s.client);
  if (s.practice) shown = shown.filter((m) => m.practice === s.practice);
  const draftCount = ALL.filter((m) => !publishState(s, m).published).length;
  const publishedCount = ALL.length - draftCount;
  if (s.publishFilter === 'drafts') shown = shown.filter((m) => !publishState(s, m).published);
  if (s.publishFilter === 'published') shown = shown.filter((m) => publishState(s, m).published);

  const clientList = [...new Set([...Object.keys(s.clientData), ...s.meetings.map((m) => m.client)])].map((c, i) => ({
    name: c,
    count: s.meetings.filter((m) => m.client === c).length,
    dot: CLIENT_DOT_COLORS[i % CLIENT_DOT_COLORS.length],
    archivedNow: s.archived.includes(c),
    bg: s.client === c ? 'var(--tint)' : 'transparent',
    fg: s.client === c ? 'var(--ink)' : 'var(--ink2)',
    pick: () => patch({ client: s.client === c ? null : c, screen: 'library', query: '' }),
    toggleArchive: () => {
      const willArchive = !s.archived.includes(c);
      patch((p) => ({
        archived: p.archived.includes(c) ? p.archived.filter((x) => x !== c) : [...p.archived, c],
        archiveOpen: p.archived.includes(c) ? p.archiveOpen : true,
        client: p.client === c ? null : p.client
      }));
      if (s.authToken && s.clientIds[c]) clientsApi.archive(s.clientIds[c], willArchive).catch(() => {});
    }
  }));

  const results: {
    pre: string;
    hit: string;
    post: string;
    who: string;
    ini: string;
    color: string;
    at: string;
    meeting: string;
    open: () => void;
  }[] = [];
  if (q.length > 1) {
    s.meetings.forEach((m) => {
      m.lines.forEach((l) => {
        const idx = l.text.toLowerCase().indexOf(q);
        const sp = speaker(l.k);
        const inName = sp.name.toLowerCase().includes(q) || m.client.toLowerCase().includes(q);
        if (idx >= 0 || inName) {
          const at = idx >= 0 ? idx : 0;
          results.push({
            pre: idx >= 0 ? l.text.slice(Math.max(0, at - 70), at) : l.text.slice(0, 90),
            hit: idx >= 0 ? l.text.slice(at, at + q.length) : '',
            post: idx >= 0 ? l.text.slice(at + q.length, at + q.length + 120) + '…' : '…',
            who: sp.name,
            ini: ini(sp.name),
            color: sp.color,
            at: l.t,
            meeting: m.client + ' · ' + m.title,
            open: () => open(m.id)
          });
        }
      });
    });
  }

  // Demo meetings use a small fixed list of recurring unnamed voices. Real
  // recordings have no cross-meeting voice matching (see chat), so every
  // unnamed speaker key is scoped to its one meeting — surface those too.
  const dynamicPending: (typeof PENDING_VOICE_DEFS)[number][] = [];
  const seenDynamic = new Set<string>();
  ALL.forEach((m) => {
    m.lines.forEach((l, idx) => {
      if (l.k[0] === '?' && l.k.includes(':') && !s.voiceNames[l.k] && !seenDynamic.has(l.k)) {
        seenDynamic.add(l.k);
        const idxPart = l.k.slice(l.k.lastIndexOf(':') + 1);
        const n = Number(idxPart);
        dynamicPending.push({
          k: l.k,
          label: 'VOICE ' + (Number.isFinite(n) ? n + 1 : idxPart),
          meta: '1 meeting · ' + (s.titles[m.id] || m.title),
          hint: 'From your recording — name this speaker to apply it across this meeting.',
          seed: ((m.id.length + idx) % 7) + 1,
          suggest: []
        });
      }
    });
  });
  const pendingVoices = [...PENDING_VOICE_DEFS.filter((v) => !s.voiceNames[v.k]), ...dynamicPending];

  const knownVoices = [
    ...Object.keys(P).map((k) => ({ name: asPerson(k).n, ini: ini(asPerson(k).n), color: asPerson(k).c, meta: asPerson(k).r, match: '99%' })),
    ...Object.entries(s.voiceNames).map(([k, n]) => ({ name: n, ini: ini(n), color: '#0195BD', meta: 'named by you · ' + k, match: 'new' }))
  ];

  const navDef = [
    { key: 'library' as ScreenKey, label: 'Timeline', icon: '◷', badge: null as string | null },
    { key: 'prep' as ScreenKey, label: 'Prep a meeting', icon: '✎', badge: null as string | null },
    { key: 'clients' as ScreenKey, label: 'Clients', icon: '▣', badge: null as string | null },
    { key: 'voices' as ScreenKey, label: 'Voices', icon: '◍', badge: pendingVoices.length ? String(pendingVoices.length) : null },
    { key: 'export' as ScreenKey, label: 'Knowledge base', icon: '▤', badge: null as string | null },
    { key: 'team' as ScreenKey, label: 'Team & seats', icon: '◇', badge: s.team.some((t) => t.status === 'pending') ? '1' : null },
    { key: 'settings' as ScreenKey, label: 'Capture & policy', icon: '◎', badge: null as string | null }
  ];

  const narrow = s.w < 1120;
  const collapsed = s.w < 880;
  const railOpen = narrow ? s.railOpen : true;
  const meRow = s.team.find((t) => t.email === s.me) || s.team[0];
  const meName = meRow.k ? asPerson(meRow.k).n : meRow.name!;
  const isOwner = meRow.role === 'Owner';
  const isAdmin = isOwner || meRow.role === 'Admin';

  const note = (email: string, msg: string) => {
    patch((p) => ({ rowNote: { ...p.rowNote, [email]: msg } }));
    setTimeout(() => {
      patch((p) => {
        const r = { ...p.rowNote };
        delete r[email];
        return { rowNote: r };
      });
    }, 1800);
  };

  return {
    authed: !!s.authUser,
    authView: s.authView,
    goLogin: () => patch({ authView: 'login', authError: null }),
    goAcceptInvite: () => patch({ authView: 'accept-invite', authError: null }),
    authEmail: s.authEmail,
    onAuthEmail: (v: string) => patch({ authEmail: v }),
    authPassword: s.authPassword,
    onAuthPassword: (v: string) => patch({ authPassword: v }),
    authName: s.authName,
    onAuthName: (v: string) => patch({ authName: v }),
    authInviteToken: s.authInviteToken,
    onAuthInviteToken: (v: string) => patch({ authInviteToken: v }),
    authError: s.authError,
    authLoading: s.authLoading,
    authLoginReady: !!(s.authEmail.trim() && s.authPassword),
    authAcceptReady: !!(s.authInviteToken.trim() && s.authName.trim() && s.authPassword.length >= 8),
    submitLogin: () => login(s.authEmail.trim(), s.authPassword),
    submitAcceptInvite: () => acceptInvite(s.authInviteToken.trim(), s.authName.trim(), s.authPassword),
    logout,

    meName,
    meIni: ini(meName),
    meRole: isOwner ? 'Owner · full control' : meRow.role + (meRow.scope === 'attended' ? ' · attended only' : ' · full library'),
    meRoleColor: isOwner ? AQ2 : 'var(--ink3)',
    meAvatarBg: isOwner ? 'linear-gradient(135deg,#4192B9,#5AC3A7)' : meRow.k ? asPerson(meRow.k).c : '#8A9AA3',
    accountMenu: s.accountMenu,
    toggleAccountMenu: () => patch((p) => ({ accountMenu: !p.accountMenu })),
    accountLinks: [
      { label: 'Capture & policy', icon: '◎', key: 'settings' as ScreenKey, meta: isOwner ? '' : 'read-only' },
      { label: 'Team & seats', icon: '◇', key: 'team' as ScreenKey, meta: s.team.filter((t) => t.status === 'active').length + ' seats' },
      { label: 'Clients', icon: '▣', key: 'clients' as ScreenKey, meta: String(Object.keys(s.clientData).length) },
      { label: 'Knowledge base', icon: '▤', key: 'export' as ScreenKey, meta: s.meetings.length + ' files' },
      { label: 'Voices', icon: '◍', key: 'voices' as ScreenKey, meta: '' }
    ].map((a) => ({ ...a, go: () => patch({ screen: a.key, query: '', accountMenu: false }) })),
    themeOpts: (['light', 'dark'] as const).map((t) => ({
      label: t === 'light' ? 'Light' : 'Dark',
      pick: () => patch({ theme: t }),
      bg: s.theme === t ? 'var(--tint)' : 'transparent',
      fg: s.theme === t ? 'var(--ink)' : 'var(--ink2)',
      border: s.theme === t ? AQ1 : 'var(--line)'
    })),
    accountList: s.team
      .filter((t) => t.status === 'active')
      .map((t) => {
        const nm = t.k ? asPerson(t.k).n : t.name!;
        return {
          name: nm,
          ini: ini(nm),
          color: t.k ? asPerson(t.k).c : '#8A9AA3',
          role: t.role,
          bg: s.me === t.email ? 'var(--tint)' : 'transparent',
          pick: () => patch({ me: t.email, accountMenu: false })
        };
      }),
    ownerBanner: isOwner
      ? 'You are the owner. You can promote or demote admins, change any member’s library access, and transfer ownership.'
      : 'Signed in as ' + meName + ' (' + meRow.role + '). Only the owner, Lana Marov, can change roles or library access.',
    ownerBannerBg: isOwner ? 'var(--tint)' : 'rgba(255,106,0,.06)',
    ownerBannerBorder: isOwner ? 'var(--line2)' : 'rgba(255,106,0,.3)',
    ownerBannerDot: isOwner ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : '#FF6A00',
    policyIntro: 'Capture and retention are owner-controlled and apply to every Maverio account.',
    policyBanner: isOwner
      ? 'You can change every setting here. Changes take effect on all seats at their next launch.'
      : 'Read-only for ' + meRow.role.toLowerCase() + ' accounts — ask Lana Marov to change a policy.',
    narrow,
    collapsed,
    railOpen,
    sideW: collapsed ? '62px' : '214px',
    showLabels: collapsed ? 'none' : 'block',
    navJustify: collapsed ? 'center' : 'flex-start',
    clientsDisplay: collapsed ? 'none' : 'flex',
    railPos: narrow ? 'absolute' : 'static',
    railW: narrow ? 'min(340px,86%)' : 'clamp(288px,26%,352px)',
    railShadow: narrow ? '-20px 0 56px rgba(0,0,0,.3)' : 'none',
    scrim: narrow && railOpen,
    toggleRail: () => patch((p) => ({ railOpen: !p.railOpen })),
    railBtnBg: railOpen && narrow ? 'var(--tint)' : 'var(--panel3)',
    railBtnFg: railOpen && narrow ? 'var(--ink)' : 'var(--ink2)',
    backDisplay: (() => {
      if (s.screen === 'meeting' || s.screen === 'search') return 'flex';
      if (s.screen === 'clients' && s.clientMode !== 'list') return 'flex';
      return 'none';
    })(),
    chromeTitleDisplay: s.screen === 'meeting' || s.screen === 'search' || (s.screen === 'clients' && s.clientMode !== 'list') ? 'none' : 'block',
    backLabel: (() => {
      if (s.screen === 'meeting') return 'Timeline';
      if (s.screen === 'search') return 'Timeline';
      if (s.screen === 'clients') return s.clientMode === 'edit' && s.clientSel ? s.clientSel : 'Clients';
      return 'Back';
    })(),
    goBack: () => {
      if (s.screen === 'clients') {
        if (s.clientMode === 'edit') return patch({ clientMode: s.clientSel ? 'detail' : 'list', clientSaved: false });
        return patch({ clientMode: 'list', clientSel: null, clientSaved: false });
      }
      patch({ screen: 'library', query: '' });
    },
    theme: s.theme,
    themeIcon: dark ? '☀' : '☾',
    toggleTheme: () => patch({ theme: dark ? 'light' : 'dark' }),
    query: s.query,
    onQuery: (v: string) => patch({ query: v, screen: v.trim() ? 'search' : 'library' }),

    recording: s.recording,
    toggleRecord,
    micOnly: s.captureMode === 'mic-only',
    captureError: s.captureError,
    dismissCaptureError: () => patch({ captureError: null }),
    analysisError: s.analysisError,
    dismissAnalysisError: () => patch({ analysisError: null }),
    recLabel: s.recording ? 'Recording' : 'Record',
    recBg: s.recording ? 'rgba(255,106,0,.13)' : 'var(--panel3)',
    recFg: s.recording ? '#FF6A00' : 'var(--ink)',
    recDot: s.recording ? '#FF6A00' : 'var(--ink3)',
    recAnim: s.recording ? 'recdot 1.3s ease-in-out infinite' : 'none',
    elapsed:
      s.secs >= 3600
        ? Math.floor(s.secs / 3600) + 'h ' + String(Math.floor(s.secs / 60) % 60).padStart(2, '0') + 'm ' + String(s.secs % 60).padStart(2, '0') + 's'
        : String(Math.floor(s.secs / 60)).padStart(2, '0') + ':' + String(s.secs % 60).padStart(2, '0'),
    liveSpeakers: (() => {
      const roster = [
        ...s.attendees.map((k) => ({ name: asPerson(k).n.split(' ')[0], ini: ini(asPerson(k).n), color: asPerson(k).c, known: true })),
        ...Array.from({ length: s.guests }, (_, i) => ({ name: 'VOICE ' + (i + 1), ini: '?', color: '#8A9AA3', known: false }))
      ];
      const detected = roster.filter((_, i) => s.secs >= 3 + i * 6);
      const live = detected.length ? Math.floor(s.secs / 7) % detected.length : 0;
      return detected.map((p, i) => ({
        ...p,
        bg: i === live ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.26)',
        op: i === live ? '1' : '.5',
        chipBg: i === live ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)',
        chipBorder: i === live ? 'rgba(255,255,255,.3)' : 'transparent',
        nameFg: p.known ? (i === live ? '#fff' : 'rgba(255,255,255,.66)') : '#FFB000',
        bars: [
          { dur: (i === live ? 0.62 : 1.4) + 's', delay: '0s' },
          { dur: (i === live ? 0.5 : 1.6) + 's', delay: '.1s' },
          { dur: (i === live ? 0.7 : 1.3) + 's', delay: '.05s' },
          { dur: (i === live ? 0.55 : 1.5) + 's', delay: '.15s' }
        ]
      }));
    })(),
    pendingVoices: s.secs < 3 + (s.attendees.length + s.guests - 1) * 6,
    pendingLabel: s.secs < 3 ? 'listening…' : 'matching voiceprints…',

    nav: navDef.map((n) => ({
      ...n,
      go: () => go(n.key),
      bg: s.screen === n.key ? 'var(--tint)' : 'transparent',
      fg: s.screen === n.key ? 'var(--ink)' : 'var(--ink2)'
    })),
    clientsActive: clientList.filter((c) => !c.archivedNow),
    clientsArchived: clientList.filter((c) => c.archivedNow),
    activeCount: String(clientList.filter((c) => !c.archivedNow).length),
    archivedCount: String(clientList.filter((c) => c.archivedNow).length),
    noActiveClients: !clientList.some((c) => !c.archivedNow),
    noArchivedClients: !clientList.some((c) => c.archivedNow),
    toggleArchive: () => patch((p) => ({ archiveOpen: !p.archiveOpen })),
    archiveChevron: s.archiveOpen ? '180deg' : '0deg',
    archiveListDisplay: collapsed || !s.archiveOpen ? 'none' : 'flex',

    isLibrary: s.screen === 'library',
    isSearch: s.screen === 'search',
    isMeeting: s.screen === 'meeting',
    isVoices: s.screen === 'voices',
    isExport: s.screen === 'export',
    isSettings: s.screen === 'settings',

    shownMeetings: shown.map(decorate),
    resultLine: shown.length + ' meetings · ' + shown.reduce((a, m) => a + m.decisions.length, 0) + ' decisions · ' + shown.reduce((a, m) => a + m.actions.length, 0) + ' actions captured',
    practices: PRACTICES.map((p) => ({
      label: p,
      dot: PR[p].c,
      pick: () => patch({ practice: s.practice === p ? null : p, screen: 'library', query: '' }),
      bg: s.practice === p ? PR[p].t : 'transparent',
      fg: s.practice === p ? PR[p].c : 'var(--ink2)',
      border: s.practice === p ? PR[p].c : 'var(--line)'
    })),
    filterActive: !!(s.client || s.practice),
    clearFilters: () => patch({ client: null, practice: null }),
    publishFilters: (
      [
        { key: 'all' as const, label: 'All', count: ALL.length },
        { key: 'drafts' as const, label: 'Drafts', count: draftCount },
        { key: 'published' as const, label: 'Published', count: publishedCount }
      ]
    ).map((f) => ({
      label: f.label + ' (' + f.count + ')',
      pick: () => patch({ publishFilter: f.key }),
      bg: s.publishFilter === f.key ? 'var(--tint)' : 'transparent',
      fg: s.publishFilter === f.key ? 'var(--ink)' : 'var(--ink2)',
      border: s.publishFilter === f.key ? AQ1 : 'var(--line)'
    })),

    searchHeading: '“' + s.query + '”',
    searchSub: results.length + ' passages across ' + s.meetings.length + ' meetings · matched on transcript, speaker and client',
    searchResults: results.slice(0, 12),
    noResults: q.length > 1 && !results.length,

    cur: (() => {
      const fields = cur.fields.map((f, i) => {
        const key = cur.id + '|' + f.key;
        const ov = s.fieldEdits[key];
        const editing = s.editField === key;
        return {
          ...f,
          val: ov !== undefined ? ov : f.val,
          bg: i % 2 ? 'var(--panel2)' : 'var(--panel)',
          edited: ov !== undefined || !!(f as any).edited,
          editing,
          reading: !editing,
          draft: s.fieldDraft,
          start: () => patch({ editField: key, fieldDraft: ov !== undefined ? ov : f.val }),
          onDraft: (v: string) => patch({ fieldDraft: v }),
          cancel: () => patch({ editField: null, fieldDraft: '' }),
          save: () => {
            const v = s.fieldDraft.trim();
            if (!v) return patch({ editField: null, fieldDraft: '' });
            pushToClient(cur, f.key, v);
            patch((p) => ({ fieldEdits: { ...p.fieldEdits, [key]: v }, editField: null, fieldDraft: '' }));
            if (s.authToken) meetingsApi.editField(cur.id, f.key, v).catch(() => {});
          }
        };
      });
      const pub = publishState(s, cur);
      return {
        ...cur,
        published: pub.published,
        publishStatusLine: pub.published ? 'Published by ' + pub.by + ' · ' + pub.at : 'Draft — not yet in the knowledge base',
        publishStatusFg: pub.published ? '#27AC53' : '#FF6A00',
        publishStatusBg: pub.published ? 'rgba(39,172,83,.08)' : 'rgba(255,106,0,.06)',
        publishStatusBorder: pub.published ? 'rgba(39,172,83,.3)' : 'rgba(255,106,0,.3)',
        publishBtnLabel: pub.published ? 'Unpublish' : 'Publish to knowledge base',
        togglePublish: () => (pub.published ? unpublishMeeting(cur.id) : publishMeeting(cur.id)),
        title: s.titles[cur.id] || cur.title,
        pColor: PR[cur.practice].c,
        pTint: PR[cur.practice].t,
        metaLine:
          cur.dow.charAt(0) +
          cur.dow.slice(1).toLowerCase() +
          ' ' +
          cur.day +
          ' ' +
          cur.mon.charAt(0) +
          cur.mon.slice(1).toLowerCase() +
          ' · ' +
          cur.time +
          ' · ' +
          hm(cur.dur) +
          ' · captured from system audio + mic',
        decisions: cur.decisions,
        actions: cur.actions.map((a, i) => ({
          ...a,
          n: String(i + 1).padStart(2, '0'),
          ini: ini(asPerson(a.who).n),
          color: asPerson(a.who).c,
          who: asPerson(a.who).n,
          srcLabel: a.src ? 'heard at ' + a.src : 'no source line',
          dueFg: /not stated|no date/i.test(a.due || '') ? '#FF6A00' : 'var(--ink2)',
          dueBg: /not stated|no date/i.test(a.due || '') ? 'rgba(255,106,0,.11)' : 'var(--panel2)'
        })),
        fields,
        diarLine: (() => {
          const curUnresolved = new Set(cur.lines.filter((l) => l.k[0] === '?' && !s.voiceNames[l.k]).map((l) => l.k)).size;
          return cur.people.length + (curUnresolved > 0 ? ' known + ' + curUnresolved + ' unnamed' : '') + ' speakers separated automatically';
        })(),
        hasUnknown: cur.lines.some((l) => l.k[0] === '?' && !s.voiceNames[l.k]),
        lines: cur.lines.map((l, i) => {
          const sp = speaker(l.k);
          const unk = l.k[0] === '?' && !s.voiceNames[l.k];
          const same = i > 0 && cur.lines[i - 1].k === l.k;
          return {
            t: l.t,
            text: l.text,
            who: sp.name,
            ini: unk ? '?' : ini(sp.name),
            color: sp.color,
            conf: 'unnamed voice',
            nameColor: unk ? '#FF6A00' : 'var(--ink)',
            nameDisplay: same ? 'none' : 'flex',
            confDisplay: unk ? 'inline-block' : 'none',
            divider: i === 0 || same ? 'transparent' : 'var(--line2)'
          };
        }),
        markdown: md(cur)
      };
    })(),
    tabs: (
      [
        { k: 'summary', label: 'Summary' },
        { k: 'transcript', label: 'Transcript' },
        { k: 'export', label: 'Markdown for the LLM' }
      ] as const
    ).map((t) => ({
      label: t.label,
      go: () => patch({ tab: t.k }),
      line: s.tab === t.k ? AQ2 : 'transparent',
      fg: s.tab === t.k ? 'var(--ink)' : 'var(--ink3)'
    })),
    toggleFields: () => patch((p) => ({ fieldsOpen: !p.fieldsOpen })),
    fieldsDisplay: s.fieldsOpen ? 'block' : 'none',
    fieldsChevron: s.fieldsOpen ? '180deg' : '0deg',
    fieldsCount: cur.fields.length + ' rows',
    fieldsHint: s.fieldsOpen ? 'editable · syncs to the client profile' : 'show',
    fieldSyncOn: !!s.fieldSync,
    fieldSyncLabel: s.fieldSync ? 'Saved to ' + s.fieldSync.client + ' → ' + s.fieldSync.target : '',
    goClientFromField: () => {
      if (s.fieldSync) patch({ screen: 'clients', clientMode: 'detail', clientSel: s.fieldSync.client, query: '' });
    },
    tabSummary: s.tab === 'summary',
    tabTranscript: s.tab === 'transcript',
    tabExport: s.tab === 'export',
    analysing: cur.stage === 'analysing',
    transcribing: cur.stage === 'transcribing',
    editingTitle: s.editTitle,
    notEditingTitle: !s.editTitle,
    titleEdited: !!s.titles[cur.id] || cur.titleEdited,
    titleDraft: s.titleDraft,
    startEditTitle: () => patch({ editTitle: true, titleDraft: s.titles[cur.id] || cur.title }),
    onTitleDraft: (v: string) => patch({ titleDraft: v }),
    cancelEditTitle: () => patch({ editTitle: false, titleDraft: '' }),
    saveTitle: () => {
      const v = s.titleDraft.trim();
      if (!v) return patch({ editTitle: false });
      patch((p) => ({ titles: { ...p.titles, [cur.id]: v }, editTitle: false, titleDraft: '' }));
      if (s.authToken) meetingsApi.setTitle(cur.id, v).catch(() => {});
    },
    objective: cur.objective || 'No single objective was stated on this recording.',
    objectiveCite: cur.objectiveCite ? 'heard at ' + cur.objectiveCite : 'not stated aloud',
    actionCount: cur.actions.length + (cur.actions.length === 1 ? ' action heard' : ' actions heard'),
    hasGaps: !!(cur.gaps && cur.gaps.length),
    gapCount: (cur.gaps || []).length + ((cur.gaps || []).length === 1 ? ' question' : ' questions'),
    gaps: (cur.gaps || []).map((g, i) => {
      const key = cur.id + '-' + i;
      const ans = s.gapAnswers[key] || g.answer;
      return {
        ...g,
        n: String(i + 1).padStart(2, '0'),
        citeLabel: g.cite === 'not discussed' ? 'never discussed on the call' : 'heard at ' + g.cite,
        answered: !!ans,
        answer: ans || '',
        unanswered: !ans,
        draft: s.gapDraft[key] || '',
        onDraft: (v: string) => patch((p) => ({ gapDraft: { ...p.gapDraft, [key]: v } })),
        submit: () => {
          const v = (s.gapDraft[key] || '').trim();
          if (!v) return;
          patch((p) => ({ gapAnswers: { ...p.gapAnswers, [key]: v }, gapDraft: { ...p.gapDraft, [key]: '' } }));
          if (s.authToken) meetingsApi.answerGap(cur.id, i, v).catch(() => {});
        }
      };
    }),
    toggleRedactNames: () => patch({ redactNames: !s.redactNames }),
    redactNamesLabel: s.redactNames ? 'Names redacted' : 'Redact names',
    redactNamesBg: s.redactNames ? 'rgba(255,106,0,.12)' : 'var(--panel2)',
    redactNamesFg: s.redactNames ? '#FF6A00' : 'var(--ink)',
    redact: s.redact,
    toggleRedact: () => patch({ redact: !s.redact }),
    redactLabel: s.redact ? 'Fees redacted' : 'Redact fees',
    redactBg: s.redact ? 'rgba(255,106,0,.12)' : 'var(--panel2)',
    redactFg: s.redact ? '#FF6A00' : 'var(--ink)',
    copyMd: () => {
      if (navigator.clipboard) navigator.clipboard.writeText(md(cur));
      patch({ copied: true });
      setTimeout(() => patch({ copied: false }), 1600);
    },
    copyLabel: s.copied ? 'Copied ✓' : 'Copy markdown',

    voiceSub: pendingVoices.length + ' voiceprints waiting on a name · ' + knownVoices.length + ' known · names apply backwards across the whole library',
    hasPending: pendingVoices.length > 0,
    pending: pendingVoices.map((v) => {
      const on = s.playing === v.k;
      return {
        ...v,
        wave: wave(v.seed).map((w, i) => ({
          h: w.h,
          op: on ? '1' : '.7',
          anim: on ? 'lvl ' + (0.5 + ((i * 7) % 9) / 12).toFixed(2) + 's ease-in-out infinite ' + ((i % 6) * 0.07).toFixed(2) + 's' : 'none'
        })),
        play: () => patch((p) => ({ playing: p.playing === v.k ? null : v.k })),
        playIcon: on ? '❚❚' : '▶',
        playTitle: on ? 'Pause sample' : 'Play a 6-second sample of this voice',
        playBg: on ? 'linear-gradient(135deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
        playFg: on ? '#fff' : 'var(--ink2)',
        playBorder: on ? 'transparent' : 'var(--line)',
        playPad: on ? '0' : '2px',
        clip: on ? '0:02 / 0:06' : '0:06 sample',
        playState: on ? 'playing' : '',
        name: () => openNamerFor(v),
        merge: () => {
          patch((p) => ({ voiceNames: { ...p.voiceNames, [v.k]: 'Room audio (ignored)' }, playing: null }));
          if (s.authToken) meetingsApi.setVoiceName(v.k, 'Room audio (ignored)').catch(() => {});
        }
      };
    }),
    known: knownVoices,

    namerOpen: s.namerOpen,
    namerTitle: s.namerFor ? s.namerFor.label + ' · ' + s.namerFor.meta : '',
    namerHint: s.namerFor ? s.namerFor.hint : '',
    namerWave: wave(s.namerFor ? s.namerFor.seed : 1),
    namerSuggestions: (s.namerFor ? s.namerFor.suggest : []).map((n) => ({
      label: n,
      pick: () => patch({ namerDraft: n }),
      bg: s.namerDraft === n ? 'var(--tint)' : 'var(--panel2)',
      fg: s.namerDraft === n ? 'var(--ink)' : 'var(--ink2)',
      border: s.namerDraft === n ? AQ1 : 'var(--line)'
    })),
    namerDraft: s.namerDraft,
    onNamerDraft: (v: string) => patch({ namerDraft: v }),
    namerApplyAll: s.namerApplyAll,
    onNamerApplyAll: (v: boolean) => patch({ namerApplyAll: v }),
    // Demo voices (bare '?N' keys) recur across several seeded meetings, so naming
    // one really does apply "backwards" across a handful of past meetings. Real
    // per-meeting speakers ('?meetingId:N') only ever exist in that one meeting —
    // there's no cross-meeting voice matching yet — so hide the claim entirely.
    namerApplyAllVisible: !!(s.namerFor && !s.namerFor.k.includes(':')),
    namerApplyAllLabel: (() => {
      if (!s.namerFor) return '';
      const match = /^(\d+)/.exec(s.namerFor.meta);
      return match ? 'Apply to all ' + match[1] + ' past meetings with this voiceprint' : 'Apply to every past meeting with this voiceprint';
    })(),
    closeNamer: () => patch({ namerOpen: false }),
    openNamer: () => {
      const v = pendingVoices.find((x) => cur.lines.some((l) => l.k === x.k)) || pendingVoices[0];
      if (v) openNamerFor(v);
    },
    saveNamer: () => {
      const n = s.namerDraft.trim();
      if (!n || !s.namerFor) return patch({ namerOpen: false });
      const key = s.namerFor.k;
      patch((p) => ({ voiceNames: { ...p.voiceNames, [key]: n }, namerOpen: false }));
      if (s.authToken) meetingsApi.setVoiceName(key, n).catch(() => {});
    },

    stats: [
      { n: publishedCount + '/' + ALL.length, label: 'PUBLISHED · FILED' },
      { n: '41h', label: 'AUDIO CAPTURED' },
      { n: String(s.meetings.reduce((a, m) => a + m.dec, 0)), label: 'DECISIONS INDEXED' },
      { n: String(Object.keys(P).length), label: 'VOICEPRINTS' }
    ],
    corpus: ALL.filter((m) => publishState(s, m).published).map((m) => {
      const pub = publishState(s, m);
      return {
        file: m.date || m.mon.toLowerCase() + '-' + m.day + '-' + m.client.toLowerCase().replace(/[^a-z]+/g, '-') + '.md',
        meta: m.title + ' · ' + m.people.length + ' speakers · ' + hm(m.dur),
        publishStamp: 'Published by ' + pub.by + ' · ' + pub.at,
        practice: m.practice,
        pColor: PR[m.practice].c,
        pTint: PR[m.practice].t,
        size: (6 + m.lines.length * 1.4).toFixed(1) + ' KB',
        open: () => patch({ screen: 'meeting', meetingId: m.id, tab: 'export' })
      };
    }),
    draftsList: ALL.filter((m) => !publishState(s, m).published).map((m) => ({
      title: s.titles[m.id] || m.title,
      meta: m.client + ' · ' + m.title,
      practice: m.practice,
      pColor: PR[m.practice].c,
      pTint: PR[m.practice].t,
      review: () => patch({ screen: 'meeting', meetingId: m.id, tab: 'summary' }),
      publish: () => publishMeeting(m.id)
    })),
    goSettings: () => go('settings'),

    isClients: s.screen === 'clients',
    clientModeList: s.clientMode === 'list',
    clientModeForm: s.clientMode === 'new' || s.clientMode === 'edit',
    clientModeDetail: s.clientMode === 'detail',
    clientHeading: s.clientMode === 'new' ? 'Add a client' : s.clientMode === 'edit' ? 'Edit ' + s.clientSel : s.clientMode === 'detail' ? s.clientSel : 'Clients',
    clientSub:
      s.clientMode === 'new' || s.clientMode === 'edit'
        ? 'Everything here becomes part of the company database — and the people you list get voiceprint slots.'
        : s.clientMode === 'detail'
          ? ((s.clientData[s.clientSel!] || ({} as any)).practice || '') + ' · ' + ((s.clientData[s.clientSel!] || ({} as any)).stage || '') + ' · ' + s.meetings.filter((m) => m.client === s.clientSel).length + ' meetings on file'
          : Object.keys(s.clientData).length + ' clients · ' + s.meetings.length + ' meetings filed · every contact carries a voiceprint slot',
    clientBackDisplay: s.clientMode === 'list' ? 'none' : 'block',
    clientAddDisplay: s.clientMode === 'new' || s.clientMode === 'edit' ? 'none' : 'block',
    clientEditDisplay: s.clientMode === 'detail' ? 'block' : 'none',
    backToClients: () => patch({ clientMode: 'list', clientSel: null, clientSaved: false }),
    startEditClient: () => {
      const d = s.clientData[s.clientSel!] || ({} as any);
      patch({
        clientMode: 'edit',
        clientSaved: false,
        newClient: {
          name: s.clientSel!,
          practice: d.practice || 'Consulting',
          stage: d.stage || 'Discovery',
          address: d.address || '',
          phone: d.phone || '',
          site: d.site || '',
          notes: d.notes || ''
        },
        newContacts: (d.contacts || []).map((c: any) => ({ ...c }))
      });
    },
    cancelClientForm: () => patch({ clientMode: s.clientSel ? 'detail' : 'list', clientSaved: false }),
    saveIntro:
      s.clientMode === 'edit'
        ? 'Changes apply everywhere this client appears — the sidebar, the timeline, extracted fields, and the markdown the LLM ingests. People you add here get a voiceprint slot straight away.'
        : 'The client appears in the sidebar, every future recording can be filed to it, and each person listed here gets a voiceprint slot — so the first time they speak on a call, Recall proposes their name instead of "VOICE 1".',
    startNewClient: () =>
      patch({
        clientMode: 'new',
        clientSaved: false,
        newClient: { name: '', practice: 'Consulting', stage: 'Discovery', address: '', phone: '', site: '', notes: '' },
        newContacts: []
      }),
    clientCards: Object.keys(s.clientData)
      .filter((n) => !s.archived.includes(n))
      .map((name) => {
        const d = s.clientData[name];
        return {
          name,
          practice: d.practice,
          pColor: PR[d.practice].c,
          pTint: PR[d.practice].t,
          stage: d.stage,
          meetings: String(s.meetings.filter((m) => m.client === name).length),
          contactCount: String(d.contacts.length),
          open: () => patch({ clientMode: 'detail', clientSel: name })
        };
      }),
    archivedCards: Object.keys(s.clientData)
      .filter((n) => s.archived.includes(n))
      .map((name) => {
        const d = s.clientData[name];
        return {
          name,
          practice: d.practice,
          pColor: PR[d.practice].c,
          pTint: PR[d.practice].t,
          stage: d.stage,
          meetings: String(s.meetings.filter((m) => m.client === name).length),
          contactCount: String(d.contacts.length),
          restore: () => {
            patch((p) => ({ archived: p.archived.filter((x) => x !== name) }));
            if (s.authToken && s.clientIds[name]) clientsApi.archive(s.clientIds[name], false).catch(() => {});
          },
          open: () => patch({ clientMode: 'detail', clientSel: name })
        };
      }),
    hasArchivedCards: Object.keys(s.clientData).some((n) => s.archived.includes(n)),
    clientArchiveLabel: s.archived.includes(s.clientSel || '') ? 'Restore' : 'Archive',
    toggleArchiveSel: () => {
      const n = s.clientSel;
      if (!n) return;
      const willArchive = !s.archived.includes(n);
      patch((p) => ({ archived: p.archived.includes(n) ? p.archived.filter((x) => x !== n) : [...p.archived, n] }));
      if (s.authToken && s.clientIds[n]) clientsApi.archive(s.clientIds[n], willArchive).catch(() => {});
    },

    clientFields: [
      { key: 'name', label: 'COMPANY NAME', placeholder: 'e.g. Northgate Utilities' },
      { key: 'address', label: 'ADDRESS', placeholder: 'Street, city, postcode' },
      { key: 'phone', label: 'MAIN PHONE', placeholder: '+44 …' },
      { key: 'site', label: 'WEBSITE', placeholder: 'company.com' }
    ].map((f) => ({
      ...f,
      value: (s.newClient as any)[f.key],
      set: (v: string) => patch((p) => ({ newClient: { ...p.newClient, [f.key]: v } as any, clientSaved: false }))
    })),
    newNotes: s.newClient.notes,
    onNewNotes: (v: string) => patch((p) => ({ newClient: { ...p.newClient, notes: v } })),
    newPractices: PRACTICES.map((p) => ({
      label: p,
      dot: PR[p].c,
      pick: () => patch((x) => ({ newClient: { ...x.newClient, practice: p } })),
      bg: s.newClient.practice === p ? PR[p].t : 'transparent',
      fg: s.newClient.practice === p ? PR[p].c : 'var(--ink2)',
      border: s.newClient.practice === p ? PR[p].c : 'var(--line)'
    })),
    newStages: STAGES.map((g) => ({
      label: g,
      pick: () => patch((x) => ({ newClient: { ...x.newClient, stage: g } })),
      bg: s.newClient.stage === g ? 'var(--tint)' : 'transparent',
      fg: s.newClient.stage === g ? 'var(--ink)' : 'var(--ink2)',
      border: s.newClient.stage === g ? AQ1 : 'var(--line)'
    })),
    newContacts: s.newContacts.map((c, i) => ({
      ...c,
      ini: ini(c.name),
      color: CONTACT_COLORS[i % CONTACT_COLORS.length],
      line: [c.email, c.phone].filter(Boolean).join(' · ') || 'no contact details yet',
      remove: () => patch((p) => ({ newContacts: p.newContacts.filter((_, j) => j !== i) }))
    })),
    ctName: s.ctName,
    onCtName: (v: string) => patch({ ctName: v }),
    ctRole: s.ctRole,
    onCtRole: (v: string) => patch({ ctRole: v }),
    ctEmail: s.ctEmail,
    onCtEmail: (v: string) => patch({ ctEmail: v }),
    ctPhone: s.ctPhone,
    onCtPhone: (v: string) => patch({ ctPhone: v }),
    addContact: () => {
      const n = s.ctName.trim();
      if (!n) return;
      patch((p) => ({
        newContacts: [...p.newContacts, { name: n, role: p.ctRole.trim() || 'Contact', email: p.ctEmail.trim(), phone: p.ctPhone.trim() }],
        ctName: '',
        ctRole: '',
        ctEmail: '',
        ctPhone: ''
      }));
    },
    saveClientLabel: s.clientSaved ? 'Client saved ✓' : s.newClient.name.trim() ? 'Save client' : 'Add a company name first',
    saveClientBg: s.clientSaved ? 'rgba(39,172,83,.15)' : s.newClient.name.trim() ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
    saveClientFg: s.clientSaved ? '#27AC53' : s.newClient.name.trim() ? '#fff' : 'var(--ink3)',
    saveClient: () => {
      const n = s.newClient.name.trim();
      if (!n) return;
      const wasEditing = s.clientMode === 'edit';
      const priorSel = s.clientSel;
      patch((p) => {
        const data = { ...p.clientData };
        if (p.clientMode === 'edit' && p.clientSel && p.clientSel !== n) delete data[p.clientSel];
        data[n] = { ...p.newClient, contacts: p.newContacts } as any;
        return { clientData: data, clientSel: n, clientSaved: true };
      });
      setTimeout(() => patch({ clientMode: 'detail', clientSaved: false }), 700);
      if (s.authToken) {
        const body = {
          name: n,
          practice: s.newClient.practice,
          stage: s.newClient.stage,
          address: s.newClient.address,
          phone: s.newClient.phone,
          site: s.newClient.site,
          notes: s.newClient.notes,
          contacts: s.newContacts
        };
        if (wasEditing && priorSel && s.clientIds[priorSel]) {
          clientsApi.update(s.clientIds[priorSel], body).catch(() => {});
        } else {
          clientsApi
            .create(body)
            .then(({ client }) => patch((p) => ({ clientIds: { ...p.clientIds, [n]: client.id } })))
            .catch(() => {});
        }
      }
    },

    detailFacts: (() => {
      const d = (s.clientData[s.clientSel || ''] || {}) as any;
      const ms = s.meetings.filter((m) => m.client === s.clientSel);
      return [
        { k: 'practice', v: d.practice || '—' },
        { k: 'stage', v: d.stage || '—' },
        ...(d.decisionMaker ? [{ k: 'decision maker', v: d.decisionMaker }] : []),
        { k: 'address', v: d.address || 'not recorded' },
        { k: 'phone', v: d.phone || 'not recorded' },
        { k: 'website', v: d.site || 'not recorded' },
        { k: 'last meeting', v: ms.length ? ms[0].title + ' · ' + ms[0].day + ' ' + ms[0].mon : 'none yet' }
      ].map((f, i) => ({ ...f, bg: i % 2 ? 'var(--panel2)' : 'var(--panel)' }));
    })(),
    detailNotes: (() => {
      const base = (s.clientData[s.clientSel || ''] || ({} as any)).notes;
      const log = s.notesLog[s.clientSel || ''] || [];
      const all = [...log, ...(base ? [{ meta: 'CLIENT RECORD', text: base }] : [])];
      if (!all.length) all.push({ meta: 'NO NOTES YET', text: 'Nothing recorded for this client. Add the first note below.' });
      return all.map((n, i) => ({ ...n, divider: i === all.length - 1 ? 'transparent' : 'var(--line2)' }));
    })(),
    noteCount: (() => {
      const n = (s.notesLog[s.clientSel || ''] || []).length + ((s.clientData[s.clientSel || ''] || ({} as any)).notes ? 1 : 0);
      return n + (n === 1 ? ' note' : ' notes') + ' · scrolls';
    })(),
    noteDraft: s.noteDraft,
    onNoteDraft: (v: string) => patch({ noteDraft: v }),
    noteBtnLabel: s.noteSaved ? 'Note added ✓' : 'Add note',
    noteBtnBg: s.noteSaved ? 'rgba(39,172,83,.15)' : s.noteDraft.trim() ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
    noteBtnFg: s.noteSaved ? '#27AC53' : s.noteDraft.trim() ? '#fff' : 'var(--ink3)',
    addNote: () => {
      const v = s.noteDraft.trim();
      if (!v) return;
      const stamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
      patch((p) => ({
        notesLog: { ...p.notesLog, [p.clientSel!]: [{ meta: stamp + ' · ' + meName.toUpperCase(), text: v }, ...(p.notesLog[p.clientSel!] || [])] },
        noteDraft: '',
        noteSaved: true
      }));
      setTimeout(() => patch({ noteSaved: false }), 1600);
      const cid = s.clientSel && s.clientIds[s.clientSel];
      if (s.authToken && cid) clientsApi.addNote(cid, v).catch(() => {});
    },
    detailContacts: ((s.clientData[s.clientSel || ''] || ({} as any)).contacts || []).map((c: any, i: number) => {
      const known = Object.values(P).some((p) => p.n === c.name);
      return {
        ...c,
        ini: ini(c.name),
        color: CONTACT_COLORS[i % CONTACT_COLORS.length],
        line: [c.email, c.phone].filter(Boolean).join(' · ') || 'no contact details',
        vp: known ? 'voiceprint' : 'slot reserved',
        vpColor: known ? '#27AC53' : 'var(--ink3)',
        vpTint: known ? 'rgba(39,172,83,.12)' : 'var(--panel3)'
      };
    }),
    detailMeetings: [
      ...s.scheduledMeetings
        .filter((sm) => sm.client === s.clientSel)
        .map((sm) => ({
          title: sm.title,
          meta: formatWhen(sm.date, sm.time) + ' · ' + sm.type + (sm.place ? ' · ' + sm.place : ''),
          date: 'Scheduled',
          badge: 'SCHEDULED',
          open: () => loadScheduled(sm.id, false)
        })),
      ...s.meetings.filter((m) => m.client === s.clientSel).map((m) => ({
        title: m.title,
        meta: m.dec + (m.dec === 1 ? ' decision · ' : ' decisions · ') + m.act + (m.act === 1 ? ' action' : ' actions') + ' · ' + hm(m.dur),
        date: m.day + ' ' + m.mon,
        badge: '',
        open: () => open(m.id)
      }))
    ],

    isPrep: s.screen === 'prep',
    prepTitle: s.prepTitle,
    onPrepTitle: (v: string) => patch({ prepTitle: v }),
    prepClient: s.prepClient,
    onPrepClient: (v: string) => patch({ prepClient: v }),
    prepPractices: PRACTICES.map((p) => ({
      label: p,
      dot: PR[p].c,
      pick: () => patch({ prepPractice: p }),
      bg: s.prepPractice === p ? PR[p].t : 'transparent',
      fg: s.prepPractice === p ? PR[p].c : 'var(--ink2)',
      border: s.prepPractice === p ? PR[p].c : 'var(--line)'
    })),
    agenda: s.agenda.map((text, i) => ({
      text,
      n: String(i + 1).padStart(2, '0'),
      remove: () => patch((p) => ({ agenda: p.agenda.filter((_, j) => j !== i) }))
    })),
    agendaDraft: s.agendaDraft,
    onAgendaDraft: (v: string) => patch({ agendaDraft: v }),
    addAgenda: () => {
      const v = s.agendaDraft.trim();
      if (!v) return;
      patch((p) => ({ agenda: [...p.agenda, v], agendaDraft: '' }));
    },
    outcomes: s.outcomes.map((text, i) => ({
      text,
      remove: () => patch((p) => ({ outcomes: p.outcomes.filter((_, j) => j !== i) }))
    })),
    outcomeDraft: s.outcomeDraft,
    onOutcomeDraft: (v: string) => patch({ outcomeDraft: v }),
    addOutcome: () => {
      const v = s.outcomeDraft.trim();
      if (!v) return;
      patch((p) => ({ outcomes: [...p.outcomes, v], outcomeDraft: '' }));
    },
    voicePicks: Object.keys(P).map((k) => {
      const on = s.attendees.includes(k);
      return {
        name: asPerson(k).n.split(' ')[0],
        ini: ini(asPerson(k).n),
        color: asPerson(k).c,
        role: asPerson(k).r,
        toggle: () => patch((p) => ({ attendees: on ? p.attendees.filter((x) => x !== k) : [...p.attendees, k] })),
        bg: on ? 'var(--tint)' : 'transparent',
        fg: on ? 'var(--ink)' : 'var(--ink2)',
        border: on ? AQ1 : 'var(--line)'
      };
    }),
    guests: Array.from({ length: s.guests }, (_, i) => ({
      label: 'Expected guest ' + (i + 1),
      remove: () => patch((p) => ({ guests: Math.max(0, p.guests - 1) }))
    })),
    addGuest: () => patch((p) => ({ guests: p.guests + 1 })),
    attendeeCount: s.attendees.length + s.guests + ' voices · ' + s.attendees.length + ' known',
    briefTitle: (s.prepTitle || 'Untitled meeting') + ' · ' + s.prepClient,
    brief: [
      { k: 'capture', v: 'System audio + microphone · no plugin, no bot in the call' },
      { k: 'expecting', v: s.attendees.length + ' known voiceprints' + (s.guests ? ' + ' + s.guests + ' reserved slot' + (s.guests > 1 ? 's' : '') : '') },
      { k: 'agenda', v: s.agenda.length + ' item' + (s.agenda.length === 1 ? '' : 's') + ' → chapter markers' },
      { k: 'outcomes', v: s.outcomes.length + ' to verify against decisions' },
      { k: 'files to', v: s.prepClient + ' · ' + s.prepPractice },
      { k: 'retention', v: s.settings.keepAudio ? 'audio kept · transcript forever' : 'audio 30 days · transcript forever' }
    ],
    armMeeting: toggleRecord,
    armLabel: s.recording ? 'Recording — stop from the pill' : 'Arm & start recording',
    armBg: s.recording ? 'rgba(255,106,0,.14)' : 'linear-gradient(90deg,#4192B9,#5AC3A7)',
    armFg: s.recording ? '#FF6A00' : '#fff',
    discloseDisplay: s.settings.disclosure ? 'block' : 'none',

    scheduleDate: s.scheduleDate,
    onScheduleDate: (v: string) => patch({ scheduleDate: v }),
    scheduleTime: s.scheduleTime,
    onScheduleTime: (v: string) => patch({ scheduleTime: v }),
    scheduleDurations: DURATION_OPTIONS.map((mins) => ({
      label: hm(mins),
      pick: () => patch({ scheduleDuration: mins }),
      bg: s.scheduleDuration === mins ? 'var(--tint)' : 'transparent',
      fg: s.scheduleDuration === mins ? 'var(--ink)' : 'var(--ink2)',
      border: s.scheduleDuration === mins ? AQ1 : 'var(--line)'
    })),
    schedulePlace: s.schedulePlace,
    onSchedulePlace: (v: string) => patch({ schedulePlace: v }),
    scheduleTypes: MEETING_TYPES.map((t) => ({
      label: t,
      pick: () => patch({ scheduleType: t }),
      bg: s.scheduleType === t ? 'var(--tint)' : 'transparent',
      fg: s.scheduleType === t ? 'var(--ink)' : 'var(--ink2)',
      border: s.scheduleType === t ? AQ1 : 'var(--line)'
    })),
    scheduleReady: !!(s.scheduleDate && s.scheduleTime),
    scheduleMeeting,
    scheduleBtnLabel: s.scheduleSaved ? 'Scheduled ✓' : s.scheduleDate && s.scheduleTime ? 'Schedule meeting' : 'Set a date and time first',
    scheduleBtnBg: s.scheduleSaved ? 'rgba(39,172,83,.15)' : s.scheduleDate && s.scheduleTime ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : 'var(--panel3)',
    scheduleBtnFg: s.scheduleSaved ? '#27AC53' : s.scheduleDate && s.scheduleTime ? '#fff' : 'var(--ink3)',

    isTeam: s.screen === 'team',
    seatLine: (() => {
      const p = s.team.filter((t) => t.status === 'pending').length;
      return s.team.filter((t) => t.status === 'active').length + ' of 8 seats in use · ' + p + (p === 1 ? ' invite' : ' invites') + ' pending · workspace locked to @maverio.com';
    })(),
    inviteLink: 'recall.maverio.com/join/mv-8f2c41',
    copyLink: () => {
      if (navigator.clipboard) navigator.clipboard.writeText('https://recall.maverio.com/join/mv-8f2c41');
      patch({ copiedLink: true });
      setTimeout(() => patch({ copiedLink: false }), 1600);
    },
    copyLinkLabel: s.copiedLink ? 'Copied ✓' : 'Copy install link',
    inviteEmail: s.inviteEmail,
    onInviteEmail: (v: string) => patch({ inviteEmail: v, inviteSent: false }),
    inviteBorder: s.inviteEmail && !/@maverio\.com$/i.test(s.inviteEmail.trim()) ? '#FF6A00' : 'var(--line)',
    inviteHelp: !isAdmin
      ? 'Only the owner and admins can invite. Ask Lana Marov to add a seat.'
      : s.inviteEmail && !/@maverio\.com$/i.test(s.inviteEmail.trim())
        ? 'Outside addresses cannot be invited — the library is company-only.'
        : 'They get the install link by email, sign in with their Maverio account, and their voiceprint enrolls on their first recorded call.',
    inviteBtnLabel: s.inviteSent ? 'Invite sent ✓' : 'Send invite',
    inviteBtnBg: s.inviteSent ? 'rgba(39,172,83,.14)' : 'linear-gradient(90deg,#4192B9,#5AC3A7)',
    inviteBtnFg: s.inviteSent ? '#27AC53' : '#fff',
    scopes: (
      [
        { k: 'all' as const, label: 'Full library' },
        { k: 'attended' as const, label: 'Attended only' }
      ]
    ).map((c) => ({
      label: c.label,
      pick: () => patch({ inviteScope: c.k }),
      bg: s.inviteScope === c.k ? 'var(--tint)' : 'transparent',
      fg: s.inviteScope === c.k ? 'var(--ink)' : 'var(--ink2)',
      border: s.inviteScope === c.k ? AQ1 : 'var(--line)'
    })),
    roles: (['Member', 'Admin'] as const).map((r) => ({
      label: r,
      pick: () => patch({ inviteRole: r }),
      bg: s.inviteRole === r ? 'var(--tint)' : 'transparent',
      fg: s.inviteRole === r ? 'var(--ink)' : 'var(--ink2)',
      border: s.inviteRole === r ? AQ1 : 'var(--line)'
    })),
    onInvite: () => {
      const em = s.inviteEmail.trim();
      if (!isAdmin || !/@maverio\.com$/i.test(em)) return;
      const nm = em
        .split('@')[0]
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      patch((p) => ({
        team: [...p.team, { name: nm, email: em, role: p.inviteRole, status: 'pending', seen: 'invited just now', vp: 'awaiting first call', scope: p.inviteScope }],
        inviteEmail: '',
        inviteSent: true
      }));
      setTimeout(() => patch({ inviteSent: false }), 2200);
      if (s.authToken) {
        teamApi
          .invite(em, s.inviteRole, s.inviteScope)
          .then((res) => patch({ lastInviteToken: res.joinToken }))
          .catch(() => {});
      }
    },
    lastInviteToken: s.lastInviteToken,
    team: s.team.map((t) => {
      const nm = t.k ? asPerson(t.k).n : t.name!;
      const pend = t.status === 'pending';
      const owner = t.role === 'Owner';
      return {
        name: nm,
        ini: ini(nm),
        email: t.email,
        seen: t.seen,
        role: owner ? 'Owner · master admin' : pend ? 'Invited · ' + t.role : t.role,
        color: t.k ? asPerson(t.k).c : '#8A9AA3',
        rowBg: pend ? 'var(--panel2)' : 'var(--panel)',
        roleColor: owner ? '#fff' : pend ? '#FF6A00' : t.role === 'Admin' ? AQ1 : 'var(--ink3)',
        roleTint: owner ? 'linear-gradient(90deg,#4192B9,#5AC3A7)' : pend ? 'rgba(255,106,0,.12)' : t.role === 'Admin' ? 'var(--tint)' : 'var(--panel3)',
        scopeOpacity: owner || !isOwner ? '.5' : '1',
        scopeOpts: (
          [
            { k: 'all' as const, label: 'Full library' },
            { k: 'attended' as const, label: 'Attended only' }
          ]
        ).map((o) => ({
          label: o.label,
          title: owner ? 'The owner always has full access' : o.k === 'all' ? 'Reads every meeting ever recorded' : 'Only meetings this voiceprint appears in',
          bg: t.scope === o.k ? 'var(--tint)' : 'transparent',
          fg: t.scope === o.k ? 'var(--ink)' : 'var(--ink3)',
          pick: () => {
            if (owner) return note(t.email, 'Owner keeps full access');
            if (!isOwner) return note(t.email, 'Owner only');
            patch((p) => ({ team: p.team.map((x) => (x.email === t.email ? { ...x, scope: o.k } : x)) }));
            note(t.email, o.k === 'all' ? 'Full access ✓' : 'Attended only ✓');
          }
        })),
        voiceprint: t.vp,
        vpColor: t.vp === 'enrolled' ? '#27AC53' : 'var(--ink3)',
        vpTint: t.vp === 'enrolled' ? 'rgba(39,172,83,.12)' : 'var(--panel3)',
        actLabel: s.rowNote[t.email] || (owner ? 'Transfer ownership' : pend ? 'Resend' : t.role === 'Admin' ? 'Make member' : 'Make admin'),
        act: () => {
          if (owner) return note(t.email, isOwner ? 'Pick a member below' : 'Owner only');
          if (pend) return isAdmin ? note(t.email, 'Resent ✓') : note(t.email, 'Admins only');
          if (!isOwner) return note(t.email, 'Owner only');
          const next = t.role === 'Admin' ? 'Member' : 'Admin';
          patch((p) => ({ team: p.team.map((x) => (x.email === t.email ? { ...x, role: next } : x)) }));
          note(t.email, 'Now ' + next.toLowerCase() + ' ✓');
        }
      };
    }),

    settings: [
      { k: 'disclosure' as const, label: 'Disclosure prompt before recording', help: 'Shows you a one-line script to read at the top of the call. Required in all-party-consent jurisdictions.' },
      { k: 'autoCal' as const, label: 'Arm automatically for calendar meetings', help: 'Recall pre-arms when a meeting starts. You still press record — nothing captures itself.' },
      { k: 'sysAudio' as const, label: 'Capture system audio', help: 'Records the Mac output — works with any conferencing tool, no plugin or bot in the call.' },
      { k: 'mic' as const, label: 'Capture microphone', help: 'Your side of the conversation, separated as its own track for cleaner diarisation.' },
      { k: 'keepAudio' as const, label: 'Keep raw audio beyond 30 days', help: 'Off by default. Transcripts and structured fields are retained indefinitely for the knowledge base.' }
    ].map((x) => ({
      ...x,
      toggle: () => {
        if (!isOwner) return;
        patch((p) => ({ settings: { ...p.settings, [x.k]: !p.settings[x.k] } }));
      },
      title: isOwner ? '' : 'Only the owner can change this',
      opacity: isOwner ? '1' : '.45',
      cursor: isOwner ? 'pointer' : 'not-allowed',
      lockDisplay: isOwner ? 'none' : 'inline-block',
      track: s.settings[x.k] ? 'linear-gradient(90deg,' + AQ1 + ',' + AQ2 + ')' : 'var(--panel3)',
      knob: s.settings[x.k] ? '22px' : '3px'
    })),

    chat: s.chat.map((c) => ({
      tag: c.role === 'user' ? 'YOU' : 'RECALL',
      tagColor: c.role === 'user' ? 'var(--ink3)' : AQ2,
      text: c.text,
      fg: c.role === 'user' ? 'var(--ink)' : 'var(--ink2)',
      bg: c.role === 'user' ? 'var(--panel)' : 'transparent',
      border: c.role === 'user' ? 'var(--line)' : 'transparent',
      hasCites: !!(c.cites && c.cites.length),
      cites: (c.cites || []).map((x) => {
        const found = s.meetings.find((m) => m.id === x.id) || s.meetings[0];
        return { label: x.label, dot: found ? PR[found.practice].c : 'var(--ink3)', open: () => open(x.id) };
      })
    })),
    thinking: s.thinking,
    askScope:
      s.screen === 'meeting'
        ? 'Scoped to this meeting · switch to all ' + s.meetings.length + ' anytime'
        : 'All ' + s.meetings.length + ' meetings · ' + s.team.length + ' accounts · answers cite their source',
    prompts: [
      { label: 'What did we decide?', q: 'What did we decide recently?' },
      { label: 'Who owns what?', q: 'Who owns what actions right now?' },
      { label: 'Risks across clients', q: 'What risks keep coming up?' },
      { label: 'Hartline fee', q: 'What is the Hartline fee?' }
    ].map((p) => ({ label: p.label, ask: () => ask(p.q) })),
    draft: s.draft,
    onDraft: (v: string) => patch({ draft: v }),
    onSubmitAsk: () => ask(s.draft),
    backToLibrary: () => go('library'),

    railTab: s.railTab,
    isAskTab: s.railTab === 'ask',
    isScheduledTab: s.railTab === 'scheduled',
    goAskTab: () => patch({ railTab: 'ask' }),
    goScheduledTab: () => patch({ railTab: 'scheduled' }),
    scheduledCount: s.scheduledMeetings.length,
    scheduledList: [...s.scheduledMeetings]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((sm: ScheduledMeeting) => ({
        id: sm.id,
        title: sm.title,
        client: sm.client,
        practice: sm.practice,
        pColor: PR[sm.practice].c,
        pTint: PR[sm.practice].t,
        when: formatWhen(sm.date, sm.time),
        durationLabel: hm(sm.durationMin),
        place: sm.place || 'not set',
        type: sm.type,
        agendaCount: sm.agenda.length + (sm.agenda.length === 1 ? ' agenda item' : ' agenda items'),
        outcomeCount: sm.outcomes.length + (sm.outcomes.length === 1 ? ' outcome' : ' outcomes'),
        startNow: () => loadScheduled(sm.id, true),
        openPrep: () => loadScheduled(sm.id, false),
        remove: () => removeScheduled(sm.id)
      }))
  };
}
