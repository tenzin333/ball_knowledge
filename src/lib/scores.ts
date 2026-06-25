// Local leaderboard persisted in the browser (localStorage).
// CURRENTLY UNUSED — the leaderboard UI is disabled in ResultScreen because this
// is per-device, not per-user (the app is stateless, no backend/auth). Kept for
// later: when a real backend + user accounts exist, either swap these for API
// calls or keep localStorage as an offline fallback, then re-enable the
// leaderboard block in src/components/ResultScreen.tsx.
export interface ScoreEntry {
  score: number;
  rounds: number;
  difficulty: string;
  at: number; // epoch ms
}

const KEY = "ball-knowledge-scores";
const MAX = 10;

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

/** Save a result and return the top-MAX leaderboard (best score first). */
export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  const all = [...loadScores(), entry]
    .sort((a, b) => b.score - a.score || b.at - a.at)
    .slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage full / blocked — ignore */
  }
  return all;
}
