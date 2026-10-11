import type { PlaceKindValue } from "./catalog-meta";
import { MINUTES_PER_DAY } from "./dates";

/*
 * Regelbasierte Planungshilfen – bewusst ohne KI und ohne externe Dienste:
 * nachvollziehbar, testbar und mit Begründung für jede Empfehlung.
 */

// ─── Tourstationen planen ────────────────────────────────────────────────────

/**
 * Berechnet die Startzeiten der eingeschlossenen Stationen ab einer Startzeit mit Puffer.
 * Ausgelassene Stationen und Stationen, die nach Mitternacht enden würden, erhalten keine Zeit.
 */
export function scheduleStops<T extends { durationMinutes: number; included: boolean }>(
  stops: readonly T[],
  startMinutes: number,
  buffer: number,
): (T & { start: number | null })[] {
  let cursor = startMinutes;
  let overflow = false;
  return stops.map((stop) => {
    if (!stop.included || overflow) return { ...stop, start: null };
    if (cursor + stop.durationMinutes > MINUTES_PER_DAY) {
      overflow = true;
      return { ...stop, start: null };
    }
    const start = cursor;
    cursor += stop.durationMinutes + buffer;
    return { ...stop, start };
  });
}

// ─── Freie Zeit finden ───────────────────────────────────────────────────────

export type Slot = { start: number; end: number };
type Busy = { startMinutes: number; durationMinutes: number };

export type FreeSlotOptions = {
  /** Beginn des Tagesfensters (Standard 09:00) */
  dayStart?: number;
  /** Ende des Tagesfensters (Standard 21:00) */
  dayEnd?: number;
  /** Kleinste sinnvolle Lücke (Standard 60 Min.) */
  minMinutes?: number;
  /** Frühester Beginn, z. B. «jetzt» am heutigen Tag */
  notBefore?: number;
};

/** Auf die nächste Viertelstunde aufrunden */
export function ceilToQuarter(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

/** Freie Zeitfenster eines Tages zwischen den geplanten Einträgen. */
export function findFreeSlots(items: readonly Busy[], options: FreeSlotOptions = {}): Slot[] {
  const dayStart = options.dayStart ?? 9 * 60;
  const dayEnd = options.dayEnd ?? 21 * 60;
  const minMinutes = options.minMinutes ?? 60;
  let cursor = Math.max(dayStart, options.notBefore != null ? ceilToQuarter(options.notBefore) : dayStart);
  const slots: Slot[] = [];
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  for (const item of sorted) {
    const start = Math.min(item.startMinutes, dayEnd);
    if (start - cursor >= minMinutes) slots.push({ start: cursor, end: start });
    cursor = Math.max(cursor, item.startMinutes + item.durationMinutes);
    if (cursor >= dayEnd) break;
  }
  if (dayEnd - cursor >= minMinutes) slots.push({ start: cursor, end: dayEnd });
  return slots;
}

// ─── Empfehlungen ────────────────────────────────────────────────────────────

export type Candidate = {
  id: string;
  kind: PlaceKindValue;
  categorySlug: string;
  durationMinutes: number;
  rainSuitable: boolean;
};

export type RecommendationReason = "profile" | "lunch" | "dinner" | "coffee" | "rain" | "fits";

export type Recommendation<T extends Candidate> = {
  place: T;
  /** Vorgeschlagene Startzeit (z. B. 12:00 fürs Mittagessen) */
  start: number;
  durationMinutes: number;
  reasons: RecommendationReason[];
  score: number;
};

export type RecommendContext = {
  /** Orte der Tour zum gewählten Reiseprofil */
  profilePlaceIds?: ReadonlySet<string>;
  /** Bereits im Aufenthalt geplante Orte */
  plannedPlaceIds?: ReadonlySet<string>;
  /** Nur Orte, die sich bei Regen eignen */
  rainy?: boolean;
  /** Ist an diesem Tag schon ein Essen um die Mittags-/Abendzeit geplant? */
  hasLunch?: boolean;
  hasDinner?: boolean;
  limit?: number;
};

const LUNCH: Slot = { start: 12 * 60, end: 13 * 60 };
const DINNER: Slot = { start: 19 * 60, end: 20 * 60 + 30 };
const COFFEE: Slot = { start: 15 * 60, end: 15 * 60 + 45 };

function covers(slot: Slot, window: Slot): boolean {
  return slot.start <= window.start && slot.end >= window.end;
}

/**
 * Empfiehlt Orte für ein freies Zeitfenster.
 * Regeln: passt in die Lücke, nicht schon geplant, keine Veranstaltungen (eigene Daten),
 * bei Regen nur wetterfeste Orte. Bonus für das Reiseprofil, Essenszeiten und
 * Kaffeepause; Restaurants ausserhalb der Essenszeiten werden zurückgestellt.
 */
export function recommendForSlot<T extends Candidate>(
  candidates: readonly T[],
  slot: Slot,
  context: RecommendContext = {},
): Recommendation<T>[] {
  const length = slot.end - slot.start;
  const lunch = !context.hasLunch && covers(slot, LUNCH);
  const dinner = !context.hasDinner && covers(slot, DINNER);
  const coffee = covers(slot, COFFEE);
  const results: Recommendation<T>[] = [];

  candidates.forEach((place, index) => {
    if (place.categorySlug === "veranstaltungen") return;
    if (context.plannedPlaceIds?.has(place.id)) return;
    if (context.rainy && !place.rainSuitable) return;
    if (place.durationMinutes > length) return;

    const reasons: RecommendationReason[] = [];
    let score = 0;
    let start = slot.start;
    const isRestaurant = place.kind === "RESTAURANT";
    const isCafe = place.kind === "CAFE";

    if (context.profilePlaceIds?.has(place.id)) {
      score += 3;
      reasons.push("profile");
    }
    if ((isRestaurant || isCafe) && lunch) {
      score += isRestaurant ? 4 : 3;
      reasons.push("lunch");
      start = LUNCH.start;
    } else if (isRestaurant && dinner) {
      score += 4;
      reasons.push("dinner");
      start = Math.max(slot.start, DINNER.start - 30);
    } else if (isCafe && coffee) {
      score += 2;
      reasons.push("coffee");
      start = Math.max(slot.start, COFFEE.start - 15);
    } else if (isRestaurant) {
      score -= 3; // ausserhalb der Essenszeiten nicht vorschlagen, ausser nichts anderes passt
    }
    if (context.rainy && place.rainSuitable) reasons.push("rain");
    // Passt gut: nutzt einen spürbaren Teil der Lücke, ohne sie zu sprengen
    if (place.durationMinutes >= Math.min(60, length / 2)) {
      score += 1;
      reasons.push("fits");
    }
    // Startzeit so wählen, dass der Ort sicher in die Lücke passt
    start = Math.min(Math.max(start, slot.start), slot.end - place.durationMinutes);
    // Kuratierte Reihenfolge des Katalogs als sanfter Tiebreaker
    score -= index * 0.001;
    results.push({ place, start, durationMinutes: place.durationMinutes, reasons, score });
  });

  // Abwechslung: zuerst höchstens ein Vorschlag pro Art (z. B. nicht drei Restaurants), dann auffüllen
  const limit = context.limit ?? 3;
  const sorted = results.sort((a, b) => b.score - a.score);
  const picked: Recommendation<T>[] = [];
  const kinds = new Set<PlaceKindValue>();
  for (const r of sorted) {
    if (picked.length >= limit) break;
    if (kinds.has(r.place.kind)) continue;
    kinds.add(r.place.kind);
    picked.push(r);
  }
  for (const r of sorted) {
    if (picked.length >= limit) break;
    if (!picked.includes(r)) picked.push(r);
  }
  return picked.sort((a, b) => b.score - a.score);
}
