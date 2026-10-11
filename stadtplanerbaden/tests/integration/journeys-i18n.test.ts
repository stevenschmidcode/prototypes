import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { applyJourneyToTrip, createAgendaItem } from "@/server/services/agenda";
import { getJourneyBySlug, getPlaceBySlug, listCategories, listJourneys, listPlaces } from "@/server/services/catalog";
import { createTrip, getTrip, listTrips, updateTrip } from "@/server/services/trips";
import { createVisitor, generateToken } from "@/server/services/visitor";

const createdVisitors: string[] = [];
async function newVisitor() {
  const visitor = await createVisitor(generateToken());
  createdVisitors.push(visitor.id);
  return visitor;
}
const weekend = { name: "Kulturwochenende", startDate: "2026-10-16", endDate: "2026-10-18" };

afterAll(async () => {
  await db.visitorSession.deleteMany({ where: { id: { in: createdVisitors } } });
  await db.$disconnect();
});

describe("Mehrsprachige Inhalte", () => {
  it("liefert Orte auf Englisch und fällt sonst auf Deutsch zurück", async () => {
    const de = await getPlaceBySlug("historische-altstadt-baden", "de");
    const en = await getPlaceBySlug("historische-altstadt-baden", "en");
    expect(de.name).toBe("Historische Altstadt Baden");
    expect(en.name).toBe("Baden Old Town");
    expect(en.description).not.toBe(de.description);
    expect(en.category.name).toBe("Explore");
    expect(de.category.name).toBe("Entdecken");
  });

  it("übersetzt Kategorien und durchsucht englische Texte", async () => {
    expect((await listCategories("en")).map((c) => c.name)).toContain("Food & drink");
    const results = await listPlaces({ query: "wooden bridge", locale: "en" });
    expect(results.map((p) => p.slug)).toContain("holzbruecke-baden");
  });
});

describe("Thementouren", () => {
  it("listet alle Touren mit Stationen und Gesamtdauer", async () => {
    const journeys = await listJourneys("de");
    expect(journeys.map((j) => j.slug)).toEqual([
      "mittelalter-geschichte",
      "wellness-thermalwasser",
      "coffee-lover",
      "kunst-kultur",
      "natur-aussicht",
      "familie",
    ]);
    for (const journey of journeys) {
      expect(journey.stopCount).toBeGreaterThanOrEqual(4);
      expect(journey.totalMinutes).toBeGreaterThan(0);
    }
  });

  it("liefert eine Tour mit geordneten, übersetzten Stationen", async () => {
    const de = await getJourneyBySlug("mittelalter-geschichte", "de");
    const en = await getJourneyBySlug("mittelalter-geschichte", "en");
    expect(de.title).toBe("Mittelalter & Geschichte");
    expect(en.title).toBe("Middle Ages & History");
    expect(de.stops.map((s) => s.position)).toEqual([...de.stops.keys()]);
    expect(de.stops[0].place.slug).toBe("ruine-stein");
    expect(en.stops[0].note).toContain("Stein Castle");
    expect(en.stops[0].place.name).not.toBe(de.stops[0].place.name);
  });

  it("meldet unbekannte Touren als nicht gefunden", async () => {
    await expect(getJourneyBySlug("gibt-es-nicht")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Reiseprofil am Aufenthalt", () => {
  it("speichert und ändert das gewählte Reiseprofil; unbekannte Profile werden ignoriert", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, { ...weekend, journeySlug: "coffee-lover" });
    expect((await getTrip(visitor.id, id)).journeySlug).toBe("coffee-lover");
    await updateTrip(visitor.id, id, { ...weekend, journeySlug: "kunst-kultur" });
    expect((await listTrips(visitor.id))[0].journeySlug).toBe("kunst-kultur");
    await updateTrip(visitor.id, id, { ...weekend, journeySlug: "gibt-es-nicht" });
    expect((await getTrip(visitor.id, id)).journeySlug).toBeNull();
  });
});

describe("Tour als Tagesprogramm übernehmen", () => {
  it("legt alle Stationen nacheinander mit Puffer an", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const journey = await getJourneyBySlug("wellness-thermalwasser", "de");

    const result = await applyJourneyToTrip(visitor.id, id, {
      journeySlug: "wellness-thermalwasser",
      date: "2026-10-17",
      startTime: "10:00",
      bufferMinutes: 15,
    });
    expect(result).toMatchObject({ created: journey.stops.length, total: journey.stops.length, date: "2026-10-17", conflicts: 0 });

    const agenda = (await getTrip(visitor.id, id)).agenda;
    expect(agenda.map((i) => i.place?.slug)).toEqual(journey.stops.map((s) => s.place.slug));
    let expectedStart = 600;
    for (const [index, item] of agenda.entries()) {
      expect(item.startMinutes).toBe(expectedStart);
      expect(item.durationMinutes).toBe(journey.stops[index].durationMinutes);
      expect(item.notes).toBe(journey.stops[index].note);
      expectedStart += item.durationMinutes + 15;
    }
  });

  it("übernimmt Titel und Notizen in der gewählten Sprache", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await applyJourneyToTrip(visitor.id, id, { journeySlug: "familie", date: "2026-10-16", startTime: "09:00" }, "en");
    const agenda = (await getTrip(visitor.id, id, "en")).agenda;
    expect(agenda[0].title).toMatch(/Children/);
    expect(agenda[0].notes).toMatch(/childhood/);
  });

  it("lässt Stationen weg, die nach Mitternacht enden würden, und meldet Konflikte", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await createAgendaItem(visitor.id, id, { title: "Spätes Abendessen", date: "2026-10-16", startTime: "22:15", durationMinutes: 60 });
    const result = await applyJourneyToTrip(visitor.id, id, {
      journeySlug: "coffee-lover",
      date: "2026-10-16",
      startTime: "22:00",
      bufferMinutes: 0,
    });
    expect(result.created).toBeGreaterThan(0);
    expect(result.created).toBeLessThan(result.total);
    expect(result.conflicts).toBeGreaterThan(0);
    const latestEnd = Math.max(...(await getTrip(visitor.id, id)).agenda.map((i) => i.startMinutes + i.durationMinutes));
    expect(latestEnd).toBeLessThanOrEqual(24 * 60);
  });

  it("lehnt Startzeiten ab, ab denen keine Station mehr passt", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await expect(
      applyJourneyToTrip(visitor.id, id, { journeySlug: "wellness-thermalwasser", date: "2026-10-16", startTime: "23:50" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("ist idempotent über den Idempotenzschlüssel", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const input = { journeySlug: "natur-aussicht", date: "2026-10-18", startTime: "09:00", clientRequestId: randomUUID() };
    const first = await applyJourneyToTrip(visitor.id, id, input);
    const second = await applyJourneyToTrip(visitor.id, id, input);
    expect(second.created).toBe(first.created);
    expect((await getTrip(visitor.id, id)).agenda).toHaveLength(first.created);
  });

  it("übernimmt eine angepasste Auswahl in eigener Reihenfolge und Dauer", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const journey = await getJourneyBySlug("mittelalter-geschichte", "de");
    const [first, second, third] = journey.stops;
    const result = await applyJourneyToTrip(visitor.id, id, {
      journeySlug: journey.slug,
      date: "2026-10-17",
      startTime: "14:00",
      bufferMinutes: 0,
      stops: [
        { stopId: third.id, durationMinutes: 30 },
        { stopId: first.id, durationMinutes: 20 },
      ],
    });
    expect(result).toMatchObject({ created: 2, total: 2 });
    const agenda = (await getTrip(visitor.id, id)).agenda;
    expect(agenda.map((i) => [i.place?.slug, i.startMinutes, i.durationMinutes])).toEqual([
      [third.place.slug, 14 * 60, 30],
      [first.place.slug, 14 * 60 + 30, 20],
    ]);
    expect(agenda.some((i) => i.place?.slug === second.place.slug)).toBe(false);
  });

  it("lehnt Stationen anderer Touren, Duplikate und leere Auswahl ab", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const history = await getJourneyBySlug("mittelalter-geschichte", "de");
    const coffee = await getJourneyBySlug("coffee-lover", "de");
    const base = { journeySlug: history.slug, date: "2026-10-17", startTime: "10:00" };
    await expect(
      applyJourneyToTrip(visitor.id, id, { ...base, stops: [{ stopId: coffee.stops[0].id, durationMinutes: 30 }] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      applyJourneyToTrip(visitor.id, id, {
        ...base,
        stops: [
          { stopId: history.stops[0].id, durationMinutes: 30 },
          { stopId: history.stops[0].id, durationMinutes: 30 },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(applyJourneyToTrip(visitor.id, id, { ...base, stops: [] })).rejects.toBeInstanceOf(ValidationError);
    expect((await getTrip(visitor.id, id)).agenda).toHaveLength(0);
  });

  it("prüft Reisedaten und Eigentum", async () => {
    const owner = await newVisitor();
    const intruder = await newVisitor();
    const { id } = await createTrip(owner.id, weekend);
    await expect(
      applyJourneyToTrip(owner.id, id, { journeySlug: "familie", date: "2026-10-20", startTime: "10:00" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      applyJourneyToTrip(intruder.id, id, { journeySlug: "familie", date: "2026-10-16", startTime: "10:00" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      applyJourneyToTrip(owner.id, id, { journeySlug: "gibt-es-nicht", date: "2026-10-16", startTime: "10:00" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await getTrip(owner.id, id)).agenda).toHaveLength(0);
  });
});
