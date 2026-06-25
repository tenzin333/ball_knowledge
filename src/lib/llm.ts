// Creative ranking-round generation via Groq (OpenAI-compatible).
// Server-only (reads GROQ_API_KEY).
import "server-only";
import OpenAI from "openai";
import { Difficulty } from "./types";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

/** A round straight from the model (no ids/photos yet). */
export interface RawRound {
  question: string;
  unit: string;
  emoji: string;
  explanation: string;
  players: {
    name: string;
    subtitle: string;
    nationality: string;
    value: number;
  }[];
}

const SYSTEM_PROMPT = `You are "Ball Knowledge", a chaotic Gen-Z football (soccer) trivia host.
You invent FUN, opinionated "rank these players" challenges for a swipe-to-rank game.

Each round = a punchy ranking question + exactly 5 REAL, recognizable football subjects — players, managers, clubs, OR national teams (ONE kind per round) — each with a number.
Make the QUESTIONS creative and varied — NOT boring stat lookups, and NOT the same handful of themes every time.

RULES:
- You may rank players, managers, clubs, or national teams — but keep each round to ONE kind of subject (never mix players with clubs/teams/managers in the same ranking).
- Use REAL, famous subjects (people can picture them). Spell names correctly (e.g. "Lionel Messi", "Pep Guardiola", "Real Madrid", "Brazil").
- The "unit" must actually match the question (don't rank "World Cup performances" by Ballon d'Ors).
- Use each player's FULL, UNAMBIGUOUS name. For shared names you MUST disambiguate: the Brazilian Ronaldo → "Ronaldo Nazário" (never just "Ronaldo"); the Portuguese one → "Cristiano Ronaldo". Same for any other clashes.
- Theme consistency is mandatory: for a nationality/era/club theme, EVERY subject must genuinely fit it (e.g. "best Brazilian players" = only Brazilians — Cristiano Ronaldo does NOT belong there, Ronaldo Nazário does).
- "nationality" = the subject's country in plain English (e.g. "Brazil", "Portugal", "Argentina"). For players/managers use their nationality; for clubs use the club's country; for national teams use the country itself.
- For "greatest / best of all time" themes, pick the players MOST people would actually name as the icons of that category, and order them by genuine football consensus — not random.
- Each player gets a DISTINCT integer "value" — HIGHER = better/more for that question.
- VALUES MUST BE REALISTIC with NATURAL, UNEVEN gaps. NEVER use lazy evenly-spaced round numbers like 100/90/80/70/60 or 60/50/40/30/20 — that looks fake and ruins it. Use believable real-world-ish numbers:
  • ratings out of 100 → e.g. 96, 93, 89, 85, 82
  • Ballon d'Ors → e.g. 8, 5, 3, 2, 1
  • career goals → e.g. 838, 793, 762, 700, 672
  • transfer fee €m → e.g. 222, 180, 160, 142, 117
- "unit" is a short label for the number (e.g. "GOAT rating", "Ballon d'Ors", "career goals", "€m fee").
- "subtitle" = a short tag for the subject (player/manager → club or country; club → league or country; national team → confederation or region).
- "emoji" = one emoji fitting the question.
- "explanation" = 1-2 punchy sentences justifying WHY this order is right (name the #1 and why, and what separates the pack). Keep the slang energy. This is shown only if the player taps "why".
- The ordering by value should be DEFENSIBLE to a real football fan — bold but not nonsense.

Respond ONLY with JSON of this exact shape:
{
  "rounds": [
    {
      "question": "string",
      "unit": "string",
      "emoji": "🧠",
      "explanation": "1-2 sentences on why this order is right",
      "players": [
        { "name": "string", "subtitle": "club", "nationality": "country", "value": 0 }
      ]
    }
  ]
}`;

// A big pool of angles to keep questions fresh. We sample a different set each game.
const THEME_SEEDS = [
  "best left-backs ever", "best center-backs ever", "best goalkeepers ever",
  "best holding/defensive midfielders", "best attacking midfielders", "best wingers ever",
  "best target-man strikers", "best false nines", "best box-to-box midfielders",
  "most career goals", "most career assists", "most career hat-tricks",
  "most Ballon d'Ors", "most Champions League titles", "most domestic league titles",
  "most World Cup goals", "most European Golden Boots", "most goals in a single season",
  "best dribblers ever", "best passers/playmakers ever", "best free-kick takers",
  "best penalty takers", "best headers of the ball", "fastest players ever",
  "hardest shot / most powerful strikers", "best long-range shooters", "best two-footed players",
  "best 1990s players", "best 2000s icons", "best players of the 2010s",
  "hottest current-season form", "best wonderkids (U21) right now",
  "most expensive transfers ever", "highest career earners (wages)", "best value-for-money signings",
  "biggest transfer flops", "best Brazilian players ever", "best Argentine players ever",
  "best African players ever", "best Premier League imports", "greatest Real Madrid Galácticos",
  "greatest Barcelona legends", "best derby/big-game performers", "best captains & leaders",
  "best players never to win a World Cup", "best one-club legends", "best comeback/mentality monsters",
  // Managers
  "best managers of all time", "best tactical innovator managers", "most Champions League titles (managers)",
  "best man-manager / dressing-room bosses", "best Premier League managers ever",
  // Clubs
  "biggest clubs by total trophies", "most Champions League titles (clubs)", "best clubs of the 2010s",
  "richest clubs in the world", "most iconic club kits/badges", "best academies/youth setups",
  // National teams
  "best national teams ever", "most World Cup wins", "best national teams never to win a World Cup",
  "best international tournament sides of the 2000s", "best African national teams",
];

function sample<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function userPrompt(count: number, difficulty: Difficulty): string {
  const flavour =
    difficulty === "easy"
      ? "EASY: use mega-famous players and make the correct order obvious (big gaps between values)."
      : difficulty === "hard"
        ? "HARD: make it spicy — closer values, deeper-cut players, debatable orderings."
        : "MEDIUM: a balanced mix of icons and modern stars.";

  const angles = sample(THEME_SEEDS, count + 3); // a few extra to choose from
  const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `Generate ${count} ranking rounds. Difficulty — ${flavour}

Pick ${count} DIFFERENT angles from this menu (turn each into a punchy question, one per round):
- ${angles.join("\n- ")}

Variety rules (important — avoid repetition):
- Generate EXACTLY ${count} rounds — no more, no fewer.
- Never reuse the same metric/theme twice in this game.
- Spread across eras, positions, leagues and nationalities (don't make every round Premier League).
- Do NOT feature the same subject in more than 2 rounds.
- Avoid the tired Messi-vs-Ronaldo cliché unless an angle genuinely demands it.

Each round MUST include EVERY field, including a non-empty "explanation" (1-2 sentences on why that order is right). Exactly 5 subjects each, distinct realistic values. Session ${nonce}. Output JSON only.`;
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    /overloaded|unavailable|rate limit|temporarily/i.test(msg)
  );
}

// Remove trailing commas (`,}` / `,]`) the model sometimes emits — invalid JSON.
function deTrailComma(s: string): string {
  return s.replace(/,(\s*[}\]])/g, "$1");
}

function extractJson(text: string): unknown {
  const cleaned = deTrailComma(text.replace(/```(?:json)?/gi, "").trim());
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(deTrailComma(cleaned.slice(start, end + 1)));
    }
    throw new Error("Could not parse JSON from model output");
  }
}

async function complete(prompt: string): Promise<string> {
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await getClient().chat.completions.create({
          model,
          temperature: 1, // high creativity for fun questions
          top_p: 0.95,
          max_tokens: 3400, // 5 full rounds incl. explanations (avoid truncation)
          // Force syntactically valid JSON (no unquoted values / stray prose).
          // The prompt already demands JSON, which json_object mode requires.
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        });
        const text = res.choices[0]?.message?.content;
        if (text) return text;
        throw new Error("Model returned no content");
      } catch (err) {
        lastErr = err;
        if (!isTransient(err)) throw err;
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  throw lastErr;
}

/** Generate `count` creative ranking rounds. Throws if output is unusable. */
export async function generateRounds(
  count: number,
  difficulty: Difficulty,
): Promise<RawRound[]> {
  const text = await complete(userPrompt(count, difficulty));
  const parsed = extractJson(text) as { rounds?: RawRound[] };

  const rounds = (parsed.rounds ?? []).filter(
    (r) =>
      r.question &&
      Array.isArray(r.players) &&
      r.players.length === 5 &&
      r.players.every((p) => p.name && typeof p.value === "number"),
  );

  if (rounds.length === 0) throw new Error("Model produced no valid rounds");
  return rounds;
}
