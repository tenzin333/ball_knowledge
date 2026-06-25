# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ Per `AGENTS.md`: this is **Next.js 16** (App Router) with breaking changes vs. older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

There is no test suite yet. `playwright` is installed but no specs or config exist; data-testids (`player-row`, `rank-badge`, `player-value`, `player-name`, `player-mark`) are sprinkled through `PlayerBoard.tsx` for future e2e tests.

### Required environment

- `GROQ_API_KEY` — **required**. The app calls Groq's OpenAI-compatible API (not OpenAI itself). Without it `/api/round` returns a 500. Player photos use TheSportsDB's free public key (`3`, hardcoded), so no key is needed for images.

## Architecture

Ball Knowledge is a single-player "rank 5 footballers in the right order" game with a loud Gen-Z/brainrot tone. Each game = 5 AI-generated ranking rounds. The app is **stateless** — no database, no auth, nothing persists server-side.

### Data flow for one game

1. `/` ([src/app/page.tsx](src/app/page.tsx)) — pick difficulty (easy/medium/hard), routes to `/play?difficulty=…`.
2. `/play` ([src/app/play/page.tsx](src/app/play/page.tsx)) — server component validates the difficulty and renders the client `<RankGame>`.
3. `<RankGame>` ([src/components/RankGame.tsx](src/components/RankGame.tsx)) — the state machine (`loading → playing → calculating → done | error`). On mount it `POST`s to `/api/round`, then drives scoring/streaks across rounds.
4. `POST /api/round` ([src/app/api/round/route.ts](src/app/api/round/route.ts)) — orchestrates generation:
   - `generateRounds()` ([src/lib/llm.ts](src/lib/llm.ts)) asks Groq for 5 rounds of 5 players each.
   - `resolveImages()` ([src/lib/playerImages.ts](src/lib/playerImages.ts)) enriches every player with a nationality-validated photo.
   - Assigns stable `id`s and returns `ApiRound[]`.
5. Client `finalizeRounds()` ([src/lib/rounds.ts](src/lib/rounds.ts)) shuffles display order and computes `correctOrder` from each player's `value`.
6. `<PlayerBoard>` ([src/components/PlayerBoard.tsx](src/components/PlayerBoard.tsx)) — drag-to-reorder (framer-motion `Reorder`), "lock in", reveal, then `<ResultScreen>` ([src/components/ResultScreen.tsx](src/components/ResultScreen.tsx)).

### Round generation (`src/lib/llm.ts`)

- Uses the `openai` SDK pointed at `https://api.groq.com/openai/v1`. Model fallback chain: `llama-3.3-70b-versatile` → `llama-3.1-8b-instant`, with 2 attempts per model and retry only on transient errors (429/500/503).
- `THEME_SEEDS` is a large pool of ranking angles; a random subset is sampled per game (plus a per-game `nonce`) to keep questions fresh. Temperature is `1` for variety.
- The model returns raw JSON; `extractJson()` strips code fences and trailing commas defensively. `generateRounds()` filters out malformed rounds (must have a question and exactly 5 players each with a name + numeric `value`).
- The system prompt enforces game-design rules: real famous players only, distinct **uneven** realistic values (no lazy 100/90/80…), disambiguated names (e.g. "Ronaldo Nazário" vs "Cristiano Ronaldo"), theme consistency. When editing prompt rules, keep this file as the single source of truth.

### Scoring model — value-based, not position-based

The core scoring rule lives in [src/components/PlayerBoard.tsx](src/components/PlayerBoard.tsx) `lockIn()`: a slot is correct when the player's `value` equals the correct value for that slot — **not** by player identity. This makes tied values interchangeable and always fair. Cards are **not** reordered on reveal; the user keeps seeing their own ranking, and each card is tagged with where it actually belongs. Ranks use competition ranking (ties share a number: 1,2,2,4,…).

`src/lib/rounds.ts` `scoreRound()` is a separate position-match helper; `RankGame` awards `20 × correct + 50` perfect-round bonus and tracks streaks. Result tier (amateur/elite/legend) is by percentage of correctly-placed players.

### Photos (`src/lib/playerImages.ts`)

Best-effort cutouts from TheSportsDB, **de-duplicated by name** and fetched in parallel. Guards against the wrong-face problem for ambiguous names by comparing the returned `strNationality` against the LLM-supplied nationality (lenient match; trusts the name if either side is unknown). Missing/rejected images fall back to player initials in `<Avatar>`.

### Known-disabled feature

`src/lib/scores.ts` (localStorage leaderboard) and the leaderboard block in `ResultScreen.tsx` are intentionally disabled because the app is stateless/per-device — see the in-file notes before re-enabling.

## Conventions

- TypeScript path alias `@/*` → `./src/*`.
- Server-only modules (`llm.ts`, `playerImages.ts`) import `"server-only"` and read secrets; never import them into client components.
- Styling is Tailwind v4 (`@import "tailwindcss"` in [src/app/globals.css](src/app/globals.css)). Custom utilities live there: `gradient-text`, `pitch-stripes`, and `animate-{wobble,float,throb,pop-in,shake}`. Confetti effects are in [src/lib/confetti.ts](src/lib/confetti.ts) (client-only).
