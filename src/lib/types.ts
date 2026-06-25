// Shared types for Ball Knowledge — creative "rank the ballers" game.

export type Difficulty = "easy" | "medium" | "hard";

/** One player in a ranking round. `value` defines the correct order (higher = better). */
export interface RankPlayer {
  id: number;
  name: string;
  subtitle: string; // club, shown under the name
  nationality: string; // country in English, used to validate the photo
  value: number; // the LLM's rating/number for this player
  image: string | null; // cutout from TheSportsDB (best effort, nationality-checked)
}

/** A round as produced by the LLM (before photos + shuffling). */
export interface ApiRound {
  question: string; // e.g. "Rank the greatest midfielders of all time"
  unit: string; // what the number means, e.g. "GOAT rating", "Ballon d'Ors"
  emoji: string;
  explanation: string; // short justification of the ranking (shown on demand)
  players: RankPlayer[];
}

export interface RoundsResponse {
  rounds: ApiRound[];
}
