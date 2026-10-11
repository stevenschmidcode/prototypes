import "server-only";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { toTripAccommodation } from "@/server/mappers";
import { assertTripOwnership } from "@/server/services/trips";
import { isoToDbDate, timeToMinutes } from "@/lib/dates";
import { accommodationInputSchema, toFieldErrors } from "@/lib/validation";
import type { TripAccommodationDto } from "@/lib/types";

/**
 * Speichert die Unterkunft eines Aufenthalts (anlegen oder ersetzen).
 * Bei Auswahl aus dem Katalog werden fehlende Angaben aus dem Katalog ergänzt;
 * Eingaben des Gastes haben Vorrang. Koordinaten stammen nur aus dem Katalog.
 */
export async function saveTripAccommodation(
  visitorId: string,
  tripId: string,
  input: unknown,
): Promise<TripAccommodationDto> {
  const parsed = accommodationInputSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(toFieldErrors(parsed.error));
  const data = parsed.data;
  const trip = await assertTripOwnership(visitorId, tripId);

  let catalog = null;
  if (data.accommodationId) {
    catalog = await db.accommodation.findFirst({
      where: { id: data.accommodationId, published: true, cityId: trip.cityId },
    });
    if (!catalog) throw new ValidationError({ accommodationId: "v.accommodationNotInCatalog" });
  }

  const values = {
    accommodationId: catalog?.id ?? null,
    type: catalog?.type ?? data.type,
    name: data.name,
    street: data.street ?? catalog?.street ?? null,
    postalCode: data.postalCode ?? catalog?.postalCode ?? null,
    locality: data.locality ?? catalog?.locality ?? null,
    latitude: catalog?.latitude ?? null,
    longitude: catalog?.longitude ?? null,
    checkInDate: data.checkInDate ? isoToDbDate(data.checkInDate) : null,
    checkInTime: data.checkInTime ? timeToMinutes(data.checkInTime) : null,
    checkOutDate: data.checkOutDate ? isoToDbDate(data.checkOutDate) : null,
    checkOutTime: data.checkOutTime ? timeToMinutes(data.checkOutTime) : null,
    phone: data.phone ?? catalog?.phone ?? null,
    websiteUrl: data.websiteUrl ?? catalog?.websiteUrl ?? null,
    notes: data.notes ?? null,
  };

  const [row] = await db.$transaction([
    db.tripAccommodation.upsert({
      where: { tripId },
      create: { tripId, ...values },
      update: values,
      include: { accommodation: true },
    }),
    db.trip.update({ where: { id: tripId }, data: { lastOpenedAt: new Date() } }),
  ]);
  return toTripAccommodation(row);
}

export async function removeTripAccommodation(visitorId: string, tripId: string): Promise<void> {
  await assertTripOwnership(visitorId, tripId);
  const result = await db.tripAccommodation.deleteMany({ where: { tripId } });
  if (result.count === 0) throw new NotFoundError("e.noAccommodation");
}
