import "server-only";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { NotFoundError } from "@/server/errors";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };

/** JSON-Antwort für persönliche Daten – nie in gemeinsamen Caches speichern. */
export function privateJson(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, { ...init, headers: { ...PRIVATE_HEADERS, ...init.headers } });
}

export function handleRouteError(error: unknown) {
  // Next.js-interne Steuerfehler (z. B. Prerender-Abbruch, notFound) nicht abfangen
  unstable_rethrow(error);
  if (error instanceof NotFoundError) return privateJson({ error: "Nicht gefunden." }, { status: 404 });
  console.error("[api] Unerwarteter Fehler", error);
  return privateJson({ error: "Interner Fehler." }, { status: 500 });
}
