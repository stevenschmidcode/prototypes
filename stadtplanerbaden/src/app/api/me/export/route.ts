import { getVisitorId } from "@/server/session";
import { exportVisitorData } from "@/server/services/visitor";
import { handleRouteError, privateJson } from "@/server/http";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

/** Datenauskunft: alle gespeicherten Daten des Gastes als JSON-Download. */
export async function GET(request: Request) {
  try {
    const lang = new URL(request.url).searchParams.get("lang");
    const visitorId = await getVisitorId();
    const data = visitorId
      ? await exportVisitorData(visitorId, isLocale(lang) ? lang : DEFAULT_LOCALE)
      : { exportedAt: new Date().toISOString(), profile: null, trips: [], favorites: [] };
    return privateJson(data, {
      headers: { "Content-Disposition": 'attachment; filename="baden-meine-daten.json"' },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
