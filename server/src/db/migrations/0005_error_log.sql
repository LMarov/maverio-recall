create table error_log (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  method text,
  path text,
  status_code int,
  message text not null,
  stack text,
  user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index error_log_created_at_idx on error_log (created_at desc);
