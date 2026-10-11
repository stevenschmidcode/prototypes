import type { Locale } from "../config";
import de, { type Dictionary } from "./de";
import en from "./en";

const dictionaries: Record<Locale, Dictionary> = { de, en };

export function getDictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
