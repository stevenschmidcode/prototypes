import { describe, expect, it } from "vitest";
import { ceilToQuarter, findFreeSlots, recommendForSlot, scheduleStops, type Candidate } from "@/lib/recommendations";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

describe("Tourstationen planen", () => {
  const stops = [
    { id: "a", durationMinutes: 60, included: true },
    { id: "b", durationMinutes: 30, included: false },
    { id: "c", durationMinutes: 45, included: true },
  ];

  it("plant eingeschlossene Stationen mit Puffer und überspringt ausgelassene", () => {
    expect(scheduleStops(stops, h(10), 15).map((s) => s.start)).toEqual([h(10), null, h(11, 15)]);
  });

  it("lässt Stationen nach Mitternacht weg – auch alle folgenden", () => {
    const late = scheduleStops(
      [
        { id: "a", durationMinutes: 60, included: true },
        { id: "b", durationMinutes: 90, included: true },
        { id: "c", durationMinutes: 10, included: true },
      ],
      h(22, 30),
      0,
    );
    expect(late.map((s) => s.start)).toEqual([h(22, 30), null, null]);
  });
});

describe("Freie Zeit finden", () => {
  const busy = [
    { startMinutes: h(10), durationMinutes: 60 },
    { startMinutes: h(15), durationMinutes: 120 },
  ];

  it("findet Lücken im Tagesfenster 09–21 Uhr (ab 60 Min.)", () => {
    expect(findFreeSlots(busy, { minMinutes: 90 })).toEqual([
      { start: h(11), end: h(15) },
      { start: h(17), end: h(21) },
    ]);
    expect(findFreeSlots(busy, { minMinutes: 60 })).toEqual([
      { start: h(9), end: h(10) },
      { start: h(11), end: h(15) },
      { start: h(17), end: h(21) },
    ]);
  });

  it("ignoriert zu kurze Lücken und überlappende Termine", () => {
    const overlapping = [
      { startMinutes: h(9), durationMinutes: 120 },
      { startMinutes: h(10), durationMinutes: 60 },
      { startMinutes: h(11, 30), durationMinutes: 570 },
    ];
    expect(findFreeSlots(overlapping)).toEqual([]);
  });

  it("liefert einen ganzen freien Tag und beginnt heute erst ab jetzt", () => {
    expect(findFreeSlots([])).toEqual([{ start: h(9), end: h(21) }]);
    expect(findFreeSlots([], { notBefore: h(13, 7) })).toEqual([{ start: h(13, 15), end: h(21) }]);
    expect(findFreeSlots([], { notBefore: h(20, 30) })).toEqual([]);
  });

  it("rundet auf die nächste Viertelstunde", () => {
    expect(ceilToQuarter(h(13, 1))).toBe(h(13, 15));
    expect(ceilToQuarter(h(13))).toBe(h(13));
  });
});

describe("Empfehlungen", () => {
  const places: Candidate[] = [
    { id: "museum", kind: "MUSEUM", categorySlug: "kultur", durationMinutes: 90, rainSuitable: true },
    { id: "ruine", kind: "SIGHT", categorySlug: "entdecken", durationMinutes: 45, rainSuitable: false },
    { id: "restaurant", kind: "RESTAURANT", categorySlug: "essen-trinken", durationMinutes: 75, rainSuitable: true },
    { id: "cafe", kind: "CAFE", categorySlug: "essen-trinken", durationMinutes: 45, rainSuitable: true },
    { id: "fest", kind: "EVENT", categorySlug: "veranstaltungen", durationMinutes: 60, rainSuitable: false },
    { id: "therme", kind: "WELLNESS", categorySlug: "wellness", durationMinutes: 180, rainSuitable: true },
  ];
  const ids = (list: { place: Candidate }[]) => list.map((r) => r.place.id);

  it("schlägt nur vor, was in die Lücke passt – ohne Veranstaltungen und bereits Geplantes", () => {
    const result = recommendForSlot(places, { start: h(9), end: h(10, 30) }, { plannedPlaceIds: new Set(["museum"]), limit: 10 });
    expect(ids(result)).not.toContain("therme"); // zu lang
    expect(ids(result)).not.toContain("fest"); // Veranstaltung
    expect(ids(result)).not.toContain("museum"); // schon geplant
    expect(ids(result)).toContain("ruine");
  });

  it("bevorzugt zur Mittagszeit Restaurants und plant sie um 12 Uhr", () => {
    const [first] = recommendForSlot(places, { start: h(11), end: h(14) });
    expect(first.place.id).toBe("restaurant");
    expect(first.start).toBe(h(12));
    expect(first.reasons).toContain("lunch");
  });

  it("schlägt kein Mittagessen vor, wenn schon eines geplant ist, und stellt Restaurants zurück", () => {
    const result = recommendForSlot(places, { start: h(11), end: h(14) }, { hasLunch: true });
    expect(result[0].place.id).not.toBe("restaurant");
    expect(result.every((r) => !r.reasons.includes("lunch"))).toBe(true);
  });

  it("empfiehlt am Nachmittag eine Kaffeepause", () => {
    const result = recommendForSlot(places, { start: h(14, 30), end: h(16, 30) }, { limit: 10 });
    const cafe = result.find((r) => r.place.id === "cafe");
    expect(cafe?.reasons).toContain("coffee");
    expect(cafe?.start).toBe(h(14, 45));
  });

  it("filtert bei Regen und gewichtet das Reiseprofil", () => {
    const rainy = recommendForSlot(places, { start: h(9), end: h(21) }, { rainy: true, limit: 10 });
    expect(ids(rainy)).not.toContain("ruine");
    expect(rainy.every((r) => r.place.rainSuitable)).toBe(true);

    const profile = recommendForSlot(places, { start: h(15), end: h(18) }, { profilePlaceIds: new Set(["therme"]) });
    expect(profile[0].place.id).toBe("therme");
    expect(profile[0].reasons).toContain("profile");
  });

  it("wählt die Startzeit so, dass der Ort sicher in die Lücke passt", () => {
    const result = recommendForSlot(places, { start: h(19), end: h(20, 30) }, { limit: 10 });
    for (const r of result) expect(r.start + r.durationMinutes).toBeLessThanOrEqual(h(20, 30));
  });
});

describe("Abwechslung", () => {
  it("zeigt zuerst verschiedene Arten statt dreimal dasselbe", () => {
    const restaurants: Candidate[] = ["a", "b", "c"].map((id) => ({
      id,
      kind: "RESTAURANT",
      categorySlug: "essen-trinken",
      durationMinutes: 75,
      rainSuitable: true,
    }));
    const others: Candidate[] = [
      { id: "museum", kind: "MUSEUM", categorySlug: "kultur", durationMinutes: 90, rainSuitable: true },
      { id: "park", kind: "NATURE", categorySlug: "natur", durationMinutes: 30, rainSuitable: false },
    ];
    const result = recommendForSlot([...restaurants, ...others], { start: 11 * 60, end: 21 * 60 });
    expect(result.map((r) => r.place.kind)).toEqual(["RESTAURANT", "MUSEUM", "NATURE"]);
  });

  it("füllt mit gleichen Arten auf, wenn nichts anderes passt", () => {
    const only: Candidate[] = ["a", "b"].map((id) => ({ id, kind: "CAFE", categorySlug: "essen-trinken", durationMinutes: 30, rainSuitable: true }));
    expect(recommendForSlot(only, { start: 9 * 60, end: 10 * 60 })).toHaveLength(2);
  });
});
