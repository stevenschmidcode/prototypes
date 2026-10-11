"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localizePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/de";
import { translateMessage } from "./messages";

type I18nContextValue = {
  locale: Locale;
  t: Dictionary;
  /** Interner Pfad → URL in der aktuellen Sprache */
  href: (path: string) => string;
  /** Meldungsschlüssel (Validierung/Server) → Text */
  message: (key: string | undefined) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: dict,
      href: (path) => localizePath(locale, path),
      message: (key) => translateMessage(dict, locale, key),
    }),
    [locale, dict],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n muss innerhalb des I18nProvider verwendet werden.");
  return context;
}
