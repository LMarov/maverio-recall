import { Eagle, EagleProfiler } from '@picovoice/eagle-node';
import { env } from '../env';
import { pool } from '../db/pool';
import type { RawUtterance } from './transcribe';

const SAMPLE_RATE = 16000;
const MATCH_THRESHOLD = 0.6;

export function isVoiceprintEnabled(): boolean {
  return !!env.picovoiceAccessKey;
}

/** Concatenates one speaker's utterance audio out of a full-meeting PCM buffer. */
export function sliceSpeakerPcm(pcm: Int16Array, utterances: RawUtterance[], speaker: string): Int16Array {
  const segments = utterances.filter((u) => u.speaker === speaker);
  const totalLen = segments.reduce((n, u) => n + Math.max(0, Math.round((u.end - u.start) * SAMPLE_RATE)), 0);
  const out = new Int16Array(totalLen);
  let offset = 0;
  for (const u of segments) {
    const startSample = Math.max(0, Math.round(u.start * SAMPLE_RATE));
    const endSample = Math.min(pcm.length, Math.round(u.end * SAMPLE_RATE));
    if (endSample <= startSample) continue;
    out.set(pcm.subarray(startSample, endSample), offset);
    offset += endSample - startSample;
  }
  return out.subarray(0, offset);
}

/**
 * Builds (or replaces) a named speaker's voiceprint from a chunk of their own
 * audio. Only the derived embedding is stored — never the audio itself — so
 * it's untouched by the audio retention job. Returns false if there wasn't
 * enough audio to produce a usable profile (Eagle needs several seconds).
 */
export async function enrollSpeaker(label: string, pcm: Int16Array): Promise<boolean> {
  if (!isVoiceprintEnabled()) return false;
  const profiler = new EagleProfiler(env.picovoiceAccessKey);
  try {
    const frameLength = profiler.frameLength;
    for (let i = 0; i + frameLength <= pcm.length; i += frameLength) {
      profiler.enroll(pcm.subarray(i, i + frameLength));
    }
    const percentage = profiler.flush();
    if (percentage < 100) return false;
    const profile = Buffer.from(profiler.export());
    await pool.query(
      `insert into voiceprints (label, profile) values ($1,$2)
       on conflict (lower(label)) do update set profile = excluded.profile, updated_at = now()`,
      [label, profile]
    );
    return true;
  } finally {
    profiler.release();
  }
}

/**
 * Compares each given (unnamed) speaker's audio against every enrolled
 * voiceprint and returns the best match above threshold, if any. A result
 * here is always a suggestion for a human to confirm — never applied on its
 * own.
 */
export async function identifySpeakers(pcmBySpeaker: Record<string, Int16Array>): Promise<Record<string, { label: string; score: number }>> {
  if (!isVoiceprintEnabled() || Object.keys(pcmBySpeaker).length === 0) return {};
  const { rows } = await pool.query<{ label: string; profile: Buffer }>('select label, profile from voiceprints');
  if (rows.length === 0) return {};
  const profiles = rows.map((r) => new Uint8Array(r.profile));
  const eagle = new Eagle(env.picovoiceAccessKey);
  try {
    const frameLength = eagle.minProcessSamples;
    const result: Record<string, { label: string; score: number }> = {};
    for (const [speaker, pcm] of Object.entries(pcmBySpeaker)) {
      const totals = new Array(rows.length).fill(0);
      let frames = 0;
      for (let i = 0; i + frameLength <= pcm.length; i += frameLength) {
        const scores = eagle.process(pcm.subarray(i, i + frameLength), profiles);
        if (!scores) continue;
        scores.forEach((s, idx) => (totals[idx] += s));
        frames++;
      }
      if (frames === 0) continue;
      let bestIdx = 0;
      for (let i = 1; i < rows.length; i++) if (totals[i] > totals[bestIdx]) bestIdx = i;
      const avgBest = totals[bestIdx] / frames;
      if (avgBest >= MATCH_THRESHOLD) result[speaker] = { label: rows[bestIdx].label, score: avgBest };
    }
    return result;
  } finally {
    eagle.release();
  }
}
