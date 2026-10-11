import "server-only";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { NotFoundError } from "@/server/errors";
import { getVisitorId } from "@/server/session";
import { getTrip } from "@/server/services/trips";
import { idSchema } from "@/lib/validation";

/**
 * Lädt einen Aufenthalt für eine Seite. Ohne Session, mit ungültiger ID oder
 * bei fremden Aufenthalten → 404 (keine Unterscheidung, keine Informationslecks).
 */
export async function loadOwnedTrip(params: Promise<{ tripId: string }>) {
  const [{ tripId }, locale] = await Promise.all([params, getLocale()]);
  const visitorId = await getVisitorId();
  if (!visitorId || !idSchema.safeParse(tripId).success) notFound();
  try {
    return { visitorId, trip: await getTrip(visitorId, tripId, locale) };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
