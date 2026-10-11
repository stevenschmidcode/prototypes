import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { agendaItemInclude, pickTranslation, toAgendaItem } from "@/server/mappers";
import { assertTripOwnership } from "@/server/services/trips";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { conflictsWith } from "@/lib/agenda";
import { PLACE_KIND_TO_AGENDA } from "@/lib/catalog-meta";
import { dbDateToIso, isWithin, isoToDbDate, MINUTES_PER_DAY, timeToMinutes } from "@/lib/dates";
import {
  agendaItemInputSchema,
  applyJourneySchema,
  msg,
  toFieldErrors,
  type AgendaItemInput,
} from "@/lib/validation";
import type { AgendaItemDto } from "@/lib/types";

export type AgendaMutationResult = {
  item: AgendaItemDto;
  /** Überschneidungen mit anderen Einträgen – Warnung, kein Fehler */
  conflicts: Pick<AgendaItemDto, "id" | "title" | "date" | "startMinutes" | "durationMinutes">[];
};

function parse(input: unknown): AgendaItemInput {
  const parsed = agendaItemInputSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));
  return parsed.data;
}

function assertDateInTrip(date: string, trip: { startDate: string; endDate: string }) {
  if (!isWithin(date, trip.startDate, trip.endDate)) {
    throw new ValidationError({ date: msg("v.dateOutsideTrip", trip.startDate, trip.endDate) });
  }
}

async function assertPlace(placeId: string | undefined, cityId: string) {
  if (!placeId) return null;
  const place = await db.place.findFirst({ where: { id: placeId, published: true, cityId }, select: { id: true } });
  if (!place) throw new ValidationError({ placeId: "v.placeNotInCatalog" });
  return place.id;
}

/** Lädt einen Agendaeintrag nur, wenn der zugehörige Aufenthalt dem Gast gehört. */
async function findOwnedItem(visitorId: string, itemId: string) {
  const item = await db.agendaItem.findFirst({
    where: { id: itemId, trip: { visitorSessionId: visitorId } },
    select: {
      id: true,
      tripId: true,
      trip: { select: { startDate: true, endDate: true, cityId: true } },
    },
  });
  if (!item) throw new NotFoundError("e.itemNotFound");
  return {
    ...item,
    trip: {
      startDate: dbDateToIso(item.trip.startDate),
      endDate: dbDateToIso(item.trip.endDate),
      cityId: item.trip.cityId,
    },
  };
}

async function computeConflicts(tripId: string, item: AgendaItemDto) {
  const others = await db.agendaItem.findMany({
    where: { tripId, NOT: { id: item.id }, date: isoToDbDate(item.date) },
    select: { id: true, title: true, date: true, startMinutes: true, durationMinutes: true },
  });
  return conflictsWith(
    item,
    others.map((o) => ({ ...o, date: dbDateToIso(o.date) })),
  );
}

export async function createAgendaItem(
  visitorId: string,
  tripId: string,
  input: unknown,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AgendaMutationResult> {
  const data = parse(input);
  const trip = await assertTripOwnership(visitorId, tripId);
  assertDateInTrip(data.date, trip);
  const placeId = await assertPlace(data.placeId, trip.cityId);

  if (data.clientRequestId) {
    const existing = await db.agendaItem.findFirst({
      where: { clientRequestId: data.clientRequestId, tripId },
      include: agendaItemInclude(locale),
    });
    if (existing) {
      const item = toAgendaItem(existing);
      return { item, conflicts: await computeConflicts(tripId, item) };
    }
  }

  try {
    const [row] = await db.$transaction([
      db.agendaItem.create({
        data: {
          tripId,
          placeId,
          title: data.title,
          date: isoToDbDate(data.date),
          startMinutes: timeToMinutes(data.startTime),
          durationMinutes: data.durationMinutes,
          location: data.location ?? null,
          category: data.category,
          notes: data.notes ?? null,
          clientRequestId: data.clientRequestId ?? null,
        },
        include: agendaItemInclude(locale),
      }),
      db.trip.update({ where: { id: tripId }, data: { lastOpenedAt: new Date() } }),
    ]);
    const item = toAgendaItem(row);
    return { item, conflicts: await computeConflicts(tripId, item) };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      data.clientRequestId
    ) {
      throw new ValidationError({ _form: "v.alreadySaved" });
    }
    throw error;
  }
}

export async function updateAgendaItem(
  visitorId: string,
  itemId: string,
  input: unknown,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AgendaMutationResult> {
  const data = parse(input);
  const owned = await findOwnedItem(visitorId, itemId);
  assertDateInTrip(data.date, owned.trip);
  const placeId = await assertPlace(data.placeId, owned.trip.cityId);

  const row = await db.agendaItem.update({
    where: { id: itemId },
    data: {
      placeId,
      title: data.title,
      date: isoToDbDate(data.date),
      startMinutes: timeToMinutes(data.startTime),
      durationMinutes: data.durationMinutes,
      location: data.location ?? null,
      category: data.category,
      notes: data.notes ?? null,
    },
    include: agendaItemInclude(locale),
  });
  const item = toAgendaItem(row);
  return { item, conflicts: await computeConflicts(owned.tripId, item) };
}

export async function deleteAgendaItem(visitorId: string, itemId: string): Promise<{ tripId: string }> {
  const owned = await findOwnedItem(visitorId, itemId);
  await db.agendaItem.delete({ where: { id: itemId } });
  return { tripId: owned.tripId };
}

// ─── Thementour als Tagesprogramm ────────────────────────────────────────────

export type ApplyJourneyResult = {
  created: number;
  total: number;
  date: string;
  /** Anzahl bestehender Einträge, mit denen sich die neuen Stationen überschneiden */
  conflicts: number;
};

/**
 * Legt alle Stationen einer Thementour nacheinander in die Agenda eines Tages:
 * Start zur gewünschten Zeit, danach jeweils Dauer + Puffer (Weg, Pause).
 * Stationen, die nach Mitternacht enden würden, werden ausgelassen.
 * Titel und Ort werden in der aktuellen Sprache gespeichert.
 * Idempotent über clientRequestId (der erste Eintrag trägt ihn).
 */
export async function applyJourneyToTrip(
  visitorId: string,
  tripId: string,
  input: unknown,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ApplyJourneyResult> {
  const parsed = applyJourneySchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));
  const data = parsed.data;
  const trip = await assertTripOwnership(visitorId, tripId);
  assertDateInTrip(data.date, trip);

  const journey = await db.journey.findFirst({
    where: { slug: data.journeySlug, cityId: trip.cityId, published: true },
    include: {
      stops: {
        orderBy: { position: "asc" },
        include: {
          place: {
            select: {
              id: true,
              name: true,
              kind: true,
              street: true,
              postalCode: true,
              locality: true,
              published: true,
              translations: { where: { locale }, take: 1, select: { name: true } },
            },
          },
          translations: { where: { locale: { in: [locale, "de"] } } },
        },
      },
    },
  });
  if (!journey) throw new NotFoundError("e.journeyNotFound");

  if (data.clientRequestId) {
    const already = await db.agendaItem.findFirst({ where: { tripId, clientRequestId: data.clientRequestId }, select: { id: true } });
    if (already) {
      // Wiederholte Anfrage (z. B. Doppelklick): nichts neu anlegen, bestehendes Ergebnis melden
      const count = await db.agendaItem.count({
        where: { tripId, date: isoToDbDate(data.date), placeId: { in: journey.stops.map((s) => s.place.id) } },
      });
      return { created: count, total: journey.stops.length, date: data.date, conflicts: 0 };
    }
  }

  const published = journey.stops.filter((stop) => stop.place.published);
  // Eigene Auswahl: nur Stationen dieser Tour, in der gewünschten Reihenfolge und Dauer
  let stops = published;
  if (data.stops) {
    const byId = new Map(published.map((stop) => [stop.id, stop]));
    if (data.stops.some((s) => !byId.has(s.stopId))) throw new ValidationError({ stops: "v.invalidRequest" });
    stops = data.stops.map((s) => ({ ...byId.get(s.stopId)!, durationMinutes: s.durationMinutes }));
  }
  let cursor = timeToMinutes(data.startTime);
  const planned: Prisma.AgendaItemCreateManyInput[] = [];
  for (const stop of stops) {
    if (cursor + stop.durationMinutes > MINUTES_PER_DAY) break;
    const name = stop.place.translations[0]?.name ?? stop.place.name;
    const address = [stop.place.street, [stop.place.postalCode, stop.place.locality].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
    planned.push({
      tripId,
      placeId: stop.place.id,
      title: name,
      date: isoToDbDate(data.date),
      startMinutes: cursor,
      durationMinutes: stop.durationMinutes,
      location: address || null,
      category: PLACE_KIND_TO_AGENDA[stop.place.kind],
      notes: pickTranslation(stop.translations, locale)?.note ?? null,
      clientRequestId: planned.length === 0 ? (data.clientRequestId ?? null) : null,
    });
    cursor += stop.durationMinutes + data.bufferMinutes;
  }
  if (planned.length === 0) throw new ValidationError({ startTime: "v.journeyNoneFits" });

  const existing = await db.agendaItem.findMany({
    where: { tripId, date: isoToDbDate(data.date) },
    select: { id: true, date: true, startMinutes: true, durationMinutes: true, title: true },
  });
  const existingItems = existing.map((e) => ({ ...e, date: dbDateToIso(e.date) }));
  const conflicts = planned.filter(
    (p) => conflictsWith({ date: data.date, startMinutes: p.startMinutes, durationMinutes: p.durationMinutes }, existingItems).length > 0,
  ).length;

  await db.$transaction([
    db.agendaItem.createMany({ data: planned }),
    db.trip.update({ where: { id: tripId }, data: { lastOpenedAt: new Date() } }),
  ]);
  return { created: planned.length, total: stops.length, date: data.date, conflicts };
}
