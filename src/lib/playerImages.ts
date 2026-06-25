// Best-effort player cutout photos from TheSportsDB (free tier, key "3").
// Validates the matched player's nationality so we don't show the wrong face
// for ambiguous names (e.g. "Ronaldo" returning Cristiano in a Brazilian list).
import "server-only";

const SDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

interface SdbPlayer {
  strCutout?: string | null;
  strRender?: string | null;
  strThumb?: string | null;
  strNationality?: string | null;
}

interface LookupResult {
  image: string | null;
  nationality: string | null;
}

async function lookup(name: string): Promise<LookupResult> {
  try {
    const res = await fetch(
      `${SDB_BASE}/searchplayers.php?p=${encodeURIComponent(name)}`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return { image: null, nationality: null };
    const data = (await res.json()) as { player: SdbPlayer[] | null };
    const p = data.player?.[0];
    return {
      image: p?.strCutout || p?.strRender || p?.strThumb || null,
      nationality: p?.strNationality ?? null,
    };
  } catch {
    return { image: null, nationality: null };
  }
}

/** Lenient nationality match (handles "Brazil" vs "Brazilian"); accept if unknown. */
function nationalityMatches(found: string | null, intended: string): boolean {
  if (!found || !intended) return true; // can't validate → trust the name match
  const a = found.trim().toLowerCase();
  const b = intended.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Resolve images for players, de-duplicated by name. Rejects a photo whose
 * nationality contradicts the intended one (wrong-person guard).
 */
export async function resolveImages(
  players: { name: string; nationality: string }[],
): Promise<Map<string, string | null>> {
  const intendedByName = new Map<string, string>();
  players.forEach((p) => intendedByName.set(p.name, p.nationality));

  const entries = await Promise.all(
    [...intendedByName.keys()].map(async (name) => {
      const { image, nationality } = await lookup(name);
      const ok = nationalityMatches(nationality, intendedByName.get(name) ?? "");
      return [name, ok ? image : null] as const;
    }),
  );
  return new Map(entries);
}
