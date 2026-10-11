import { describe, expect, it } from "vitest";
import {
  accommodationInputSchema,
  agendaItemInputSchema,
  favoriteTargetSchema,
  toFieldErrors,
  tripInputSchema,
} from "@/lib/validation";

const errorsOf = (result: { success: boolean; error?: unknown }) =>
  result.success ? {} : toFieldErrors(result.error as Parameters<typeof toFieldErrors>[0]);

/** Schemas liefern sprachneutrale Meldungsschlüssel; die Texte prüft tests/unit/i18n.test.ts. */
describe("Aufenthalt-Validierung", () => {
  const valid = { name: "Wochenende in Baden", startDate: "2026-10-16", endDate: "2026-10-18" };

  it("akzeptiert gültige Eingaben und trimmt den Namen", () => {
    const result = tripInputSchema.safeParse({ ...valid, name: "  Wochenende in Baden  ", notes: "" });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Wochenende in Baden");
    expect(result.data?.notes).toBeUndefined();
  });

  it("erlaubt Tagesausflüge (Anreise = Abreise)", () => {
    expect(tripInputSchema.safeParse({ ...valid, endDate: "2026-10-16" }).success).toBe(true);
  });

  it("lehnt Abreise vor Anreise mit verständlicher Meldung ab", () => {
    const errors = errorsOf(tripInputSchema.safeParse({ ...valid, endDate: "2026-10-15" }));
    expect(errors.endDate).toBe("v.endBeforeStart");
  });

  it("begrenzt die Dauer auf 60 Tage", () => {
    expect(tripInputSchema.safeParse({ ...valid, endDate: "2026-12-14" }).success).toBe(true);
    expect(errorsOf(tripInputSchema.safeParse({ ...valid, endDate: "2026-12-15" })).endDate).toBe("v.tripTooLong|60");
  });

  it("verlangt einen Namen und gültige Daten", () => {
    const errors = errorsOf(tripInputSchema.safeParse({ name: "   ", startDate: "2026-02-30", endDate: "x" }));
    expect(errors.name).toBeDefined();
    expect(errors.startDate).toBeDefined();
    expect(errors.endDate).toBeDefined();
  });

  it("lehnt einen ungültigen Idempotenzschlüssel ab", () => {
    expect(tripInputSchema.safeParse({ ...valid, clientRequestId: "abc" }).success).toBe(false);
  });
});

describe("Unterkunft-Validierung", () => {
  it("ergänzt https:// bei Website-Adressen", () => {
    const result = accommodationInputSchema.safeParse({ name: "Ferienwohnung", websiteUrl: "www.example.ch" });
    expect(result.data?.websiteUrl).toBe("https://www.example.ch");
  });

  it("lehnt unsichere Protokolle ab", () => {
    expect(accommodationInputSchema.safeParse({ name: "X", websiteUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("prüft Check-out nach Check-in", () => {
    const errors = errorsOf(
      accommodationInputSchema.safeParse({ name: "X", checkInDate: "2026-10-18", checkOutDate: "2026-10-16" }),
    );
    expect(errors.checkOutDate).toBeDefined();
  });

  it("prüft Telefonnummern", () => {
    expect(accommodationInputSchema.safeParse({ name: "X", phone: "+41 56 200 17 17" }).success).toBe(true);
    expect(accommodationInputSchema.safeParse({ name: "X", phone: "ruf mich an" }).success).toBe(false);
  });
});

describe("Agenda-Validierung", () => {
  const valid = { title: "Thermalbad", date: "2026-10-17", startTime: "11:00", durationMinutes: 180 };

  it("akzeptiert einen gültigen Eintrag mit Standardkategorie", () => {
    const result = agendaItemInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.category).toBe("OTHER");
  });

  it("verlangt ein Ende vor Mitternacht", () => {
    expect(errorsOf(agendaItemInputSchema.safeParse({ ...valid, startTime: "23:00", durationMinutes: 120 })).durationMinutes).toBe(
      "v.endAfterMidnight",
    );
    expect(agendaItemInputSchema.safeParse({ ...valid, startTime: "23:00", durationMinutes: 60 }).success).toBe(true);
  });

  it("lehnt ungültige Uhrzeiten, Dauern und Kategorien ab", () => {
    expect(agendaItemInputSchema.safeParse({ ...valid, startTime: "25:00" }).success).toBe(false);
    expect(agendaItemInputSchema.safeParse({ ...valid, durationMinutes: 0 }).success).toBe(false);
    expect(agendaItemInputSchema.safeParse({ ...valid, category: "PARTY" }).success).toBe(false);
  });
});

describe("Favoriten-Ziel", () => {
  it("verlangt genau einen Ort oder eine Unterkunft", () => {
    const id = "6f1c4c1e-8f5e-4a54-9d4a-1f7f8b0c2a11";
    expect(favoriteTargetSchema.safeParse({ placeId: id }).success).toBe(true);
    expect(favoriteTargetSchema.safeParse({ accommodationId: id }).success).toBe(true);
    expect(favoriteTargetSchema.safeParse({}).success).toBe(false);
    expect(favoriteTargetSchema.safeParse({ placeId: id, accommodationId: id }).success).toBe(false);
    expect(favoriteTargetSchema.safeParse({ placeId: "1 OR 1=1" }).success).toBe(false);
  });
});
