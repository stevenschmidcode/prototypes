/**
 * Seed: Stadt Baden, Kategorien, kuratierter Ortskatalog und Unterkünfte.
 *
 * Quelle der Inhalte: prisma/seed-data/catalog.json (recherchiert und mit
 * Quellen belegt; nicht verifizierbare Angaben sind null). Das Skript ist
 * idempotent – mehrfaches Ausführen aktualisiert bestehende Einträge.
 *
 * Ausführen: pnpm db:seed
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type PlaceKind } from "../src/generated/prisma/client";

type SeedAddress = { street: string | null; postalCode: string | null; city: string | null };
type SeedPlace = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  address: SeedAddress | null;
  lat: number | null;
  lng: number | null;
  websiteUrl: string | null;
  durationMinutes: number;
  indoorOutdoor: "INDOOR" | "OUTDOOR" | "MIXED";
  rainSuitable: boolean;
  priceInfo: "FREE" | "PAID" | "UNKNOWN";
  openingHours: string | null;
  eventInfo?: { startDate: string | null; endDate: string | null; note?: string } | null;
  /** Optional: Art des Ortes (sonst KIND_BY_SLUG) */
  kind?: PlaceKind;
  tags: string[];
};
type SeedAccommodation = {
  slug: string;
  name: string;
  type: "HOTEL" | "APARTMENT" | "PRIVATE" | "OTHER";
  address: SeedAddress | null;
  lat: number | null;
  lng: number | null;
  websiteUrl: string | null;
  phone: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  shortDescription: string | null;
};
type SeedImage = { slug: string; file: string; sourceUrl: string; author: string; license: string; licenseUrl: string };
type Catalog = { places: SeedPlace[]; accommodations: SeedAccommodation[]; images: SeedImage[] };
type EnCatalog = {
  places: Record<string, { name: string; shortDescription: string; description: string; tags: string[]; openingHours: string | null } | undefined>;
  accommodations: Record<string, { shortDescription: string | null } | undefined>;
};
type JourneyText = { title: string; persona: string; tagline: string; intro: string };
type SeedJourney = {
  slug: string;
  icon: string;
  theme: string;
  image: string | null;
  de: JourneyText;
  en: JourneyText;
  stops: { place: string; minutes: number; de: string; en: string }[];
};

const CATEGORIES = [
  { slug: "entdecken", name: "Entdecken", icon: "compass", description: "Altstadt, Brücken, Türme und Geschichte." },
  { slug: "essen-trinken", name: "Essen & Trinken", icon: "utensils", description: "Restaurants, Cafés und Gasthäuser." },
  { slug: "wellness", name: "Wellness", icon: "waves", description: "Thermalwasser – seit der Römerzeit." },
  { slug: "kultur", name: "Kultur", icon: "landmark", description: "Museen, Theater und Kunst." },
  { slug: "natur", name: "Natur", icon: "trees", description: "Parks, Aussichtspunkte und Wälder." },
  { slug: "shopping", name: "Shopping", icon: "shopping-bag", description: "Märkte, Boutiquen und Traditionsläden." },
  { slug: "veranstaltungen", name: "Veranstaltungen", icon: "calendar-heart", description: "Feste und Festivals." },
] as const;

const CATEGORY_BY_KEY: Record<string, string> = {
  ENTDECKEN: "entdecken",
  ESSEN_TRINKEN: "essen-trinken",
  WELLNESS: "wellness",
  KULTUR: "kultur",
  NATUR: "natur",
  SHOPPING: "shopping",
  VERANSTALTUNGEN: "veranstaltungen",
};

/** Feinere Art je Ort – Grundlage für den Favoritenfilter. */
const KIND_BY_SLUG: Record<string, PlaceKind> = {
  "historische-altstadt-baden": "SIGHT",
  "ruine-stein": "SIGHT",
  "holzbruecke-baden": "SIGHT",
  "landvogteischloss-historisches-museum": "MUSEUM",
  "grand-casino-baden": "ACTIVITY",
  "thermalbad-fortyseven": "WELLNESS",
  "kurpark-baden": "NATURE",
  limmatpromenade: "NATURE",
  "museum-langmatt": "MUSEUM",
  baederquartier: "SIGHT",
  "heisse-brunnen": "WELLNESS",
  "schweizer-kindermuseum": "MUSEUM",
  "kurtheater-baden": "CULTURE",
  "stadtturm-baden": "SIGHT",
  baldegg: "NATURE",
  teufelskeller: "NATURE",
  "restaurant-roter-turm": "RESTAURANT",
  "restaurant-trudelkeller": "RESTAURANT",
  "waldgasthaus-baldegg": "RESTAURANT",
  "cafe-confiserie-himmel": "CAFE",
  "frau-meise": "CAFE",
  "wochenmarkt-baden": "SHOP",
  "einkaufen-innenstadt": "SHOP",
  badenfahrt: "EVENT",
  fantoche: "EVENT",
  "badener-wunderdorf": "EVENT",
};

/** Redaktionelle Auswahl für «Empfehlungen» auf der Startseite. */
const FEATURED = [
  "historische-altstadt-baden",
  "thermalbad-fortyseven",
  "heisse-brunnen",
  "museum-langmatt",
  "ruine-stein",
  "holzbruecke-baden",
  "landvogteischloss-historisches-museum",
  "baederquartier",
];

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatEventRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (sy === ey && sm === em) return `${sd}.–${ed}. ${MONTHS[em - 1]} ${ey}`;
  if (sy === ey) return `${sd}. ${MONTHS[sm - 1]} – ${ed}. ${MONTHS[em - 1]} ${ey}`;
  return `${sd}. ${MONTHS[sm - 1]} ${sy} – ${ed}. ${MONTHS[em - 1]} ${ey}`;
}

function eventText(place: SeedPlace): string | null {
  const info = place.eventInfo;
  if (!info?.startDate || !info.endDate) return null;
  return `${formatEventRange(info.startDate, info.endDate)} (gemäss Veranstalter bzw. Baden Tourismus – bitte vor dem Besuch prüfen).`;
}

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function eventTextEn(place: SeedPlace): string | null {
  const info = place.eventInfo;
  if (!info?.startDate || !info.endDate) return null;
  const [sy, sm, sd] = info.startDate.split("-").map(Number);
  const [ey, em, ed] = info.endDate.split("-").map(Number);
  const range =
    sy === ey && sm === em
      ? `${sd}–${ed} ${MONTHS_EN[em - 1]} ${ey}`
      : sy === ey
        ? `${sd} ${MONTHS_EN[sm - 1]} – ${ed} ${MONTHS_EN[em - 1]} ${ey}`
        : `${sd} ${MONTHS_EN[sm - 1]} ${sy} – ${ed} ${MONTHS_EN[em - 1]} ${ey}`;
  return `${range} (according to the organiser or Baden Tourism – please check before your visit).`;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), file), "utf8")) as T;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL ist nicht gesetzt.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const catalog = readJson<Catalog>("prisma/seed-data/catalog.json");
  const catalogEn = readJson<EnCatalog>("prisma/seed-data/catalog.en.json");
  const { journeys } = readJson<{ journeys: SeedJourney[] }>("prisma/seed-data/journeys.json");
  const images = new Map(catalog.images.map((image) => [image.slug, image]));
  const imageFields = (slug: string, name: string) => {
    const image = images.get(slug);
    if (!image) return { imageUrl: null, imageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null };
    return {
      imageUrl: image.file.replace(/^public/, ""),
      imageAlt: `Foto: ${name}`,
      imageCredit: image.author,
      imageLicense: image.license,
      imageSourceUrl: image.sourceUrl,
    };
  };

  try {
    const city = await db.city.upsert({
      where: { slug: "baden" },
      create: { slug: "baden", name: "Baden", canton: "AG", latitude: 47.4733, longitude: 8.3059 },
      update: { name: "Baden", canton: "AG", latitude: 47.4733, longitude: 8.3059 },
    });

    const categoryIds = new Map<string, string>();
    for (const [index, category] of CATEGORIES.entries()) {
      const row = await db.placeCategory.upsert({
        where: { slug: category.slug },
        create: { ...category, sortOrder: index },
        update: { ...category, sortOrder: index },
      });
      categoryIds.set(category.slug, row.id);
    }

    const placeIds = new Map<string, string>();
    for (const [index, place] of catalog.places.entries()) {
      const categorySlug = CATEGORY_BY_KEY[place.category];
      const categoryId = categorySlug ? categoryIds.get(categorySlug) : undefined;
      const kind = place.kind ?? KIND_BY_SLUG[place.slug];
      if (!categoryId || !kind) throw new Error(`Kategorie/Art fehlt für ${place.slug}`);
      const data = {
        cityId: city.id,
        categoryId,
        name: place.name,
        kind,
        shortDescription: place.shortDescription,
        description: place.description,
        street: place.address?.street ?? null,
        postalCode: place.address?.postalCode ?? null,
        locality: place.address?.city ?? null,
        latitude: place.lat,
        longitude: place.lng,
        durationMinutes: place.durationMinutes,
        websiteUrl: place.websiteUrl,
        openingHours: place.openingHours,
        eventInfo: eventText(place),
        tags: place.tags,
        setting: place.indoorOutdoor,
        rainSuitable: place.rainSuitable,
        priceInfo: place.priceInfo,
        featured: FEATURED.includes(place.slug),
        sortOrder: FEATURED.includes(place.slug) ? FEATURED.indexOf(place.slug) : 100 + index,
        published: true,
        ...imageFields(place.slug, place.name),
      };
      const row = await db.place.upsert({
        where: { cityId_slug: { cityId: city.id, slug: place.slug } },
        create: { slug: place.slug, ...data },
        update: data,
      });
      placeIds.set(place.slug, row.id);

      // Englische Übersetzung (fehlt sie, zeigt die App das deutsche Original)
      const en = catalogEn.places[place.slug];
      if (en) {
        const translation = {
          name: en.name,
          shortDescription: en.shortDescription,
          description: en.description,
          tags: en.tags,
          openingHours: en.openingHours,
          eventInfo: eventTextEn(place),
        };
        await db.placeTranslation.upsert({
          where: { placeId_locale: { placeId: row.id, locale: "en" } },
          create: { placeId: row.id, locale: "en", ...translation },
          update: translation,
        });
      }
    }

    for (const [index, accommodation] of catalog.accommodations.entries()) {
      const data = {
        cityId: city.id,
        name: accommodation.name,
        type: accommodation.type,
        shortDescription: accommodation.shortDescription,
        street: accommodation.address?.street ?? null,
        postalCode: accommodation.address?.postalCode ?? null,
        locality: accommodation.address?.city ?? null,
        latitude: accommodation.lat,
        longitude: accommodation.lng,
        phone: accommodation.phone,
        websiteUrl: accommodation.websiteUrl,
        defaultCheckIn: accommodation.checkInTime,
        defaultCheckOut: accommodation.checkOutTime,
        sortOrder: index,
        published: true,
        ...imageFields(accommodation.slug, accommodation.name),
      };
      const row = await db.accommodation.upsert({
        where: { cityId_slug: { cityId: city.id, slug: accommodation.slug } },
        create: { slug: accommodation.slug, ...data },
        update: data,
      });
      const en = catalogEn.accommodations[accommodation.slug];
      if (en) {
        await db.accommodationTranslation.upsert({
          where: { accommodationId_locale: { accommodationId: row.id, locale: "en" } },
          create: { accommodationId: row.id, locale: "en", shortDescription: en.shortDescription },
          update: { shortDescription: en.shortDescription },
        });
      }
    }

    // Thementouren: Tour und Übersetzungen per Upsert, Stationen werden neu aufgebaut
    for (const [index, journey] of journeys.entries()) {
      const image = journey.image ? images.get(journey.image) : undefined;
      const data = {
        cityId: city.id,
        icon: journey.icon,
        theme: journey.theme,
        imageUrl: image ? image.file.replace(/^public/, "") : null,
        sortOrder: index,
        published: true,
      };
      const row = await db.journey.upsert({
        where: { cityId_slug: { cityId: city.id, slug: journey.slug } },
        create: { slug: journey.slug, ...data },
        update: data,
      });
      for (const locale of ["de", "en"] as const) {
        await db.journeyTranslation.upsert({
          where: { journeyId_locale: { journeyId: row.id, locale } },
          create: { journeyId: row.id, locale, ...journey[locale] },
          update: journey[locale],
        });
      }
      await db.journeyStop.deleteMany({ where: { journeyId: row.id } });
      for (const [position, stop] of journey.stops.entries()) {
        const placeId = placeIds.get(stop.place);
        if (!placeId) throw new Error(`Tour ${journey.slug}: unbekannter Ort ${stop.place}`);
        await db.journeyStop.create({
          data: {
            journeyId: row.id,
            placeId,
            position,
            durationMinutes: stop.minutes,
            translations: {
              create: [
                { locale: "de", note: stop.de },
                { locale: "en", note: stop.en },
              ],
            },
          },
        });
      }
    }

    console.log(
      `✓ Seed abgeschlossen: ${catalog.places.length} Orte, ${catalog.accommodations.length} Unterkünfte, ${CATEGORIES.length} Kategorien, ${journeys.length} Thementouren (de/en)`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
