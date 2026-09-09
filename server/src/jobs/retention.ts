import { env } from '../env';
import { pool } from '../db/pool';
import { storage } from '../storage';
import { audit } from '../util/audit';

/**
 * Deletes raw meeting audio past the retention window. Only the audio blob
 * goes — the transcript, summary, decisions, actions etc. on the meeting row
 * are untouched, since retention is about not hoarding raw recordings
 * indefinitely, not about the meeting's extracted knowledge.
 */
export async function runAudioRetention(): Promise<number> {
  const cutoff = new Date(Date.now() - env.audioRetentionDays * 24 * 60 * 60 * 1000);
  const due = await pool.query<{ id: string; audio_storage_key: string }>(
    `select id, audio_storage_key from meetings
     where audio_storage_key is not null and occurred_at < $1`,
    [cutoff]
  );
  for (const row of due.rows) {
    await storage.delete(row.audio_storage_key);
    await pool.query('update meetings set audio_storage_key = null where id = $1', [row.id]);
    await audit(null, 'audio_retention_delete', 'meeting', row.id, { retentionDays: env.audioRetentionDays });
  }
  return due.rows.length;
}

export function startAudioRetentionJob() {
  const run = () =>
    runAudioRetention()
      .then((n) => {
        if (n > 0) console.log(`[retention] deleted audio for ${n} meeting(s) past ${env.audioRetentionDays}d`);
      })
      .catch((err) => console.error('[retention] failed', err));
  run();
  setInterval(run, 24 * 60 * 60 * 1000);
}
