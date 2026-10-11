import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { getDictionaryFor } from "./dictionaries";

/**
 * Aktuelle Sprache in Server Components (aus dem Root-Parameter [lang]).
 * Nicht in Server Actions oder Route Handlers verfügbar – dort wird die Sprache übergeben.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Wörterbuch und Sprache für Server Components */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionaryFor(locale) };
}
