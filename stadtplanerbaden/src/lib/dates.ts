/**
 * Datums- und Zeitlogik für baden.
 *
 * Kalendertage werden durchgehend als ISO-Strings ("YYYY-MM-DD") behandelt und
 * immer als lokale Tage in Europe/Zurich interpretiert. Damit gibt es keine
 * Verschiebungen durch Zeitzonen oder Sommerzeit. Uhrzeiten sind Minuten seit
 * Mitternacht (0–1439).
 */

export const APP_TIME_ZONE = "Europe/Zurich";
export const MINUTES_PER_DAY = 24 * 60;
/** Maximale Länge eines Aufenthalts in Tagen (inkl. An- und Abreisetag). */
export const MAX_TRIP_DAYS = 60;

export type IsoDate = string;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Prüft, ob ein String ein gültiges Kalenderdatum im Format YYYY-MM-DD ist. */
export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function assertIsoDate(value: string): asserts value is IsoDate {
  if (!isIsoDate(value)) throw new RangeError(`Ungültiges Datum: ${value}`);
}

/** ISO-Datum → Date (UTC-Mitternacht) für Prisma-Felder vom Typ @db.Date. */
export function isoToDbDate(iso: IsoDate): Date {
  assertIsoDate(iso);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Date aus einem @db.Date-Feld → ISO-Datum. */
export function dbDateToIso(date: Date): IsoDate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Tagesnummer seit 1970-01-01 – Grundlage für Differenzen und absolute Zeiten. */
export function dayNumber(iso: IsoDate): number {
  return Math.round(isoToDbDate(iso).getTime() / 86_400_000);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = isoToDbDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return dbDateToIso(date);
}

/** Anzahl Tage von a bis b (b − a). */
export function diffInDays(a: IsoDate, b: IsoDate): number {
  return dayNumber(b) - dayNumber(a);
}

/** Alle Kalendertage von start bis end (inklusive). */
export function eachDay(start: IsoDate, end: IsoDate): IsoDate[] {
  const count = diffInDays(start, end);
  if (count < 0) return [];
  return Array.from({ length: count + 1 }, (_, i) => addDays(start, i));
}

export function isWithin(iso: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return iso >= start && iso <= end;
}

/** Heutiges Datum in Europe/Zurich. */
export function todayInZurich(now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Aktuelle Uhrzeit in Europe/Zurich als Minuten seit Mitternacht. */
export function nowMinutesInZurich(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

// ─── Uhrzeiten ───────────────────────────────────────────────────────────────

export function isTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** "HH:mm" → Minuten seit Mitternacht. */
export function timeToMinutes(value: string): number {
  const match = TIME_RE.exec(value);
  if (!match) throw new RangeError(`Ungültige Uhrzeit: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minuten seit Mitternacht → "HH:mm". Werte ≥ 24 h werden als "24:00" begrenzt. */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Sprache der Formatierung (entspricht i18n/config Locale) */
export type DateLocale = "de" | "en";
const INTL: Record<DateLocale, string> = { de: "de-CH", en: "en-GB" };

/** Dauer in Minuten → «1 Std. 30 Min.» / «1 hr 30 min» */
export function formatDuration(minutes: number, locale: DateLocale = "de"): string {
  const [hr, min] = locale === "en" ? ["hr", "min"] : ["Std.", "Min."];
  if (minutes < 60) return `${minutes} ${min}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ${hr}` : `${h} ${hr} ${m} ${min}`;
}

// ─── Formatierung (de-CH / en-GB) ─────────────────────────────────────────────

function format(iso: IsoDate, options: Intl.DateTimeFormatOptions, locale: DateLocale = "de"): string {
  // Die Date-Instanz liegt auf UTC-Mitternacht – daher in UTC formatieren.
  return new Intl.DateTimeFormat(INTL[locale], { ...options, timeZone: "UTC" }).format(isoToDbDate(iso));
}

/** «Freitag, 16. Oktober 2026» / «Friday 16 October 2026» */
export function formatDateLong(iso: IsoDate, locale: DateLocale = "de"): string {
  return format(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, locale);
}

/** «Fr., 16. Okt.» / «Fri 16 Oct» */
export function formatDateShort(iso: IsoDate, locale: DateLocale = "de"): string {
  return format(iso, { weekday: "short", day: "numeric", month: "short" }, locale);
}

/** «Freitag» */
export function formatWeekday(iso: IsoDate, locale: DateLocale = "de"): string {
  return format(iso, { weekday: "long" }, locale);
}

/** «Fr» / «Fri» */
export function formatWeekdayShort(iso: IsoDate, locale: DateLocale = "de"): string {
  return format(iso, { weekday: "short" }, locale).replace(/.$/, "");
}

/** «16. Oktober» / «16 October» */
export function formatDayMonth(iso: IsoDate, locale: DateLocale = "de"): string {
  return format(iso, { day: "numeric", month: "long" }, locale);
}

/** Tag im Monat als Kurzform: «16.» / «16» */
export function formatDayNumber(iso: IsoDate, locale: DateLocale = "de"): string {
  const day = Number(iso.slice(8));
  return locale === "de" ? `${day}.` : String(day);
}

/**
 * Kompakter Zeitraum:
 * - gleicher Monat: «16.–18. Oktober 2026» / «16–18 October 2026»
 * - gleiches Jahr: «30. September – 2. Oktober 2026» / «30 September – 2 October 2026»
 * - sonst: «30. Dezember 2026 – 2. Januar 2027»
 */
export function formatDateRange(start: IsoDate, end: IsoDate, locale: DateLocale = "de"): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const full = (iso: IsoDate) => format(iso, { day: "numeric", month: "long", year: "numeric" }, locale);
  if (start === end) return full(start);
  if (sy === ey && sm === em) return locale === "de" ? `${sd}.–${full(end)}` : `${sd}–${full(end)}`;
  if (sy === ey) return `${formatDayMonth(start, locale)} – ${full(end)}`;
  return `${full(start)} – ${full(end)}`;
}

// ─── Aufenthalte ─────────────────────────────────────────────────────────────

export type TripStatus = "upcoming" | "current" | "past";

export function tripStatus(trip: { startDate: IsoDate; endDate: IsoDate }, today: IsoDate): TripStatus {
  if (today < trip.startDate) return "upcoming";
  if (today > trip.endDate) return "past";
  return "current";
}

/** Anzahl Nächte zwischen An- und Abreise. */
export function nightsBetween(start: IsoDate, end: IsoDate): number {
  return Math.max(0, diffInDays(start, end));
}

/** «In 3 Tagen», «Morgen», «Heute» … relativ zum heutigen Tag. */
export function relativeDayLabel(iso: IsoDate, today: IsoDate, locale: DateLocale = "de"): string {
  const diff = diffInDays(today, iso);
  const en = locale === "en";
  if (diff === 0) return en ? "Today" : "Heute";
  if (diff === 1) return en ? "Tomorrow" : "Morgen";
  if (diff === -1) return en ? "Yesterday" : "Gestern";
  if (diff > 1) return en ? `In ${diff} days` : `In ${diff} Tagen`;
  return en ? `${Math.abs(diff)} days ago` : `Vor ${Math.abs(diff)} Tagen`;
}
