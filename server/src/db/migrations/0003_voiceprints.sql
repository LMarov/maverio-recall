-- Cross-meeting voice recognition: a small table of speaker voiceprints (one
-- per confirmed name), plus pipeline-internal columns on meetings to support
-- enrolling/identifying against them. `profile` stores only the derived
-- embedding Picovoice Eagle produces — never raw audio — so it survives the
-- 30-day audio retention job untouched.
create table voiceprints (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  profile bytea not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index voiceprints_label_idx on voiceprints (lower(label));

-- Per-utterance speaker + timing, kept only for the voiceprint pipeline to
-- slice enrollment/identification audio by; never sent to the client.
alter table meetings add column raw_utterances jsonb not null default '[]';

-- rawSpeakerIndex -> { label, score }, Eagle's best guess for each unnamed
-- speaker in this meeting, surfaced to the client as a suggestion only —
-- naming a speaker always requires a human to confirm it.
alter table meetings add column speaker_suggestions jsonb not null default '{}';
