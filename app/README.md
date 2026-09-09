# Maverio Recall

A macOS desktop app (Electron + React + TypeScript) implementing the
`Maverio Recall` design from `../project/Maverio Recall.dc.html`.

This started as a faithful **front-end clone with mock data** of the Claude
Design prototype (Phase 0), then grew real single-user audio capture,
transcription and AI analysis (Phase 1), and is now a **real, shared,
multi-user product (Phase 2)**: sign-in-gated, backed by the server in
`../server`, with clients/meetings/scheduling/team all persisted centrally in
Postgres and kept in sync live over a websocket. See "What's real vs. still
mocked" below.

## Setup

```bash
npm install
cp .env.example .env      # then fill in your API keys + VITE_API_URL, see below
npm run dev:electron      # Vite + Electron together, hot reload in the app window
```

You also need the server running (see `../server/README.md`) — the desktop
app is a thin client now; it signs in against that server and has no
meaningful local-only mode of its own.

### API keys / config (`.env`)

| Key | Used for | Get one at |
|---|---|---|
| `VITE_API_URL` | Where the desktop app looks for the Maverio Recall server | `../server`, defaults to `http://localhost:8787` |
| `DEEPGRAM_API_KEY` | Transcription + speaker diarization (server-side only, see below) | https://console.deepgram.com |
| `ANTHROPIC_API_KEY` | Summary / decisions / actions / gaps analysis (server-side only, see below) | https://console.anthropic.com |

`.env` lives next to `package.json` and is gitignored. `VITE_API_URL` is
read at **build time** by Vite (must be prefixed `VITE_`) since it's needed
in the renderer to know where to sign in. `DEEPGRAM_API_KEY` /
`ANTHROPIC_API_KEY` are no longer used by this app directly — the AI
pipeline moved server-side in Phase 2 (`../server/src/pipeline/`) so API
keys never need to reach a desktop machine at all. They're kept here only
because the Electron main process still reads them as a fallback for the
(now unused) local-only pipeline code in `electron/ai.cjs` — set them on the
**server's** `.env` instead.

### macOS permissions

The first time you record, macOS will prompt for:
- **Microphone** — required.
- **Screen & System Audio Recording** — needed to capture the other side of
  the call (system audio), not just your mic. If you decline, or your macOS
  version doesn't support it, Recall falls back to **mic-only** and tells you
  so on the recording pill and in that meeting's fields.

System-audio capture is the single most fragile part of this app — it
depends on Electron/Chromium's desktop-audio-loopback support and your macOS
version, and can't be fully verified outside a real Mac with real hardware.
If it's unreliable on your machine, mic-only recording still works.

## Build

```bash
npm run build   # type-check + Vite production build -> dist/
npm run dist    # build + package a macOS app with electron-builder
```

## What's real vs. still mocked (Phase 2)

**Real, shared across the team via the server:**
- Sign-in (email + password), invite-a-colleague, domain-gated to
  `@maverio.com` — `src/components/screens/Auth.tsx`, `src/api.ts`
- Clients (create/edit/archive/notes/contacts), scheduled meetings, meeting
  publish/unpublish, gap answers, field edits, title edits, voice names —
  all persisted in the server's Postgres database and live-synced to every
  signed-in teammate over the websocket (`src/realtime.ts`)
- Audio capture (mic + best-effort system audio) via `src/capture.ts`,
  uploaded to the server, which runs transcription (Deepgram) + AI analysis
  (Claude) and pushes the result back over the websocket — no API keys or
  AI calls happen on the desktop machine anymore
- A brand-new team's workspace starts genuinely empty (no seed meetings) —
  the Timeline/Knowledge base/etc. all handle the zero-data state gracefully

**Still mocked / not yet built:**
- **No cross-meeting voice recognition.** Deepgram diarizes speakers within
  one recording; naming a speaker only applies to that one meeting (unlike
  the demo's "?1 recurs across 4 Hartline calls" voiceprint fiction)
- Simultaneous screen recording (removed from the UI as not implemented)
- The Ask rail's Q&A is still a canned local answer bank
  (`src/data.ts`'s `ANSWERS`), not a real search over the team's meetings
- Attendee/team-member "voiceprint" identity is still the fixed 8-person
  mock roster (`P` in `src/data.ts`) for the Prep screen's attendee chips;
  a real team's invited members don't get a matching avatar/color slot there
- Invite links are a raw code the inviter copies and sends manually (no
  email delivery, no `recall.maverio.com/join/...` deep link yet)

## Structure

- `electron/main.cjs` — window + local IPC handlers (screen-source picker,
  mic permission, saving a recording to a temp file). The old local
  store/transcribe/analyze IPC handlers (`electron/store.cjs`,
  `electron/ai.cjs`) are unused now that the server does all of that, and
  are kept only as a reference for the Phase 1 local-only pipeline.
- `src/api.ts` — REST client for the server (`../server`): auth, team,
  clients, meetings, scheduled meetings, audio upload. The only place a
  network request is made.
- `src/realtime.ts` — websocket client; subscribes to live events
  (`meeting.*`, `client.updated`, `scheduled.*`, `team.*`) from the server.
- `src/sync.ts` — maps the server's id-keyed rows (clients, meetings,
  scheduled meetings, team) to the client-name-keyed shapes the rest of the
  app already works with, so `derive.ts` needed almost no changes for Phase 2.
- `src/capture.ts` — renderer-side mic + system-audio capture and recording;
  the resulting blob is uploaded via `api.ts` instead of processed locally.
- `src/persistence.ts` — a local cache (auth token + last-synced data) via
  IPC (or `localStorage` in a plain browser), so the app paints instantly on
  launch before the network fetch + websocket reconcile it with the server.
- `src/data.ts` — the original mock data model (people, seed meetings, the
  canned Q&A answer bank, practices) — still used as an offline-safe default
  before login, and for cosmetic constants (practice colors, the fixed
  attendee roster) that Phase 2 didn't need to change.
- `src/initialState.ts` — the app's initial state shape.
- `src/useApp.ts` — state + the imperative logic: auth (login/accept-invite/
  logout), the real recording lifecycle (capture → upload → the server
  transcribes/analyzes and pushes updates back), markdown export, search, ask.
- `src/derive.ts` — builds the view-model consumed by every screen
  component (labels, colors, computed booleans, event handlers) — this is
  the direct port of the prototype's `renderVals()`, now sourcing
  clients/meetings/team/scheduled meetings from server-synced state instead
  of the static mock constants.
- `src/components/` — presentational React components, one per screen/overlay.

See `../server/README.md` for the backend.
