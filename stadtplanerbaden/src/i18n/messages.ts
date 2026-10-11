import { formatDateShort, isIsoDate } from "@/lib/dates";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/de";

/** Ersetzt {name}-Platzhalter: fmt("Hallo {name}", { name: "Baden" }) */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Singular/Plural: plural({ one: "Ort", other: "Orte" }, 3) → "Orte" */
export function plural(forms: { one: string; other: string }, count: number): string {
  return count === 1 ? forms.one : forms.other;
}

/** «3 Orte» / «1 place» */
export function countLabel(forms: { one: string; other: string }, count: number): string {
  return `${count} ${plural(forms, count)}`;
}

/**
 * Übersetzt einen Meldungsschlüssel aus Validierung oder Server ("v.tooLong|80")
 * in die aktuelle Sprache. ISO-Daten in Parametern werden lokal formatiert.
 * Unbekannte Texte werden unverändert zurückgegeben.
 */
export function translateMessage(dict: Dictionary, locale: Locale, message: string | undefined): string {
  if (!message) return "";
  const [key, ...params] = message.split("|");
  const template = dict.messages[key];
  if (!template) return message;
  return template.replace(/\{(\d+)\}/g, (_, index: string) => {
    const value = params[Number(index)] ?? "";
    return isIsoDate(value) ? formatDateShort(value, locale) : value;
  });
}

/** Anführungszeichen der Sprache: «…» (de-CH) bzw. “…” (en) */
export function quote(locale: Locale, text: string): string {
  return locale === "de" ? `«${text}»` : `“${text}”`;
}
