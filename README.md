# אלבום המשפחה — Family Album MVP

A minimal, Hebrew, mobile-first app with two pages:

- **`/`** — "Add a memory": upload a photo, optionally say who it is,
  optionally record a voice note telling their story. Submits to the
  backend, which transcribes the voice note (Whisper) and starts
  animating the photo with gentle motion (Runway).
- **`/album`** — the private gallery: shows every memory, the animated
  clip once it's ready (falls back to the still photo while
  processing), the story transcript, and the original voice note.

Both pages are protected by a simple shared code (not real accounts —
good enough to keep the album off search engines and away from
strangers, not meant to be bank-grade security).

## 1. Get your API keys

You need two, both pay-as-you-go:

- **OpenAI** (for transcribing the Hebrew voice notes): sign up at
  https://platform.openai.com, create a key under API Keys. Whisper
  costs about $0.006/minute — a few cents a month at this scale.
- **Runway** (for animating the photos): sign up at
  https://app.runwayml.com, create a key under Settings → API Keys.
  This is the real cost driver — roughly $0.25–0.50 per 5-second clip
  on the turbo model this app uses. Buy a small credit pack to start;
  there's no free tier for video generation.

## 2. Configure

```bash
cp .env.example .env.local
```

Fill in `OPENAI_API_KEY` and `RUNWAY_API_KEY`. Also set:

- `UPLOAD_ACCESS_CODE` — the code grandma types once to reach the
  "add a memory" page (keep it simple — a word in Hebrew is fine).
- `ALBUM_ACCESS_CODE` — the code family members type to view the
  album (can be the same as above, or different if you want to share
  the album link more widely than the upload link).

## 3. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Try adding a memory, then check
http://localhost:3000/album.

## 4. Deploy it somewhere real

**Important:** this app stores photos, clips, voice notes and a small
JSON file on disk, under `DATA_DIR` (see `lib/db.js`). That's simple
and fine for an MVP, but it means you need a host with a **persistent
volume** that survives redeploys — not a serverless platform like
plain Vercel, where the filesystem resets on every deploy.

### Railway

1. New Project → Deploy from GitHub repo → pick this repo.
2. Add a **Volume** to the service (Settings → Volumes), mount path
   e.g. `/data`.
3. Set environment variables (Settings → Variables):
   - `DATA_DIR=/data` (must match the volume's mount path)
   - `OPENAI_API_KEY`, `RUNWAY_API_KEY`
   - `UPLOAD_ACCESS_CODE`, `ALBUM_ACCESS_CODE`
4. Railway auto-detects Next.js and runs `npm run build` / `npm run
   start` — no changes needed there.
5. Settings → Networking → Generate Domain to get a public URL.

### Other options
- **Render** — same idea: a Web Service with a persistent disk
  mounted at some path, set `DATA_DIR` to that path.
- **A small VPS** (DigitalOcean, Hetzner) — run `npm run build && npm
  run start` behind a process manager like `pm2`; `DATA_DIR` can just
  be a normal folder on disk since the VPS itself persists.

## 5. Send grandma the link

Once deployed, the two links to share are:

- `https://your-domain/` — bookmark this on her phone for adding
  memories. Walk her through typing the upload code once; after that
  it's remembered on her phone.
- `https://your-domain/album` — share this with the family, with the
  album code.

A WhatsApp-based flow (sending photos directly to a bot) is a
natural next step once this version proves people actually use it —
but it needs WhatsApp Business API setup (a dedicated number, Meta
verification), which is a separate, heavier piece of work. This
version gets you testing the actual experience — the animation, the
voice stories, the album — today.

## What's deliberately simple (and what to improve later)

- **Storage** is a flat JSON file + local disk. Fine for dozens of
  memories; swap for a real database if this grows to hundreds.
- **Auth** is a shared code in `localStorage`, not real accounts.
- **No retry queue** — if Runway or Whisper fails, the memory is
  still saved (photo + transcript if transcription worked), just
  without an animated clip. You can see failures in the server logs.
- **Motion prompt** is hard-coded in `lib/runway.js`
  (`GENTLE_MOTION_PROMPT`) — tune the wording there if clips come out
  too subtle or too dramatic.
- **One photo per memory.** Multiple photos per person, grouping by
  person, and song generation from the transcripts are natural next
  layers once this is working.
