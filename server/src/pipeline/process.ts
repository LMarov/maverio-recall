import { pool } from '../db/pool';
import { broadcast } from '../realtime/hub';
import { analyzeTranscript } from './analyze';
import { transcribeAudio } from './transcribe';
import { decodeToPcm16k } from './audioDecode';
import { identifySpeakers, isVoiceprintEnabled, sliceSpeakerPcm } from './voiceprint';

interface ProcessContext {
  title: string;
  client: string;
  agenda: string[];
}

/** Runs after audio has been uploaded and stored; fire-and-forget from the route handler. */
export async function processRecording(meetingId: string, audioBuffer: Buffer, mimeType: string, context: ProcessContext) {
  try {
    const { lines, speakerCount, fullText, rawUtterances } = await transcribeAudio(audioBuffer, mimeType);
    await pool.query(
      `update meetings set stage = 'analysing', lines = $2, people = $3, unknown_count = $4, summary = coalesce(summary, $5), raw_utterances = $6
       where id = $1`,
      [
        meetingId,
        JSON.stringify(lines),
        JSON.stringify([...new Set(lines.map((l) => l.k))]),
        speakerCount,
        fullText.slice(0, 0),
        JSON.stringify(rawUtterances)
      ]
    );
    broadcast({ type: 'meeting.stage', meetingId, stage: 'analysing' });

    // Cross-meeting voice matching is a best-effort enhancement: any failure
    // here (bad key, decode error) is logged and skipped, never surfaced as a
    // pipeline error on the meeting — transcription/analysis already
    // succeeded and stand on their own.
    if (isVoiceprintEnabled()) {
      try {
        const pcm = await decodeToPcm16k(audioBuffer);
        const speakers = [...new Set(rawUtterances.map((u) => u.speaker))];
        const pcmBySpeaker = Object.fromEntries(speakers.map((s) => [s, sliceSpeakerPcm(pcm, rawUtterances, s)]));
        const suggestions = await identifySpeakers(pcmBySpeaker);
        if (Object.keys(suggestions).length > 0) {
          await pool.query('update meetings set speaker_suggestions = $2 where id = $1', [meetingId, JSON.stringify(suggestions)]);
        }
      } catch (err) {
        console.error('[voiceprint] identification failed', err);
      }
    }

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
