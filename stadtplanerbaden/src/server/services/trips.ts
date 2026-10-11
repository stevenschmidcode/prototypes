import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { agendaItemInclude, toAgendaItem, toTripAccommodation } from "@/server/mappers";
import { getDefaultCity } from "@/server/services/catalog";
import { compareItems } from "@/lib/agenda";
import { dbDateToIso, isoToDbDate } from "@/lib/dates";
import { toFieldErrors, tripInputSchema, type TripInput } from "@/lib/validation";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { TripDetailDto, TripSummaryDto } from "@/lib/types";

/**
 * Lädt einen Aufenthalt nur, wenn er dem Gast gehört. Fremde und nicht
 * existierende IDs sind bewusst nicht unterscheidbar (keine Informationslecks).
 */
export async function assertTripOwnership(visitorId: string, tripId: string) {
  const trip = await db.trip.findFirst({
    where: { id: tripId, visitorSessionId: visitorId },
    select: { id: true, startDate: true, endDate: true, cityId: true },
  });
  if (!trip) throw new NotFoundError("e.tripNotFound");
  return { ...trip, startDate: dbDateToIso(trip.startDate), endDate: dbDateToIso(trip.endDate) };
}

export async function listTrips(visitorId: string): Promise<TripSummaryDto[]> {
  const rows = await db.trip.findMany({
    where: { visitorSessionId: visitorId },
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    include: {
      accommodation: { select: { name: true } },
      journey: { select: { slug: true } },
      _count: { select: { agendaItems: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    startDate: dbDateToIso(row.startDate),
    endDate: dbDateToIso(row.endDate),
    accommodationName: row.accommodation?.name ?? null,
    agendaCount: row._count.agendaItems,
    journeySlug: row.journey?.slug ?? null,
  }));
}

/** ID des zuletzt aktiven Aufenthalts (zuletzt geöffnet oder bearbeitet). */
export async function getLastActiveTripId(visitorId: string): Promise<string | null> {
  const trip = await db.trip.findFirst({
    where: { visitorSessionId: visitorId },
    orderBy: [{ lastOpenedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  return trip?.id ?? null;
}

export async function getTrip(visitorId: string, tripId: string, locale: Locale = DEFAULT_LOCALE): Promise<TripDetailDto> {
  const row = await db.trip.findFirst({
    where: { id: tripId, visitorSessionId: visitorId },
    include: {
      accommodation: { include: { accommodation: true } },
      agendaItems: { include: agendaItemInclude(locale) },
      journey: { select: { slug: true } },
    },
  });
  if (!row) throw new NotFoundError("e.tripNotFound");
  const agenda = row.agendaItems.map(toAgendaItem).sort(compareItems);
  return {
    id: row.id,
    name: row.name,
    startDate: dbDateToIso(row.startDate),
    endDate: dbDateToIso(row.endDate),
    notes: row.notes,
    accommodationName: row.accommodation?.name ?? null,
    accommodation: row.accommodation ? toTripAccommodation(row.accommodation) : null,
    agenda,
    agendaCount: agenda.length,
    journeySlug: row.journey?.slug ?? null,
  };
}

/** Markiert einen Aufenthalt als zuletzt aktiv (gedrosselt auf eine Schreiboperation pro Minute). */
export async function markTripOpened(visitorId: string, tripId: string): Promise<void> {
  await db.trip.updateMany({
    where: { id: tripId, visitorSessionId: visitorId, lastOpenedAt: { lt: new Date(Date.now() - 60_000) } },
    data: { lastOpenedAt: new Date() },
  });
}

function parseTripInput(input: unknown) {
  const parsed = tripInputSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));
  return parsed.data;
}

/** Reiseprofil (Slug) → Journey-ID derselben Stadt; unbekannte Slugs werden ignoriert */
async function resolveJourneyId(data: TripInput, cityId: string): Promise<string | null> {
  if (!data.journeySlug) return null;
  const journey = await db.journey.findFirst({
    where: { slug: data.journeySlug, cityId, published: true },
    select: { id: true },
  });
  return journey?.id ?? null;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createTrip(visitorId: string, input: unknown): Promise<{ id: string }> {
  const data = parseTripInput(input);

  // Idempotenz: dieselbe Anfrage (z. B. Doppelklick, erneutes Senden) erzeugt keinen zweiten Aufenthalt.
  if (data.clientRequestId) {
    const existing = await db.trip.findUnique({
      where: { clientRequestId: data.clientRequestId },
      select: { id: true, visitorSessionId: true },
    });
    if (existing) {
      if (existing.visitorSessionId !== visitorId) throw new ValidationError({ _form: "v.invalidRequest" });
      return { id: existing.id };
    }
  }

  const city = await getDefaultCity();
  try {
    const trip = await db.trip.create({
      data: {
        visitorSessionId: visitorId,
        cityId: city.id,
        name: data.name,
        startDate: isoToDbDate(data.startDate),
        endDate: isoToDbDate(data.endDate),
        notes: data.notes ?? null,
        journeyId: await resolveJourneyId(data, city.id),
        clientRequestId: data.clientRequestId ?? null,
      },
      select: { id: true },
    });
    return trip;
  } catch (error) {
    // Gleichzeitige Doppel-Anfrage: die erste hat gewonnen.
    if (isUniqueViolation(error) && data.clientRequestId) {
      const existing = await db.trip.findFirst({
        where: { clientRequestId: data.clientRequestId, visitorSessionId: visitorId },
        select: { id: true },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function updateTrip(visitorId: string, tripId: string, input: unknown): Promise<{ id: string }> {
  const data = parseTripInput(input);
  const trip = await assertTripOwnership(visitorId, tripId);
  await db.trip.update({
    where: { id: tripId },
    data: {
      name: data.name,
      startDate: isoToDbDate(data.startDate),
      endDate: isoToDbDate(data.endDate),
      notes: data.notes ?? null,
      journeyId: await resolveJourneyId(data, trip.cityId),
      lastOpenedAt: new Date(),
    },
  });
  return { id: tripId };
}

export async function deleteTrip(visitorId: string, tripId: string): Promise<void> {
  const result = await db.trip.deleteMany({ where: { id: tripId, visitorSessionId: visitorId } });
  if (result.count === 0) throw new NotFoundError("e.tripNotFound");
}

/** Anzahl Agendaeinträge, die nach einer Datumsänderung ausserhalb des Aufenthalts lägen. */
export async function countItemsOutsideRange(
  visitorId: string,
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  await assertTripOwnership(visitorId, tripId);
  return db.agendaItem.count({
    where: {
      tripId,
      OR: [{ date: { lt: isoToDbDate(startDate) } }, { date: { gt: isoToDbDate(endDate) } }],
    },
  });
}
