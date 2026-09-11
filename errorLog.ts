import { pool } from './db/pool';
import { logger } from './logger';

export interface CapturedError {
  id: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  message: string;
  stack?: string;
  userId?: string;
  createdAt: string;
}

/**
 * Persists an error for later inspection via GET /admin/errors. Best-effort:
 * a logging failure must never mask (or replace) the original error, so
 * write failures are only logged, never thrown.
 */
export async function recordError(err: {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  message: string;
  stack?: string;
  userId?: string;
}): Promise<void> {
  try {
    await pool.query(
      `insert into error_log (request_id, method, path, status_code, message, stack, user_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [err.requestId || null, err.method || null, err.path || null, err.statusCode || null, err.message, err.stack || null, err.userId || null]
    );
  } catch (writeErr) {
    logger.error({ err: writeErr }, 'failed to persist error_log entry');
  }
}

export async function getRecentErrors(limit = 50): Promise<CapturedError[]> {
  const { rows } = await pool.query(
    `select id, request_id, method, path, status_code, message, stack, user_id, created_at
     from error_log order by created_at desc limit $1`,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    requestId: r.request_id ?? undefined,
    method: r.method ?? undefined,
    path: r.path ?? undefined,
    statusCode: r.status_code ?? undefined,
    message: r.message,
    stack: r.stack ?? undefined,
    userId: r.user_id ?? undefined,
    createdAt: r.created_at
  }));
}
