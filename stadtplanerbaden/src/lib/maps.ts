import type { Address, Coordinates } from "./types";

/** «Bäderstrasse 1, 5400 Baden» */
export function formatAddress(address: Address): string | null {
  const locality = [address.postalCode, address.locality].filter(Boolean).join(" ");
  const parts = [address.street, locality].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Link zur Navigation in einer externen Karten-App. Es werden keine Daten an
 * Dritte übertragen, solange der Nutzer den Link nicht selbst öffnet.
 * Google Maps-URLs öffnen auf iOS und Android die jeweils installierte App.
 */
export function mapsUrl({
  name,
  address,
  coordinates,
}: {
  name: string;
  address: string | null;
  coordinates: Coordinates | null;
}): string {
  const query = coordinates
    ? `${coordinates.latitude},${coordinates.longitude}`
    : [name, address ?? "Baden AG"].join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Route zu Fuss über alle Stationen einer Tour (Google Maps, max. 9 Zwischenstopps). */
export function routeUrl(stops: { name: string; address: string | null; coordinates: Coordinates | null }[]): string | null {
  if (stops.length < 2) return null;
  const point = (s: (typeof stops)[number]) =>
    s.coordinates ? `${s.coordinates.latitude},${s.coordinates.longitude}` : [s.name, s.address ?? "Baden AG"].join(", ");
  const params = new URLSearchParams({
    api: "1",
    origin: point(stops[0]),
    destination: point(stops[stops.length - 1]),
    travelmode: "walking",
  });
  const waypoints = stops.slice(1, -1).slice(0, 9).map(point);
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
