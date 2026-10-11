import { describe, expect, it } from "vitest";
import {
  countFavoritesByFilter,
  favoriteFilterKey,
  filterFavorites,
  normalizeSearch,
  searchPlaces,
  type FavoriteLike,
} from "@/lib/catalog-meta";

describe("Favoritenlogik", () => {
  const favorites: (FavoriteLike & { name: string })[] = [
    { type: "place", kind: "MUSEUM", name: "Museum Langmatt" },
    { type: "place", kind: "SIGHT", name: "Ruine Stein" },
    { type: "place", kind: "NATURE", name: "Baldegg" },
    { type: "place", kind: "CAFE", name: "Frau Meise" },
    { type: "accommodation", name: "Limmathof" },
  ];

  it("ordnet Arten den Filtergruppen zu", () => {
    expect(favoriteFilterKey({ type: "place", kind: "MUSEUM" })).toBe("museen");
    expect(favoriteFilterKey({ type: "place", kind: "NATURE" })).toBe("sehenswuerdigkeiten");
    expect(favoriteFilterKey({ type: "place", kind: "EVENT" })).toBe("veranstaltungen");
    expect(favoriteFilterKey({ type: "accommodation" })).toBe("hotels");
  });

  it("filtert nach Kategorie und liefert ohne Filter alle", () => {
    expect(filterFavorites(favorites, "sehenswuerdigkeiten").map((f) => f.name)).toEqual(["Ruine Stein", "Baldegg"]);
    expect(filterFavorites(favorites, "hotels").map((f) => f.name)).toEqual(["Limmathof"]);
    expect(filterFavorites(favorites, null)).toHaveLength(5);
  });

  it("zählt Favoriten je Gruppe", () => {
    const counts = countFavoritesByFilter(favorites);
    expect(counts.get("sehenswuerdigkeiten")).toBe(2);
    expect(counts.get("cafes")).toBe(1);
    expect(counts.has("restaurants")).toBe(false);
  });
});

describe("Katalogsuche", () => {
  const places = [
    { name: "Bäderquartier", shortDescription: "2000 Jahre Bädergeschichte", tags: ["Thermalwasser"] },
    { name: "Thermalbad FORTYSEVEN", shortDescription: "Wellness-Therme im Bäderquartier", tags: ["Sauna"] },
    { name: "Museum Langmatt", shortDescription: "Impressionisten in einer Villa", tags: ["Kunst"] },
  ];

  it("normalisiert Umlaute und Sonderzeichen", () => {
    expect(normalizeSearch("Bäder-Quartier!")).toBe("baeder quartier");
  });

  it("findet Treffer umlaut-tolerant", () => {
    expect(searchPlaces(places, "baeder").map((p) => p.name)).toContain("Bäderquartier");
    expect(searchPlaces(places, "bader").map((p) => p.name)).toContain("Bäderquartier");
  });

  it("gewichtet Treffer im Namen höher", () => {
    expect(searchPlaces(places, "bäder")[0].name).toBe("Bäderquartier");
  });

  it("verlangt alle Suchbegriffe und durchsucht Tags", () => {
    expect(searchPlaces(places, "kunst villa").map((p) => p.name)).toEqual(["Museum Langmatt"]);
    expect(searchPlaces(places, "sauna zoo")).toEqual([]);
  });

  it("liefert ohne Suchbegriff alle Orte", () => {
    expect(searchPlaces(places, "  ")).toHaveLength(3);
  });
});
