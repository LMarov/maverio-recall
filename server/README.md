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

Electron and electron-builder are kept on their latest stable majors
(currently Electron 44, electron-builder 26) rather than pinned indefinitely
— `npm audit` flagged real high/critical CVEs in the versions this project
started on (Phase 0), unaddressed until this was deliberately revisited.
Bumping Electron is the highest-regression-risk dependency update this app
has, since it's the runtime everything else (capture, IPC, the packaged
app) runs on top of — re-run the full manual capture/permissions smoke test
on a real Mac after any future Electron major bump, the same way this one
was verified live (screen-by-screen navigation, IPC round-trips, a
test-packaged `.app` bundle) before being adopted.

### Signing & notarization

`npm run dist` produces an unsigned `.dmg` by default — fine for your own
testing, but macOS Gatekeeper will block it on anyone else's machine unless
it's signed with a real Apple Developer ID and notarized. This only works
running on an actual Mac (code signing/notarization shell out to `codesign`
and `xcrun notarytool`) with a paid Apple Developer Program membership —
neither is available in this sandbox, so this has been configured but never
actually run.

`electron-builder` (see `build.mac` in `package.json`,
`build/entitlements.mac.plist`) already has hardened runtime + the
entitlements Electron needs under it, and the microphone usage description
Recall's mic capture requires. It signs and notarizes automatically once
these environment variables are set before `npm run dist`:

| Env var | For |
|---|---|
| `CSC_LINK` / `CSC_KEY_PASSWORD` | Path (or base64) to your Developer ID Application `.p12` certificate + its password — code signing |
| `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` | Notarization via an app-specific password (simplest) |
| `APPLE_API_KEY` / `APPLE_API_KEY_ID` / `APPLE_API_ISSUER` | Notarization via an App Store Connect API key (alternative to the above) |

Leave all of these unset for a local unsigned build — `npm run dist` still
works, it just isn't distributable to other machines.

### Testing

```bash
npm test   # vitest run
```

Unit tests for the pure, view-model-adjacent logic — `data.ts`'s attendee
resolvers, `sync.ts`'s server-row mappers, and `derive.ts`'s `buildView`
itself against realistic `AppState` fixtures. `derive.ts` computes the
*entire* view-model unconditionally on every render regardless of which
screen is active, which is exactly why an unsafe lookup on one screen's
data has twice now crashed every other screen too (a real teammate with no
fixed-demo `k`; a real per-meeting speaker key) — `derive.test.ts` targets
that exact pattern directly, across every screen, not just the current
one. No server, no Electron, and no browser needed — these run against
plain Node.

## What's real vs. still mocked (Phase 10)

**Real, shared across the team via the server:**
- Sign-in (email + password), invite-a-colleague, forgot/reset password,
  domain-gated to `@maverio.com` — `src/components/screens/Auth.tsx`,
  `src/api.ts`. Invite and reset emails are sent for real once the server
  has `EMAIL_DRIVER=smtp` configured (see `../server/README.md`).
- Clients (create/edit/archive/notes/contacts), scheduled meetings, meeting
  publish/unpublish, gap answers, field edits, title edits, voice names —
  all persisted in the server's Postgres database and live-synced to every
  signed-in teammate over the websocket (`src/realtime.ts`)
- Audio capture (mic + best-effort system audio) via `src/capture.ts`,
  uploaded to the server, which runs transcription (Deepgram) + AI analysis
  (Claude) and pushes the result back over the websocket — no API keys or
  AI calls happen on the desktop machine anymore
- **The Ask rail** — `ask()` in `src/useApp.ts` calls the server's `/ask`
  endpoint, which grounds Claude's answer in the team's actual meetings
  (summaries, decisions, actions, gaps, and — when the question is scoped to
  one meeting — the full transcript) and returns real citations back to the
  source meeting. No more canned answer bank once signed in.
- A brand-new team's workspace starts genuinely empty (no seed meetings) —
  the Timeline/Knowledge base/Ask rail all handle the zero-data state gracefully
- A pending invite (no name yet — the invitee hasn't accepted) renders with
  a readable placeholder name derived from their email (`nameFromEmail` in
  `src/data.ts`) everywhere a team member's name is shown, instead of
  assuming every team member already has one
- **Prep's "Voices in the room" attendee chips** are the real team roster and
  the current client's real contacts (`attendeeFromTeamMember`/
  `attendeeFromContact` in `src/data.ts`), each with a stable, deterministic
  avatar color (`colorForKey`) — not the fixed 8-person mock dictionary
- **The audit log** (Capture & policy screen, owners/admins only) reads real
  sign-ins, invites, client edits, publishes, and audio-retention deletions
  from the server's `/audit` endpoint
- **Cross-meeting voice recognition** — when the server has a
  `PICOVOICE_ACCESS_KEY` configured, naming a speaker enrolls a real
  voiceprint (Picovoice Eagle, on-device speaker embeddings — no raw audio
  stored, just the derived profile), and every new meeting's still-unnamed
  speakers are checked against it. A match only ever surfaces as a
  suggestion — a prefilled name + confidence % on the Voices screen's
  pending-voice card and in the namer — a human still has to confirm it.
  Entirely optional: with no key set, naming a speaker works exactly as
  before, just without any cross-meeting matching. See `../server/README.md`
  for the setup and honest limits of this (it needs a real Picovoice
  AccessKey to do anything, which this sandbox doesn't have).

- **Invite and password-reset emails are clickable deep links.** Clicking
  `maveriorecall://join/<code>` or `maveriorecall://reset/<code>` (see
  `electron/main.cjs`) launches the app straight into the accept-invite or
  reset-password screen with the code already filled in — the raw code is
  still included underneath as a fallback for anyone whose mail client
  strips the link or who's copying it to a different machine. A real
  `recall.maverio.com/join/...` web link would need an actual hosted domain;
  this achieves the same one-click outcome without one, since macOS hands a
  registered custom URL scheme straight to the app. The link-parsing logic
  and the packaged app's `Info.plist` registration were both verified
  directly; actually clicking a `maveriorecall://` link and watching macOS
  launch/focus the app hasn't been, since that needs a real signed,
  installed build on an actual Mac — not available in this sandbox.

- **Ask ranks meetings by real relevance** to the question — Postgres
  full-text search over title/objective/summary/decisions/actions/gaps
  (`../server/src/pipeline/retrieval.ts`), not just the 50 most recent —
  falling back to recency for whatever's left when the question's wording
  doesn't overlap the corpus. Ranks on shared vocabulary, not meaning, so
  it's full-text search rather than genuine semantic/vector search — see
  `../server/README.md` for that distinction.

**Still mocked / not yet built:**
- Simultaneous screen recording (removed from the UI as not implemented)
- Voiceprint enrollment rebuilds a person's profile from whichever meeting's
  audio they were most recently (re)named in — it doesn't average across
  every meeting they've ever been confirmed in.

## Structure

- `build/entitlements.mac.plist` — hardened-runtime entitlements for
  signing/notarization, see "Signing & notarization" above.
- `src/*.test.ts` — the test suite, see "Testing" above.
- `electron/main.cjs` — window + local IPC handlers (screen-source picker,
  mic permission, saving a recording to a temp file), plus the
  `maveriorecall://` custom-protocol registration and deep-link parsing
  (forwarded to the renderer over the `deep-link` IPC channel, see
  `electron/preload.cjs`'s `onDeepLink`). The old local store/transcribe/
  analyze IPC handlers (`electron/store.cjs`, `electron/ai.cjs`) are unused
  now that the server does all of that, and are kept only as a reference
  for the Phase 1 local-only pipeline.
- `src/api.ts` — REST client for the server (`../server`): auth, team,
  clients, meetings, scheduled meetings, audio upload, ask. The only place a
  network request is made.
- `src/realtime.ts` — websocket client; subscribes to live events
  (`meeting.*`, `client.updated`, `scheduled.*`, `team.*`) from the server.
- `src/sync.ts` — maps the server's id-keyed rows (clients, meetings,
  scheduled meetings, team) to the client-name-keyed shapes the rest of the
  app already works with, so `derive.ts` needed almost no changes for Phase
  2, plus `scopeSpeakerKey()`, which normalizes Deepgram/Claude's raw
  per-recording speaker labels ("?0", "Speaker 0") into the meeting-scoped
  unnamed-voice keys the rest of the app expects.
- `src/capture.ts` — renderer-side mic + system-audio capture and recording;
  the resulting blob is uploaded via `api.ts` instead of processed locally.
- `src/persistence.ts` — a local cache (auth token + last-synced data) via
  IPC (or `localStorage` in a plain browser), so the app paints instantly on
  launch before the network fetch + websocket reconcile it with the server.
- `src/data.ts` — the original mock data model (people, seed meetings, the
  canned Q&A answer bank, practices) — still used as an offline-safe default
  before login, and for cosmetic constants (practice colors, audit action
  labels) that didn't need to change. Also home to the real-attendee
  resolvers (`attendeeFromTeamMember`, `attendeeFromContact`,
  `resolveAttendeeKey`, `colorForKey`) that unify the fixed demo roster with
  real team members and client contacts wherever a speaker/attendee needs a
  name and color.
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
