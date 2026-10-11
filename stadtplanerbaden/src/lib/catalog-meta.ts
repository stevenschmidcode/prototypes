import type { AgendaCategoryValue } from "./validation";

/** Arten von Orten (entspricht Prisma-Enum PlaceKind). */
export const PLACE_KINDS = [
  "SIGHT",
  "RESTAURANT",
  "CAFE",
  "WELLNESS",
  "CULTURE",
  "MUSEUM",
  "NATURE",
  "ACTIVITY",
  "SHOP",
  "EVENT",
] as const;
export type PlaceKindValue = (typeof PLACE_KINDS)[number];

/** Kategorien im Bereich «Entdecken» (Slugs entsprechen PlaceCategory.slug; Namen im Wörterbuch). */
export const DISCOVER_CATEGORIES = [
  { slug: "entdecken", icon: "compass" },
  { slug: "essen-trinken", icon: "utensils" },
  { slug: "wellness", icon: "waves" },
  { slug: "kultur", icon: "landmark" },
  { slug: "natur", icon: "trees" },
  { slug: "shopping", icon: "shopping-bag" },
  { slug: "veranstaltungen", icon: "calendar-heart" },
] as const;
export type DiscoverCategorySlug = (typeof DISCOVER_CATEGORIES)[number]["slug"];

export function isDiscoverCategory(value: string | undefined): value is DiscoverCategorySlug {
  return DISCOVER_CATEGORIES.some((c) => c.slug === value);
}

// ─── Favoriten-Filter ────────────────────────────────────────────────────────

/** Filtergruppen in der Favoritenübersicht (gemäss Produktanforderung; Bezeichnungen im Wörterbuch). */
export const FAVORITE_FILTERS = [
  { key: "sehenswuerdigkeiten", kinds: ["SIGHT", "NATURE"] },
  { key: "restaurants", kinds: ["RESTAURANT"] },
  { key: "cafes", kinds: ["CAFE"] },
  { key: "wellness", kinds: ["WELLNESS"] },
  { key: "kultur", kinds: ["CULTURE"] },
  { key: "museen", kinds: ["MUSEUM"] },
  { key: "aktivitaeten", kinds: ["ACTIVITY", "SHOP"] },
  { key: "veranstaltungen", kinds: ["EVENT"] },
  { key: "hotels", kinds: [] },
] as const satisfies readonly { key: string; kinds: readonly PlaceKindValue[] }[];
export type FavoriteFilterKey = (typeof FAVORITE_FILTERS)[number]["key"];

export type FavoriteLike =
  | { type: "place"; kind: PlaceKindValue }
  | { type: "accommodation" };

export function favoriteFilterKey(favorite: FavoriteLike): FavoriteFilterKey {
  if (favorite.type === "accommodation") return "hotels";
  const match = FAVORITE_FILTERS.find((f) => (f.kinds as readonly PlaceKindValue[]).includes(favorite.kind));
  return match?.key ?? "aktivitaeten";
}

export function filterFavorites<T extends FavoriteLike>(favorites: readonly T[], key: FavoriteFilterKey | null): T[] {
  if (!key) return [...favorites];
  return favorites.filter((f) => favoriteFilterKey(f) === key);
}

/** Zählt Favoriten je Filtergruppe – nur Gruppen mit Einträgen werden im UI gezeigt. */
export function countFavoritesByFilter<T extends FavoriteLike>(favorites: readonly T[]): Map<FavoriteFilterKey, number> {
  const counts = new Map<FavoriteFilterKey, number>();
  for (const favorite of favorites) {
    const key = favoriteFilterKey(favorite);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function isFavoriteFilterKey(value: string | undefined): value is FavoriteFilterKey {
  return FAVORITE_FILTERS.some((f) => f.key === value);
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

/** Ableitung der Agenda-Kategorie aus der Art eines Ortes. */
export const PLACE_KIND_TO_AGENDA: Record<PlaceKindValue, AgendaCategoryValue> = {
  SIGHT: "SIGHTSEEING",
  RESTAURANT: "FOOD",
  CAFE: "FOOD",
  WELLNESS: "WELLNESS",
  CULTURE: "CULTURE",
  MUSEUM: "CULTURE",
  NATURE: "NATURE",
  ACTIVITY: "SIGHTSEEING",
  SHOP: "SHOPPING",
  EVENT: "EVENT",
};


// ─── Suche ───────────────────────────────────────────────────────────────────

/** Normalisiert Text für eine tolerante Suche: Kleinbuchstaben, ohne Akzente, ä→ae … */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type Searchable = {
  name: string;
  shortDescription: string;
  tags: readonly string[];
  categoryName?: string;
  locality?: string | null;
};

/**
 * Einfache, robuste Volltextsuche für den (kleinen) kuratierten Katalog.
 * Alle Suchbegriffe müssen vorkommen; Treffer im Namen werden höher gewichtet.
 * Umlaute werden tolerant behandelt («baeder» findet «Bäder»).
 */
export function searchPlaces<T extends Searchable>(places: readonly T[], query: string): T[] {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [...places];
  // Variante ohne «e» nach Vokal, damit auch «bader» → «baeder» trifft
  const loose = (s: string) => s.replace(/([aou])e/g, "$1");

  const scored: { place: T; score: number }[] = [];
  for (const place of places) {
    const name = normalizeSearch(place.name);
    const rest = normalizeSearch(
      [place.shortDescription, place.tags.join(" "), place.categoryName ?? "", place.locality ?? ""].join(" "),
    );
    let score = 0;
    let all = true;
    for (const term of terms) {
      const t = loose(term);
      if (name.includes(term) || loose(name).includes(t)) score += name.startsWith(term) ? 4 : 3;
      else if (rest.includes(term) || loose(rest).includes(t)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (all) scored.push({ place, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.place);
}
