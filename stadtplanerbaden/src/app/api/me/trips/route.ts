import { getVisitorId } from "@/server/session";
import { listTrips } from "@/server/services/trips";
import { handleRouteError, privateJson } from "@/server/http";

/** Aufenthalte des aktuellen Gastes. */
export async function GET() {
  try {
    const visitorId = await getVisitorId();
    if (!visitorId) return privateJson({ trips: [] });
    return privateJson({ trips: await listTrips(visitorId) });
  } catch (error) {
    return handleRouteError(error);
  }
}
