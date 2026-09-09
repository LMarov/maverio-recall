import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { createTestUser, resetDb } from '../testDb';

const app = createApp();

async function authedRequest() {
  const user = await createTestUser();
  const login = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  return { user, token: login.body.token as string };
}

beforeEach(async () => {
  await resetDb();
});

describe('clients CRUD', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/clients');
    expect(res.status).toBe(401);
  });

  it('creates a client with contacts, then lists it back', async () => {
    const { token } = await authedRequest();

    const create = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Hartline Logistics',
        practice: 'Consulting',
        contacts: [{ name: 'Ines Kovač', role: 'COO', email: 'ines@hartline.example' }]
      });
    expect(create.status).toBe(201);
    expect(create.body.client).toMatchObject({ name: 'Hartline Logistics', practice: 'Consulting', archived: false });
    const clientId = create.body.client.id;

    const list = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.clients).toHaveLength(1);
    expect(list.body.clients[0].contacts).toEqual([expect.objectContaining({ name: 'Ines Kovač', role: 'COO' })]);
    expect(list.body.clients[0].id).toBe(clientId);
  });

  it('updates fields via PATCH', async () => {
    const { token } = await authedRequest();
    const create = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ashgrove Textiles', practice: 'Growth iQ' });
    const clientId = create.body.client.id;

    const patch = await request(app).patch(`/clients/${clientId}`).set('Authorization', `Bearer ${token}`).send({ stage: 'Active engagement' });
    expect(patch.status).toBe(200);

    const list = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(list.body.clients[0].stage).toBe('Active engagement');
  });

  it('archives and restores a client', async () => {
    const { token } = await authedRequest();
    const create = await request(app).post('/clients').set('Authorization', `Bearer ${token}`).send({ name: 'Kessler & Roe', practice: 'Capability' });
    const clientId = create.body.client.id;

    const archive = await request(app).patch(`/clients/${clientId}/archive`).set('Authorization', `Bearer ${token}`).send({ archived: true });
    expect(archive.status).toBe(200);
    let list = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(list.body.clients[0].archived).toBe(true);

    const restore = await request(app).patch(`/clients/${clientId}/archive`).set('Authorization', `Bearer ${token}`).send({ archived: false });
    expect(restore.status).toBe(200);
    list = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(list.body.clients[0].archived).toBe(false);
  });

  it('adds a note and a contact after creation', async () => {
    const { token } = await authedRequest();
    const create = await request(app).post('/clients').set('Authorization', `Bearer ${token}`).send({ name: 'Verdon Health', practice: 'Internal' });
    const clientId = create.body.client.id;

    const note = await request(app).post(`/clients/${clientId}/notes`).set('Authorization', `Bearer ${token}`).send({ text: 'Kickoff scheduled.' });
    expect(note.status).toBe(201);
    expect(note.body.note.text).toBe('Kickoff scheduled.');

    const contact = await request(app)
      .post(`/clients/${clientId}/contacts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sam Petrie', role: 'IT' });
    expect(contact.status).toBe(201);

    const list = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(list.body.clients[0].notes).toHaveLength(1);
    expect(list.body.clients[0].contacts).toHaveLength(1);
  });
});
