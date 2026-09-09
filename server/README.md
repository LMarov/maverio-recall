# Maverio Recall — server

The Phase 2 backend for Maverio Recall: a small Express + Postgres API and
websocket server that the Electron app (`../app`) talks to. It's what turns
Recall from a single-user local app into a real product a whole team signs
into and shares.

## What it does

- **Auth** — email + password, JWT sessions, invite-only signup gated to
  `@maverio.com`, password reset, rate-limited login/invite/reset endpoints
  (`src/routes/auth.ts`, `src/routes/team.ts`, `src/util/rateLimit.ts`).
- **Email** — invite and password-reset emails go through a small adapter
  (`src/email/`) that defaults to logging to the console (no account
  needed) and can send for real over SMTP with any provider.
- **Data** — clients, meetings (with decisions/actions/gaps/fields/
  transcript lines), scheduled meetings, voice names, voiceprints, an audit
  log — all in Postgres (`src/db/migrations/`).
- **Audio + AI pipeline** — accepts an uploaded recording, stores it (S3 or
  local disk), transcribes it with Deepgram, analyzes it with Claude, and
  writes the result back onto the meeting row (`src/pipeline/`,
  `src/routes/audio.ts`). API keys live only here — never on a client.
- **Realtime** — a websocket (`src/realtime/hub.ts`) pushes every change
  (new meeting, stage change, publish, a new client, a scheduled meeting,
  a teammate joining) to every signed-in client instantly.
- **Ask** — `POST /ask` (`src/routes/ask.ts`, `src/pipeline/ask.ts`) answers
  a free-text question about the team's meetings. It hands Claude the
  relevant meeting content (summary/objective/decisions/actions/gaps for
  every meeting, or one meeting's full transcript when the question is
  scoped to it) with the same "use only what's given" grounding as the
  analysis pipeline, and returns an answer plus citations back to the
  source meeting(s). Same API-key-stays-server-side rule as the rest of the
  pipeline.
- **Audit log** — `GET /audit` (`src/routes/audit.ts`, owners/admins only)
  reads back sign-ins, invites, client edits, publishes, and audio-retention
  deletions written by `src/util/audit.ts`.
- **Audio retention** — `src/jobs/retention.ts` runs daily, deleting the raw
  audio blob (not the transcript/analysis) for any meeting past
  `AUDIO_RETENTION_DAYS`, and logs the deletion to the audit log.
- **Cross-meeting voice recognition** — `src/pipeline/voiceprint.ts` +
  `src/pipeline/audioDecode.ts`. Optional: only runs when
  `PICOVOICE_ACCESS_KEY` is set. Naming a speaker (`PUT
  /meetings/meta/voice-names/:key`) decodes that meeting's audio, slices out
  that speaker's turns, and enrolls a real voiceprint (Picovoice Eagle,
  on-device speaker embeddings — only the derived profile is stored, never
  raw audio, so it isn't affected by the retention job). Every new
  meeting's still-unnamed speakers are then checked against every enrolled
  voiceprint (`identifySpeakers`), and a match above threshold is written to
  that meeting's `speaker_suggestions` — surfaced to the client purely as a
  suggestion; a human still has to confirm it via the namer. With no key
  set, this whole layer is skipped and naming a speaker behaves exactly as
  it did before Phase 5.

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
| `EMAIL_DRIVER` | `console` (default, dev-only — logs the email instead of sending it) or `smtp` |
| `EMAIL_FROM` | The "from" address on sent emails |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Only used when `EMAIL_DRIVER=smtp` — works with any SMTP provider (Gmail, SES, Postmark, Mailgun, your own mail server, ...); no specific vendor required |
| `APP_URL` | Included in emailed links — the app's own URL (default `http://localhost:5173`) |
| `AUDIO_RETENTION_DAYS` | Days raw meeting audio is kept before the retention job deletes it (default `30`) — transcripts/analysis are unaffected |
| `PICOVOICE_ACCESS_KEY` | Optional — enables real cross-meeting voice recognition (https://console.picovoice.ai/). Leave blank to skip it entirely |
| `JWT_SECRET_PREVIOUS` | Optional — set to the old `JWT_SECRET` while rotating it, so existing sessions keep verifying until they expire |
| `CORS_ORIGIN` | Comma-separated allowed origins, or `*` (default) |
| `TRUST_PROXY` | Set to `1` when running behind a single reverse proxy/load balancer, so rate limiting and `req.ip` see the real client IP |
| `NODE_ENV` | `production` switches request logging to the fuller `combined` format; anything else uses the terser `dev` format |

Invite and password-reset emails go through this same adapter
(`src/email/`). Leave `EMAIL_DRIVER=console` for local dev — the email
content (including the invite/reset code) is printed to the server's
console instead of sent, so nothing beyond running the server locally is
needed to test either flow. Set `EMAIL_DRIVER=smtp` with real SMTP
credentials to actually deliver mail.

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

## Production deployment

```bash
cp .env.example .env   # fill in real secrets — see below
docker compose up --build -d
docker compose exec server npm run migrate
```

`docker-compose.yml` runs a production-like stack — Postgres, MinIO
(S3-compatible storage), and the server itself, each in its own container —
for a self-hosted deploy or local testing of the packaged image. The
`Dockerfile` is a multi-stage build producing a small runtime image
(`node dist/index.js`, matching `npm start`) with a `/health`-backed
`HEALTHCHECK` your orchestrator can also point a load balancer health check
at. It's Debian-based rather than Alpine — `@picovoice/eagle-node` ships a
glibc-linked native binary that won't load under musl.

For a real deploy (not just local docker-compose), a few things change from
the dev defaults:

- **Storage**: point `STORAGE_DRIVER=s3` at a real bucket (AWS S3, or a
  self-hosted MinIO you actually run in production) — `STORAGE_DRIVER=local`
  is dev-only, see above.
- **Email**: set `EMAIL_DRIVER=smtp` with real credentials so invite/reset
  emails actually deliver, instead of only logging to the console.
- **Secrets**: use a long random `JWT_SECRET`. To rotate it without logging
  everyone out, set the new value as `JWT_SECRET` and the old one as
  `JWT_SECRET_PREVIOUS` for 30 days (session lifetime), then drop the
  latter.
- **Reverse proxy**: put this behind a TLS-terminating reverse proxy (Caddy
  is the least-setup option for automatic HTTPS; nginx + certbot works too)
  rather than exposing the server directly. Once you do, set
  `TRUST_PROXY=1` so rate limiting and `req.ip` see the real client IP
  instead of the proxy's, and set `CORS_ORIGIN` if this API ever gains a
  web (browser-based) client — the desktop app itself doesn't have a fixed
  origin the way a website would, so `*` (the default) is fine for the
  architecture as it stands today.
- **Migrations**: run `npm run migrate` as a one-off command after each
  deploy (`docker compose exec server npm run migrate`, or the equivalent
  one-off task on your platform) — the server doesn't migrate itself on
  boot, so a botched migration can't silently take down a running instance.
- **Scaling**: `rateLimit.ts`'s in-memory counters and the websocket
  connection registry (`realtime/hub.ts`) are both per-process — this all
  assumes a single server instance. Running more than one behind a load
  balancer needs a shared store (e.g. Redis) for both.

None of this — the Dockerfile, docker-compose stack, or the reverse-proxy
setup — has been run end to end in this sandbox (no Docker daemon
available here to actually `docker build`/`docker run`); it's been reviewed
carefully but not exercised live the way the rest of this app's features
have been.

## Structure

- `Dockerfile`, `docker-compose.yml`, `.dockerignore` — the production
  deploy artifacts, see "Production deployment" above.
- `src/index.ts` — Express app + http/websocket server bootstrap.
- `src/env.ts` — typed env var access.
- `src/db/` — Postgres pool, a tiny SQL-file migration runner, the seed script.
- `src/auth/` — password hashing, JWT sign/verify, the `requireAuth` middleware.
- `src/routes/` — one file per resource (`auth`, `team`, `clients`,
  `meetings`, `scheduled`, `audio`, `ask`).
- `src/storage/` — the object-storage abstraction (`s3.ts` / `local.ts`)
  behind a single `StorageAdapter` interface.
- `src/pipeline/` — `transcribe.ts` (Deepgram), `analyze.ts` (Claude),
  `process.ts` (orchestrates the two after an upload and broadcasts the
  result, then runs voiceprint identification), `ask.ts` (answers a question
  grounded in the team's meetings), `voiceprint.ts` (Picovoice Eagle
  enroll/identify), `audioDecode.ts` (ffmpeg-static: compressed upload ->
  16kHz mono PCM for Eagle).
- `src/jobs/retention.ts` — the daily audio-retention job.
- `src/realtime/hub.ts` — the websocket connection registry + `broadcast()`.
- `src/email/` — the email abstraction (`console.ts` / `smtp.ts`) behind a
  single `EmailAdapter` interface, same pattern as `src/storage/`.
- `src/util/` — small shared helpers (async route wrapper, audit log writer,
  `rateLimit.ts` — an in-memory fixed-window limiter on the auth/invite
  endpoints).

## What's not built yet

- Invite emails still hand back the raw join token in the API response too
  (Team & seats shows it after sending one) as a fallback for when
  `EMAIL_DRIVER=console` or delivery fails — by design, not a gap.
- `rateLimit.ts`'s in-memory counters are per-process — fine for a single
  server instance (this app's whole deployment model today), but would need
  a shared store (e.g. Redis) if this ever ran as multiple instances behind
  a load balancer.
- `/ask` has no real retrieval — it hands Claude the 50 most recent
  meetings' summaries (or one full meeting when scoped) rather than
  ranking/searching for the most relevant ones. Fine at the volume a team
  produces today; will need real full-text or vector search once there are
  hundreds of meetings.
- Voiceprint enrollment isn't cumulative — naming a speaker rebuilds their
  profile from that one meeting's audio, replacing whatever was there
  before, rather than averaging across every meeting they've ever been
  confirmed in.
- Voiceprint matching genuinely requires a real `PICOVOICE_ACCESS_KEY` and
  cannot be end-to-end verified in a sandbox without one (or without real
  Deepgram network access to produce a transcript in the first place) — the
  decode/slice/enroll/identify code paths are each verified in isolation,
  but no one has watched a real "record → later recording auto-suggests the
  same person" round trip happen end to end yet.
