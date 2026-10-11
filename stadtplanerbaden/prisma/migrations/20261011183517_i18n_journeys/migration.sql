-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "journeyId" UUID;

-- CreateTable
CREATE TABLE "PlaceTranslation" (
    "id" UUID NOT NULL,
    "placeId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "openingHours" TEXT,
    "eventInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationTranslation" (
    "id" UUID NOT NULL,
    "accommodationId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "shortDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyTranslation" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "intro" TEXT NOT NULL,

    CONSTRAINT "JourneyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStop" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "placeId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,

    CONSTRAINT "JourneyStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyStopTranslation" (
    "id" UUID NOT NULL,
    "stopId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "JourneyStopTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceTranslation_placeId_locale_key" ON "PlaceTranslation"("placeId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationTranslation_accommodationId_locale_key" ON "AccommodationTranslation"("accommodationId", "locale");

-- CreateIndex
CREATE INDEX "Journey_cityId_sortOrder_idx" ON "Journey"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Journey_cityId_slug_key" ON "Journey"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyTranslation_journeyId_locale_key" ON "JourneyTranslation"("journeyId", "locale");

-- CreateIndex
CREATE INDEX "JourneyStop_placeId_idx" ON "JourneyStop"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyStop_journeyId_position_key" ON "JourneyStop"("journeyId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "JourneyStopTranslation_stopId_locale_key" ON "JourneyStopTranslation"("stopId", "locale");

-- CreateIndex
CREATE INDEX "Trip_journeyId_idx" ON "Trip"("journeyId");

-- AddForeignKey
ALTER TABLE "PlaceTranslation" ADD CONSTRAINT "PlaceTranslation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationTranslation" ADD CONSTRAINT "AccommodationTranslation_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyTranslation" ADD CONSTRAINT "JourneyTranslation_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStop" ADD CONSTRAINT "JourneyStop_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStop" ADD CONSTRAINT "JourneyStop_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyStopTranslation" ADD CONSTRAINT "JourneyStopTranslation_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "JourneyStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
