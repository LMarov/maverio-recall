create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  role text not null check (role in ('Owner','Admin','Member')),
  scope text not null check (scope in ('all','attended')) default 'all',
  created_at timestamptz not null default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('Owner','Admin','Member')),
  scope text not null check (scope in ('all','attended')) default 'all',
  token text unique not null,
  invited_by uuid references users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  practice text not null,
  stage text,
  address text,
  phone text,
  site text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text,
  role text,
  email text,
  phone text
);

create table client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  author_id uuid references users(id),
  text text not null,
  created_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references clients(id),
  practice text not null,
  occurred_at timestamptz not null,
  duration_seconds int,
  stage text not null default 'done' check (stage in ('transcribing','analysing','done')),
  people jsonb not null default '[]',
  unknown_count int not null default 0,
  summary text,
  objective text,
  objective_cite text,
  decisions jsonb not null default '[]',
  gaps jsonb not null default '[]',
  actions jsonb not null default '[]',
  fields jsonb not null default '[]',
  lines jsonb not null default '[]',
  title_override text,
  title_edited_by uuid references users(id),
  title_edited_at timestamptz,
  published boolean not null default false,
  published_by uuid references users(id),
  published_at timestamptz,
  audio_storage_key text,
  pipeline_error text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index meetings_client_id_idx on meetings(client_id);
create index meetings_occurred_at_idx on meetings(occurred_at desc);

create table gap_answers (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  gap_index int not null,
  answer text not null,
  answered_by uuid references users(id),
  answered_at timestamptz not null default now(),
  unique(meeting_id, gap_index)
);

create table field_edits (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  field_key text not null,
  value text not null,
  edited_by uuid references users(id),
  edited_at timestamptz not null default now(),
  unique(meeting_id, field_key)
);

create table voice_names (
  key text primary key,
  name text not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table scheduled_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references clients(id),
  practice text not null,
  scheduled_at timestamptz not null,
  duration_min int not null,
  place text,
  type text not null check (type in ('In person','Video call','Phone')),
  agenda jsonb not null default '[]',
  outcomes jsonb not null default '[]',
  attendees jsonb not null default '[]',
  guests int not null default 0,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  target_type text,
  target_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);
