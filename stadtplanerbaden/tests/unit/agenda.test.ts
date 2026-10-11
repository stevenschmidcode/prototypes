import { describe, expect, it } from "vitest";
import {
  conflictsWith,
  findConflicts,
  groupByTripDays,
  nextItem,
  overlaps,
  suggestStartMinutes,
  type TimedItem,
} from "@/lib/agenda";

const item = (id: string, date: string, start: string, duration: number): TimedItem => {
  const [h, m] = start.split(":").map(Number);
  return { id, date, startMinutes: h * 60 + m, durationMinutes: duration };
};

describe("Zeitüberschneidungen", () => {
  it("erkennt echte Überlappungen", () => {
    expect(overlaps(item("a", "2026-10-17", "11:00", 120), item("b", "2026-10-17", "12:00", 60))).toBe(true);
    expect(overlaps(item("a", "2026-10-17", "11:00", 120), item("b", "2026-10-17", "11:30", 15))).toBe(true);
  });

  it("wertet direkt anschliessende Termine nicht als Konflikt", () => {
    expect(overlaps(item("a", "2026-10-17", "09:00", 60), item("b", "2026-10-17", "10:00", 60))).toBe(false);
  });

  it("vergleicht nur gleiche Tage – gleiche Uhrzeit an anderem Tag ist kein Konflikt", () => {
    expect(overlaps(item("a", "2026-10-16", "15:00", 60), item("b", "2026-10-17", "15:00", 60))).toBe(false);
  });
});

describe("Agenda-Konflikterkennung", () => {
  it("findet alle Konfliktpaare symmetrisch", () => {
    const items = [
      item("checkin", "2026-10-16", "15:00", 30),
      item("altstadt", "2026-10-16", "16:30", 120),
      item("dinner", "2026-10-16", "18:00", 120), // überschneidet Altstadt
      item("bad", "2026-10-17", "11:00", 180),
      item("museum", "2026-10-17", "13:00", 90), // überschneidet Bad
      item("kaffee", "2026-10-17", "13:30", 30), // überschneidet Bad und Museum
    ];
    const conflicts = findConflicts(items);
    expect(conflicts.has("checkin")).toBe(false);
    expect(conflicts.get("altstadt")).toEqual(["dinner"]);
    expect(conflicts.get("dinner")).toEqual(["altstadt"]);
    expect(new Set(conflicts.get("kaffee"))).toEqual(new Set(["bad", "museum"]));
    expect(new Set(conflicts.get("bad"))).toEqual(new Set(["museum", "kaffee"]));
  });

  it("liefert keine Konflikte für eine leere oder konfliktfreie Agenda", () => {
    expect(findConflicts([]).size).toBe(0);
    expect(findConflicts([item("a", "2026-10-16", "09:00", 60), item("b", "2026-10-16", "10:00", 60)]).size).toBe(0);
  });

  it("prüft einen geplanten Eintrag gegen bestehende und ignoriert sich selbst", () => {
    const existing = [item("a", "2026-10-17", "11:00", 120), item("b", "2026-10-17", "16:00", 60)];
    expect(conflictsWith({ date: "2026-10-17", startMinutes: 12 * 60, durationMinutes: 30 }, existing).map((c) => c.id)).toEqual(["a"]);
    expect(conflictsWith({ id: "a", date: "2026-10-17", startMinutes: 11 * 60, durationMinutes: 120 }, existing)).toEqual([]);
  });
});

describe("Gruppierung nach Reisetagen", () => {
  it("bezieht Einträge auf die tatsächlichen Daten und zeigt leere Tage", () => {
    const { days, outside } = groupByTripDays(
      [item("b", "2026-10-16", "19:00", 60), item("a", "2026-10-16", "15:00", 30), item("x", "2026-10-20", "10:00", 60)],
      "2026-10-16",
      "2026-10-18",
    );
    expect(days.map((d) => d.date)).toEqual(["2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(days[0].items.map((i) => i.id)).toEqual(["a", "b"]); // chronologisch
    expect(days[1].items).toEqual([]);
    expect(outside.map((i) => i.id)).toEqual(["x"]);
  });
});

describe("Nächste Aktivität", () => {
  const agenda = [item("a", "2026-10-16", "15:00", 60), item("b", "2026-10-17", "09:00", 60)];

  it("liefert den laufenden Eintrag", () => {
    expect(nextItem(agenda, "2026-10-16", 15 * 60 + 30)).toEqual({ item: agenda[0], ongoing: true });
  });

  it("liefert den nächsten anstehenden Eintrag, auch am Folgetag", () => {
    expect(nextItem(agenda, "2026-10-16", 17 * 60)).toEqual({ item: agenda[1], ongoing: false });
  });

  it("liefert null, wenn alles vorbei ist", () => {
    expect(nextItem(agenda, "2026-10-18", 0)).toBeNull();
  });
});

describe("Startzeit-Vorschlag", () => {
  it("schlägt 10:00 für einen leeren Tag vor", () => {
    expect(suggestStartMinutes([], "2026-10-16")).toBe(600);
  });
  it("schlägt die nächste Viertelstunde nach dem letzten Termin vor", () => {
    expect(suggestStartMinutes([item("a", "2026-10-16", "14:05", 60)], "2026-10-16")).toBe(15 * 60 + 15);
  });
});
