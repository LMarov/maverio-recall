import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { answerQuestion, type AskDocument } from '../pipeline/ask';
import { asyncHandler } from '../util/asyncHandler';

export const askRouter = Router();
askRouter.use(requireAuth);

const MAX_MEETINGS = 50;

const askSchema = z.object({ question: z.string().min(1), meetingId: z.string().uuid().optional() });

function toDocument(row: any, clientName: string, includeLines: boolean): AskDocument {
  return {
    id: row.id,
    title: row.title_override || row.title,
    client: clientName,
    occurredAt: row.occurred_at,
    objective: row.objective || '',
    objectiveCite: row.objective_cite || '',
    summary: row.summary || '',
    decisions: row.decisions || [],
    actions: row.actions || [],
    gaps: row.gaps || [],
    lines: includeLines ? row.lines || [] : undefined
  };
}

askRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = askSchema.parse(req.body);

    let rows: any[];
    if (body.meetingId) {
      const { rows: r } = await pool.query('select * from meetings where id = $1', [body.meetingId]);
      rows = r;
    } else {
      const { rows: r } = await pool.query('select * from meetings order by occurred_at desc limit $1', [MAX_MEETINGS]);
      rows = r;
    }

    if (rows.length === 0) {
      res.json({ text: 'No meetings recorded yet — record one and ask me about it.', citations: [] });
      return;
    }

    const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))];
    const clients = clientIds.length ? await pool.query('select id, name from clients where id = any($1)', [clientIds]) : { rows: [] };
    const clientNameById = Object.fromEntries(clients.rows.map((c: any) => [c.id, c.name]));

    const docs = rows.map((r) => toDocument(r, clientNameById[r.client_id] || 'Unfiled', !!body.meetingId));
    const result = await answerQuestion(body.question, docs, !!body.meetingId);

    const titleById = Object.fromEntries(rows.map((r) => [r.id, r.title_override || r.title]));
    const citations = result.citations.map((c) => ({ id: c.meetingId, label: (titleById[c.meetingId] || 'Meeting') + ' · ' + c.quote }));

    res.json({ text: result.text, citations });
  })
);
