import { dayNumber, eachDay, MINUTES_PER_DAY, type IsoDate } from "./dates";

/** Minimale Form eines Agendaeintrags für Zeitberechnungen. */
export type TimedItem = {
  id: string;
  date: IsoDate;
  startMinutes: number;
  durationMinutes: number;
};

/** Absoluter Start in Minuten (Tagesnummer × 1440 + Startzeit). */
export function absoluteStart(item: Pick<TimedItem, "date" | "startMinutes">): number {
  return dayNumber(item.date) * MINUTES_PER_DAY + item.startMinutes;
}

export function absoluteEnd(item: Omit<TimedItem, "id">): number {
  return absoluteStart(item) + item.durationMinutes;
}

export function endMinutes(item: Pick<TimedItem, "startMinutes" | "durationMinutes">): number {
  return item.startMinutes + item.durationMinutes;
}

/**
 * Zwei Einträge überschneiden sich, wenn sich ihre Zeiträume echt überlappen.
 * Direkt aneinander anschliessende Termine (Ende = Start) sind kein Konflikt.
 */
export function overlaps(a: Omit<TimedItem, "id">, b: Omit<TimedItem, "id">): boolean {
  return absoluteStart(a) < absoluteEnd(b) && absoluteStart(b) < absoluteEnd(a);
}

export function compareItems(a: TimedItem, b: TimedItem): number {
  return absoluteStart(a) - absoluteStart(b) || a.durationMinutes - b.durationMinutes || a.id.localeCompare(b.id);
}

/**
 * Findet alle Überschneidungen. Ergebnis: Map von Eintrags-ID auf die IDs der
 * Einträge, mit denen er kollidiert. Einträge ohne Konflikt fehlen in der Map.
 *
 * Sweep über die nach Start sortierten Einträge: O(n log n + k).
 */
export function findConflicts<T extends TimedItem>(items: readonly T[]): Map<string, string[]> {
  const sorted = [...items].sort(compareItems);
  const conflicts = new Map<string, string[]>();
  const active: T[] = [];

  const add = (a: string, b: string) => {
    const list = conflicts.get(a) ?? [];
    list.push(b);
    conflicts.set(a, list);
  };

  for (const item of sorted) {
    const start = absoluteStart(item);
    // Einträge entfernen, die vor dem aktuellen Start enden
    for (let i = active.length - 1; i >= 0; i--) {
      if (absoluteEnd(active[i]) <= start) active.splice(i, 1);
    }
    for (const other of active) {
      add(item.id, other.id);
      add(other.id, item.id);
    }
    active.push(item);
  }
  return conflicts;
}

/** Konflikte eines (geplanten) Eintrags gegenüber bestehenden Einträgen. */
export function conflictsWith<T extends TimedItem>(
  candidate: Omit<TimedItem, "id"> & { id?: string },
  items: readonly T[],
): T[] {
  return items
    .filter((item) => item.id !== candidate.id && overlaps(candidate, item))
    .sort(compareItems);
}

export type AgendaDay<T> = { date: IsoDate; items: T[] };

/**
 * Gruppiert Einträge nach den tatsächlichen Tagen des Aufenthalts.
 * Tage ohne Einträge sind enthalten (für Leer-Zustände). Einträge ausserhalb
 * des Zeitraums (z. B. nach Änderung der Reisedaten) werden separat geliefert.
 */
export function groupByTripDays<T extends TimedItem>(
  items: readonly T[],
  startDate: IsoDate,
  endDate: IsoDate,
): { days: AgendaDay<T>[]; outside: T[] } {
  const days = eachDay(startDate, endDate).map((date) => ({ date, items: [] as T[] }));
  const index = new Map(days.map((day) => [day.date, day]));
  const outside: T[] = [];
  for (const item of [...items].sort(compareItems)) {
    const day = index.get(item.date);
    if (day) day.items.push(item);
    else outside.push(item);
  }
  return { days, outside };
}

/**
 * Nächster relevanter Eintrag: ein laufender oder der nächste anstehende.
 */
export function nextItem<T extends TimedItem>(
  items: readonly T[],
  today: IsoDate,
  nowMinutes: number,
): { item: T; ongoing: boolean } | null {
  const now = dayNumber(today) * MINUTES_PER_DAY + nowMinutes;
  const sorted = [...items].sort(compareItems);
  for (const item of sorted) {
    const start = absoluteStart(item);
    const end = absoluteEnd(item);
    if (end > now) return { item, ongoing: start <= now };
  }
  return null;
}

/** Vorschlag für die Startzeit eines neuen Eintrags an einem Tag: nach dem letzten Termin. */
export function suggestStartMinutes<T extends TimedItem>(items: readonly T[], date: IsoDate): number {
  const sameDay = items.filter((item) => item.date === date);
  if (sameDay.length === 0) return 10 * 60;
  const latestEnd = Math.max(...sameDay.map((item) => endMinutes(item)));
  // auf die nächste Viertelstunde runden, spätestens 22:00
  const rounded = Math.ceil(latestEnd / 15) * 15;
  return Math.min(rounded, 22 * 60);
}
