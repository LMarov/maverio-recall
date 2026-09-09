import 'dotenv/config';
import { hashPassword } from '../auth/password';
import { pool } from './pool';

const DEV_PASSWORD = process.env.SEED_PASSWORD || 'recall-dev-1';

async function main() {
  const passwordHash = await hashPassword(DEV_PASSWORD);

  const users: { email: string; name: string; role: 'Owner' | 'Admin' | 'Member'; scope: 'all' | 'attended' }[] = [
    { email: 'lana@maverio.com', name: 'Lana Marov', role: 'Owner', scope: 'all' },
    { email: 'priya@maverio.com', name: 'Priya Raman', role: 'Admin', scope: 'all' },
    { email: 'marcus@maverio.com', name: 'Marcus Boyle', role: 'Admin', scope: 'all' },
    { email: 'tom@maverio.com', name: 'Tom Lasky', role: 'Member', scope: 'all' },
    { email: 'nadia@maverio.com', name: 'Nadia Farah', role: 'Member', scope: 'attended' }
  ];

  for (const u of users) {
    await pool.query(
      `insert into users (email, name, password_hash, role, scope) values ($1,$2,$3,$4,$5)
       on conflict (email) do nothing`,
      [u.email, u.name, passwordHash, u.role, u.scope]
    );
  }

  const clients: { name: string; practice: string; stage: string }[] = [
    { name: 'Hartline Logistics', practice: 'Consulting', stage: 'Diagnostic → Delivery' },
    { name: 'Verdon Health', practice: 'Growth iQ', stage: 'Renewal / upsell' },
    { name: 'Kessler & Roe', practice: 'Capability', stage: 'Kickoff / delivery' }
  ];

  for (const c of clients) {
    await pool.query(
      `insert into clients (name, practice, stage) values ($1,$2,$3)
       on conflict (name) do nothing`,
      [c.name, c.practice, c.stage]
    );
  }

  console.log(`Seeded ${users.length} users (password: ${DEV_PASSWORD}) and ${clients.length} clients.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
