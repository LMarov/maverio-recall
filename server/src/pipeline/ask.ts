import { env } from '../env';

export interface AskDocument {
  id: string;
  title: string;
  client: string;
  occurredAt: string;
  objective: string;
  objectiveCite: string;
  summary: string;
  decisions: { text: string; cite: string }[];
  actions: { who: string; text: string; due: string; src: string }[];
  gaps: { q: string; why: string; cite: string }[];
  /** Only populated when the question is scoped to a single meeting. */
  lines?: { t: string; k: string; text: string }[];
}

export interface AskResult {
  text: string;
  citations: { meetingId: string; quote: string }[];
}

function renderDocument(d: AskDocument): string {
  const parts = [
    `MEETING ${d.id}`,
    `Title: ${d.title}`,
    `Client: ${d.client}`,
    `Date: ${d.occurredAt}`,
    d.objective ? `Objective: ${d.objective} (${d.objectiveCite || 'not stated'})` : null,
    d.summary ? `Summary: ${d.summary}` : null,
    d.decisions.length ? 'Decisions:\n' + d.decisions.map((x) => `- ${x.text} [${x.cite}]`).join('\n') : null,
    d.actions.length ? 'Actions:\n' + d.actions.map((x) => `- ${x.who}: ${x.text} (due ${x.due}) [${x.src}]`).join('\n') : null,
    d.gaps.length ? 'Open questions:\n' + d.gaps.map((x) => `- ${x.q} [${x.cite}]`).join('\n') : null,
    d.lines?.length ? 'Full transcript:\n' + d.lines.map((l) => `[${l.t}] ${l.k}: ${l.text}`).join('\n') : null
  ].filter(Boolean);
  return parts.join('\n');
}

function buildAskPrompt(question: string, docs: AskDocument[], scoped: boolean): string {
  const corpus = docs.map(renderDocument).join('\n\n---\n\n');
  return (
    'You answer questions for a business advisory team about their own recorded meetings. ' +
    'Use ONLY the meeting material below — never invent a name, figure, date, or fact that is not in it. ' +
    'If the material does not answer the question, say so plainly instead of guessing. ' +
    (scoped ? 'The question is scoped to the single meeting below.' : 'The question may span any of the meetings below.') +
    '\n\nMEETINGS:\n\n' +
    corpus +
    '\n\nQUESTION: ' +
    question +
    '\n\nRespond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:\n' +
    '{\n' +
    '  "text": string (the answer, written for a colleague — direct, no hedging beyond what the material itself is unsure about),\n' +
    '  "citations": [{"meetingId": string (must be one of the MEETING ids above), "quote": string (the exact [cite] tag you drew the fact from, e.g. "18:42 \\u00b7 Speaker 1")}]\n' +
    '}'
  );
}

export async function answerQuestion(question: string, docs: AskDocument[], scoped: boolean): Promise<AskResult> {
  const key = env.anthropicApiKey;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set on the server.');

  const prompt = buildAskPrompt(question, docs, scoped);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Anthropic request failed (' + res.status + '): ' + text.slice(0, 400));
  }
  const json: any = await res.json();
  const raw: string = (json?.content || []).map((b: any) => b.text || '').join('').trim();
  const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    const knownIds = new Set(docs.map((d) => d.id));
    return {
      text: parsed.text || '',
      citations: (parsed.citations || []).filter((c: any) => knownIds.has(c.meetingId))
    };
  } catch (e) {
    throw new Error('Could not parse the ask response as JSON: ' + String(e) + '\nRaw: ' + cleaned.slice(0, 400));
  }
}
