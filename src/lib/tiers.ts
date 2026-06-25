// Single source of truth for result tiers — shared by the menu (transparency
// info) and the result screen. Client-safe (no secrets / server-only deps).

export interface Tier {
  key: "amateur" | "elite" | "legend";
  name: string;
  emoji: string;
  grad: string; // tailwind gradient classes
  anim: string; // tailwind/custom animation class
  tag: string;
  /** Inclusive lower bound, as a fraction of players placed correctly. */
  minPct: number;
}

export const TIERS: Record<Tier["key"], Tier> = {
  amateur: {
    key: "amateur",
    name: "AMATEUR",
    emoji: "🐣",
    grad: "from-cyan-300 to-sky-500",
    anim: "animate-wobble",
    tag: "keep grinding, aura incoming 💪",
    minPct: 0,
  },
  elite: {
    key: "elite",
    name: "ELITE",
    emoji: "🦅",
    grad: "from-fuchsia-300 to-violet-500",
    anim: "animate-throb",
    tag: "certified baller brain 😼🔥",
    minPct: 0.4,
  },
  legend: {
    key: "legend",
    name: "LEGEND",
    emoji: "👑",
    grad: "from-yellow-300 to-amber-500",
    anim: "animate-bounce",
    tag: "GOAT scout, unreal 🐐🏆",
    minPct: 0.75,
  },
};

/** Tiers from lowest to highest — for ordered display. */
export const TIER_LADDER: Tier[] = [TIERS.amateur, TIERS.elite, TIERS.legend];

/** Pick the tier for a given number of correctly-placed players. */
export function tierFor(correct: number, totalSlots: number): Tier {
  const pct = totalSlots ? correct / totalSlots : 0;
  if (pct >= TIERS.legend.minPct) return TIERS.legend;
  if (pct >= TIERS.elite.minPct) return TIERS.elite;
  return TIERS.amateur;
}

/** Human-readable accuracy range for a tier, e.g. "40–74%" or "75%+". */
export function tierRangeLabel(tier: Tier): string {
  const lo = Math.round(tier.minPct * 100);
  const idx = TIER_LADDER.findIndex((t) => t.key === tier.key);
  const next = TIER_LADDER[idx + 1];
  if (!next) return `${lo}%+`;
  const hi = Math.round(next.minPct * 100) - 1;
  return `${lo}–${hi}%`;
}
