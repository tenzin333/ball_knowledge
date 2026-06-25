// Pure helpers to finalize LLM rounds for play. Client-safe.
import { ApiRound, RankPlayer } from "./types";

export interface Round {
  question: string;
  unit: string;
  emoji: string;
  explanation: string; // why the ranking is what it is (shown on demand)
  /** Players in shuffled display order. */
  players: RankPlayer[];
  /** Player-array indices ordered from highest value to lowest (correct ranking). */
  correctOrder: number[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Shuffle display order and compute the correct ranking from each player's value. */
export function finalizeRound(api: ApiRound): Round {
  const players = shuffle(api.players);
  const correctOrder = players
    .map((_, idx) => idx)
    .sort((a, b) => players[b].value - players[a].value);
  return {
    question: api.question,
    unit: api.unit,
    emoji: api.emoji || "⚽",
    explanation: api.explanation || "",
    players,
    correctOrder,
  };
}

export function finalizeRounds(rounds: ApiRound[]): Round[] {
  return rounds.map(finalizeRound);
}

/** How many slots the user placed in exactly the right rank. */
export function scoreRound(userOrder: number[], correctOrder: number[]): number {
  let matches = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) matches++;
  }
  return matches;
}
