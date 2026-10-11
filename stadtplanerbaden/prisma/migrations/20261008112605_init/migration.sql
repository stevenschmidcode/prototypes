-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('SIGHT', 'RESTAURANT', 'CAFE', 'WELLNESS', 'CULTURE', 'MUSEUM', 'NATURE', 'ACTIVITY', 'SHOP', 'EVENT');

-- CreateEnum
CREATE TYPE "PlaceSetting" AS ENUM ('INDOOR', 'OUTDOOR', 'MIXED');

-- CreateEnum
CREATE TYPE "PriceInfo" AS ENUM ('FREE', 'PAID', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AccommodationType" AS ENUM ('HOTEL', 'APARTMENT', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgendaCategory" AS ENUM ('SIGHTSEEING', 'FOOD', 'CULTURE', 'WELLNESS', 'NATURE', 'SHOPPING', 'EVENT', 'ACCOMMODATION', 'TRAVEL', 'OTHER');

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CH',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Zurich',
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "locale" TEXT NOT NULL DEFAULT 'de-CH',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceCategory" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PlaceKind" NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "street" TEXT,
    "postalCode" TEXT,
    "locality" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "durationMinutes" INTEGER NOT NULL,
    "websiteUrl" TEXT,
    "openingHours" TEXT,
    "eventInfo" TEXT,
    "tags" TEXT[],
    "setting" "PlaceSetting" NOT NULL,
    "rainSuitable" BOOLEAN NOT NULL DEFAULT false,
    "priceInfo" "PriceInfo" NOT NULL DEFAULT 'UNKNOWN',
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageCredit" TEXT,
    "imageLicense" TEXT,
    "imageSourceUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accommodation" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccommodationType" NOT NULL DEFAULT 'HOTEL',
    "shortDescription" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "locality" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "defaultCheckIn" TEXT,
    "defaultCheckOut" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageCredit" TEXT,
    "imageLicense" TEXT,
    "imageSourceUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" UUID NOT NULL,
    "visitorSessionId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "notes" TEXT,
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientRequestId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripAccommodation" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "accommodationId" UUID,
    "type" "AccommodationType" NOT NULL DEFAULT 'HOTEL',
    "name" TEXT NOT NULL,
    "street" TEXT,
    "postalCode" TEXT,
    "locality" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "checkInDate" DATE,
    "checkInTime" INTEGER,
    "checkOutDate" DATE,
    "checkOutTime" INTEGER,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripAccommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "placeId" UUID,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "location" TEXT,
    "category" "AgendaCategory" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "clientRequestId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "visitorSessionId" UUID NOT NULL,
    "placeId" UUID,
    "accommodationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceCategory_slug_key" ON "PlaceCategory"("slug");

-- CreateIndex
CREATE INDEX "Place_cityId_categoryId_sortOrder_idx" ON "Place"("cityId", "categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "Place_cityId_featured_idx" ON "Place"("cityId", "featured");

-- CreateIndex
CREATE UNIQUE INDEX "Place_cityId_slug_key" ON "Place"("cityId", "slug");

-- CreateIndex
CREATE INDEX "Accommodation_cityId_sortOrder_idx" ON "Accommodation"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Accommodation_cityId_slug_key" ON "Accommodation"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_tokenHash_key" ON "VisitorSession"("tokenHash");

-- CreateIndex
CREATE INDEX "VisitorSession_expiresAt_idx" ON "VisitorSession"("expiresAt");

-- CreateIndex
CREATE INDEX "VisitorSession_userId_idx" ON "VisitorSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_clientRequestId_key" ON "Trip"("clientRequestId");

-- CreateIndex
CREATE INDEX "Trip_visitorSessionId_lastOpenedAt_idx" ON "Trip"("visitorSessionId", "lastOpenedAt");

-- CreateIndex
CREATE INDEX "Trip_visitorSessionId_startDate_idx" ON "Trip"("visitorSessionId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "TripAccommodation_tripId_key" ON "TripAccommodation"("tripId");

-- CreateIndex
CREATE INDEX "TripAccommodation_accommodationId_idx" ON "TripAccommodation"("accommodationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaItem_clientRequestId_key" ON "AgendaItem"("clientRequestId");

-- CreateIndex
CREATE INDEX "AgendaItem_tripId_date_startMinutes_idx" ON "AgendaItem"("tripId", "date", "startMinutes");

-- CreateIndex
CREATE INDEX "AgendaItem_placeId_idx" ON "AgendaItem"("placeId");

-- CreateIndex
CREATE INDEX "Favorite_visitorSessionId_createdAt_idx" ON "Favorite"("visitorSessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_visitorSessionId_placeId_key" ON "Favorite"("visitorSessionId", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_visitorSessionId_accommodationId_key" ON "Favorite"("visitorSessionId", "accommodationId");

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PlaceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accommodation" ADD CONSTRAINT "Accommodation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Zusätzliche Integritätsregeln (nicht in Prisma ausdrückbar) ─────────────

-- Ein Favorit verweist auf genau einen Ort ODER genau eine Unterkunft
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_exactly_one_target"
  CHECK ((("placeId" IS NOT NULL)::int + ("accommodationId" IS NOT NULL)::int) = 1);

-- Abreise nicht vor Anreise
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_dates_order" CHECK ("endDate" >= "startDate");

-- Uhrzeiten und Dauer in gültigen Bereichen
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_start_range"
  CHECK ("startMinutes" >= 0 AND "startMinutes" < 1440);
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_duration_range"
  CHECK ("durationMinutes" > 0 AND "durationMinutes" <= 1440);
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_time_range"
  CHECK (("checkInTime" IS NULL OR ("checkInTime" >= 0 AND "checkInTime" < 1440))
     AND ("checkOutTime" IS NULL OR ("checkOutTime" >= 0 AND "checkOutTime" < 1440)));
