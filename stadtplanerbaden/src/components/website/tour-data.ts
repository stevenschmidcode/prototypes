import type { Locale } from "@/i18n/config";
import { DISCOVER_CATEGORIES } from "@/lib/catalog-meta";
import catalog from "../../../prisma/seed-data/catalog.json";
import catalogEn from "../../../prisma/seed-data/catalog.en.json";
import journeysSeed from "../../../prisma/seed-data/journeys.json";

/** Statische Daten für die Desktop-Tour – aus den Seed-Quellen, ohne Datenbank. */
export type TourData = {
  counts: { places: number; accommodations: number; journeys: number };
  highlights: { slug: string; name: string; image: string }[];
  categories: string[];
  journeys: { slug: string; title: string; persona: string; icon: string; theme: string }[];
};

const HIGHLIGHTS = ["thermalbad-fortyseven", "historische-altstadt-baden", "museum-langmatt", "ruine-stein"];

type EnPlaces = Record<string, { name?: string } | undefined>;

export function tourData(locale: Locale): TourData {
  const enPlaces = (catalogEn as { places: EnPlaces }).places;
  return {
    counts: {
      places: catalog.places.length,
      accommodations: catalog.accommodations.length,
      journeys: journeysSeed.journeys.length,
    },
    highlights: HIGHLIGHTS.flatMap((slug) => {
      const place = catalog.places.find((p) => p.slug === slug);
      const image = catalog.images.find((i) => i.slug === slug);
      if (!place || !image) return [];
      const name = locale === "en" ? (enPlaces[slug]?.name ?? place.name) : place.name;
      return [{ slug, name, image: image.file.replace(/^public/, "") }];
    }),
    categories: DISCOVER_CATEGORIES.map((c) => c.slug),
    journeys: journeysSeed.journeys.map((j) => ({
      slug: j.slug,
      title: j[locale].title,
      persona: j[locale].persona,
      icon: j.icon,
      theme: j.theme,
    })),
  };
}
