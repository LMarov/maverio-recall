import { pool } from './db/pool';
import { hashPassword } from './auth/password';

/** Wipes every app table between tests, keeping the schema (and schema_migrations) intact. */
export async function resetDb() {
  await pool.query(`
    truncate table
      error_log, audit_log, field_edits, gap_answers, client_notes, client_contacts,
      scheduled_meetings, meetings, clients, voice_names, voiceprints,
      password_resets, invites, users
    restart identity cascade
  `);
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'Owner' | 'Admin' | 'Member';
  scope: 'all' | 'attended';
}

export async function createTestUser(overrides: Partial<Omit<TestUser, 'id'>> = {}): Promise<TestUser> {
  const email = overrides.email ?? 'lana@maverio.com';
  const name = overrides.name ?? 'Lana Marov';
  const password = overrides.password ?? 'test-password-123';
  const role = overrides.role ?? 'Owner';
  const scope = overrides.scope ?? 'all';
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query('insert into users (email, name, password_hash, role, scope) values ($1,$2,$3,$4,$5) returning id', [
    email,
    name,
    passwordHash,
    role,
    scope
  ]);
  return { id: rows[0].id, email, name, password, role, scope };
}
