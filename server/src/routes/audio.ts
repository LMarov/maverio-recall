import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { storage } from '../storage';
import { processRecording } from '../pipeline/process';
import { broadcast } from '../realtime/hub';
import { asyncHandler } from '../util/asyncHandler';

export const audioRouter = Router();
audioRouter.use(requireAuth);

const upload = multer({ limits: { fileSize: 1024 * 1024 * 500 } }); // 500MB ceiling per recording

const metaSchema = z.object({
  title: z.string().min(1),
  clientId: z.string().uuid().optional(),
  practice: z.enum(['Consulting', 'Growth iQ', 'Capability', 'Internal']),
  agenda: z.string().optional(), // JSON-encoded string[] (multipart form fields are strings)
  occurredAt: z.string().optional(),
  durationSeconds: z.number().int().optional()
});

// multipart/form-data: file field "audio", plus the metaSchema fields as form fields.
audioRouter.post(
  '/',
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Missing audio file' });
      return;
    }
    const body = metaSchema.parse({
      ...req.body,
      durationSeconds: req.body.durationSeconds ? Number(req.body.durationSeconds) : undefined
    });
    const agenda: string[] = body.agenda ? JSON.parse(body.agenda) : [];

    const storageKey = `meetings/${crypto.randomUUID()}/${Date.now()}.webm`;
    await storage.put(storageKey, req.file.buffer, req.file.mimetype);

    const inserted = await pool.query(
      `insert into meetings (title, client_id, practice, occurred_at, duration_seconds, stage, audio_storage_key, created_by)
       values ($1,$2,$3,$4,$5,'transcribing',$6,$7) returning id`,
      [body.title, body.clientId || null, body.practice, body.occurredAt || new Date().toISOString(), body.durationSeconds || null, storageKey, req.user!.id]
    );
    const meetingId = inserted.rows[0].id;
    broadcast({ type: 'meeting.created', meetingId });

    const clientRow = body.clientId ? await pool.query('select name from clients where id = $1', [body.clientId]) : { rows: [] as { name: string }[] };
    const clientName = clientRow.rows[0]?.name || '';

    // Don't block the response on the AI pipeline — the client watches for
    // meeting.stage / meeting.updated events over the websocket instead.
    void processRecording(meetingId, req.file.buffer, req.file.mimetype, { title: body.title, client: clientName, agenda });

    res.status(201).json({ meetingId });
  })
);

audioRouter.get(
  '/:key(.*)/url',
  asyncHandler(async (req, res) => {
    const url = await storage.getReadUrl(req.params.key);
    res.json({ url });
  })
);
