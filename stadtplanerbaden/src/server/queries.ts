import "server-only";
import { connection } from "next/server";
import { getLocale } from "@/i18n/server";
import { getVisitorId } from "@/server/session";
import { listFavorites } from "@/server/services/favorites";
import { getLastActiveTripId, getTrip, listTrips } from "@/server/services/trips";
import * as catalog from "@/server/services/catalog";
import type { PlaceDetailDto } from "@/lib/types";

/**
 * Lade-Funktionen für Server Components.
 *
 * - Die Sprache kommt aus dem Root-Parameter [lang] (next/root-params).
 * - Mit Cache Components sind alle Datenbankzugriffe dynamisch und liegen hinter
 *   <Suspense>. `connection()` markiert Katalogabfragen explizit als
 *   Request-Zeit-Daten, damit der Build keine Datenbank benötigt.
 */
export async function loadPlaces(filter: Omit<catalog.PlaceFilter, "locale"> = {}) {
  const locale = await getLocale();
  await connection();
  return catalog.listPlaces({ ...filter, locale });
}

export async function loadPlace(slug: string) {
  const locale = await getLocale();
  await connection();
  return catalog.getPlaceBySlug(slug, locale);
}

export async function loadRelatedPlaces(place: PlaceDetailDto) {
  const locale = await getLocale();
  await connection();
  return catalog.listRelatedPlaces(place, locale);
}

export async function loadAccommodations() {
  const locale = await getLocale();
  await connection();
  return catalog.listAccommodations(locale);
}

export async function loadJourneys() {
  const locale = await getLocale();
  await connection();
  return catalog.listJourneys(locale);
}

export async function loadJourney(slug: string) {
  const locale = await getLocale();
  await connection();
  return catalog.getJourneyBySlug(slug, locale);
}

export async function loadJourneysForPlace(placeId: string) {
  const locale = await getLocale();
  await connection();
  return catalog.listJourneysForPlace(placeId, locale);
}

/** Zuletzt aktiver Aufenthalt des aktuellen Gastes (oder null). */
export async function loadActiveTrip() {
  const locale = await getLocale();
  const visitorId = await getVisitorId();
  if (!visitorId) return null;
  const tripId = await getLastActiveTripId(visitorId);
  return tripId ? getTrip(visitorId, tripId, locale) : null;
}

export async function loadFavorites() {
  const locale = await getLocale();
  const visitorId = await getVisitorId();
  return visitorId ? listFavorites(visitorId, locale) : [];
}

/** Daten für das Dashboard eines Aufenthalts */
export async function loadDashboard(visitorId: string, tripId: string) {
  const locale = await getLocale();
  const [trip, trips, favorites, journeys] = await Promise.all([
    getTrip(visitorId, tripId, locale),
    listTrips(visitorId),
    listFavorites(visitorId, locale),
    catalog.listJourneys(locale),
  ]);
  return { trip, trips, favorites, journeys };
}
