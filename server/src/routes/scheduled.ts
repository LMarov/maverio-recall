import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';

export const scheduledRouter = Router();
scheduledRouter.use(requireAuth);

function serialize(row: any) {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    practice: row.practice,
    scheduledAt: row.scheduled_at,
    durationMin: row.duration_min,
    place: row.place,
    type: row.type,
    agenda: row.agenda || [],
    outcomes: row.outcomes || [],
    attendees: row.attendees || [],
    guests: row.guests,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

scheduledRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('select * from scheduled_meetings order by scheduled_at asc');
    res.json({ scheduledMeetings: rows.map(serialize) });
  })
);

const createSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().uuid(),
  practice: z.enum(['Consulting', 'Growth iQ', 'Capability', 'Internal']),
  scheduledAt: z.string(),
  durationMin: z.number().int().positive(),
  place: z.string().optional(),
  type: z.enum(['In person', 'Video call', 'Phone']),
  agenda: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  attendees: z.array(z.string()).default([]),
  guests: z.number().int().min(0).default(0)
});

scheduledRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const inserted = await pool.query(
      `insert into scheduled_meetings (title, client_id, practice, scheduled_at, duration_min, place, type, agenda, outcomes, attendees, guests, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
      [
        body.title,
        body.clientId,
        body.practice,
        body.scheduledAt,
        body.durationMin,
        body.place || null,
        body.type,
        JSON.stringify(body.agenda),
        JSON.stringify(body.outcomes),
        JSON.stringify(body.attendees),
        body.guests,
        req.user!.id
      ]
    );
    const row = inserted.rows[0];
    broadcast({ type: 'scheduled.created', scheduledId: row.id });
    res.status(201).json({ scheduledMeeting: serialize(row) });
  })
);

scheduledRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await pool.query('delete from scheduled_meetings where id = $1', [req.params.id]);
    broadcast({ type: 'scheduled.removed', scheduledId: req.params.id });
    res.json({ ok: true });
  })
);
