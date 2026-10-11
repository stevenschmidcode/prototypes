/**
 * Sprachen von baden.
 *
 * - Deutsch (Schweiz) ist die Standardsprache und läuft ohne URL-Präfix: /entdecken
 * - Englisch läuft unter /en: /en/entdecken
 * Intern liegen alle Seiten unter app/[lang]; der Proxy schreibt unpräfixierte
 * Pfade auf /de um.
 */
export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

/** Formatierungs-Locale für Intl (Datum, Zahlen) */
export const INTL_LOCALE: Record<Locale, string> = {
  de: "de-CH",
  en: "en-GB",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Interner Pfad → öffentliche URL der Sprache. localizePath("en", "/entdecken") → "/en/entdecken" */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Öffentliche URL → { locale, path ohne Präfix } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

