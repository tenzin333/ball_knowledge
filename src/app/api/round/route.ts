import { NextRequest, NextResponse } from "next/server";
import { generateRounds } from "@/lib/llm";
import { resolveImages } from "@/lib/playerImages";
import { ApiRound, Difficulty, RankPlayer } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const NUM_ROUNDS = 5;

export async function POST(req: NextRequest) {
  let body: { difficulty?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const difficulty: Difficulty = DIFFICULTIES.includes(
    body.difficulty as Difficulty,
  )
    ? (body.difficulty as Difficulty)
    : "medium";

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing GROQ_API_KEY." },
      { status: 500 },
    );
  }

  try {
    const raw = await generateRounds(NUM_ROUNDS, difficulty);

    // Enrich every player with a nationality-validated photo (de-duplicated).
    const allPlayers = raw.flatMap((r) =>
      r.players.map((p) => ({ name: p.name, nationality: p.nationality ?? "" })),
    );
    const images = await resolveImages(allPlayers);

    let pid = 0;
    const rounds: ApiRound[] = raw.map((r) => ({
      question: r.question,
      unit: r.unit,
      emoji: r.emoji,
      explanation: r.explanation ?? "",
      players: r.players.map<RankPlayer>((p) => ({
        id: pid++,
        name: p.name,
        subtitle: p.subtitle ?? "",
        nationality: p.nationality ?? "",
        value: p.value,
        image: images.get(p.name) ?? null,
      })),
    }));

    return NextResponse.json({ rounds });
  } catch (err) {
    console.error("[/api/round] failed:", err);
    return NextResponse.json(
      { error: "Couldn't cook up the rounds. Run it back." },
      { status: 500 },
    );
  }
}
