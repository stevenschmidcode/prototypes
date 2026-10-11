import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  CloudRain,
  Info,
  MapPin,
  Navigation,
  Sun,
  Ticket,
} from "lucide-react";
import { AddToTripDialog } from "@/components/agenda/add-to-trip-dialog";
import { Container, SectionHeader } from "@/components/common/section";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { JourneyCard } from "@/components/journey/journey-card";
import { PlaceCard } from "@/components/place/place-card";
import { PlaceImage } from "@/components/place/place-image";
import { localizePath } from "@/i18n/config";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDuration } from "@/lib/dates";
import { formatAddress, mapsUrl } from "@/lib/maps";
import type { PlaceDetailDto } from "@/lib/types";
import { NotFoundError } from "@/server/errors";
import { loadJourneysForPlace, loadPlace, loadRelatedPlaces } from "@/server/queries";

export async function generateMetadata(props: PageProps<"/[lang]/entdecken/[slug]">): Promise<Metadata> {
  const [{ slug }, { t }] = await Promise.all([props.params, getI18n()]);
  try {
    const place = await loadPlace(slug);
    return { title: place.name, description: place.shortDescription };
  } catch (error) {
    unstable_rethrow(error);
    return { title: t.place.notFound };
  }
}

export default function PlaceDetailPage(props: PageProps<"/[lang]/entdecken/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PlaceDetail params={props.params} />
    </Suspense>
  );
}

async function PlaceDetail({ params }: { params: PageProps<"/[lang]/entdecken/[slug]">["params"] }) {
  const [{ slug }, { locale, t }] = await Promise.all([params, getI18n()]);
  let place: PlaceDetailDto;
  try {
    place = await loadPlace(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const address = formatAddress(place.address);

  const facts = [
    { icon: Clock3, label: t.place.duration, value: fmt(t.place.durationValue, { duration: formatDuration(place.durationMinutes, locale) }) },
    {
      icon: place.setting === "OUTDOOR" ? Sun : MapPin,
      label: t.place.setting,
      value: place.setting === "INDOOR" ? t.place.indoor : place.setting === "OUTDOOR" ? t.place.outdoor : t.place.mixed,
    },
    { icon: CloudRain, label: t.place.rain, value: place.rainSuitable ? t.place.rainGood : t.place.rainBad },
    {
      icon: place.priceInfo === "FREE" ? Ticket : CircleDollarSign,
      label: t.place.price,
      value: place.priceInfo === "FREE" ? t.common.free : place.priceInfo === "PAID" ? t.common.paid : t.common.unknown,
    },
  ];

  return (
    <article>
      <div className="relative mx-auto max-w-6xl md:px-6 md:pt-6">
        <PlaceImage
          image={place.image}
          category={place.category.slug}
          sizes="(min-width: 1152px) 1104px, 100vw"
          preload
          fallbackLabel={fmt(t.place.illustration, { category: place.category.name })}
          className="aspect-[4/3.6] md:aspect-[21/9] md:rounded-[2rem]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/40 to-transparent md:mx-6 md:mt-6 md:rounded-t-[2rem]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-10 md:pt-10">
          <Link
            href={localizePath(locale, "/entdecken")}
            className="inline-flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-transform hover:scale-105"
            aria-label={t.place.back}
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <FavoriteButton target={{ placeId: place.id }} name={place.name} />
        </div>
      </div>

      <Container className="relative -mt-8 md:mt-0">
        <div className="grid grid-cols-1 gap-10 rounded-t-[2rem] bg-background pt-7 md:grid-cols-[1.5fr_1fr] md:gap-14 md:pt-10">
          <div className="animate-rise space-y-6">
            <div className="space-y-3">
              <p className="eyebrow text-terracotta-strong">
                <Link href={localizePath(locale, `/entdecken?kategorie=${place.category.slug}`)} className="hover:underline">
                  {place.category.name}
                </Link>
                {place.locality ? ` · ${place.locality}` : ""}
              </p>
              <h1 className="display text-[2.5rem] md:text-6xl">{place.name}</h1>
              <p className="text-lg text-ink/80 md:text-xl">{place.shortDescription}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <AddToTripDialog
                place={{
                  id: place.id,
                  slug: place.slug,
                  name: place.name,
                  kind: place.kind,
                  durationMinutes: place.durationMinutes,
                  location: address,
                }}
              />
              <FavoriteButton target={{ placeId: place.id }} name={place.name} variant="inline" />
            </div>

            <dl className="grid grid-cols-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <fact.icon className="mb-3 size-5 text-forest" aria-hidden />
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                  <dd className="text-sm font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-4 text-base leading-relaxed text-ink/85">
              {place.description.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {place.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t.place.tags}>
                {place.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-sand-soft px-3 py-1.5 text-xs font-medium text-ink/80">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="space-y-4 md:pt-2" aria-label={t.place.practical}>
            {place.eventInfo && (
              <InfoCard title={t.place.event}>
                <p>{place.eventInfo}</p>
              </InfoCard>
            )}
            <InfoCard title={t.place.openingHours}>
              {place.openingHours ? (
                <p className="whitespace-pre-line">{place.openingHours}</p>
              ) : (
                <p className="flex gap-2 text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t.place.hoursUnverified}
                </p>
              )}
            </InfoCard>
            <InfoCard title={t.place.location}>
              {address ? <p>{address}</p> : <p className="text-muted-foreground">{t.place.noAddress}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={mapsUrl({ name: place.name, address, coordinates: place.coordinates })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-paper hover:bg-forest/90"
                >
                  <Navigation className="size-4" aria-hidden /> {t.common.route}
                  <span className="sr-only">{t.common.opensMaps}</span>
                </a>
                {place.websiteUrl && (
                  <a
                    href={place.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-input bg-card px-4 text-sm font-medium hover:border-ink/30"
                  >
                    {t.common.website} <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">{t.common.externalLink}</span>
                  </a>
                )}
              </div>
            </InfoCard>
            {place.image?.credit && (
              <p className="px-1 text-xs text-muted-foreground">
                {t.common.photo}: {place.image.credit}
                {place.image.license ? ` · ${place.image.license}` : ""}
                {place.image.sourceUrl && (
                  <>
                    {" · "}
                    <a href={place.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {t.common.source}
                    </a>
                  </>
                )}
              </p>
            )}
          </aside>
        </div>

        <Suspense fallback={null}>
          <InJourneys placeId={place.id} title={t.place.inJourneys} />
        </Suspense>
        <Suspense fallback={null}>
          <Related place={place} eyebrow={t.place.moreEyebrow} title={fmt(t.place.moreTitle, { category: place.category.name })} />
        </Suspense>
      </Container>
    </article>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-5 text-sm ring-1 ring-border">
      <h2 className="eyebrow mb-3 text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

async function InJourneys({ placeId, title }: { placeId: string; title: string }) {
  const journeys = await loadJourneysForPlace(placeId);
  if (journeys.length === 0) return null;
  return (
    <section aria-labelledby="in-touren" className="mt-16">
      <SectionHeader title={title} id="in-touren" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((journey) => (
          <li key={journey.id}>
            <JourneyCard journey={journey} />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function Related({ place, eyebrow, title }: { place: PlaceDetailDto; eyebrow: string; title: string }) {
  const related = await loadRelatedPlaces(place);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="aehnliche" className="mt-16">
      <SectionHeader eyebrow={eyebrow} title={title} id="aehnliche" />
      <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => (
          <li key={p.id}>
            <PlaceCard place={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mx-auto max-w-6xl md:px-6 md:pt-6">
        <div className="aspect-[4/3.6] animate-pulse bg-sand md:aspect-[21/9] md:rounded-[2rem]" />
      </div>
      <Container className="space-y-4 pt-8">
        <div className="h-3 w-28 animate-pulse rounded bg-sand" />
        <div className="h-12 w-3/4 animate-pulse rounded-lg bg-sand" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded bg-sand-soft" />
        <div className="h-12 w-64 animate-pulse rounded-full bg-sand" />
      </Container>
    </div>
  );
}
