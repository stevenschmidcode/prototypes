import { getVisitorId } from "@/server/session";
import { getFavoriteIds } from "@/server/services/favorites";
import { handleRouteError, privateJson } from "@/server/http";

/** Favoriten-IDs des aktuellen Gastes (für Herz-Buttons). */
export async function GET() {
  try {
    const visitorId = await getVisitorId();
    if (!visitorId) return privateJson({ placeIds: [], accommodationIds: [] });
    return privateJson(await getFavoriteIds(visitorId));
  } catch (error) {
    return handleRouteError(error);
  }
}
