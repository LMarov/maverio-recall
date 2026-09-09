import { pool } from '../db/pool';

export async function audit(userId: string | null, action: string, targetType?: string, targetId?: string, meta?: unknown) {
  await pool.query(
    'insert into audit_log (user_id, action, target_type, target_id, meta) values ($1,$2,$3,$4,$5)',
    [userId, action, targetType || null, targetId || null, meta ? JSON.stringify(meta) : null]
  );
}
