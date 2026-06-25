# Ball Knowledge ⚽

A chaotic, IG-style **"rank the ballers"** game. Each round drops 5 real players
with their photos; you drag them into order **MOST → LEAST** for some stat or
trait, then **lock in** and the real values slam onto the cards to reveal how
close you got. Farm aura, dodge the L.

Live at: https://ballknowledgegg.vercel.app/

## How it plays

- Pick a difficulty: **easy**, **medium**, or **hard**.
- 5 AI-generated rounds. Each round: a ranking question + 5 players in random order.
- Drag players highest → lowest, then **lock in**. The real values reveal on each card.
- Score = correctly placed players × 20 aura, +50 for a perfect round, with streaks.
- Confetti and a tiered result (amateur / elite / legend).

Scoring is **value-based**: a slot is correct when the player's value matches the
correct value for that slot, so tied values are interchangeable and always fair.

## Data

- **Rounds & stats:** AI-generated via [Groq](https://groq.com/)'s OpenAI-compatible
  API (`llama-3.3-70b-versatile`, falling back to `llama-3.1-8b-instant`).
- **Player photos:** [TheSportsDB](https://www.thesportsdb.com/) cutouts (best
  effort, nationality-validated; falls back to an initials avatar).

## Setup

1. Get a **free** Groq API key: https://console.groq.com/keys
2. Create `.env.local` (copy from `.env.local.example`):

   ```
   GROQ_API_KEY=your-key-here
   ```

   Player photos use TheSportsDB's free public key (hardcoded), so no extra key is needed.

3. Install & run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000

## Code map

- `src/lib/llm.ts` — server-only: ask Groq for 5 rounds of 5 players each.
- `src/lib/playerImages.ts` — server-only: enrich players with nationality-validated photos.
- `src/lib/rounds.ts` — pure: shuffle display order, compute correct order, score rounds.
- `src/app/api/round/route.ts` — returns one game (5 rounds) per request.
- `src/components/RankGame.tsx` — round loop, scoring, streaks.
- `src/components/PlayerBoard.tsx` — drag-to-reorder + the value reveal.

The API key is only ever used server-side. The app is stateless — no database, no auth.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · framer-motion · canvas-confetti

## Author

[tenthinlay](https://github.com/tenzin333) — tenthinlay007@gmail.com
