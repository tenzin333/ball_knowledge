"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Difficulty, RoundsResponse } from "@/lib/types";
import { finalizeRounds, Round } from "@/lib/rounds";
import { popCorrect } from "@/lib/confetti";
import ScoreBar from "./ScoreBar";
import PlayerBoard from "./PlayerBoard";
import ResultScreen from "./ResultScreen";

type Phase = "loading" | "playing" | "calculating" | "done" | "error";

const PER_SLOT = 20; // aura per correctly placed player
const PERFECT_BONUS = 50;

interface Props {
  difficulty: Difficulty;
}

export default function RankGame({ difficulty }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0); // total correctly-placed players
  const [perfects, setPerfects] = useState(0);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setPhase("loading");
    setError("");
    setRounds([]);
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setPerfects(0);
    setStreak(0);
    try {
      const res = await fetch("/api/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setRounds(finalizeRounds((data as RoundsResponse).rounds));
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }, [difficulty]);

  useEffect(() => {
    load();
  }, [load]);

  function handleScored(matches: number) {
    const perfect = matches === 5;
    setCorrect((c) => c + matches);
    setScore((s) => s + matches * PER_SLOT + (perfect ? PERFECT_BONUS : 0));
    if (perfect) {
      setPerfects((p) => p + 1);
      setStreak((s) => s + 1);
      popCorrect();
    } else {
      setStreak(0);
      if (matches >= 3) popCorrect();
    }
  }

  // Memoized so PlayerBoard's auto-advance effect doesn't re-fire on re-render.
  const handleNext = useCallback(() => {
    if (index + 1 >= rounds.length) setPhase("calculating");
    else setIndex((i) => i + 1);
  }, [index, rounds.length]);

  // "calculating" is a brief loader after the final round → results.
  useEffect(() => {
    if (phase !== "calculating") return;
    const t = setTimeout(() => setPhase("done"), 1100);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-6xl animate-spin-ball">⚽</div>
        <p className="flex items-center gap-2 text-xl font-black">
          cooking up takes <LoadingDots /> 🔥
        </p>
        <p className="text-sm text-fuchsia-100/50 font-medium">
          inventing spicy rankings + grabbing player pics.
        </p>
        <SweepBar />
      </div>
    );
  }

  if (phase === "calculating") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-6xl animate-throb">🧮</div>
        <p className="flex items-center gap-2 text-xl font-black">
          calculating your aura <LoadingDots /> ✨
        </p>
        <p className="text-sm text-fuchsia-100/50 font-medium">tallying the dub.</p>
        <SweepBar />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center max-w-sm">
        <div className="text-6xl">💀</div>
        <p className="text-lg font-black">bro it fumbled the bag 😭</p>
        <p className="text-sm text-fuchsia-100/50 font-medium">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="rounded-2xl bg-gradient-to-r from-lime-400 to-cyan-400 px-5 py-3 font-black uppercase text-black"
          >
            run it back
          </button>
          <Link
            href="/"
            className="rounded-2xl border-2 border-white/15 px-5 py-3 font-black"
          >
            bail
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <ResultScreen
        score={score}
        correct={correct}
        perfects={perfects}
        rounds={rounds.length}
        difficulty={difficulty}
        onPlayAgain={load}
      />
    );
  }

  return (
    <div className="w-full max-w-xl">
      <ScoreBar
        current={index + 1}
        total={rounds.length}
        score={score}
        streak={streak}
      />
      <PlayerBoard
        key={index}
        round={rounds[index]}
        isLast={index + 1 === rounds.length}
        onScored={handleScored}
        onNext={handleNext}
      />
    </div>
  );
}

/** Three staggered bouncing dots in the brand colors. */
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-dot-trail" />
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-dot-trail [animation-delay:0.2s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-dot-trail [animation-delay:0.4s]" />
    </span>
  );
}

/** Indeterminate progress bar with a gradient chunk sweeping across. */
function SweepBar() {
  return (
    <div className="relative mt-1 h-1.5 w-48 max-w-[60%] overflow-hidden rounded-full bg-white/10">
      <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 animate-loading-sweep" />
    </div>
  );
}
