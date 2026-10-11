import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import { dbDateToIso, minutesToTime } from "@/lib/dates";
import type {
  AccommodationDto,
  AgendaItemDto,
  ImageInfo,
  JourneySummaryDto,
  PlaceDetailDto,
  PlaceSummaryDto,
  TripAccommodationDto,
} from "@/lib/types";

/*
 * Mapper Datenbank → DTO.
 * Grundfelder sind Deutsch; für andere Sprachen wird die passende Übersetzung
 * mitgeladen (`translations: { where: { locale } }`) und – falls vorhanden – verwendet.
 */

type ImageFields = {
  imageUrl: string | null;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string | null;
};

export function toImage(entity: ImageFields, alt: string): ImageInfo | null {
  if (!entity.imageUrl) return null;
  return {
    url: entity.imageUrl,
    alt,
    credit: entity.imageCredit,
    license: entity.imageLicense,
    sourceUrl: entity.imageSourceUrl,
  };
}

function coords(entity: { latitude: number | null; longitude: number | null }) {
  return entity.latitude != null && entity.longitude != null
    ? { latitude: entity.latitude, longitude: entity.longitude }
    : null;
}

/** Übersetzungen nur für Nicht-Standardsprachen laden */
function translationsFor(locale: Locale) {
  return { where: { locale }, take: 1 } as const;
}

// ─── Orte ────────────────────────────────────────────────────────────────────

export function placeSummarySelect(locale: Locale) {
  return {
    id: true,
    slug: true,
    name: true,
    kind: true,
    shortDescription: true,
    durationMinutes: true,
    setting: true,
    rainSuitable: true,
    priceInfo: true,
    tags: true,
    locality: true,
    imageUrl: true,
    imageCredit: true,
    imageLicense: true,
    imageSourceUrl: true,
    category: { select: { slug: true, name: true } },
    translations: {
      ...translationsFor(locale),
      select: { name: true, shortDescription: true, tags: true },
    },
  } satisfies Prisma.PlaceSelect;
}

type PlaceSummaryRow = Prisma.PlaceGetPayload<{ select: ReturnType<typeof placeSummarySelect> }>;

export function toPlaceSummary(row: PlaceSummaryRow, categoryName: (slug: string) => string): PlaceSummaryDto {
  const tr = row.translations[0];
  const name = tr?.name ?? row.name;
  return {
    id: row.id,
    slug: row.slug,
    name,
    kind: row.kind,
    category: { slug: row.category.slug, name: categoryName(row.category.slug) },
    shortDescription: tr?.shortDescription ?? row.shortDescription,
    durationMinutes: row.durationMinutes,
    setting: row.setting,
    rainSuitable: row.rainSuitable,
    priceInfo: row.priceInfo,
    tags: tr?.tags.length ? tr.tags : row.tags,
    image: toImage(row, name),
    locality: row.locality,
  };
}

export function placeDetailInclude(locale: Locale) {
  return {
    category: true,
    translations: translationsFor(locale),
  } satisfies Prisma.PlaceInclude;
}

type PlaceDetailRow = Prisma.PlaceGetPayload<{ include: ReturnType<typeof placeDetailInclude> }>;

export function toPlaceDetail(row: PlaceDetailRow, categoryName: (slug: string) => string): PlaceDetailDto {
  const tr = row.translations[0];
  const name = tr?.name ?? row.name;
  return {
    id: row.id,
    slug: row.slug,
    name,
    kind: row.kind,
    category: { slug: row.category.slug, name: categoryName(row.category.slug) },
    shortDescription: tr?.shortDescription ?? row.shortDescription,
    durationMinutes: row.durationMinutes,
    setting: row.setting,
    rainSuitable: row.rainSuitable,
    priceInfo: row.priceInfo,
    tags: tr?.tags.length ? tr.tags : row.tags,
    image: toImage(row, name),
    locality: row.locality,
    description: tr?.description ?? row.description,
    address: { street: row.street, postalCode: row.postalCode, locality: row.locality },
    coordinates: coords(row),
    websiteUrl: row.websiteUrl,
    // Öffnungszeiten/Durchführung: Übersetzung bevorzugen, sonst deutsches Original
    openingHours: tr?.openingHours ?? row.openingHours,
    eventInfo: tr?.eventInfo ?? row.eventInfo,
  };
}

// ─── Unterkünfte ─────────────────────────────────────────────────────────────

export function accommodationInclude(locale: Locale) {
  return { translations: translationsFor(locale) } satisfies Prisma.AccommodationInclude;
}

type AccommodationRow = Prisma.AccommodationGetPayload<{ include: ReturnType<typeof accommodationInclude> }>;

export function toAccommodation(row: AccommodationRow): AccommodationDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    shortDescription: row.translations[0]?.shortDescription ?? row.shortDescription,
    address: { street: row.street, postalCode: row.postalCode, locality: row.locality },
    coordinates: coords(row),
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    defaultCheckIn: row.defaultCheckIn,
    defaultCheckOut: row.defaultCheckOut,
    image: toImage(row, row.name),
  };
}

type TripAccommodationRow = Prisma.TripAccommodationGetPayload<{ include: { accommodation: true } }>;

export function toTripAccommodation(row: TripAccommodationRow): TripAccommodationDto {
  return {
    id: row.id,
    accommodationId: row.accommodationId,
    catalogSlug: row.accommodation?.slug ?? null,
    type: row.type,
    name: row.name,
    address: { street: row.street, postalCode: row.postalCode, locality: row.locality },
    coordinates: coords(row),
    checkInDate: row.checkInDate ? dbDateToIso(row.checkInDate) : null,
    checkInTime: row.checkInTime != null ? minutesToTime(row.checkInTime) : null,
    checkOutDate: row.checkOutDate ? dbDateToIso(row.checkOutDate) : null,
    checkOutTime: row.checkOutTime != null ? minutesToTime(row.checkOutTime) : null,
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    notes: row.notes,
    image: row.accommodation ? toImage(row.accommodation, row.name) : null,
  };
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

export function agendaItemInclude(locale: Locale) {
  return {
    place: {
      select: {
        id: true,
        slug: true,
        name: true,
        imageUrl: true,
        imageCredit: true,
        imageLicense: true,
        imageSourceUrl: true,
        translations: { ...translationsFor(locale), select: { name: true } },
      },
    },
  } satisfies Prisma.AgendaItemInclude;
}

type AgendaItemRow = Prisma.AgendaItemGetPayload<{ include: ReturnType<typeof agendaItemInclude> }>;

export function toAgendaItem(row: AgendaItemRow): AgendaItemDto {
  const placeName = row.place ? (row.place.translations[0]?.name ?? row.place.name) : null;
  return {
    id: row.id,
    title: row.title,
    date: dbDateToIso(row.date),
    startMinutes: row.startMinutes,
    durationMinutes: row.durationMinutes,
    location: row.location,
    category: row.category,
    notes: row.notes,
    place:
      row.place && placeName
        ? { id: row.place.id, slug: row.place.slug, name: placeName, image: toImage(row.place, placeName) }
        : null,
  };
}

// ─── Thementouren ────────────────────────────────────────────────────────────

export function journeySummaryInclude(locale: Locale) {
  return {
    translations: { where: { locale: { in: [locale, "de"] } } },
    stops: { select: { durationMinutes: true } },
  } satisfies Prisma.JourneyInclude;
}

type JourneySummaryRow = Prisma.JourneyGetPayload<{ include: ReturnType<typeof journeySummaryInclude> }>;

/** Übersetzung der gewünschten Sprache, sonst Deutsch */
export function pickTranslation<T extends { locale: string }>(rows: T[], locale: Locale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "de") ?? rows[0];
}

export function toJourneySummary(row: JourneySummaryRow, locale: Locale): JourneySummaryDto {
  const tr = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    theme: row.theme,
    imageUrl: row.imageUrl,
    title: tr?.title ?? row.slug,
    persona: tr?.persona ?? "",
    tagline: tr?.tagline ?? "",
    stopCount: row.stops.length,
    totalMinutes: row.stops.reduce((sum, stop) => sum + stop.durationMinutes, 0),
  };
}
