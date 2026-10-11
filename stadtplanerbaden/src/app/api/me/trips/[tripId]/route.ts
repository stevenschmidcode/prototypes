import { getVisitorId } from "@/server/session";
import { getTrip } from "@/server/services/trips";
import { handleRouteError, privateJson } from "@/server/http";
import { idSchema } from "@/lib/validation";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

/**
 * Details eines Aufenthalts. Nur für den Eigentümer – fremde oder unbekannte
 * IDs liefern identisch 404, damit nichts über fremde Daten verraten wird.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/me/trips/[tripId]">) {
  try {
    const { tripId } = await ctx.params;
    const visitorId = await getVisitorId();
    if (!visitorId || !idSchema.safeParse(tripId).success) {
      return privateJson({ error: "Nicht gefunden." }, { status: 404 });
    }
    const lang = new URL(request.url).searchParams.get("lang");
    return privateJson({ trip: await getTrip(visitorId, tripId, isLocale(lang) ? lang : DEFAULT_LOCALE) });
  } catch (error) {
    return handleRouteError(error);
  }
}
