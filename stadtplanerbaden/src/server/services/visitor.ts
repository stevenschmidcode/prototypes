import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { listFavorites } from "@/server/services/favorites";
import { getTrip, listTrips } from "@/server/services/trips";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/** Gastdaten verfallen nach 180 Tagen Inaktivität (Datenminimierung). */
export const SESSION_TTL_DAYS = 180;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
/** Schreibzugriffe auf lastSeenAt höchstens einmal pro Stunde. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

/** 256 Bit Zufall, base64url-kodiert (43 Zeichen). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

/** Gespeichert wird nur der Hash – ein Datenbankleck verrät keine gültigen Cookies. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(from = Date.now()): Date {
  return new Date(from + SESSION_TTL_MS);
}

/** Findet eine gültige Gast-Session anhand des Cookie-Tokens. */
export async function findVisitorByToken(token: string): Promise<{ id: string } | null> {
  if (!isWellFormedToken(token)) return null;
  const session = await db.visitorSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, lastSeenAt: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.visitorSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), expiresAt: sessionExpiry() },
    });
  }
  return { id: session.id };
}

export async function createVisitor(token: string): Promise<{ id: string }> {
  return db.visitorSession.create({
    data: { tokenHash: hashToken(token), expiresAt: sessionExpiry() },
    select: { id: true },
  });
}

/** Löscht den Gast inklusive aller Aufenthalte, Agenden und Favoriten (Cascade). */
export async function deleteVisitor(visitorId: string): Promise<void> {
  await db.visitorSession.deleteMany({ where: { id: visitorId } });
}

/** Datenauskunft / Datenportabilität (revDSG Art. 25 und 28). */
export async function exportVisitorData(visitorId: string, locale: Locale = DEFAULT_LOCALE) {
  const session = await db.visitorSession.findUnique({
    where: { id: visitorId },
    select: { createdAt: true, lastSeenAt: true, expiresAt: true },
  });
  const summaries = await listTrips(visitorId);
  const trips = await Promise.all(summaries.map((t) => getTrip(visitorId, t.id, locale)));
  const favorites = await listFavorites(visitorId, locale);
  return {
    exportedAt: new Date().toISOString(),
    profile: session
      ? {
          type: "guest",
          createdAt: session.createdAt.toISOString(),
          lastSeenAt: session.lastSeenAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        }
      : null,
    trips,
    favorites: favorites.map((f) =>
      f.type === "place"
        ? { type: f.type, createdAt: f.createdAt, name: f.place.name, slug: f.place.slug }
        : { type: f.type, createdAt: f.createdAt, name: f.accommodation.name, slug: f.accommodation.slug },
    ),
  };
}

