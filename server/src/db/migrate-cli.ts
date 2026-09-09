import { runMigrations } from './migrate';
import { pool } from './pool';

runMigrations()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
