"use client";

import { motion, Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { RankPlayer } from "@/lib/types";
import { Round } from "@/lib/rounds";

const RANK_COLORS = [
  "from-yellow-300 to-amber-500", // 1
  "from-slate-200 to-slate-400", // 2
  "from-orange-300 to-orange-600", // 3
  "from-fuchsia-300 to-fuchsia-500", // 4
  "from-cyan-300 to-cyan-500", // 5
];

// Last round: how long the reveal stays before auto-advancing to results.
const AUTO_ADVANCE_MS = 4500;

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

interface Props {
  round: Round;
  isLast: boolean;
  onScored: (matches: number) => void;
  onNext: () => void;
}

export default function PlayerBoard({ round, isLast, onScored, onNext }: Props) {
  const { players, question, unit, emoji, explanation } = round;
  const [items, setItems] = useState<RankPlayer[]>(players);
  const [revealed, setRevealed] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  // Whether the user originally placed each player in its correct slot.
  const [rightById, setRightById] = useState<Map<number, boolean>>(new Map());
  const [matches, setMatches] = useState(0);

  // On the LAST round, auto-advance to results after a comfortable reveal —
  // unless the player opened the "why" explainer, in which case wait for them.
  useEffect(() => {
    if (revealed && isLast && !showWhy) {
      const t = setTimeout(onNext, AUTO_ADVANCE_MS);
      return () => clearTimeout(t);
    }
  }, [revealed, isLast, showWhy, onNext]);

  // The correct ranking, highest value first.
  const correctOrder = useMemo(
    () => [...players].sort((a, b) => b.value - a.value),
    [players],
  );
  // Competition rank (1-based) per player — TIED VALUES SHARE A RANK (1,2,2,4,…).
  const displayRankById = useMemo(() => {
    const m = new Map<number, number>();
    players.forEach((p) =>
      m.set(p.id, 1 + players.filter((q) => q.value > p.value).length),
    );
    return m;
  }, [players]);

  function lockIn() {
    // A slot is correct if its VALUE matches the correct value for that slot —
    // so tied players are interchangeable and always fair to score.
    // We DON'T reorder the cards: the user keeps seeing their own ranking,
    // and each card is tagged with where it actually belongs.
    const rights = new Map<number, boolean>();
    items.forEach((p, i) => rights.set(p.id, p.value === correctOrder[i].value));
    const hit = [...rights.values()].filter(Boolean).length;

    setRightById(rights);
    setMatches(hit);
    setRevealed(true);
    onScored(hit);
  }

  return (
    <div className="w-full">
      {/* Creative question header — fixed height so cards don't shift between
          rounds when the question is shorter/longer. */}
      <div className="mb-3 flex min-h-[5.75rem] flex-col justify-end">
        <h2 className="text-2xl sm:text-3xl font-black leading-tight">
          <span className="mr-1">{emoji}</span>
          <span className="gradient-text">{question}</span>
        </h2>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-fuchsia-200/50">
          by {unit}
        </p>
      </div>
      {revealed ? (
        <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
          <span className="text-fuchsia-200/50">your pick</span>
          <span className="text-lime-300">🟢 nailed · 🥇 = real rank</span>
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
          <span className="text-yellow-300">🔝 most</span>
          <span className="text-fuchsia-200/40">drag to rank</span>
          <span className="text-cyan-300">least 🔻</span>
        </div>
      )}

      <Reorder.Group
        axis="y"
        as="div"
        values={items}
        onReorder={setItems}
        className="space-y-2.5"
      >
        {items.map((p, idx) => (
          <PlayerRow
            key={p.id}
            player={p}
            index={idx}
            revealed={revealed}
            right={rightById.get(p.id) ?? false}
            displayRank={displayRankById.get(p.id) ?? 1}
          />
        ))}
      </Reorder.Group>

      {/* Hidden-by-default justification of the correct ranking. */}
      {revealed && explanation && (
        <div className="mt-4">
          <button
            onClick={() => setShowWhy((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs font-black uppercase tracking-widest text-cyan-300/90 transition-colors hover:bg-white/[0.06]"
          >
            <span>🤔 why these ranks?</span>
            <span className="text-fuchsia-200/50">{showWhy ? "▲" : "▼"}</span>
          </button>
          {showWhy && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-3.5 py-3 text-sm font-medium leading-relaxed text-fuchsia-50/90"
            >
              {explanation}
            </motion.p>
          )}
        </div>
      )}

      {!revealed ? (
        <button
          onClick={lockIn}
          className="mt-5 w-full rounded-3xl bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 py-4 text-xl font-black uppercase text-black shadow-[0_6px_0_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.35)]"
        >
          lock in ✅
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-3"
        >
          <div
            className={`grid h-16 w-22  shrink-0 place-items-center rounded-2xl border-2 text-2xl font-black ${
              matches === items.length
                ? "border-lime-400/60 bg-lime-400/15 text-lime-300"
                : matches >= 3
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                  : "border-rose-400/50 bg-rose-400/10 text-rose-300"
            }`}
          >
            {matches}/{items.length}
            <span className="ml-1 text-xl">
              {matches === items.length ? "🐐" : matches >= 3 ? "😼" : "💀"}
            </span>
          </div>
          {isLast ? (
            <div className="flex-1">
              <button
                onClick={onNext}
                className="w-full rounded-3xl bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 py-4 text-lg font-black uppercase text-black shadow-[0_6px_0_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.35)]"
              >
                see results 🏆
              </button>
              {/* Auto-advance countdown — cancels when the explainer is open. */}
              {!showWhy && (
                <>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-lime-400 to-cyan-400"
                    />
                  </div>
                  <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-fuchsia-200/40">
                    auto in a sec · tap 🤔 why to stay
                  </p>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 rounded-3xl bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 py-4 text-lg font-black uppercase text-black shadow-[0_6px_0_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.35)]"
            >
              next →
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  index,
  revealed,
  right,
  displayRank,
}: {
  player: RankPlayer;
  index: number;
  revealed: boolean;
  right: boolean;
  displayRank: number; // 1-based competition rank (ties share a number)
}) {
  const controls = useDragControls();
  // The left badge always shows the user's OWN ranking position (their pick),
  // so their guess stays visible after reveal.
  const myRank = index + 1;
  const arrow = displayRank < myRank ? "▲" : displayRank > myRank ? "▼" : "";

  return (
    <Reorder.Item
      value={player}
      as="div"
      layout
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.04, boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}
      data-testid="player-row"
      className={`flex select-none items-center gap-3 rounded-2xl border-2 px-2.5 py-2.5 ${
        revealed
          ? right
            ? "border-lime-400 bg-lime-400/15"
            : "border-rose-400/70 bg-rose-400/10"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      {/* Left badge = the user's own ranking position (their pick) */}
      <div
        data-testid="rank-badge"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${RANK_COLORS[index]} text-sm font-black text-black`}
      >
        {myRank}
      </div>

      {/* Avatar with augmented number overlay on reveal */}
      <div className="relative shrink-0">
        <Avatar player={player} />
        {revealed && (
          <motion.span
            data-testid="player-value"
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 13 }}
            className="absolute -bottom-1.5 -right-2 grid min-w-7 place-items-center rounded-lg bg-black px-1.5 py-0.5 text-base font-black text-lime-300 shadow-lg ring-2 ring-lime-400/60"
          >
            {player.value}
          </motion.span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div data-testid="player-name" className="truncate font-black leading-tight">
          {player.name}
        </div>
        <div className="truncate text-xs text-fuchsia-100/55 font-medium">
          {player.subtitle}
        </div>
      </div>

      {/* Right side: reveal verdict, or a drag grip.
          Correct → green check. Wrong → red pill showing the REAL rank + an
          arrow telling which way it should move. */}
      {revealed ? (
        right ? (
          <motion.div
            data-testid="player-mark"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime-400 text-lg font-black text-black shadow"
          >
            ✓
          </motion.div>
        ) : (
          <motion.div
            data-testid="player-mark"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex shrink-0 items-center gap-1.5"
          >
            <span className="text-xs font-black text-rose-300">{arrow}</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-sm font-black text-black ring-2 ring-yellow-200/40">
              {displayRank}
            </span>
          </motion.div>
        )
      ) : (
        <div
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 cursor-grab touch-none px-2 text-xl text-fuchsia-200/40 active:cursor-grabbing"
          aria-label="drag handle"
        >
          ⠿
        </div>
      )}
    </Reorder.Item>
  );
}

function Avatar({ player }: { player: RankPlayer }) {
  return (
    <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-600/40 to-cyan-600/40 ring-2 ring-white/15">
      {player.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.image}
          alt={player.name}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span className="text-sm font-black text-white/90">
          {initials(player.name)}
        </span>
      )}
    </div>
  );
}
