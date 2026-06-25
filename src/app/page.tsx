"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Difficulty } from "@/lib/types";
import { TIER_LADDER, tierRangeLabel } from "@/lib/tiers";

const DIFFICULTIES: { id: Difficulty; label: string; blurb: string }[] = [
  { id: "easy", label: "Lil Bro 🍼", blurb: "icons, obvious order" },
  { id: "medium", label: "Aura Farmer 😼", blurb: "mixed bag" },
  { id: "hard", label: "Sigma 🗿", blurb: "spicy & debatable" },
];

export default function Home() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  function kickOff() {
    router.push(`/play?difficulty=${difficulty}`);
  }

  return (
    <main className="pitch-stripes flex-1 flex flex-col items-center justify-center px-5 py-10 sm:py-12">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-9 relative">
          <div className="pointer-events-none absolute -top-2 left-2 text-3xl animate-float">
            🔥
          </div>
          <div className="pointer-events-none absolute top-6 right-3 text-3xl animate-float [animation-delay:0.6s]">
            💀
          </div>
          <div className="text-6xl mb-1 animate-wobble inline-block">⚽</div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">
            BALL <span className="gradient-text">KNOWLEDGE</span>
          </h1>
          <p className="mt-3 text-fuchsia-100/80 max-w-md mx-auto font-semibold">
            drag the ballers into the right order — best dribblers, GOAT mids,
            biggest transfers & more. you got the takes? 🧠⚽
          </p>
        </header>

        <section className="mb-9">
          <h2 className="text-sm font-black uppercase tracking-widest text-cyan-300 mb-3">
            how cooked do u want it 🔥
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => {
              const active = d.id === difficulty;
              return (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-3xl border-2 px-2 py-5 text-center transition-all ${
                    active
                      ? "border-fuchsia-400 bg-fuchsia-400/15 ring-4 ring-fuchsia-400/30 rotate-1"
                      : "border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="font-black text-sm leading-tight">{d.label}</div>
                  <div className="mt-1 text-[11px] text-cyan-100/60 font-medium">
                    {d.blurb}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <button
          onClick={kickOff}
          className="w-full rounded-3xl bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 py-5 text-2xl font-black uppercase tracking-tight text-black shadow-[0_8px_0_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.35)] animate-throb"
        >
          LOCK IN 🔒⚽
        </button>

        {/* Transparency: how the end-of-game rank is decided. */}
        <section className="mt-7">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-300">
            how u get ranked 🏅
          </h2>
          <p className="mb-3 text-xs font-medium text-fuchsia-100/55">
            every game = 5 rounds, 5 ballers to rank each (25 in total). ur tier
            🏅 is the share you put in the right order — aura points are separate.
          </p>
          <ul className="space-y-2">
            {TIER_LADDER.map((t) => (
              <li
                key={t.key}
                className="flex items-center gap-3 rounded-2xl border-2 border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="text-2xl">{t.emoji}</span>
                <span
                  className={`bg-gradient-to-r ${t.grad} bg-clip-text font-black uppercase tracking-tight text-transparent`}
                >
                  {t.name}
                </span>
                <span className="ml-auto text-sm font-black text-fuchsia-100/70">
                  {tierRangeLabel(t)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-5 text-center text-xs text-fuchsia-100/40 font-medium">
          takes by AI 🤖 · player pics from{" "}
          <span className="text-lime-300/70">TheSportsDB</span> · every run hits
          different 💅
        </p>
      </div>
    </main>
  );
}
