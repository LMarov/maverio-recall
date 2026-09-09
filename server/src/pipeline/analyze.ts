import { env } from '../env';
import type { TranscriptLine } from './transcribe';

export interface AnalysisResult {
  summary: string;
  objective: string;
  objectiveCite: string;
  decisions: { text: string; cite: string }[];
  actions: { who: string; text: string; due: string; src: string }[];
  gaps: { q: string; why: string; cite: string }[];
  fields: Record<string, string>;
}

function buildAnalysisPrompt(lines: TranscriptLine[], context: { title?: string; client?: string; agenda?: string[] }): string {
  const transcriptBlock = lines.map((l) => '[' + l.t + '] Speaker ' + l.k.slice(1) + ': ' + l.text).join('\n');
  const contextLines = [
    context?.title ? 'Meeting title: ' + context.title : null,
    context?.client ? 'Client / team: ' + context.client : null,
    context?.agenda?.length ? 'Planned agenda:\n' + context.agenda.map((a, i) => i + 1 + '. ' + a).join('\n') : null
  ]
    .filter(Boolean)
    .join('\n');

  return (
    'You analyse verbatim meeting transcripts for a business advisory firm. Use ONLY what is said in the transcript below. ' +
    'Never invent a name, figure, date, or fact that was not said aloud. If something is unclear or missing, put it in "gaps" as a question instead of guessing. ' +
    'Speakers are anonymous diarized labels ("Speaker 0", "Speaker 1", ...) because voice identity is not yet known — refer to them exactly that way, do not invent real names for them.\n\n' +
    (contextLines ? contextLines + '\n\n' : '') +
    'TRANSCRIPT:\n' +
    transcriptBlock +
    '\n\nRespond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:\n' +
    '{\n' +
    '  "summary": string,\n' +
    '  "objective": string,\n' +
    '  "objectiveCite": string (e.g. "04:31 · Speaker 1", or "" if none),\n' +
    '  "decisions": [{"text": string, "cite": string}],\n' +
    '  "actions": [{"who": string (e.g. "Speaker 0"), "text": string, "due": string (or "not stated"), "src": string}],\n' +
    '  "gaps": [{"q": string, "why": string, "cite": string (or "not discussed")}],\n' +
    '  "fields": {"engagement_stage": string, "revenue_mentioned": string, "risks": string, "next_step": string}\n' +
    '}'
  );
}

export async function analyzeTranscript(lines: TranscriptLine[], context: { title?: string; client?: string; agenda?: string[] }): Promise<AnalysisResult> {
  const key = env.anthropicApiKey;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set on the server.');

  const prompt = buildAnalysisPrompt(lines, context);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Anthropic request failed (' + res.status + '): ' + text.slice(0, 400));
  }
  const json: any = await res.json();
  const raw: string = (json?.content || []).map((b: any) => b.text || '').join('').trim();
  const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Could not parse the analysis response as JSON: ' + String(e) + '\nRaw: ' + cleaned.slice(0, 400));
  }
}
