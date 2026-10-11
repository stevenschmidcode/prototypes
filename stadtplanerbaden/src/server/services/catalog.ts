import "server-only";
import { db } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import {
  accommodationInclude,
  journeySummaryInclude,
  pickTranslation,
  placeDetailInclude,
  placeSummarySelect,
  toAccommodation,
  toJourneySummary,
  toPlaceDetail,
  toPlaceSummary,
} from "@/server/mappers";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { searchPlaces } from "@/lib/catalog-meta";
import type {
  AccommodationDto,
  CategoryDto,
  JourneyDetailDto,
  JourneySummaryDto,
  PlaceDetailDto,
  PlaceSummaryDto,
} from "@/lib/types";

/** Im MVP ist ausschliesslich Baden sichtbar. Das Datenmodell unterstützt weitere Städte. */
export const DEFAULT_CITY_SLUG = "baden";

/** Kategoriename in der gewünschten Sprache (Wörterbuch), sonst Datenbankwert */
function categoryNamer(locale: Locale) {
  const names = getDictionaryFor(locale).categories;
  return (slug: string) => names[slug] ?? slug;
}

export async function getDefaultCity() {
  const city = await db.city.findUnique({ where: { slug: DEFAULT_CITY_SLUG } });
  if (!city) throw new NotFoundError("e.cityMissing");
  return city;
}

export async function listCategories(locale: Locale = DEFAULT_LOCALE): Promise<CategoryDto[]> {
  const rows = await db.placeCategory.findMany({ orderBy: { sortOrder: "asc" } });
  const name = categoryNamer(locale);
  return rows.map(({ id, slug, description, icon }) => ({ id, slug, name: name(slug), description, icon }));
}

export type PlaceFilter = {
  category?: string;
  query?: string;
  featured?: boolean;
  limit?: number;
  locale?: Locale;
};

export async function listPlaces(filter: PlaceFilter = {}): Promise<PlaceSummaryDto[]> {
  const locale = filter.locale ?? DEFAULT_LOCALE;
  const rows = await db.place.findMany({
    where: {
      published: true,
      city: { slug: DEFAULT_CITY_SLUG },
      ...(filter.category ? { category: { slug: filter.category } } : {}),
      ...(filter.featured ? { featured: true } : {}),
    },
    select: placeSummarySelect(locale),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const name = categoryNamer(locale);
  let places = rows.map((row) => toPlaceSummary(row, name));
  if (filter.query?.trim()) {
    places = searchPlaces(
      places.map((p) => ({ ...p, categoryName: p.category.name })),
      filter.query,
    );
  }
  return filter.limit ? places.slice(0, filter.limit) : places;
}

export async function getPlaceBySlug(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<PlaceDetailDto> {
  const row = await db.place.findFirst({
    where: { slug, published: true, city: { slug: DEFAULT_CITY_SLUG } },
    include: placeDetailInclude(locale),
  });
  if (!row) throw new NotFoundError("e.placeNotFound");
  return toPlaceDetail(row, categoryNamer(locale));
}

/** Ähnliche Orte derselben Kategorie für die Detailseite. */
export async function listRelatedPlaces(
  place: PlaceDetailDto,
  locale: Locale = DEFAULT_LOCALE,
  limit = 4,
): Promise<PlaceSummaryDto[]> {
  const rows = await db.place.findMany({
    where: {
      published: true,
      city: { slug: DEFAULT_CITY_SLUG },
      category: { slug: place.category.slug },
      NOT: { id: place.id },
    },
    select: placeSummarySelect(locale),
    orderBy: [{ sortOrder: "asc" }],
    take: limit,
  });
  const name = categoryNamer(locale);
  return rows.map((row) => toPlaceSummary(row, name));
}

export async function listAccommodations(locale: Locale = DEFAULT_LOCALE): Promise<AccommodationDto[]> {
  const rows = await db.accommodation.findMany({
    where: { published: true, city: { slug: DEFAULT_CITY_SLUG } },
    include: accommodationInclude(locale),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toAccommodation);
}

// ─── Thementouren ────────────────────────────────────────────────────────────

export async function listJourneys(locale: Locale = DEFAULT_LOCALE): Promise<JourneySummaryDto[]> {
  const rows = await db.journey.findMany({
    where: { published: true, city: { slug: DEFAULT_CITY_SLUG } },
    include: journeySummaryInclude(locale),
    orderBy: [{ sortOrder: "asc" }],
  });
  return rows.map((row) => toJourneySummary(row, locale));
}

/** Touren, in denen ein Ort vorkommt (für die Detailseite) */
export async function listJourneysForPlace(placeId: string, locale: Locale = DEFAULT_LOCALE): Promise<JourneySummaryDto[]> {
  const rows = await db.journey.findMany({
    where: { published: true, stops: { some: { placeId } } },
    include: journeySummaryInclude(locale),
    orderBy: [{ sortOrder: "asc" }],
  });
  return rows.map((row) => toJourneySummary(row, locale));
}

export async function getJourneyBySlug(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<JourneyDetailDto> {
  const row = await db.journey.findFirst({
    where: { slug, published: true, city: { slug: DEFAULT_CITY_SLUG } },
    include: {
      ...journeySummaryInclude(locale),
      stops: {
        orderBy: { position: "asc" },
        include: {
          translations: { where: { locale: { in: [locale, "de"] } } },
          place: {
            select: {
              ...placeSummarySelect(locale),
              street: true,
              postalCode: true,
              latitude: true,
              longitude: true,
              published: true,
            },
          },
        },
      },
    },
  });
  if (!row) throw new NotFoundError("e.journeyNotFound");
  const name = categoryNamer(locale);
  const summary = toJourneySummary(row, locale);
  const tr = pickTranslation(row.translations, locale);
  return {
    ...summary,
    intro: tr?.intro ?? "",
    stops: row.stops
      .filter((stop) => stop.place.published)
      .map((stop) => ({
        id: stop.id,
        position: stop.position,
        durationMinutes: stop.durationMinutes,
        note: pickTranslation(stop.translations, locale)?.note ?? "",
        place: {
          ...toPlaceSummary(stop.place, name),
          address: { street: stop.place.street, postalCode: stop.place.postalCode, locality: stop.place.locality },
          coordinates:
            stop.place.latitude != null && stop.place.longitude != null
              ? { latitude: stop.place.latitude, longitude: stop.place.longitude }
              : null,
        },
      })),
  };
}
