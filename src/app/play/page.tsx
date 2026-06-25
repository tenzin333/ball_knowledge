import RankGame from "@/components/RankGame";
import { Difficulty } from "@/lib/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>;
}) {
  const params = await searchParams;
  const difficulty: Difficulty = DIFFICULTIES.includes(
    params.difficulty as Difficulty,
  )
    ? (params.difficulty as Difficulty)
    : "medium";

  return (
    <main className="pitch-stripes flex-1 flex flex-col items-center px-5 py-8 sm:py-12">
      <RankGame difficulty={difficulty} />
    </main>
  );
}
