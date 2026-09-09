import { useEffect, useRef, useState } from 'react';
import { ANSWERS, P, PR, hm, ini, replaceAll } from './data';
import type { Meeting, PersonKey, ScheduledMeeting } from './data';
import { createInitialState } from './initialState';
import type { AppState, NamerTarget, StatePatch } from './types';
import { buildView } from './derive';
import { loadPersisted, savePersisted } from './persistence';
import { startRecording, type ActiveRecording } from './capture';
import { authApi, clientsApi, meetingsApi, scheduledApi, setAuthToken, teamApi, uploadAudio } from './api';
import { mapClients, mapMeeting, mapScheduled, mapTeam } from './sync';
import { connectRealtime, disconnectRealtime, onRealtimeEvent } from './realtime';

export function useApp() {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const hydrated = useRef(false);
  const activeRecording = useRef<ActiveRecording | null>(null);

  const patch = (update: StatePatch) => {
    setState((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  };

  // Load anything saved from a previous session before persisting anything ourselves,
  // so we never clobber a saved file with the just-booted defaults.
  useEffect(() => {
    let cancelled = false;
    loadPersisted().then((saved) => {
      if (cancelled) return;
      if (saved) {
        const clientData = saved.clientData ?? stateRef.current.clientData;
        if (saved.clientMode === 'detail' && (!saved.clientSel || !clientData[saved.clientSel])) {
          saved.clientMode = 'list';
          saved.clientSel = null;
        }
        patch(saved);
      }
      hydrated.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => savePersisted(stateRef.current), 400);
    return () => window.clearTimeout(t);
  }, [state]);

  const syncAll = async () => {
    const [clientsRes, teamRes, meetingsRes, scheduledRes, voiceNamesRes] = await Promise.all([
      clientsApi.list(),
      teamApi.list(),
      meetingsApi.list(),
      scheduledApi.list(),
      meetingsApi.voiceNames()
    ]);
    const { clientData, nameToId, idToName } = mapClients(clientsRes.clients);
    patch({
      clientData,
      clientIds: nameToId,
      team: mapTeam(teamRes.members),
      meetings: meetingsRes.meetings.map((m) => mapMeeting(m, idToName)),
      scheduledMeetings: scheduledRes.scheduledMeetings.map((sm) => mapScheduled(sm, idToName)),
      voiceNames: voiceNamesRes.voiceNames,
      // The seeded demo Q&A cites a mock meeting that doesn't exist for a real team.
      chat: []
    });
  };

  // Auth: whenever the token changes (on login, on hydrating a saved session,
  // or on logout) reconcile the session and the realtime connection with it.
  useEffect(() => {
    const token = state.authToken;
    setAuthToken(token);
    if (!token) {
      disconnectRealtime();
      return;
    }
    let cancelled = false;
    authApi
      .me()
      .then(({ user }) => {
        if (cancelled) return;
        patch({ authUser: user });
        return syncAll();
      })
      .then(() => {
        if (cancelled) return;
        connectRealtime(token);
      })
      .catch(() => {
        if (cancelled) return;
        patch({ authToken: null, authUser: null });
      });
    return () => {
      cancelled = true;
    };
  }, [state.authToken]);

  // Realtime: any change from a teammate refetches the affected slice. At this
  // team's scale a light full-refetch per event is simpler and safe than
  // patching individual records, and stays correct if two events race.
  useEffect(() => {
    if (!state.authToken) return;
    return onRealtimeEvent((event) => {
      switch (event.type) {
        case 'meeting.created':
        case 'meeting.stage':
        case 'meeting.updated':
        case 'meeting.published': {
          const idToName = Object.fromEntries(Object.entries(stateRef.current.clientIds).map(([n, id]) => [id, n]));
          meetingsApi.list().then((res) => patch({ meetings: res.meetings.map((m) => mapMeeting(m, idToName)) }));
          break;
        }
        case 'client.updated':
          clientsApi.list().then((res) => {
            const { clientData, nameToId } = mapClients(res.clients);
            patch({ clientData, clientIds: nameToId });
          });
          break;
        case 'scheduled.created':
        case 'scheduled.removed': {
          const idToName = Object.fromEntries(Object.entries(stateRef.current.clientIds).map(([n, id]) => [id, n]));
          scheduledApi.list().then((res) => patch({ scheduledMeetings: res.scheduledMeetings.map((sm) => mapScheduled(sm, idToName)) }));
          break;
        }
        case 'team.invited':
        case 'team.joined':
          teamApi.list().then((res) => patch({ team: mapTeam(res.members) }));
          break;
      }
    });
  }, [state.authToken]);

  const login = async (email: string, password: string) => {
    patch({ authLoading: true, authError: null });
    try {
      const { token, user } = await authApi.login(email, password);
      patch({ authToken: token, authUser: user, authLoading: false, authPassword: '' });
    } catch (e) {
      patch({ authLoading: false, authError: e instanceof Error ? e.message : String(e) });
    }
  };

  const acceptInvite = async (token: string, name: string, password: string) => {
    patch({ authLoading: true, authError: null });
    try {
      const res = await authApi.acceptInvite(token, name, password);
      patch({ authToken: res.token, authUser: res.user, authLoading: false, authPassword: '' });
    } catch (e) {
      patch({ authLoading: false, authError: e instanceof Error ? e.message : String(e) });
    }
  };

  const logout = () => {
    disconnectRealtime();
    patch({ authToken: null, authUser: null, authEmail: '', authPassword: '', authName: '', authInviteToken: '' });
  };

  // componentDidMount: recording clock + window resize listener
  useEffect(() => {
    const t = window.setInterval(() => {
      if (stateRef.current.recording) patch((s) => ({ secs: s.secs + 1 }));
    }, 1000);
    const onResize = () => patch({ w: window.innerWidth });
    window.addEventListener('resize', onResize);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const go = (screen: AppState['screen']) => patch((s) => ({ screen, query: screen === 'search' ? s.query : '' }));

  const mockLines = (s: AppState) => {
    const who = s.attendees.length ? s.attendees : ['DO'];
    const guest = s.guests > 0 ? '?1' : who[who.length - 1];
    const ag = s.agenda.length ? s.agenda : ['the scope of the work'];
    const seq = [
      { k: who[0], t: '00:00:12', text: 'Thanks for making the time. I want to get through ' + ag.length + ' things today. First on the list: ' + ag[0] + '.' },
      { k: guest, t: '00:01:48', text: 'That works. Before we go into it, I should say the board is watching the cost line on this, so anything we commit to needs a number against it.' },
      { k: who[1] || who[0], t: '00:04:31', text: 'Understood. We can hold the first phase tight and only widen it once the numbers hold up — that keeps the exposure small on your side.' },
      { k: guest, t: '00:09:05', text: 'Then let us start there. ' + ag[0] + ' — I am comfortable with that as the starting point.' },
      { k: who[0], t: '00:14:22', text: 'Good. ' + (ag[1] || 'The data we need') + ' is the next dependency. Without it we are guessing at the baseline.' },
      { k: who[1] || who[0], t: '00:21:40', text: 'I will send the request in writing this week so your team has it in one place rather than over a call.' },
      { k: guest, t: '00:28:57', text: 'Send it to me and I will name someone on my side to own it. I do not want it sitting in a shared inbox.' },
      { k: who[0], t: '00:36:14', text: 'Last one — ' + (ag[ag.length - 1] || 'commercials') + '. I will put that in the follow-up note today so nothing is ambiguous.' },
      { k: guest, t: '00:41:03', text: 'Fine. Get the note over and I will come back with any changes by the end of the week.' }
    ];
    return seq.filter((l) => l.k) as Meeting['lines'];
  };

  const finishAnalysis = (id: string) => {
    patch((p) => ({
      newMeetings: p.newMeetings.map((m) => {
        if (m.id !== id) return m;
        const who = m.people as PersonKey[];
        const ag = p.agenda;
        const p1 = P[who[1] || who[0]].n;
        const decisions = [
          { text: (ag[0] || 'The opening scope') + ' — agreed as the starting point.', cite: '00:09:05 · unnamed voice' },
          { text: 'Anything committed carries a number against it; the board is watching the cost line.', cite: '00:01:48 · unnamed voice' },
          { text: 'The data request goes over in writing rather than over a call.', cite: '00:21:40 · ' + p1 }
        ];
        const actions = [
          { who: who[1] || who[0], text: 'Send the data request in writing', due: '“this week” — no date stated', src: '00:21:40 · ' + p1 },
          { who: who[0], text: 'Send the follow-up note covering ' + (ag[ag.length - 1] || 'commercials').toLowerCase(), due: 'today', src: '00:36:14 · ' + P[who[0]].n },
          { who: who[0], text: 'Collect the client-side owner’s name once nominated', due: 'not stated', src: '00:28:57 · unnamed voice' }
        ];
        const gaps = [
          { q: 'Who is the client-side owner of the data request?', why: 'They said they would name someone but no name was given on the call.', cite: '00:28:57 · unnamed voice' },
          { q: 'What figure sits against the commitment the board is watching?', why: 'A number was demanded for anything committed; none was said aloud.', cite: '00:01:48 · unnamed voice' },
          { q: 'What is the actual deadline behind “this week”?', why: 'The data request has no date on the recording.', cite: '00:21:40 · ' + p1 }
        ];
        return {
          ...m,
          stage: 'done' as const,
          dec: decisions.length,
          act: actions.length,
          decisions,
          actions,
          gaps,
          objective: 'Agree a narrow first step the client can fund without wider commitment.',
          objectiveCite: '00:04:31 · ' + p1,
          summary:
            'A deliberately narrow start. ' +
            (ag[0] || 'The opening scope') +
            ' was agreed as the first step, with any wider commitment gated on the numbers holding up. The client board is watching cost, so every commitment needs a figure attached. The blocking dependency is the data request, which goes over in writing this week against a named owner rather than a shared inbox. Commercials go into the follow-up note today.',
          fields: m.fields.map((f) =>
            f.val === 'analysing…'
              ? {
                  ...f,
                  val:
                    f.key === 'revenue_mentioned'
                      ? 'not discussed'
                      : f.key === 'risks'
                        ? 'board scrutiny on cost; baseline data not yet supplied'
                        : 'follow-up note today, data request this week'
                }
              : f
          )
        };
      })
    }));
  };

  const updateMeeting = (id: string, updater: (m: Meeting) => Meeting) => {
    patch((p) => ({ newMeetings: p.newMeetings.map((m) => (m.id === id ? updater(m) : m)) }));
  };

  const stopAndFile = async () => {
    const s = stateRef.current;
    const rec = activeRecording.current;
    activeRecording.current = null;
    const d = new Date();
    const id = 'n' + Date.now();
    const mins = Math.max(1, Math.round(s.secs / 60));
    const baseFields = [
      { key: 'client', val: s.prepClient || 'Unfiled' },
      { key: 'engagement_stage', val: s.prepPractice === 'Internal' ? 'n/a' : 'in progress' },
      { key: 'practice', val: s.prepPractice },
      { key: 'revenue_mentioned', val: 'analysing…' },
      { key: 'risks', val: 'analysing…' },
      { key: 'agenda_items', val: s.agenda.join(' · ') || 'none set' },
      { key: 'next_step', val: 'analysing…' },
      ...(s.captureMode === 'mic-only' ? [{ key: 'capture', val: 'microphone only — system audio was not captured for this recording' }] : [])
    ];
    const nmBase: Meeting = {
      id,
      title: s.prepTitle || 'Untitled recording',
      client: s.prepClient || 'Unfiled',
      practice: PR[s.prepPractice] ? s.prepPractice : 'Internal',
      dow: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
      day: String(d.getDate()),
      mon: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      dur: mins + ' min',
      durLabel: hm(mins),
      dec: 0,
      act: 0,
      people: s.attendees.slice(0, 4),
      unknown: s.guests,
      fresh: true,
      stage: 'analysing',
      summary: 'Analysing the transcript for decisions, actions and structured fields. The full transcript is ready to read now.',
      decisions: [],
      actions: [],
      objective: '',
      objectiveCite: '',
      gaps: [],
      fields: baseFields,
      lines: mockLines(s)
    };

    const usingBackend = !!(s.authToken && rec);
    const usingRealPipeline = !usingBackend && !!(window.recallAPI && rec);
    const nm: Meeting = usingRealPipeline || usingBackend
      ? { ...nmBase, stage: 'transcribing', lines: [], summary: 'Recording saved — transcribing now.' }
      : nmBase;

    patch((p) => ({
      recording: false,
      secs: 0,
      captureMode: null,
      newMeetings: [nm, ...p.newMeetings],
      screen: 'library',
      query: '',
      justFinished: id,
      client: null,
      practice: null
    }));

    if (usingBackend) {
      try {
        const { blob } = await rec!.stop();
        const clientId = s.clientIds[s.prepClient];
        const { meetingId } = await uploadAudio(blob, {
          title: s.prepTitle || 'Untitled recording',
          clientId,
          practice: PR[s.prepPractice] ? s.prepPractice : 'Internal',
          agenda: s.agenda,
          occurredAt: d.toISOString(),
          durationSeconds: s.secs
        });
        const idToName = Object.fromEntries(Object.entries(s.clientIds).map(([n, cid]) => [cid, n]));
        const { meeting } = await meetingsApi.get(meetingId);
        patch((p) => ({
          newMeetings: p.newMeetings.filter((m) => m.id !== id),
          meetings: [mapMeeting(meeting, idToName), ...p.meetings],
          justFinished: p.justFinished === id ? meetingId : p.justFinished,
          meetingId: p.meetingId === id ? meetingId : p.meetingId
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        patch({ analysisError: message });
        updateMeeting(id, (m) => ({ ...m, stage: 'done', summary: 'Something went wrong uploading this recording: ' + message }));
      }
      return;
    }

    if (!usingRealPipeline) {
      setTimeout(() => finishAnalysis(id), 9000);
      return;
    }

    try {
      const { arrayBuffer } = await rec!.stop();
      const filePath = await window.recallAPI!.saveRecording(arrayBuffer, id);
      const transcript = await window.recallAPI!.transcribe(filePath);
      // Deepgram speaker indices ('?0', '?1', ...) are only unique within this one
      // recording — scope the key to this meeting so naming one speaker never
      // bleeds into an unrelated speaker in a different meeting.
      const scopedLines = transcript.lines.map((l) => (l.k[0] === '?' ? { ...l, k: '?' + id + ':' + l.k.slice(1) } : l));
      updateMeeting(id, (m) => ({ ...m, lines: scopedLines, stage: 'analysing' }));

      const analysis = await window.recallAPI!.analyze(transcript.fullText, scopedLines, {
        title: s.prepTitle,
        client: s.prepClient,
        agenda: s.agenda
      });
      updateMeeting(id, (m) => ({
        ...m,
        stage: 'done',
        dec: analysis.decisions.length,
        act: analysis.actions.length,
        summary: analysis.summary,
        objective: analysis.objective,
        objectiveCite: analysis.objectiveCite,
        decisions: analysis.decisions,
        actions: analysis.actions,
        gaps: analysis.gaps,
        fields: m.fields.map((f) => (analysis.fields && f.key in analysis.fields ? { ...f, val: analysis.fields[f.key] } : f))
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      patch({ analysisError: message });
      updateMeeting(id, (m) => ({ ...m, stage: 'done', summary: 'Something went wrong processing this recording: ' + message }));
    }
  };

  const toggleRecord = async () => {
    if (stateRef.current.recording) {
      await stopAndFile();
      return;
    }
    patch({ captureError: null });
    try {
      const rec = await startRecording();
      activeRecording.current = rec;
      patch({ recording: true, secs: 0, captureMode: rec.systemAudioCaptured ? 'both' : 'mic-only' });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      patch({ captureError: 'Could not start recording: ' + message });
    }
  };

  const open = (id: string) => {
    const m = stateRef.current.newMeetings.find((x) => x.id === id);
    patch({
      screen: 'meeting',
      meetingId: id,
      tab: m && m.stage === 'analysing' ? 'transcript' : 'summary',
      query: '',
      justFinished: null,
      editTitle: false,
      titleDraft: '',
      editField: null,
      fieldDraft: ''
    });
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    const found = ANSWERS.find((a) => a.match.some((m) => q.toLowerCase().includes(m)));
    const a = found || {
      text: 'I could not find that discussed directly. The closest material is the Monday ops call, where capacity and the Growth iQ data-product idea were the live threads.',
      cites: [{ id: 'm3', label: 'Monday ops · 14:20' }]
    };
    patch((s) => ({ chat: [...s.chat, { role: 'user' as const, text: q }], draft: '', thinking: true }));
    setTimeout(() => {
      patch((s) => ({ thinking: false, chat: [...s.chat, { role: 'ai' as const, text: a.text, cites: a.cites }] }));
    }, 900);
  };

  const speaker = (k: string) => {
    if (k[0] === '?') {
      const named = stateRef.current.voiceNames[k];
      if (named) return { name: named, color: '#0195BD', conf: 'named by you' };
      // Demo data uses bare keys like '?1'; real per-meeting speakers use
      // '?<meetingId>:<index>' so naming never crosses between meetings.
      const rest = k.slice(1);
      const colon = rest.lastIndexOf(':');
      const label = colon === -1 ? rest : String(Number(rest.slice(colon + 1)) + 1);
      return { name: 'VOICE ' + label, color: '#8A9AA3', conf: '92% distinct' };
    }
    return { name: P[k as PersonKey].n, color: P[k as PersonKey].c, conf: 'voiceprint' };
  };

  const md = (m: Meeting) => {
    const s = stateRef.current;
    const r = s.redact;
    const rn = s.redactNames;
    const fe = s.fieldEdits;
    const ti = s.titles;
    m = { ...m, title: ti[m.id] || m.title, fields: m.fields.map((f) => (fe[m.id + '|' + f.key] !== undefined ? { ...f, val: fe[m.id + '|' + f.key] } : f)) };
    const money = r ? '[redacted]' : null;
    const keys = [...new Set(m.lines.map((l) => l.k).concat(m.actions.map((a) => a.who)))];
    const alias: Record<string, string> = {};
    keys.forEach((k, i) => {
      alias[speaker(k).name] = 'Speaker ' + String.fromCharCode(65 + i);
    });
    const anon = (t: string) => (rn ? Object.keys(alias).reduce((acc, n) => replaceAll(acc, n, alias[n]), t) : t);
    const f = m.fields.map((x) => '  ' + x.key + ': "' + (money && x.key === 'revenue_mentioned' ? money : anon(x.val)) + '"').join('\n');
    return (
      '---\n' +
      f +
      '\n  meeting_id: "' +
      m.id +
      '"\n  captured_by: "' +
      (rn ? '[redacted]' : 'lana@maverio.com') +
      '"\n  names_redacted: ' +
      (rn ? 'true' : 'false') +
      '\n  duration_min: ' +
      parseInt(m.dur, 10) +
      '\n---\n\n# ' +
      m.client +
      ' — ' +
      m.title +
      '\n\n## Key objective\n**' +
      anon(m.objective || 'Not stated on the recording.') +
      '**' +
      (m.objectiveCite ? '  \n_heard at ' + m.objectiveCite + '_' : '') +
      '\n\n## Summary\n' +
      anon(m.summary) +
      '\n\n## Decisions\n' +
      m.dec +
      ' recorded\n' +
      m.decisions.map((d) => '- ' + anon(d.text) + '  \n  _' + anon(d.cite) + '_').join('\n') +
      '\n\n## Actions\n' +
      m.actions.map((a) => '- [ ] **' + anon(P[a.who as PersonKey].n) + '** — ' + anon(a.text) + ' _(due ' + a.due + (a.src ? ' · heard at ' + a.src : '') + ')_').join('\n') +
      '\n\n## Not stated on the recording — needs a human answer\n' +
      (m.gaps && m.gaps.length ? m.gaps.map((g) => '- ' + anon(g.q) + '  \n  _' + anon(g.why) + '_').join('\n') : '- none') +
      '\n\n## Transcript\n' +
      m.lines
        .slice(0, 3)
        .map((l) => '**' + anon(speaker(l.k).name) + '** [' + l.t + '] ' + anon(l.text) + '')
        .join('\n\n') +
      '\n\n_…' +
      (m.lines.length - 3) +
      ' more turns_\n'
    );
  };

  const pushToClient = (m: Meeting, key: string, val: string) => {
    const client = m.client;
    const stamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
    patch((p) => {
      if (!p.clientData[client]) return { fieldSync: { key, client, target: 'no client profile — change stays on the meeting only' } };
      const data = { ...p.clientData };
      const rec = { ...data[client] };
      let target = 'client record note';
      if (key === 'engagement_stage') {
        rec.stage = val;
        target = 'client profile · stage';
      }
      if (key === 'practice' && PR[val as keyof typeof PR]) {
        rec.practice = val as typeof rec.practice;
        target = 'client profile · practice';
      }
      if (key === 'decision_maker') {
        rec.decisionMaker = val;
        target = 'client profile · decision maker';
      }
      data[client] = rec;
      return {
        clientData: data,
        notesLog: {
          ...p.notesLog,
          [client]: [{ meta: stamp + ' · FROM ' + (p.titles[m.id] || m.title).toUpperCase(), text: key.replace(/_/g, ' ') + ' updated to “' + val + '”' }, ...(p.notesLog[client] || [])]
        },
        fieldSync: { key, client, target }
      };
    });
    setTimeout(() => patch({ fieldSync: null }), 4000);
  };

  const openNamerFor = (target: NamerTarget) => patch({ namerOpen: true, namerFor: target, namerDraft: '' });

  const currentUserName = () => {
    const s = stateRef.current;
    const row = s.team.find((t) => t.email === s.me) || s.team[0];
    return row.k ? P[row.k].n : row.name || 'You';
  };

  const publishMeeting = (id: string) => {
    const at = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
    patch((p) => ({ publishOverrides: { ...p.publishOverrides, [id]: { published: true, by: currentUserName(), at } } }));
    if (stateRef.current.authToken) meetingsApi.publish(id, true).catch(() => {});
  };

  const unpublishMeeting = (id: string) => {
    patch((p) => ({ publishOverrides: { ...p.publishOverrides, [id]: { published: false, by: '', at: '' } } }));
    if (stateRef.current.authToken) meetingsApi.publish(id, false).catch(() => {});
  };

  const scheduleMeeting = () => {
    const s = stateRef.current;
    if (!s.scheduleDate || !s.scheduleTime) return;
    const nm: ScheduledMeeting = {
      id: 'sch' + Date.now(),
      title: s.prepTitle || 'Untitled meeting',
      client: s.prepClient || 'Unfiled',
      practice: PR[s.prepPractice] ? s.prepPractice : 'Internal',
      date: s.scheduleDate,
      time: s.scheduleTime,
      durationMin: s.scheduleDuration,
      place: s.schedulePlace,
      type: s.scheduleType,
      agenda: [...s.agenda],
      outcomes: [...s.outcomes],
      attendees: [...s.attendees],
      guests: s.guests
    };
    patch((p) => ({ scheduledMeetings: [...p.scheduledMeetings, nm], scheduleSaved: true }));
    setTimeout(() => {
      patch({ scheduleSaved: false, scheduleDate: '', scheduleTime: '', schedulePlace: '', scheduleDuration: 60, scheduleType: 'Video call' });
    }, 1200);

    const clientId = s.clientIds[nm.client];
    if (s.authToken && clientId) {
      scheduledApi
        .create({
          title: nm.title,
          clientId,
          practice: nm.practice,
          scheduledAt: new Date(nm.date + 'T' + nm.time).toISOString(),
          durationMin: nm.durationMin,
          place: nm.place,
          type: nm.type,
          agenda: nm.agenda,
          outcomes: nm.outcomes,
          attendees: nm.attendees,
          guests: nm.guests
        })
        .catch(() => {});
    }
  };

  const loadScheduled = (id: string, startNow: boolean) => {
    const sm = stateRef.current.scheduledMeetings.find((x) => x.id === id);
    if (!sm) return;
    patch((p) => ({
      scheduledMeetings: p.scheduledMeetings.filter((x) => x.id !== id),
      prepTitle: sm.title,
      prepClient: sm.client,
      prepPractice: sm.practice,
      agenda: [...sm.agenda],
      outcomes: [...sm.outcomes],
      attendees: [...sm.attendees],
      guests: sm.guests,
      scheduleDate: sm.date,
      scheduleTime: sm.time,
      scheduleDuration: sm.durationMin,
      schedulePlace: sm.place,
      scheduleType: sm.type,
      screen: 'prep',
      railTab: 'ask'
    }));
    if (stateRef.current.authToken) scheduledApi.remove(id).catch(() => {});
    if (startNow) toggleRecord();
  };

  const removeScheduled = (id: string) => {
    patch((p) => ({ scheduledMeetings: p.scheduledMeetings.filter((x) => x.id !== id) }));
    if (stateRef.current.authToken) scheduledApi.remove(id).catch(() => {});
  };

  const methods = {
    patch,
    go,
    stopAndFile,
    toggleRecord,
    open,
    ask,
    speaker,
    md,
    pushToClient,
    openNamerFor,
    scheduleMeeting,
    loadScheduled,
    removeScheduled,
    publishMeeting,
    unpublishMeeting,
    login,
    acceptInvite,
    logout
  };

  const view = buildView(state, methods);

  return { state, view };
}

export type UseAppReturn = ReturnType<typeof useApp>;
export type ViewModel = ReturnType<typeof buildView>;
