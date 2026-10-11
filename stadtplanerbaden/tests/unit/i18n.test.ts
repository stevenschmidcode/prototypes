import { describe, expect, it } from "vitest";
import { localizePath, splitLocale } from "@/i18n/config";
import de from "@/i18n/dictionaries/de";
import en from "@/i18n/dictionaries/en";
import { countLabel, fmt, plural, quote, translateMessage } from "@/i18n/messages";
import { formatDateLong, formatDateRange, formatDuration, relativeDayLabel } from "@/lib/dates";
import { routeUrl } from "@/lib/maps";
import { tripInputSchema, toFieldErrors } from "@/lib/validation";

/** Alle Schlüsselpfade eines (verschachtelten) Wörterbuchs */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`, ...value.flatMap((v, i) => keyPaths(v, `${prefix}[${i}]`))];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) => keyPaths(v, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("Wörterbücher", () => {
  it("haben in Deutsch und Englisch exakt dieselben Schlüssel (auch Listenlängen)", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(de).sort());
  });

  it("verwenden dieselben Platzhalter in beiden Sprachen", () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(",");
    const flat = (dict: unknown) => {
      const out = new Map<string, string>();
      const walk = (v: unknown, p: string) => {
        if (typeof v === "string") out.set(p, v);
        else if (v && typeof v === "object") for (const [k, c] of Object.entries(v)) walk(c, `${p}.${k}`);
      };
      walk(dict, "");
      return out;
    };
    const deFlat = flat(de);
    for (const [key, text] of flat(en)) {
      expect(placeholders(text), key).toBe(placeholders(deFlat.get(key) ?? ""));
    }
  });

  it("enthalten keine leeren Texte und kein «ß» im Schweizer Deutsch", () => {
    const texts: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") texts.push(v);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(de);
    expect(texts.every((t) => t.trim().length > 0)).toBe(true);
    expect(texts.filter((t) => t.includes("ß"))).toEqual([]);
  });
});

describe("Meldungen", () => {
  it("übersetzt Validierungsschlüssel in beide Sprachen", () => {
    const parsed = tripInputSchema.safeParse({ name: "X", startDate: "2026-10-18", endDate: "2026-10-16" });
    const key = parsed.success ? "" : toFieldErrors(parsed.error).endDate;
    expect(translateMessage(de, "de", key)).toBe("Die Abreise kann nicht vor der Anreise liegen.");
    expect(translateMessage(en, "en", key)).toBe("Departure can't be before arrival.");
  });

  it("setzt Parameter ein und formatiert ISO-Daten lokal", () => {
    expect(translateMessage(de, "de", "v.tripTooLong|60")).toBe("Ein Aufenthalt kann höchstens 60 Tage dauern.");
    expect(translateMessage(en, "en", "v.dateOutsideTrip|2026-10-16|2026-10-18")).toBe(
      "Please choose a date within your stay (Fri 16 Oct – Sun 18 Oct).",
    );
  });

  it("gibt unbekannte Texte unverändert zurück", () => {
    expect(translateMessage(de, "de", "Irgendein Text")).toBe("Irgendein Text");
    expect(translateMessage(de, "de", undefined)).toBe("");
  });

  it("ersetzt Platzhalter, Pluralformen und Anführungszeichen", () => {
    expect(fmt("Tag {day} von {total}", { day: 2, total: 3 })).toBe("Tag 2 von 3");
    expect(fmt("{unbekannt}", {})).toBe("{unbekannt}");
    expect(plural(en.common.places, 1)).toBe("place");
    expect(countLabel(de.common.places, 3)).toBe("3 Orte");
    expect(quote("de", "Baden")).toBe("«Baden»");
    expect(quote("en", "Baden")).toBe("“Baden”");
  });
});

describe("Sprach-URLs", () => {
  it("Deutsch ohne Präfix, Englisch unter /en", () => {
    expect(localizePath("de", "/entdecken")).toBe("/entdecken");
    expect(localizePath("en", "/entdecken")).toBe("/en/entdecken");
    expect(localizePath("en", "/")).toBe("/en");
    expect(localizePath("en", "entdecken?q=bad")).toBe("/en/entdecken?q=bad");
  });

  it("zerlegt öffentliche Pfade in Sprache und Pfad", () => {
    expect(splitLocale("/en/touren/coffee-lover")).toEqual({ locale: "en", path: "/touren/coffee-lover" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/touren")).toEqual({ locale: "de", path: "/touren" });
    // «/entdecken» beginnt mit «en», ist aber kein Sprachpräfix
    expect(splitLocale("/entdecken")).toEqual({ locale: "de", path: "/entdecken" });
  });
});

describe("Formatierung auf Englisch", () => {
  it("formatiert Daten, Zeiträume und Dauern britisch", () => {
    expect(formatDateLong("2026-10-16", "en")).toBe("Friday, 16 October 2026");
    expect(formatDateRange("2026-10-16", "2026-10-18", "en")).toBe("16–18 October 2026");
    expect(formatDateRange("2026-09-30", "2026-10-02", "en")).toBe("30 September – 2 October 2026");
    expect(formatDuration(90, "en")).toBe("1 hr 30 min");
    expect(relativeDayLabel("2026-10-09", "2026-10-08", "en")).toBe("Tomorrow");
  });
});

describe("Tour-Route", () => {
  it("baut eine Fussweg-Route mit Zwischenstopps", () => {
    const url = routeUrl([
      { name: "A", address: null, coordinates: { latitude: 47.1, longitude: 8.1 } },
      { name: "B", address: "Weg 1, 5400 Baden", coordinates: null },
      { name: "C", address: null, coordinates: { latitude: 47.3, longitude: 8.3 } },
    ]);
    const params = new URL(url!).searchParams;
    expect(params.get("origin")).toBe("47.1,8.1");
    expect(params.get("destination")).toBe("47.3,8.3");
    expect(params.get("waypoints")).toBe("B, Weg 1, 5400 Baden");
    expect(params.get("travelmode")).toBe("walking");
    expect(routeUrl([{ name: "A", address: null, coordinates: null }])).toBeNull();
  });
});
