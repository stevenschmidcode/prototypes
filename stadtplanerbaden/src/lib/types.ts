/**
 * Serialisierbare Datentransferobjekte (Server → Client).
 * Enthalten nie interne Felder wie Session-IDs oder Token-Hashes.
 */
import type { IsoDate } from "./dates";
import type { PlaceKindValue } from "./catalog-meta";
import type { AccommodationTypeValue, AgendaCategoryValue } from "./validation";

export type ImageInfo = {
  url: string;
  alt: string;
  credit: string | null;
  license: string | null;
  sourceUrl: string | null;
};

export type Address = {
  street: string | null;
  postalCode: string | null;
  locality: string | null;
};

export type Coordinates = { latitude: number; longitude: number };

export type CategoryDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
};

export type PlaceSummaryDto = {
  id: string;
  slug: string;
  name: string;
  kind: PlaceKindValue;
  category: Pick<CategoryDto, "slug" | "name">;
  shortDescription: string;
  durationMinutes: number;
  setting: "INDOOR" | "OUTDOOR" | "MIXED";
  rainSuitable: boolean;
  priceInfo: "FREE" | "PAID" | "UNKNOWN";
  tags: string[];
  image: ImageInfo | null;
  locality: string | null;
};

export type PlaceDetailDto = PlaceSummaryDto & {
  description: string;
  address: Address;
  coordinates: Coordinates | null;
  websiteUrl: string | null;
  openingHours: string | null;
  eventInfo: string | null;
};

export type AccommodationDto = {
  id: string;
  slug: string;
  name: string;
  type: AccommodationTypeValue;
  shortDescription: string | null;
  address: Address;
  coordinates: Coordinates | null;
  phone: string | null;
  websiteUrl: string | null;
  defaultCheckIn: string | null;
  defaultCheckOut: string | null;
  image: ImageInfo | null;
};

export type TripAccommodationDto = {
  id: string;
  accommodationId: string | null;
  /** Slug des Katalogeintrags, falls verknüpft */
  catalogSlug: string | null;
  type: AccommodationTypeValue;
  name: string;
  address: Address;
  coordinates: Coordinates | null;
  checkInDate: IsoDate | null;
  checkInTime: string | null;
  checkOutDate: IsoDate | null;
  checkOutTime: string | null;
  phone: string | null;
  websiteUrl: string | null;
  notes: string | null;
  image: ImageInfo | null;
};

export type AgendaItemDto = {
  id: string;
  title: string;
  date: IsoDate;
  startMinutes: number;
  durationMinutes: number;
  location: string | null;
  category: AgendaCategoryValue;
  notes: string | null;
  place: { id: string; slug: string; name: string; image: ImageInfo | null } | null;
};

export type TripSummaryDto = {
  id: string;
  name: string;
  startDate: IsoDate;
  endDate: IsoDate;
  accommodationName: string | null;
  agendaCount: number;
  /** Gewähltes Reiseprofil */
  journeySlug: string | null;
};

export type TripDetailDto = TripSummaryDto & {
  notes: string | null;
  accommodation: TripAccommodationDto | null;
  agenda: AgendaItemDto[];
};

export type JourneySummaryDto = {
  id: string;
  slug: string;
  icon: string;
  theme: string;
  imageUrl: string | null;
  title: string;
  persona: string;
  tagline: string;
  stopCount: number;
  /** Summe der Aufenthaltsdauern aller Stationen (ohne Wege) */
  totalMinutes: number;
};

export type JourneyStopDto = {
  id: string;
  position: number;
  durationMinutes: number;
  note: string;
  place: PlaceSummaryDto & { address: Address; coordinates: Coordinates | null };
};

export type JourneyDetailDto = JourneySummaryDto & {
  intro: string;
  stops: JourneyStopDto[];
};

export type FavoriteDto =
  | { id: string; type: "place"; createdAt: string; kind: PlaceKindValue; place: PlaceSummaryDto }
  | { id: string; type: "accommodation"; createdAt: string; accommodation: AccommodationDto };

export type FavoriteIdsDto = { placeIds: string[]; accommodationIds: string[] };

/** Ergebnis einer Server Action */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
