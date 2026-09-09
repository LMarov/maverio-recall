import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware';
import { pool } from '../db/pool';
import { audit } from '../util/audit';
import { asyncHandler } from '../util/asyncHandler';
import { broadcast } from '../realtime/hub';

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const clients = await pool.query('select * from clients order by name asc');
    const contacts = await pool.query('select * from client_contacts');
    const notes = await pool.query('select * from client_notes order by created_at asc');
    res.json({
      clients: clients.rows.map((c) => ({
        ...c,
        contacts: contacts.rows.filter((ct) => ct.client_id === c.id),
        notes: notes.rows.filter((n) => n.client_id === c.id)
      }))
    });
  })
);

const clientSchema = z.object({
  name: z.string().min(1),
  practice: z.enum(['Consulting', 'Growth iQ', 'Capability', 'Internal']),
  stage: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  site: z.string().optional(),
  notes: z.string().optional(),
  contacts: z.array(z.object({ name: z.string(), role: z.string().optional(), email: z.string().optional(), phone: z.string().optional() })).optional()
});

clientsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = clientSchema.parse(req.body);
    const client = await pool.connect();
    try {
      await client.query('begin');
      const inserted = await client.query(
        'insert into clients (name, practice, stage, address, phone, site, notes) values ($1,$2,$3,$4,$5,$6,$7) returning *',
        [body.name, body.practice, body.stage || null, body.address || null, body.phone || null, body.site || null, body.notes || null]
      );
      const row = inserted.rows[0];
      for (const c of body.contacts || []) {
        await client.query('insert into client_contacts (client_id, name, role, email, phone) values ($1,$2,$3,$4,$5)', [
          row.id,
          c.name,
          c.role || null,
          c.email || null,
          c.phone || null
        ]);
      }
      await client.query('commit');
      await audit(req.user!.id, 'create_client', 'client', row.id);
      broadcast({ type: 'client.updated', clientId: row.id });
      res.status(201).json({ client: row });
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  })
);

clientsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = clientSchema.partial().parse(req.body);
    const fields = Object.keys(body) as (keyof typeof body)[];
    if (fields.length === 0) {
      res.json({ ok: true });
      return;
    }
    const sets = fields.filter((f) => f !== 'contacts').map((f, i) => `${f} = $${i + 2}`);
    const values = fields.filter((f) => f !== 'contacts').map((f) => (body as any)[f]);
    if (sets.length > 0) {
      await pool.query(`update clients set ${sets.join(', ')} where id = $1`, [req.params.id, ...values]);
    }
    await audit(req.user!.id, 'update_client', 'client', req.params.id);
    broadcast({ type: 'client.updated', clientId: req.params.id });
    res.json({ ok: true });
  })
);

clientsRouter.patch(
  '/:id/archive',
  asyncHandler(async (req, res) => {
    const archived = z.object({ archived: z.boolean() }).parse(req.body).archived;
    await pool.query('update clients set archived = $2 where id = $1', [req.params.id, archived]);
    await audit(req.user!.id, archived ? 'archive_client' : 'restore_client', 'client', req.params.id);
    broadcast({ type: 'client.updated', clientId: req.params.id });
    res.json({ ok: true });
  })
);

clientsRouter.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const text = z.object({ text: z.string().min(1) }).parse(req.body).text;
    const inserted = await pool.query(
      'insert into client_notes (client_id, author_id, text) values ($1,$2,$3) returning *',
      [req.params.id, req.user!.id, text]
    );
    broadcast({ type: 'client.updated', clientId: req.params.id });
    res.status(201).json({ note: inserted.rows[0] });
  })
);

clientsRouter.post(
  '/:id/contacts',
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string(), role: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).parse(req.body);
    const inserted = await pool.query('insert into client_contacts (client_id, name, role, email, phone) values ($1,$2,$3,$4,$5) returning *', [
      req.params.id,
      body.name,
      body.role || null,
      body.email || null,
      body.phone || null
    ]);
    broadcast({ type: 'client.updated', clientId: req.params.id });
    res.status(201).json({ contact: inserted.rows[0] });
  })
);
