import { pool } from '../db/pool';
import { broadcast } from '../realtime/hub';
import { analyzeTranscript } from './analyze';
import { transcribeAudio } from './transcribe';

interface ProcessContext {
  title: string;
  client: string;
  agenda: string[];
}

/** Runs after audio has been uploaded and stored; fire-and-forget from the route handler. */
export async function processRecording(meetingId: string, audioBuffer: Buffer, mimeType: string, context: ProcessContext) {
  try {
    const { lines, speakerCount, fullText } = await transcribeAudio(audioBuffer, mimeType);
    await pool.query(
      `update meetings set stage = 'analysing', lines = $2, people = $3, unknown_count = $4, summary = coalesce(summary, $5)
       where id = $1`,
      [meetingId, JSON.stringify(lines), JSON.stringify([...new Set(lines.map((l) => l.k))]), speakerCount, fullText.slice(0, 0)]
    );
    broadcast({ type: 'meeting.stage', meetingId, stage: 'analysing' });

    const analysis = await analyzeTranscript(lines, context);
    await pool.query(
      `update meetings
       set stage = 'done', summary = $2, objective = $3, objective_cite = $4,
           decisions = $5, actions = $6, gaps = $7, fields = $8
       where id = $1`,
      [
        meetingId,
        analysis.summary || '',
        analysis.objective || '',
        analysis.objectiveCite || '',
        JSON.stringify(analysis.decisions || []),
        JSON.stringify(analysis.actions || []),
        JSON.stringify(analysis.gaps || []),
        JSON.stringify(Object.entries(analysis.fields || {}).map(([key, val]) => ({ key, val })))
      ]
    );
    broadcast({ type: 'meeting.stage', meetingId, stage: 'done' });
  } catch (err) {
    await pool.query('update meetings set pipeline_error = $2 where id = $1', [meetingId, String((err as Error).message || err)]);
    broadcast({ type: 'meeting.updated', meetingId });
  }
}
