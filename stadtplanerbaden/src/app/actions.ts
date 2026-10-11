"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { NotFoundError, ValidationError } from "@/server/errors";
import { clearVisitorCookie, getVisitorId, requireVisitorId } from "@/server/session";
import * as accommodationService from "@/server/services/accommodation";
import * as agendaService from "@/server/services/agenda";
import * as favoriteService from "@/server/services/favorites";
import * as tripService from "@/server/services/trips";
import { deleteVisitor } from "@/server/services/visitor";
import type { AgendaMutationResult, ApplyJourneyResult } from "@/server/services/agenda";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import type { ActionResult } from "@/lib/types";

/**
 * Server Actions – dünne Schicht über den Services.
 * Jede Action ermittelt die Gast-Identität selbst aus dem HttpOnly-Cookie und
 * vertraut keinen IDs aus dem Client. Next.js prüft zusätzlich Origin/Host.
 * Fehler werden als Meldungsschlüssel zurückgegeben; der Client übersetzt sie.
 */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    refresh();
    return { ok: true, data };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ValidationError) {
      return { ok: false, error: error.fieldErrors._form ?? error.message, fieldErrors: error.fieldErrors };
    }
    if (error instanceof NotFoundError) {
      return { ok: false, error: error.message };
    }
    console.error("[action] Unerwarteter Fehler", error);
    return { ok: false, error: "e.generic" };
  }
}

/** Sprache aus dem Client nur übernehmen, wenn sie gültig ist */
function asLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// ─── Aufenthalt ──────────────────────────────────────────────────────────────

export async function createTripAction(input: unknown) {
  return run(async () => tripService.createTrip(await requireVisitorId(), input));
}

export async function updateTripAction(tripId: string, input: unknown) {
  return run(async () => tripService.updateTrip(await requireVisitorId(), String(tripId), input));
}

export async function deleteTripAction(tripId: string) {
  return run(async () => tripService.deleteTrip(await requireVisitorId(), String(tripId)));
}

export async function countItemsOutsideRangeAction(tripId: string, startDate: string, endDate: string) {
  try {
    const visitorId = await getVisitorId();
    if (!visitorId) return 0;
    return await tripService.countItemsOutsideRange(visitorId, String(tripId), String(startDate), String(endDate));
  } catch (error) {
    unstable_rethrow(error);
    return 0;
  }
}

// ─── Unterkunft ──────────────────────────────────────────────────────────────

export async function saveAccommodationAction(tripId: string, input: unknown) {
  return run(async () => accommodationService.saveTripAccommodation(await requireVisitorId(), String(tripId), input));
}

export async function removeAccommodationAction(tripId: string) {
  return run(async () => accommodationService.removeTripAccommodation(await requireVisitorId(), String(tripId)));
}

// ─── Agenda ──────────────────────────────────────────────────────────────────

export async function createAgendaItemAction(
  tripId: string,
  input: unknown,
  locale?: string,
): Promise<ActionResult<AgendaMutationResult>> {
  return run(async () => agendaService.createAgendaItem(await requireVisitorId(), String(tripId), input, asLocale(locale)));
}

export async function updateAgendaItemAction(
  itemId: string,
  input: unknown,
  locale?: string,
): Promise<ActionResult<AgendaMutationResult>> {
  return run(async () => agendaService.updateAgendaItem(await requireVisitorId(), String(itemId), input, asLocale(locale)));
}

export async function deleteAgendaItemAction(itemId: string) {
  return run(async () => agendaService.deleteAgendaItem(await requireVisitorId(), String(itemId)));
}

/** Thementour als Tagesprogramm in einen Aufenthalt übernehmen */
export async function applyJourneyAction(
  tripId: string,
  input: unknown,
  locale?: string,
): Promise<ActionResult<ApplyJourneyResult>> {
  return run(async () => agendaService.applyJourneyToTrip(await requireVisitorId(), String(tripId), input, asLocale(locale)));
}

// ─── Favoriten ───────────────────────────────────────────────────────────────

export async function addFavoriteAction(input: unknown) {
  return run(async () => favoriteService.addFavorite(await requireVisitorId(), input));
}

export async function removeFavoriteAction(input: unknown) {
  return run(async () => favoriteService.removeFavorite(await requireVisitorId(), input));
}

// ─── Datenschutz ─────────────────────────────────────────────────────────────

/** Löscht alle Daten des Gastes unwiderruflich und entfernt das Cookie. */
export async function deleteMyDataAction() {
  return run(async () => {
    const visitorId = await getVisitorId();
    if (visitorId) await deleteVisitor(visitorId);
    await clearVisitorCookie();
  });
}
