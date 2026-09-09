# Maverio Recall — server

The Phase 2 backend for Maverio Recall: a small Express + Postgres API and
websocket server that the Electron app (`../app`) talks to. It's what turns
Recall from a single-user local app into a real product a whole team signs
into and shares.

## What it does

- **Auth** — email + password, JWT sessions, invite-only signup gated to
  `@maverio.com` (`src/routes/auth.ts`, `src/routes/team.ts`).
- **Data** — clients, meetings (with decisions/actions/gaps/fields/
  transcript lines), scheduled meetings, voice names, an audit log — all in
  Postgres (`src/db/migrations/0001_init.sql`).
- **Audio + AI pipeline** — accepts an uploaded recording, stores it (S3 or
  local disk), transcribes it with Deepgram, analyzes it with Claude, and
  writes the result back onto the meeting row (`src/pipeline/`,
  `src/routes/audio.ts`). API keys live only here — never on a client.
- **Realtime** — a websocket (`src/realtime/hub.ts`) pushes every change
  (new meeting, stage change, publish, a new client, a scheduled meeting,
  a teammate joining) to every signed-in client instantly.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, API keys — see below
npm run migrate           # creates the schema in Postgres
npm run seed              # 5 dev accounts (password: recall-dev-1) + 3 clients
npm run dev                # ts-node/tsx watch mode on :8787 (see package.json)
```

You need a Postgres instance reachable at `DATABASE_URL`. Locally that can
be a system Postgres install or `docker run -p 5432:5432 postgres` — either
way, create the database first (`createdb recall` or equivalent) before
running the migration.

### Environment variables (`.env`)

| Key | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs session tokens — use a long random value in production |
| `ALLOWED_EMAIL_DOMAIN` | Domain invites are restricted to (default `maverio.com`) |
| `STORAGE_DRIVER` | `s3` (recommended) or `local` (dev-only, writes to `LOCAL_STORAGE_DIR`) |
| `S3_*` | S3-compatible object storage config (AWS S3, MinIO, R2, ...) — only used when `STORAGE_DRIVER=s3` |
| `DEEPGRAM_API_KEY` | Transcription + speaker diarization — https://console.deepgram.com |
| `ANTHROPIC_API_KEY` | Meeting analysis — https://console.anthropic.com |
| `PORT` | Defaults to `8787` |

`STORAGE_DRIVER=local` is meant for local development only — it writes
recordings to disk under `LOCAL_STORAGE_DIR` and serves them back over
plain HTTP with no access control, which is fine on a laptop but not how
you'd run this for a real team. Point `STORAGE_DRIVER=s3` at a real bucket
(AWS S3, or a self-hosted MinIO) for anything beyond local testing.

## Running the pieces together locally

```bash
# 1. Postgres running and reachable at DATABASE_URL
# 2. In server/:
npm run migrate && npm run seed && npm run dev
# 3. In app/: point VITE_API_URL at this server (default http://localhost:8787), then
npm run build && npm run dev:electron
# 4. Sign in as lana@maverio.com / recall-dev-1 (or any of the 5 seeded accounts)
```

## Structure

- `src/index.ts` — Express app + http/websocket server bootstrap.
- `src/env.ts` — typed env var access.
- `src/db/` — Postgres pool, a tiny SQL-file migration runner, the seed script.
- `src/auth/` — password hashing, JWT sign/verify, the `requireAuth` middleware.
- `src/routes/` — one file per resource (`auth`, `team`, `clients`,
  `meetings`, `scheduled`, `audio`).
- `src/storage/` — the object-storage abstraction (`s3.ts` / `local.ts`)
  behind a single `StorageAdapter` interface.
- `src/pipeline/` — `transcribe.ts` (Deepgram), `analyze.ts` (Claude),
  `process.ts` (orchestrates the two after an upload and broadcasts the
  result).
- `src/realtime/hub.ts` — the websocket connection registry + `broadcast()`.
- `src/util/` — small shared helpers (async route wrapper, audit log writer).

## What's not built yet

- No email delivery for invites — `POST /team/invite` hands back a raw join
  token the inviter has to relay themselves (Team & seats shows it after
  sending one). Wiring a real mailer (Postmark/SES) is the natural next step.
- No password reset flow.
- No rate limiting / abuse protection on the auth endpoints.
- The retention policy mentioned in the Knowledge base UI copy (30-day audio
  retention) isn't enforced by a cron job yet — the audit log table exists
  but nothing reads it back into a UI.
