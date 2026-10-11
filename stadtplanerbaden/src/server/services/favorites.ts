import "server-only";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { accommodationInclude, placeSummarySelect, toAccommodation, toPlaceSummary } from "@/server/mappers";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { favoriteTargetSchema, toFieldErrors } from "@/lib/validation";
import type { FavoriteDto, FavoriteIdsDto } from "@/lib/types";

function parseTarget(input: unknown) {
  const parsed = favoriteTargetSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));
  return parsed.data;
}

export async function listFavorites(visitorId: string, locale: Locale = DEFAULT_LOCALE): Promise<FavoriteDto[]> {
  const rows = await db.favorite.findMany({
    where: { visitorSessionId: visitorId },
    orderBy: { createdAt: "desc" },
    include: {
      place: { select: { ...placeSummarySelect(locale), published: true } },
      accommodation: { include: accommodationInclude(locale) },
    },
  });
  const categories = getDictionaryFor(locale).categories;
  const result: FavoriteDto[] = [];
  for (const row of rows) {
    if (row.place?.published) {
      const place = toPlaceSummary(row.place, (slug) => categories[slug] ?? slug);
      result.push({ id: row.id, type: "place", createdAt: row.createdAt.toISOString(), kind: place.kind, place });
    } else if (row.accommodation?.published) {
      result.push({
        id: row.id,
        type: "accommodation",
        createdAt: row.createdAt.toISOString(),
        accommodation: toAccommodation(row.accommodation),
      });
    }
  }
  return result;
}

export async function getFavoriteIds(visitorId: string): Promise<FavoriteIdsDto> {
  const rows = await db.favorite.findMany({
    where: { visitorSessionId: visitorId },
    select: { placeId: true, accommodationId: true },
  });
  return {
    placeIds: rows.flatMap((r) => (r.placeId ? [r.placeId] : [])),
    accommodationIds: rows.flatMap((r) => (r.accommodationId ? [r.accommodationId] : [])),
  };
}

/** Fügt einen Favoriten hinzu. Idempotent: ein bestehender Favorit wird nicht dupliziert. */
export async function addFavorite(visitorId: string, input: unknown): Promise<{ id: string }> {
  const target = parseTarget(input);
  if ("placeId" in target && target.placeId) {
    const place = await db.place.findFirst({ where: { id: target.placeId, published: true }, select: { id: true } });
    if (!place) throw new NotFoundError("e.placeNotFound");
    return db.favorite.upsert({
      where: { visitorSessionId_placeId: { visitorSessionId: visitorId, placeId: place.id } },
      create: { visitorSessionId: visitorId, placeId: place.id },
      update: {},
      select: { id: true },
    });
  }
  const accommodationId = (target as { accommodationId: string }).accommodationId;
  const accommodation = await db.accommodation.findFirst({
    where: { id: accommodationId, published: true },
    select: { id: true },
  });
  if (!accommodation) throw new NotFoundError("e.accommodationNotFound");
  return db.favorite.upsert({
    where: {
      visitorSessionId_accommodationId: { visitorSessionId: visitorId, accommodationId: accommodation.id },
    },
    create: { visitorSessionId: visitorId, accommodationId: accommodation.id },
    update: {},
    select: { id: true },
  });
}

/** Entfernt einen Favoriten. Idempotent: nicht vorhandene Favoriten sind kein Fehler. */
export async function removeFavorite(visitorId: string, input: unknown): Promise<void> {
  const target = parseTarget(input);
  await db.favorite.deleteMany({
    where: {
      visitorSessionId: visitorId,
      ...("placeId" in target && target.placeId
        ? { placeId: target.placeId }
        : { accommodationId: (target as { accommodationId: string }).accommodationId }),
    },
  });
}
