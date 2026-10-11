import { describe, expect, it } from "vitest";
import {
  addDays,
  dbDateToIso,
  diffInDays,
  eachDay,
  formatDateRange,
  formatDuration,
  isIsoDate,
  isoToDbDate,
  minutesToTime,
  nightsBetween,
  nowMinutesInZurich,
  relativeDayLabel,
  timeToMinutes,
  todayInZurich,
  tripStatus,
} from "@/lib/dates";

describe("Datumsvalidierung", () => {
  it("akzeptiert gültige Kalenderdaten", () => {
    expect(isIsoDate("2026-10-16")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true); // Schaltjahr
  });

  it("lehnt ungültige Daten und Formate ab", () => {
    expect(isIsoDate("2026-02-29")).toBe(false); // kein Schaltjahr
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
    expect(isIsoDate("16.10.2026")).toBe(false);
    expect(isIsoDate("2026-10-16T00:00:00Z")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});

describe("Reisezeitraum", () => {
  it("liefert alle Tage inklusive An- und Abreisetag", () => {
    expect(eachDay("2026-10-16", "2026-10-18")).toEqual(["2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(eachDay("2026-10-16", "2026-10-16")).toEqual(["2026-10-16"]);
    expect(eachDay("2026-10-18", "2026-10-16")).toEqual([]);
  });

  it("rechnet über Monats-, Jahres- und Sommerzeitgrenzen korrekt", () => {
    // Ende der Sommerzeit in der Schweiz: 25.10.2026
    expect(eachDay("2026-10-24", "2026-10-26")).toHaveLength(3);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30"); // Beginn Sommerzeit 29.3.
    expect(diffInDays("2026-10-16", "2026-10-18")).toBe(2);
    expect(nightsBetween("2026-10-16", "2026-10-18")).toBe(2);
  });

  it("wandelt DB-Daten ohne Zeitzonenverschiebung um", () => {
    const date = isoToDbDate("2026-10-16");
    expect(date.toISOString()).toBe("2026-10-16T00:00:00.000Z");
    expect(dbDateToIso(date)).toBe("2026-10-16");
  });

  it("bestimmt den Status eines Aufenthalts", () => {
    const trip = { startDate: "2026-10-16", endDate: "2026-10-18" };
    expect(tripStatus(trip, "2026-10-15")).toBe("upcoming");
    expect(tripStatus(trip, "2026-10-16")).toBe("current");
    expect(tripStatus(trip, "2026-10-18")).toBe("current");
    expect(tripStatus(trip, "2026-10-19")).toBe("past");
  });

  it("formatiert Zeiträume schweizerisch", () => {
    expect(formatDateRange("2026-10-16", "2026-10-18")).toBe("16.–18. Oktober 2026");
    expect(formatDateRange("2026-09-30", "2026-10-02")).toBe("30. September – 2. Oktober 2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("30. Dezember 2026 – 2. Januar 2027");
  });

  it("beschreibt relative Tage", () => {
    expect(relativeDayLabel("2026-10-08", "2026-10-08")).toBe("Heute");
    expect(relativeDayLabel("2026-10-09", "2026-10-08")).toBe("Morgen");
    expect(relativeDayLabel("2026-10-16", "2026-10-08")).toBe("In 8 Tagen");
  });
});

describe("Zeitzone Europe/Zurich", () => {
  it("liefert den Schweizer Kalendertag, auch wenn UTC noch beim Vortag ist", () => {
    // 23:30 UTC am 15.10. = 01:30 in Zürich am 16.10. (Sommerzeit, UTC+2)
    expect(todayInZurich(new Date("2026-10-15T23:30:00Z"))).toBe("2026-10-16");
    expect(nowMinutesInZurich(new Date("2026-10-15T23:30:00Z"))).toBe(90);
    // Winterzeit (UTC+1)
    expect(todayInZurich(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});

describe("Uhrzeiten", () => {
  it("wandelt zwischen HH:mm und Minuten um", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("16:30")).toBe(990);
    expect(minutesToTime(990)).toBe("16:30");
    expect(() => timeToMinutes("24:00")).toThrow();
    expect(() => timeToMinutes("9:5")).toThrow();
  });

  it("formatiert Dauern lesbar", () => {
    expect(formatDuration(45)).toBe("45 Min.");
    expect(formatDuration(60)).toBe("1 Std.");
    expect(formatDuration(150)).toBe("2 Std. 30 Min.");
  });
});
