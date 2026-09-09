// Real transcription (Deepgram) + real analysis (Anthropic) for a recorded meeting.
// Both API keys are read from process.env (populated by env.cjs from a local .env file)
// and never leave the main process.

function fmtTime(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

async function transcribeAudio(fileBuffer, mimeType) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error('DEEPGRAM_API_KEY is not set. Add it to app/.env and restart the app.');
  }
  const url = 'https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&punctuate=true&utterances=true&smart_format=true';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Token ' + key,
      'Content-Type': mimeType || 'audio/webm'
    },
    body: fileBuffer
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Deepgram request failed (' + res.status + '): ' + text.slice(0, 400));
  }
  const json = await res.json();
  const utterances = json?.results?.utterances || [];
  const speakerIds = [...new Set(utterances.map((u) => u.speaker))];
  const lines = utterances.map((u) => ({
    t: fmtTime(u.start),
    k: '?' + u.speaker,
    text: (u.transcript || '').trim()
  }));
  const fullText = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || lines.map((l) => l.text).join(' ');
  return { lines, speakerCount: speakerIds.length, fullText };
}

function buildAnalysisPrompt(fullText, lines, context) {
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

async function analyzeTranscript(fullText, lines, context) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to app/.env and restart the app.');
  }
  const prompt = buildAnalysisPrompt(fullText, lines, context);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Anthropic request failed (' + res.status + '): ' + text.slice(0, 400));
  }
  const json = await res.json();
  const raw = (json?.content || []).map((b) => b.text || '').join('').trim();
  const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Could not parse the analysis response as JSON: ' + String(e) + '\nRaw: ' + cleaned.slice(0, 400));
  }
}

module.exports = { transcribeAudio, analyzeTranscript };
