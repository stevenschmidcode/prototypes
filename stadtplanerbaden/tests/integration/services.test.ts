import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/errors";
import { removeTripAccommodation, saveTripAccommodation } from "@/server/services/accommodation";
import { createAgendaItem, deleteAgendaItem, updateAgendaItem } from "@/server/services/agenda";
import { listAccommodations, listPlaces } from "@/server/services/catalog";
import { addFavorite, getFavoriteIds, listFavorites, removeFavorite } from "@/server/services/favorites";
import {
  countItemsOutsideRange,
  createTrip,
  deleteTrip,
  getLastActiveTripId,
  getTrip,
  listTrips,
  updateTrip,
} from "@/server/services/trips";
import {
  createVisitor,
  deleteVisitor,
  exportVisitorData,
  findVisitorByToken,
  generateToken,
  hashToken,
} from "@/server/services/visitor";

const createdVisitors: string[] = [];

async function newVisitor() {
  const token = generateToken();
  const visitor = await createVisitor(token);
  createdVisitors.push(visitor.id);
  return { ...visitor, token };
}

const weekend = { name: "Wochenende in Baden", startDate: "2026-10-16", endDate: "2026-10-18" };

let placeId: string;
let secondPlaceId: string;
let accommodationId: string;

beforeAll(async () => {
  const places = await listPlaces();
  placeId = places.find((p) => p.slug === "thermalbad-fortyseven")!.id;
  secondPlaceId = places.find((p) => p.slug === "museum-langmatt")!.id;
  accommodationId = (await listAccommodations())[0].id;
});

afterAll(async () => {
  await db.visitorSession.deleteMany({ where: { id: { in: createdVisitors } } });
  await db.$disconnect();
});

describe("Gast-Sessions", () => {
  it("speichert nur den Hash des Tokens und findet den Gast wieder", async () => {
    const visitor = await newVisitor();
    const row = await db.visitorSession.findUniqueOrThrow({ where: { id: visitor.id } });
    expect(row.tokenHash).toBe(hashToken(visitor.token));
    expect(row.tokenHash).not.toContain(visitor.token);
    expect(await findVisitorByToken(visitor.token)).toEqual({ id: visitor.id });
  });

  it("ignoriert unbekannte, manipulierte und abgelaufene Tokens", async () => {
    expect(await findVisitorByToken(generateToken())).toBeNull();
    expect(await findVisitorByToken("' OR 1=1 --")).toBeNull();
    const visitor = await newVisitor();
    await db.visitorSession.update({ where: { id: visitor.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findVisitorByToken(visitor.token)).toBeNull();
  });
});

describe("Aufenthalt", () => {
  it("erstellt einen Aufenthalt und liest ihn wieder", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, { ...weekend, notes: "Mit Familie" });
    const trip = await getTrip(visitor.id, id);
    expect(trip).toMatchObject({ ...weekend, notes: "Mit Familie", agenda: [], accommodation: null });
    expect(await getLastActiveTripId(visitor.id)).toBe(id);
  });

  it("verhindert doppelte Speichervorgänge über den Idempotenzschlüssel", async () => {
    const visitor = await newVisitor();
    const clientRequestId = randomUUID();
    const [a, b] = await Promise.all([
      createTrip(visitor.id, { ...weekend, clientRequestId }),
      createTrip(visitor.id, { ...weekend, clientRequestId }),
    ]);
    expect(a.id).toBe(b.id);
    expect(await listTrips(visitor.id)).toHaveLength(1);
  });

  it("validiert serverseitig (Abreise vor Anreise)", async () => {
    const visitor = await newVisitor();
    await expect(createTrip(visitor.id, { ...weekend, endDate: "2026-10-15" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("bearbeitet einen Aufenthalt und meldet Einträge ausserhalb des neuen Zeitraums", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await createAgendaItem(visitor.id, id, { title: "Brunch", date: "2026-10-18", startTime: "10:00", durationMinutes: 90 });
    expect(await countItemsOutsideRange(visitor.id, id, "2026-10-16", "2026-10-17")).toBe(1);

    await updateTrip(visitor.id, id, { ...weekend, name: "Langes Wochenende", endDate: "2026-10-17" });
    const trip = await getTrip(visitor.id, id);
    expect(trip.name).toBe("Langes Wochenende");
    expect(trip.endDate).toBe("2026-10-17");
    expect(trip.agenda).toHaveLength(1); // Eintrag bleibt erhalten
  });
});

describe("Unterkunft", () => {
  it("speichert eine Katalog-Unterkunft und ergänzt Katalogangaben", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const saved = await saveTripAccommodation(visitor.id, id, {
      accommodationId,
      name: "Mein Hotel",
      checkInDate: "2026-10-16",
      checkInTime: "15:00",
      checkOutDate: "2026-10-18",
      checkOutTime: "11:00",
      notes: "Zimmer 12",
    });
    expect(saved.accommodationId).toBe(accommodationId);
    expect(saved.address.street).toBeTruthy();
    expect(saved.checkInTime).toBe("15:00");
    expect((await getTrip(visitor.id, id)).accommodation?.notes).toBe("Zimmer 12");
  });

  it("speichert eine manuell erfasste Unterkunft und ersetzt die bestehende", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await saveTripAccommodation(visitor.id, id, { accommodationId, name: "Hotel" });
    const manual = await saveTripAccommodation(visitor.id, id, {
      type: "APARTMENT",
      name: "Ferienwohnung Limmat",
      street: "Musterweg 1",
      postalCode: "5400",
      locality: "Baden",
      websiteUrl: "fewo.example.ch",
    });
    expect(manual).toMatchObject({ accommodationId: null, type: "APARTMENT", websiteUrl: "https://fewo.example.ch" });
    expect(await db.tripAccommodation.count({ where: { tripId: id } })).toBe(1);

    await removeTripAccommodation(visitor.id, id);
    expect((await getTrip(visitor.id, id)).accommodation).toBeNull();
  });

  it("lehnt unbekannte Katalog-IDs ab", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await expect(saveTripAccommodation(visitor.id, id, { accommodationId: randomUUID(), name: "X" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("Agenda", () => {
  it("erstellt Einträge, erkennt Konflikte ohne zu blockieren", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const bath = await createAgendaItem(visitor.id, id, {
      title: "Thermalbad",
      date: "2026-10-17",
      startTime: "11:00",
      durationMinutes: 180,
      category: "WELLNESS",
      placeId,
    });
    expect(bath.conflicts).toEqual([]);
    expect(bath.item.place?.id).toBe(placeId);

    const museum = await createAgendaItem(visitor.id, id, {
      title: "Museum",
      date: "2026-10-17",
      startTime: "13:00",
      durationMinutes: 90,
      placeId: secondPlaceId,
    });
    expect(museum.conflicts.map((c) => c.title)).toEqual(["Thermalbad"]);
    expect((await getTrip(visitor.id, id)).agenda).toHaveLength(2);
  });

  it("verschiebt einen Eintrag auf einen anderen Tag und ändert die Uhrzeit", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const { item } = await createAgendaItem(visitor.id, id, {
      title: "Altstadt entdecken",
      date: "2026-10-16",
      startTime: "16:30",
      durationMinutes: 120,
    });
    const moved = await updateAgendaItem(visitor.id, item.id, {
      title: "Altstadt entdecken",
      date: "2026-10-17",
      startTime: "09:30",
      durationMinutes: 90,
    });
    expect(moved.item).toMatchObject({ date: "2026-10-17", startMinutes: 570, durationMinutes: 90 });
  });

  it("verlangt ein Datum innerhalb des Aufenthalts", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const attempt = createAgendaItem(visitor.id, id, { title: "Zu früh", date: "2026-10-15", startTime: "10:00", durationMinutes: 60 });
    await expect(attempt).rejects.toBeInstanceOf(ValidationError);
  });

  it("legt bei wiederholtem Senden keinen doppelten Eintrag an", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const input = { title: "Abendessen", date: "2026-10-16", startTime: "19:00", durationMinutes: 120, clientRequestId: randomUUID() };
    const first = await createAgendaItem(visitor.id, id, input);
    const second = await createAgendaItem(visitor.id, id, input);
    expect(second.item.id).toBe(first.item.id);
    expect((await getTrip(visitor.id, id)).agenda).toHaveLength(1);
  });

  it("löscht Einträge", async () => {
    const visitor = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    const { item } = await createAgendaItem(visitor.id, id, { title: "X", date: "2026-10-16", startTime: "10:00", durationMinutes: 30 });
    await deleteAgendaItem(visitor.id, item.id);
    expect((await getTrip(visitor.id, id)).agenda).toHaveLength(0);
  });
});

describe("Favoriten", () => {
  it("fügt Favoriten idempotent hinzu und entfernt sie", async () => {
    const visitor = await newVisitor();
    await addFavorite(visitor.id, { placeId });
    await addFavorite(visitor.id, { placeId });
    await addFavorite(visitor.id, { accommodationId });
    expect(await getFavoriteIds(visitor.id)).toEqual({ placeIds: [placeId], accommodationIds: [accommodationId] });
    expect((await listFavorites(visitor.id)).map((f) => f.type).sort()).toEqual(["accommodation", "place"]);

    await removeFavorite(visitor.id, { placeId });
    await removeFavorite(visitor.id, { placeId }); // kein Fehler
    expect((await getFavoriteIds(visitor.id)).placeIds).toEqual([]);
  });

  it("lehnt unbekannte Orte ab", async () => {
    const visitor = await newVisitor();
    await expect(addFavorite(visitor.id, { placeId: randomUUID() })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("kann denselben Favoriten in mehreren Aufenthalten einplanen", async () => {
    const visitor = await newVisitor();
    await addFavorite(visitor.id, { placeId });
    const a = await createTrip(visitor.id, weekend);
    const b = await createTrip(visitor.id, { name: "Winter", startDate: "2026-12-04", endDate: "2026-12-06" });
    await createAgendaItem(visitor.id, a.id, { title: "Bad", date: "2026-10-17", startTime: "11:00", durationMinutes: 60, placeId });
    await createAgendaItem(visitor.id, b.id, { title: "Bad", date: "2026-12-05", startTime: "11:00", durationMinutes: 60, placeId });
    expect(await db.agendaItem.count({ where: { placeId, trip: { visitorSessionId: visitor.id } } })).toBe(2);
  });
});

describe("Ownership und Zugriffsschutz", () => {
  it("verhindert, dass ein anderer Gast fremde Daten liest oder verändert", async () => {
    const owner = await newVisitor();
    const intruder = await newVisitor();
    const { id: tripId } = await createTrip(owner.id, weekend);
    const { item } = await createAgendaItem(owner.id, tripId, { title: "Privat", date: "2026-10-16", startTime: "10:00", durationMinutes: 60 });
    await addFavorite(owner.id, { placeId });

    await expect(getTrip(intruder.id, tripId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateTrip(intruder.id, tripId, weekend)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteTrip(intruder.id, tripId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(saveTripAccommodation(intruder.id, tripId, { name: "Fremd" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      createAgendaItem(intruder.id, tripId, { title: "Fremd", date: "2026-10-16", startTime: "12:00", durationMinutes: 30 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      updateAgendaItem(intruder.id, item.id, { title: "Gehackt", date: "2026-10-16", startTime: "10:00", durationMinutes: 60 }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteAgendaItem(intruder.id, item.id)).rejects.toBeInstanceOf(NotFoundError);

    expect(await listTrips(intruder.id)).toEqual([]);
    expect(await getFavoriteIds(intruder.id)).toEqual({ placeIds: [], accommodationIds: [] });

    // Daten des Eigentümers sind unverändert
    const trip = await getTrip(owner.id, tripId);
    expect(trip.agenda.map((i) => i.title)).toEqual(["Privat"]);
    expect(trip.accommodation).toBeNull();
  });

  it("löscht beim Datenlöschen alle Daten eines Gastes (Cascade) und nur diese", async () => {
    const visitor = await newVisitor();
    const other = await newVisitor();
    const { id } = await createTrip(visitor.id, weekend);
    await createAgendaItem(visitor.id, id, { title: "X", date: "2026-10-16", startTime: "10:00", durationMinutes: 30 });
    await saveTripAccommodation(visitor.id, id, { name: "Hotel" });
    await addFavorite(visitor.id, { placeId });
    const otherTrip = await createTrip(other.id, weekend);

    const exported = await exportVisitorData(visitor.id);
    expect(exported.trips).toHaveLength(1);
    expect(exported.favorites).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toContain("tokenHash");

    await deleteVisitor(visitor.id);
    expect(await db.trip.count({ where: { id } })).toBe(0);
    expect(await db.agendaItem.count({ where: { tripId: id } })).toBe(0);
    expect(await db.favorite.count({ where: { visitorSessionId: visitor.id } })).toBe(0);
    expect(await db.trip.count({ where: { id: otherTrip.id } })).toBe(1);
  });
});

describe("Datenbank-Integrität", () => {
  it("erzwingt die Constraints auch bei direktem Datenbankzugriff", async () => {
    const visitor = await newVisitor();
    const city = await db.city.findUniqueOrThrow({ where: { slug: "baden" } });
    await expect(
      db.trip.create({
        data: { visitorSessionId: visitor.id, cityId: city.id, name: "Falsch", startDate: new Date("2026-10-18"), endDate: new Date("2026-10-16") },
      }),
    ).rejects.toThrow();
    await expect(db.favorite.create({ data: { visitorSessionId: visitor.id } })).rejects.toThrow();
  });
});
