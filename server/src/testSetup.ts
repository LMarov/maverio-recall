import 'dotenv/config';
import { Client } from 'pg';

// Tests never touch the developer's real database: derive a sibling
// "<db>_test" database from DATABASE_URL and point the app at that instead.
const url = new URL(process.env.DATABASE_URL || 'postgres://recall:recall@localhost:5432/recall');
const testDbName = url.pathname.replace(/^\//, '') + '_test';
url.pathname = '/' + testDbName;
process.env.DATABASE_URL = url.toString();

process.env.NODE_ENV ||= 'test';
process.env.JWT_SECRET ||= 'test-secret-not-for-production';
process.env.ALLOWED_EMAIL_DOMAIN ||= 'maverio.com';
process.env.STORAGE_DRIVER ||= 'local';
process.env.LOCAL_STORAGE_DIR ||= './data/audio-test';

async function ensureTestDatabase() {
  const adminUrl = new URL(process.env.DATABASE_URL!);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rows } = await admin.query('select 1 from pg_database where datname = $1', [testDbName]);
    if (rows.length === 0) {
      await admin.query(`create database "${testDbName}"`);
    }
  } finally {
    await admin.end();
  }
}

await ensureTestDatabase();

const { runMigrations } = await import('./db/migrate');
await runMigrations();
