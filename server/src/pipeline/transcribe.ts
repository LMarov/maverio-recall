import { env } from '../env';

export interface TranscriptLine {
  t: string;
  k: string;
  text: string;
}

/** A diarized speaker turn's raw timing — pipeline-internal, used to slice audio for voiceprint enrollment/identification. */
export interface RawUtterance {
  speaker: string;
  start: number;
  end: number;
}

export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

export async function transcribeAudio(fileBuffer: Buffer, mimeType: string) {
  const key = env.deepgramApiKey;
  if (!key) throw new Error('DEEPGRAM_API_KEY is not set on the server.');

  const url = 'https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&punctuate=true&utterances=true&smart_format=true';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Token ' + key, 'Content-Type': mimeType || 'audio/webm' },
    body: fileBuffer
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Deepgram request failed (' + res.status + '): ' + text.slice(0, 400));
  }
  const json: any = await res.json();
  const utterances: any[] = json?.results?.utterances || [];
  const speakerIds = [...new Set(utterances.map((u) => u.speaker))];
  const lines: TranscriptLine[] = utterances.map((u) => ({
    t: fmtTime(u.start),
    k: '?' + u.speaker,
    text: (u.transcript || '').trim()
  }));
  const rawUtterances: RawUtterance[] = utterances.map((u) => ({ speaker: String(u.speaker), start: u.start, end: u.end }));
  const fullText: string = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || lines.map((l) => l.text).join(' ');
  return { lines, speakerCount: speakerIds.length, fullText, rawUtterances };
}
