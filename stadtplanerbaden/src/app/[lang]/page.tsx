import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { BedDouble, CalendarRange, Heart, MapPin, Search, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Container, SectionHeader } from "@/components/common/section";
import { JourneyCard, JourneyCardSkeleton } from "@/components/journey/journey-card";
import { CategoryIcon } from "@/components/place/category-icon";
import { PlaceCard, PlaceCardSkeleton } from "@/components/place/place-card";
import { StayInvite, StayTeaser, StayTeaserSkeleton } from "@/components/trip/stay-teaser";
import { WebsiteTour } from "@/components/website/website-tour";
import { tourData } from "@/components/website/tour-data";
import { localizePath, type Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { fmt } from "@/i18n/messages";
import { DISCOVER_CATEGORIES } from "@/lib/catalog-meta";
import { loadActiveTrip, loadFavorites, loadJourneys, loadPlaces } from "@/server/queries";

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const href = (path: string) => localizePath(locale, path);
  const stepIcons = [CalendarRange, BedDouble, Sparkles];

  return (
    <>
      {/* Desktop: geführte Website-Tour mit der App im Telefon. Mobile und im Telefon-Rahmen: die App selbst. */}
      <WebsiteTour data={tourData(locale)} />
      <div className="lg:hidden">
        <Hero locale={locale} />
        <Container className="space-y-14 pt-8 md:space-y-20 md:pt-10">
          <Suspense fallback={<StayTeaserSkeleton />}>
            <StayQuickAccess />
          </Suspense>

          <section aria-labelledby="reiseprofile">
            <SectionHeader
              eyebrow={t.home.journeysEyebrow}
              title={t.home.journeysTitle}
              description={t.home.journeysDescription}
              id="reiseprofile"
              action={{ href: href("/touren"), label: t.home.allJourneys }}
            />
            <Suspense fallback={<JourneyRowSkeleton />}>
              <JourneyRow />
            </Suspense>
          </section>

          <section aria-labelledby="kategorien">
            <SectionHeader eyebrow={t.home.categoriesEyebrow} title={t.home.categoriesTitle} id="kategorien" />
            <ul className="scrollbar-none -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-7 md:px-0">
              {DISCOVER_CATEGORIES.map((category) => (
                <li key={category.slug} className="shrink-0">
                  <Link
                    href={href(`/entdecken?kategorie=${category.slug}`)}
                    className="flex h-full min-w-28 flex-col items-start gap-6 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-sm"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-sand-soft text-forest">
                      <CategoryIcon slug={category.slug} className="size-[1.15rem]" />
                    </span>
                    <span className="text-sm leading-tight font-medium">{t.categories[category.slug]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="empfehlungen">
            <SectionHeader
              eyebrow={t.home.recommendationsEyebrow}
              title={t.home.recommendationsTitle}
              id="empfehlungen"
              action={{ href: href("/entdecken"), label: t.home.allPlaces }}
            />
            <Suspense fallback={<FeatureRowSkeleton />}>
              <Recommendations />
            </Suspense>
          </section>

          <section aria-labelledby="veranstaltungen">
            <SectionHeader
              eyebrow={t.home.eventsEyebrow}
              title={t.home.eventsTitle}
              description={t.home.eventsDescription}
              id="veranstaltungen"
              action={{ href: href("/entdecken?kategorie=veranstaltungen"), label: t.common.all }}
            />
            <Suspense fallback={<RowListSkeleton />}>
              <Events emptyText={t.home.noEvents} />
            </Suspense>
          </section>

          <Suspense fallback={null}>
            <FavoritesTeaser />
          </Suspense>

          <section aria-labelledby="planung" className="rounded-3xl border border-border bg-card p-6 md:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.4fr] md:gap-12">
              <div className="space-y-3">
                <p className="eyebrow text-terracotta-strong">{t.home.planningEyebrow}</p>
                <h2 id="planung" className="display text-[2rem] md:text-5xl">
                  {t.home.planningTitle}
                </h2>
                <p className="text-muted-foreground">{t.home.planningText}</p>
                <Link
                  href={href("/aufenthalt")}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-paper transition-colors hover:bg-forest/90"
                >
                  <MapPin className="size-4" aria-hidden /> {t.home.planningCta}
                </Link>
              </div>
              <ol className="grid gap-3">
                {t.home.steps.map((step, index) => {
                  const Icon = stepIcons[index];
                  return (
                    <li key={step.title} className="flex items-start gap-4 rounded-2xl bg-sand-soft p-4">
                      <span className="font-mono text-sm text-terracotta-strong">0{index + 1}</span>
                      <div className="flex-1">
                        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
                          <Icon className="size-4 text-forest" aria-hidden />
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{step.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </Container>
      </div>
    </>
  );
}

async function Hero({ locale }: { locale: Locale }) {
  const { t } = await getI18n();
  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="mx-auto max-w-6xl md:px-6 md:pt-6">
        <div className="relative isolate overflow-hidden md:rounded-[2rem]">
          <Image
            src="/images/hero-baden.jpg"
            alt={t.home.heroAlt}
            fill
            preload
            sizes="(min-width: 1152px) 1104px, 100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/45 via-ink/10 to-ink/80" />
          <div className="flex min-h-[34rem] flex-col justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 text-paper md:min-h-[36rem] md:p-12">
            <div className="flex items-center justify-between md:hidden">
              <Wordmark className="text-[1.75rem]" />
              <span className="eyebrow rounded-full bg-paper/15 px-3 py-1.5 backdrop-blur">{t.home.region}</span>
            </div>
            <span className="eyebrow hidden w-fit rounded-full bg-paper/15 px-3 py-1.5 backdrop-blur md:inline-flex">
              {t.home.regionLong}
            </span>
            <div className="animate-rise space-y-4">
              <p className="text-sm font-medium text-paper/85">{t.home.greeting}</p>
              <h1 id="hero-title" className="display max-w-2xl text-[3.1rem] md:text-[5.25rem]">
                {t.home.headline}
              </h1>
              <p className="max-w-lg text-base text-paper/85 md:text-lg">{t.home.subline}</p>
            </div>
          </div>
        </div>
        <form
          action={localizePath(locale, "/entdecken")}
          role="search"
          className="relative z-10 mx-5 -mt-7 flex items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 shadow-[0_12px_32px_-12px_rgba(34,37,33,0.25)] md:mx-12 md:max-w-xl"
        >
          <Search className="size-[1.1rem] shrink-0 text-muted-foreground" aria-hidden />
          <label htmlFor="home-search" className="sr-only">
            {t.home.searchLabel}
          </label>
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder={t.home.searchPlaceholder}
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-forest px-5 text-sm font-medium text-paper transition-colors hover:bg-forest/90"
          >
            {t.home.search}
          </button>
        </form>
      </div>
    </section>
  );
}

async function StayQuickAccess() {
  const trip = await loadActiveTrip();
  return trip ? <StayTeaser trip={trip} /> : <StayInvite />;
}

async function JourneyRow() {
  const journeys = await loadJourneys();
  return (
    <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {journeys.map((journey) => (
        <li key={journey.id} className="w-[72vw] max-w-72 shrink-0 snap-start md:w-auto md:max-w-none">
          <JourneyCard journey={journey} />
        </li>
      ))}
    </ul>
  );
}

async function Recommendations() {
  const places = await loadPlaces({ featured: true, limit: 8 });
  return (
    <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
      {places.map((place, index) => (
        <li key={place.id} className="w-[78vw] max-w-80 shrink-0 snap-start md:w-auto md:max-w-none">
          <PlaceCard place={place} variant="feature" preload={index < 2} />
        </li>
      ))}
    </ul>
  );
}

async function Events({ emptyText }: { emptyText: string }) {
  const events = await loadPlaces({ category: "veranstaltungen", limit: 4 });
  if (events.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-6">
      {events.map((place) => (
        <li key={place.id}>
          <PlaceCard place={place} variant="row" />
        </li>
      ))}
    </ul>
  );
}

async function FavoritesTeaser() {
  const [{ locale, t }, favorites] = await Promise.all([getI18n(), loadFavorites()]);
  const places = favorites.flatMap((f) => (f.type === "place" ? [f.place] : [])).slice(0, 4);
  if (favorites.length === 0) return null;
  return (
    <section aria-labelledby="favoriten">
      <SectionHeader
        eyebrow={t.home.favoritesEyebrow}
        title={t.home.favoritesTitle}
        id="favoriten"
        action={{ href: localizePath(locale, "/favoriten"), label: fmt(t.home.favoritesAll, { count: favorites.length }) }}
      />
      {places.length > 0 ? (
        <ul className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-6">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} variant="row" />
            </li>
          ))}
        </ul>
      ) : (
        <Link
          href={localizePath(locale, "/favoriten")}
          className="inline-flex items-center gap-2 text-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          <Heart className="size-4" aria-hidden /> {t.home.favoritesAccommodations}
        </Link>
      )}
    </section>
  );
}

function JourneyRowSkeleton() {
  return (
    <div className="-mx-5 flex gap-3 overflow-hidden px-5 md:mx-0 md:grid md:grid-cols-3 md:px-0">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-[72vw] max-w-72 shrink-0 md:w-auto md:max-w-none">
          <JourneyCardSkeleton />
        </div>
      ))}
    </div>
  );
}

function FeatureRowSkeleton() {
  return (
    <div className="-mx-5 flex gap-4 overflow-hidden px-5 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:px-0">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="w-[78vw] max-w-80 shrink-0 md:w-auto md:max-w-none">
          <PlaceCardSkeleton variant="feature" />
        </div>
      ))}
    </div>
  );
}

function RowListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-6">
      {Array.from({ length: 4 }, (_, i) => (
        <PlaceCardSkeleton key={i} variant="row" />
      ))}
    </div>
  );
}
