import { z } from "zod";
import { diffInDays, isIsoDate, isTime, MAX_TRIP_DAYS, MINUTES_PER_DAY, timeToMinutes } from "./dates";

/**
 * Validierung für Client und Server.
 *
 * Fehlermeldungen sind sprachneutrale Schlüssel (z. B. "v.endBeforeStart" oder mit
 * Parametern "v.tooLong|80"). Die Oberfläche übersetzt sie mit translateMessage()
 * aus src/i18n/messages.ts in die aktuelle Sprache.
 */

export const AGENDA_CATEGORIES = [
  "SIGHTSEEING",
  "FOOD",
  "CULTURE",
  "WELLNESS",
  "NATURE",
  "SHOPPING",
  "EVENT",
  "ACCOMMODATION",
  "TRAVEL",
  "OTHER",
] as const;
export type AgendaCategoryValue = (typeof AGENDA_CATEGORIES)[number];

export const ACCOMMODATION_TYPES = ["HOTEL", "APARTMENT", "PRIVATE", "OTHER"] as const;
export type AccommodationTypeValue = (typeof ACCOMMODATION_TYPES)[number];

/** Meldungsschlüssel mit optionalen Parametern: msg("v.tooLong", 80) → "v.tooLong|80" */
export function msg(key: string, ...params: (string | number)[]): string {
  return [key, ...params].join("|");
}

// ─── Bausteine ───────────────────────────────────────────────────────────────

/** Leere Strings aus Formularen werden zu undefined. */
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, msg("v.tooLong", max)).optional());

export const isoDateSchema = z.string({ error: "v.dateRequired" }).refine(isIsoDate, "v.dateInvalid");

const optionalIsoDate = z.preprocess(emptyToUndefined, isoDateSchema.optional());

export const timeSchema = z.string({ error: "v.timeRequired" }).refine(isTime, "v.timeInvalid");

const optionalTime = z.preprocess(emptyToUndefined, timeSchema.optional());

const uuidSchema = z.uuid("v.idInvalid");
const optionalUuid = z.preprocess(emptyToUndefined, uuidSchema.optional());

const optionalUrl = z.preprocess(
  (value) => {
    const v = emptyToUndefined(value);
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    // «www.example.ch» → «https://www.example.ch»
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  },
  z.url({ protocol: /^https?$/, error: "v.urlInvalid" }).max(300, msg("v.tooLong", 300)).optional(),
);

const optionalPhone = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(30, msg("v.tooLong", 30))
    .regex(/^\+?[0-9 ()/.-]{6,}$/, "v.phoneInvalid")
    .optional(),
);

// ─── Aufenthalt ──────────────────────────────────────────────────────────────

export const tripInputSchema = z
  .object({
    name: z
      .string({ error: "v.tripNameRequired" })
      .trim()
      .min(1, "v.tripNameRequired")
      .max(80, msg("v.tooLong", 80)),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    notes: optionalText(1000),
    /** Gewähltes Reiseprofil (Slug einer Thementour) */
    journeySlug: z.preprocess(emptyToUndefined, z.string().regex(/^[a-z0-9-]{1,60}$/, "v.idInvalid").optional()),
    clientRequestId: optionalUuid,
  })
  .superRefine((value, ctx) => {
    if (!isIsoDate(value.startDate) || !isIsoDate(value.endDate)) return;
    const diff = diffInDays(value.startDate, value.endDate);
    if (diff < 0) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "v.endBeforeStart" });
    } else if (diff + 1 > MAX_TRIP_DAYS) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: msg("v.tripTooLong", MAX_TRIP_DAYS) });
    }
  });
export type TripInput = z.infer<typeof tripInputSchema>;

// ─── Unterkunft ──────────────────────────────────────────────────────────────

export const accommodationInputSchema = z
  .object({
    /** Gesetzt, wenn eine Unterkunft aus dem Katalog gewählt wurde */
    accommodationId: optionalUuid,
    type: z.enum(ACCOMMODATION_TYPES).default("HOTEL"),
    name: z
      .string({ error: "v.accommodationNameRequired" })
      .trim()
      .min(1, "v.accommodationNameRequired")
      .max(120, msg("v.tooLong", 120)),
    street: optionalText(120),
    postalCode: optionalText(10),
    locality: optionalText(80),
    checkInDate: optionalIsoDate,
    checkInTime: optionalTime,
    checkOutDate: optionalIsoDate,
    checkOutTime: optionalTime,
    phone: optionalPhone,
    websiteUrl: optionalUrl,
    notes: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (value.checkInDate && value.checkOutDate && value.checkOutDate < value.checkInDate) {
      ctx.addIssue({ code: "custom", path: ["checkOutDate"], message: "v.checkOutBeforeCheckIn" });
    }
    if (
      value.checkInDate &&
      value.checkOutDate &&
      value.checkInDate === value.checkOutDate &&
      value.checkInTime &&
      value.checkOutTime &&
      timeToMinutes(value.checkOutTime) <= timeToMinutes(value.checkInTime)
    ) {
      ctx.addIssue({ code: "custom", path: ["checkOutTime"], message: "v.checkOutTimeBeforeCheckIn" });
    }
  });
export type AccommodationInput = z.infer<typeof accommodationInputSchema>;

// ─── Agenda ──────────────────────────────────────────────────────────────────

export const agendaItemInputSchema = z
  .object({
    title: z.string({ error: "v.titleRequired" }).trim().min(1, "v.titleRequired").max(120, msg("v.tooLong", 120)),
    date: isoDateSchema,
    startTime: timeSchema,
    durationMinutes: z.coerce
      .number({ error: "v.durationRequired" })
      .int("v.durationInteger")
      .min(5, "v.durationMin")
      .max(MINUTES_PER_DAY, "v.durationMax"),
    location: optionalText(160),
    category: z.enum(AGENDA_CATEGORIES).default("OTHER"),
    notes: optionalText(1000),
    placeId: optionalUuid,
    clientRequestId: optionalUuid,
  })
  .superRefine((value, ctx) => {
    if (!isTime(value.startTime)) return;
    if (timeToMinutes(value.startTime) + value.durationMinutes > MINUTES_PER_DAY) {
      ctx.addIssue({ code: "custom", path: ["durationMinutes"], message: "v.endAfterMidnight" });
    }
  });
export type AgendaItemInput = z.infer<typeof agendaItemInputSchema>;

/** Teil-Update: verschieben / Uhrzeit ändern / bearbeiten */
export const agendaItemUpdateSchema = agendaItemInputSchema;

/** Thementour als Tagesprogramm übernehmen */
export const applyJourneySchema = z.object({
  journeySlug: z.string().regex(/^[a-z0-9-]{1,60}$/, "v.idInvalid"),
  date: isoDateSchema,
  startTime: timeSchema,
  /** Puffer zwischen den Stationen (Weg, Pause) */
  bufferMinutes: z.coerce.number().int().min(0).max(120).default(15),
  /**
   * Optional: eigene Auswahl und Reihenfolge der Stationen mit angepasster Dauer.
   * Ohne Angabe werden alle Stationen in der kuratierten Reihenfolge übernommen.
   */
  stops: z
    .array(
      z.object({
        stopId: uuidSchema,
        durationMinutes: z.coerce.number().int().min(5, "v.durationMin").max(600, "v.durationMax"),
      }),
    )
    .min(1, "v.journeyNoStops")
    .max(30)
    .refine((list) => new Set(list.map((s) => s.stopId)).size === list.length, "v.invalidRequest")
    .optional(),
  clientRequestId: optionalUuid,
});
export type ApplyJourneyInput = z.infer<typeof applyJourneySchema>;

// ─── Favoriten ───────────────────────────────────────────────────────────────

export const favoriteTargetSchema = z.union(
  [
    z.object({ placeId: uuidSchema, accommodationId: z.undefined().optional() }),
    z.object({ accommodationId: uuidSchema, placeId: z.undefined().optional() }),
  ],
  { error: "v.favoriteTarget" },
);
export type FavoriteTarget = z.infer<typeof favoriteTargetSchema>;

export const idSchema = uuidSchema;

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

export type FieldErrors = Record<string, string>;

/** Zod-Fehler → { feld: erster Meldungsschlüssel } für Formulare. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
