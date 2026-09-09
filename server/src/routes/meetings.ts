import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';

export const meetingsRouter = Router();
meetingsRouter.use(requireAuth);

function serializeMeeting(row: any, gapAnswers: any[], fieldEdits: any[]) {
  const gaps = (row.gaps || []).map((g: any, i: number) => {
    const ans = gapAnswers.find((a) => a.gap_index === i);
    return ans ? { ...g, answer: ans.answer, answeredBy: ans.answered_by, answeredAt: ans.answered_at } : g;
  });
  const fields = (row.fields || []).map((f: any) => {
    const edit = fieldEdits.find((e) => e.field_key === f.key);
    return edit ? { ...f, val: edit.value, edited: true, editedBy: edit.edited_by } : f;
  });
  return {
    id: row.id,
    title: row.title_override || row.title,
    titleEdited: !!row.title_override,
    clientId: row.client_id,
    practice: row.practice,
    occurredAt: row.occurred_at,
    durationSeconds: row.duration_seconds,
    stage: row.stage,
    people: row.people || [],
    unknownCount: row.unknown_count,
    summary: row.summary,
    objective: row.objective,
    objectiveCite: row.objective_cite,
    decisions: row.decisions || [],
    actions: row.actions || [],
    gaps,
    fields,
    lines: row.lines || [],
    published: row.published,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    pipelineError: row.pipeline_error,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

async function loadOverrides(meetingIds: string[]) {
  if (meetingIds.length === 0) return { gapAnswers: [], fieldEdits: [] };
  const gapAnswers = await pool.query('select * from gap_answers where meeting_id = any($1)', [meetingIds]);
  const fieldEdits = await pool.query('select * from field_edits where meeting_id = any($1)', [meetingIds]);
  return { gapAnswers: gapAnswers.rows, fieldEdits: fieldEdits.rows };
}

meetingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const meetings = await pool.query('select * from meetings order by occurred_at desc');
    const ids = meetings.rows.map((m) => m.id);
    const { gapAnswers, fieldEdits } = await loadOverrides(ids);
    res.json({
      meetings: meetings.rows.map((row) =>
        serializeMeeting(
          row,
          gapAnswers.filter((a) => a.meeting_id === row.id),
          fieldEdits.filter((e) => e.meeting_id === row.id)
        )
      )
    });
  })
);

meetingsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('select * from meetings where id = $1', [req.params.id]);
    if (!rows[0]) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }
    const { gapAnswers, fieldEdits } = await loadOverrides([req.params.id]);
    res.json({ meeting: serializeMeeting(rows[0], gapAnswers, fieldEdits) });
  })
);

meetingsRouter.patch(
  '/:id/title',
  asyncHandler(async (req, res) => {
    const title = z.object({ title: z.string().min(1) }).parse(req.body).title;
    await pool.query('update meetings set title_override = $2, title_edited_by = $3, title_edited_at = now() where id = $1', [
      req.params.id,
      title,
      req.user!.id
    ]);
    broadcast({ type: 'meeting.updated', meetingId: req.params.id });
    res.json({ ok: true });
  })
);

meetingsRouter.post(
  '/:id/gap-answers',
  asyncHandler(async (req, res) => {
    const body = z.object({ gapIndex: z.number().int(), answer: z.string().min(1) }).parse(req.body);
    await pool.query(
      `insert into gap_answers (meeting_id, gap_index, answer, answered_by)
       values ($1,$2,$3,$4)
       on conflict (meeting_id, gap_index) do update set answer = excluded.answer, answered_by = excluded.answered_by, answered_at = now()`,
      [req.params.id, body.gapIndex, body.answer, req.user!.id]
    );
    broadcast({ type: 'meeting.updated', meetingId: req.params.id });
    res.json({ ok: true });
  })
);

meetingsRouter.post(
  '/:id/field-edits',
  asyncHandler(async (req, res) => {
    const body = z.object({ key: z.string().min(1), value: z.string() }).parse(req.body);
    await pool.query(
      `insert into field_edits (meeting_id, field_key, value, edited_by)
       values ($1,$2,$3,$4)
       on conflict (meeting_id, field_key) do update set value = excluded.value, edited_by = excluded.edited_by, edited_at = now()`,
      [req.params.id, body.key, body.value, req.user!.id]
    );
    broadcast({ type: 'meeting.updated', meetingId: req.params.id });
    res.json({ ok: true });
  })
);

meetingsRouter.patch(
  '/:id/publish',
  asyncHandler(async (req, res) => {
    const published = z.object({ published: z.boolean() }).parse(req.body).published;
    if (published) {
      await pool.query('update meetings set published = true, published_by = $2, published_at = now() where id = $1', [
        req.params.id,
        req.user!.id
      ]);
    } else {
      await pool.query('update meetings set published = false, published_by = null, published_at = null where id = $1', [req.params.id]);
    }
    await audit(req.user!.id, published ? 'publish' : 'unpublish', 'meeting', req.params.id);
    broadcast({ type: 'meeting.published', meetingId: req.params.id, published });
    res.json({ ok: true });
  })
);

meetingsRouter.get(
  '/meta/voice-names',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('select key, name from voice_names');
    res.json({ voiceNames: Object.fromEntries(rows.map((r) => [r.key, r.name])) });
  })
);

meetingsRouter.put(
  '/meta/voice-names/:key',
  asyncHandler(async (req, res) => {
    const name = z.object({ name: z.string().min(1) }).parse(req.body).name;
    await pool.query(
      `insert into voice_names (key, name, updated_by) values ($1,$2,$3)
       on conflict (key) do update set name = excluded.name, updated_by = excluded.updated_by, updated_at = now()`,
      [req.params.key, name, req.user!.id]
    );
    broadcast({ type: 'meeting.updated', meetingId: 'voice-name:' + req.params.key });
    res.json({ ok: true });
  })
);
