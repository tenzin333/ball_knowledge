"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { popCorrect, popFinale } from "@/lib/confetti";
import { tierFor } from "@/lib/tiers";
// NOTE: Leaderboard is disabled for now. It was browser-local (localStorage)
// only — this app is stateless with no backend/auth, so scores are per-device,
// not per-user. Kept for later: re-enable the `saveScore` import, the `board`
// state, the save line in the effect, and the leaderboard JSX block below once
// there's a real user + server to persist scores against. See src/lib/scores.ts.
// import { saveScore, ScoreEntry } from "@/lib/scores";

interface Props {
  score: number;
  correct: number; // total correctly-placed players
  perfects: number; // perfect rounds
  rounds: number;
  difficulty: string;
  onPlayAgain: () => void;
}

export default function ResultScreen({
  score,
  correct,
  perfects,
  rounds,
  difficulty,
  onPlayAgain,
}: Props) {
  // const [board, setBoard] = useState<ScoreEntry[]>([]); // leaderboard (disabled)
  const fired = useRef(false);

  const totalSlots = rounds * 5;
  const tier = tierFor(correct, totalSlots);

  useEffect(() => {
    if (fired.current) return; // run celebration once
    fired.current = true;
    // Leaderboard persistence disabled for now (see note at top of file):
    // setBoard(saveScore({ score, rounds, difficulty, at: Date.now() }));
    if (tier.key === "legend") popFinale();
    else if (tier.key === "elite") popCorrect();
  }, [tier.key]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md text-center"
    >
      {/* Animated tier badge */}
      <div className="relative mx-auto mb-3 grid h-32 w-32 place-items-center">
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${tier.grad} opacity-30 blur-2xl`}
        />
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.1 }}
          className={`text-8xl ${tier.anim}`}
        >
          {tier.emoji}
        </motion.div>
      </div>

      <h1
        className={`bg-gradient-to-r ${tier.grad} bg-clip-text text-5xl font-black uppercase tracking-tight text-transparent`}
      >
        {tier.name}
      </h1>
      <p className="mt-1 font-bold text-fuchsia-100/80">{tier.tag}</p>

      <div className="my-6 rounded-3xl border-2 border-white/10 bg-white/[0.04] p-6">
        <div className="text-7xl font-black gradient-text">{score}</div>
        <div className="text-sm font-black uppercase tracking-widest text-lime-300/70">
          total aura ✨
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.04] py-3">
            <div className="text-2xl font-black text-cyan-300">
              {correct}
              <span className="text-base text-cyan-300/50">/{totalSlots}</span>
            </div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-fuchsia-100/55">
              players in right spot
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] py-3">
            <div className="text-2xl font-black text-fuchsia-300">
              {perfects}
              <span className="text-base text-fuchsia-300/50">/{rounds}</span>
            </div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-fuchsia-100/55">
              flawless rounds
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-fuchsia-200/40 capitalize">
          {difficulty} mode
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 rounded-2xl bg-gradient-to-r from-lime-400 to-cyan-400 py-3.5 font-black uppercase text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          run it back 🔁
        </button>
        <Link
          href="/"
          className="flex-1 rounded-2xl border-2 border-white/15 bg-white/[0.04] py-3.5 font-black transition-colors hover:bg-white/[0.08]"
        >
          menu
        </Link>
      </div>

      {/*
        Leaderboard — disabled until there's real per-user persistence (backend +
        auth). It previously read the device's localStorage via saveScore(), which
        is per-device, not per-user. Re-enable the import, `board` state, and the
        save line above, then uncomment this block:

      {board.length > 0 && (
        <div className="mt-8 text-left">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-300/80">
            ur top aura runs 📈
          </h2>
          <ol className="space-y-1.5">
            {board.slice(0, 5).map((e, i) => (
              <li
                key={e.at}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="font-black text-fuchsia-300/60">#{i + 1}</span>
                  <span className="text-fuchsia-100/70 font-medium capitalize">
                    {e.difficulty} mode
                  </span>
                </span>
                <span className="font-black text-lime-300">{e.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      */}
    </motion.div>
  );
}
