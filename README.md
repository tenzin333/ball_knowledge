# Ball Knowledge ⚽

A chaotic, IG-style **"rank the ballers"** game. Each round drops 5 real players
with their photos; you tap them **MOST → LEAST** for a stat (goals, assists,
games played) and the **real numbers slam onto the cards** to reveal how close
you got. Farm aura, dodge the L.

## How it plays

- Pick a league (or **Surprise Me**).
- 5 rounds. Each round: a stat category + 5 players in random order.
- Tap players highest → lowest. The real stat numbers reveal on each card.
- Score = correctly placed players × 20 aura, +50 for a perfect round.
- Confetti, streaks, and a local leaderboard.

## Data

- **Real stats:** [football-data.org](https://www.football-data.org/) top-scorers
  endpoint (goals / assists / appearances) — accurate, current season.
- **Player photos:** [TheSportsDB](https://www.thesportsdb.com/) cutouts (best
  effort; falls back to an initials avatar + club crest).

## Setup

1. Get a **free** football-data.org key: https://www.football-data.org/client/register
2. Create `.env.local` (copy from `.env.local.example`):

   ```
   FOOTBALL_DATA_API_KEY=your-key-here
   ```

3. Install & run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000

## Code map

- `src/lib/footballData.ts` — server-only: fetch scorers + enrich with photos.
- `src/lib/rounds.ts` — pure: turn a session into 5-player ranking rounds + scoring.
- `src/app/api/round/route.ts` — returns one session (top scorers) per request.
- `src/components/RankGame.tsx` — session loader, round loop, scoring.
- `src/components/PlayerBoard.tsx` — tap-to-rank + the augmented number reveal.

The API key is only ever used server-side in the route handler.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · framer-motion · canvas-confetti
