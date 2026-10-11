import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  createVisitor,
  findVisitorByToken,
  generateToken,
  SESSION_TTL_DAYS,
} from "@/server/services/visitor";

/**
 * Gast-Sessions
 *
 * - Das Cookie enthält ein zufälliges, nicht erratbares 256-Bit-Token.
 * - HttpOnly, SameSite=Lax, in Produktion Secure und mit «__Host-»-Präfix.
 * - In der Datenbank liegt nur der SHA-256-Hash des Tokens.
 * - Eine Session wird erst beim ersten Speichern erstellt (keine Daten für reine Besucher).
 */
const isProduction = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = isProduction ? "__Host-baden_guest" : "baden_guest";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
};

/** ID des aktuellen Gastes oder null. Liest nur – erstellt nie eine Session. Pro Request gecacht. */
export const getVisitorId = cache(async (): Promise<string | null> => {
  // Persönliche Daten sind immer Request-Zeit-Daten (auch die darauf basierende «heute»-Logik).
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const visitor = await findVisitorByToken(token);
  return visitor?.id ?? null;
});

/**
 * ID des aktuellen Gastes – erstellt bei Bedarf eine neue Session und setzt das Cookie.
 * Nur in Server Actions oder Route Handlers aufrufen (Cookies schreiben).
 */
export async function requireVisitorId(): Promise<string> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const visitor = await findVisitorByToken(token);
    if (visitor) {
      // rollierende Laufzeit
      store.set(SESSION_COOKIE, token, cookieOptions);
      return visitor.id;
    }
  }
  const newToken = generateToken();
  const visitor = await createVisitor(newToken);
  store.set(SESSION_COOKIE, newToken, cookieOptions);
  return visitor.id;
}

export async function clearVisitorCookie(): Promise<void> {
  // gleiche Attribute wie beim Setzen, sonst verwerfen Browser das «__Host-»-Cookie nicht
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
