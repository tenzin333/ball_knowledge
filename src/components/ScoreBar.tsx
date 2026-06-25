"use client";

interface Props {
  current: number; // 1-based question number
  total: number;
  score: number;
  streak: number;
}

export default function ScoreBar({ current, total, score, streak }: Props) {
  const pct = Math.round(((current - 1) / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-black text-fuchsia-200/90">
          ROUND {current}/{total}
        </span>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <span className="rounded-full bg-orange-500/25 px-2.5 py-0.5 text-xs font-black text-orange-300 animate-throb">
              🔥 {streak}x HEATER
            </span>
          )}
          <span className="font-black text-lime-300">{score} AURA ✨</span>
        </div>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lime-400 via-cyan-400 to-fuchsia-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
