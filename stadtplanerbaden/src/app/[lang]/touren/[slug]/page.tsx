import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ArrowLeft, Clock3, MapPin, Navigation } from "lucide-react";
import { Container } from "@/components/common/section";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ApplyJourneyDialog } from "@/components/journey/apply-journey-dialog";
import { JourneyIcon, journeyTheme } from "@/components/journey/journey-theme";
import { PlaceImage } from "@/components/place/place-image";
import { localizePath } from "@/i18n/config";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDuration } from "@/lib/dates";
import { formatAddress, routeUrl } from "@/lib/maps";
import type { JourneyDetailDto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotFoundError } from "@/server/errors";
import { loadJourney } from "@/server/queries";

export async function generateMetadata(props: PageProps<"/[lang]/touren/[slug]">): Promise<Metadata> {
  const [{ slug }, { t }] = await Promise.all([props.params, getI18n()]);
  try {
    const journey = await loadJourney(slug);
    return { title: journey.title, description: journey.tagline };
  } catch (error) {
    unstable_rethrow(error);
    return { title: t.journeys.meta };
  }
}

export default function JourneyPage(props: PageProps<"/[lang]/touren/[slug]">) {
  return (
    <Suspense fallback={<JourneySkeleton />}>
      <JourneyDetail params={props.params} />
    </Suspense>
  );
}

async function JourneyDetail({ params }: { params: PageProps<"/[lang]/touren/[slug]">["params"] }) {
  const [{ slug }, { locale, t }] = await Promise.all([params, getI18n()]);
  let journey: JourneyDetailDto;
  try {
    journey = await loadJourney(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const theme = journeyTheme(journey.theme);
  const route = routeUrl(
    journey.stops.map((s) => ({ name: s.place.name, address: formatAddress(s.place.address), coordinates: s.place.coordinates })),
  );

  return (
    <article>
      <header className={cn("relative overflow-hidden", theme.card)}>
        {journey.imageUrl && (
          <Image src={journey.imageUrl} alt="" fill preload sizes="100vw" className="object-cover opacity-25 mix-blend-luminosity" />
        )}
        <div aria-hidden className={cn("absolute -top-24 -right-24 size-80 rounded-full", theme.accent)} />
        <Container className="relative pt-6 pb-10 md:pt-10 md:pb-14">
          <Link
            href={localizePath(locale, "/touren")}
            className={cn("-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium", theme.muted)}
          >
            <ArrowLeft className="size-4" aria-hidden /> {t.journeys.back}
          </Link>
          <div className="mt-6 max-w-3xl animate-rise space-y-4">
            <span className={cn("flex size-14 items-center justify-center rounded-full", theme.badge)}>
              <JourneyIcon name={journey.icon} className="size-6" />
            </span>
            <p className={cn("eyebrow", theme.muted)}>{journey.persona}</p>
            <h1 className="display text-[2.6rem] md:text-6xl">{journey.title}</h1>
            <p className={cn("text-lg md:text-xl", theme.muted)}>{journey.tagline}</p>
            <div className={cn("flex flex-wrap gap-4 pt-1 text-sm font-medium", theme.muted)}>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {fmt(t.journeys.stops, { count: journey.stops.length })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden />
                {fmt(t.journeys.totalDuration, { duration: formatDuration(journey.totalMinutes, locale) })}
              </span>
            </div>
          </div>
        </Container>
      </header>

      <Container className="grid grid-cols-1 gap-10 pt-8 md:grid-cols-[1.6fr_1fr] md:gap-14 md:pt-12">
        <div className="space-y-10">
          <p className="text-lg leading-relaxed text-ink/85">{journey.intro}</p>

          <section aria-labelledby="stationen">
            <h2 id="stationen" className="mb-6 text-2xl font-semibold tracking-tight">
              {t.journeys.stopsTitle}
            </h2>
            <ol className="relative space-y-0">
              {journey.stops.map((stop, index) => {
                const last = index === journey.stops.length - 1;
                return (
                  <li key={stop.id} className="relative flex gap-4 pb-8 md:gap-6">
                    {!last && <span aria-hidden className="absolute top-12 bottom-0 left-[1.4rem] w-px border-l-2 border-dashed border-input" />}
                    <span
                      aria-hidden
                      className={cn("relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold", theme.card)}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
                      <div className="flex gap-4 p-3 pr-4">
                        <PlaceImage
                          image={stop.place.image}
                          category={stop.place.category.slug}
                          sizes="96px"
                          className="aspect-square w-20 shrink-0 rounded-2xl sm:w-24"
                        />
                        <div className="min-w-0 flex-1 py-1">
                          <p className="eyebrow text-muted-foreground">
                            {stop.place.category.name} · {formatDuration(stop.durationMinutes, locale)}
                          </p>
                          <h3 className="mt-1 text-lg leading-tight font-semibold tracking-tight">
                            <Link href={localizePath(locale, `/entdecken/${stop.place.slug}`)} className="hover:underline">
                              {stop.place.name}
                            </Link>
                          </h3>
                          {formatAddress(stop.place.address) && (
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">{formatAddress(stop.place.address)}</p>
                          )}
                        </div>
                        <FavoriteButton
                          target={{ placeId: stop.place.id }}
                          name={stop.place.name}
                          className="size-10 shrink-0 bg-transparent shadow-none ring-0"
                        />
                      </div>
                      {stop.note && (
                        <div className="border-t border-border bg-sand-soft/60 px-4 py-3.5 text-sm">
                          <p className="eyebrow mb-1 text-terracotta-strong">{t.journeys.why}</p>
                          <p className="text-ink/85">{stop.note}</p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="md:pt-1">
          <div className="space-y-4 rounded-3xl bg-card p-5 ring-1 ring-border md:sticky md:top-24">
            <h2 className="text-lg font-semibold tracking-tight">{t.journeys.applyTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.journeys.applyText}</p>
            <ApplyJourneyDialog
              className="w-full"
              journey={{
                slug: journey.slug,
                title: journey.title,
                stops: journey.stops.map((s) => ({ id: s.id, name: s.place.name, durationMinutes: s.durationMinutes })),
              }}
            />
            {route && (
              <a
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:border-ink/30"
              >
                <Navigation className="size-4" aria-hidden /> {t.journeys.mapRoute}
                <span className="sr-only">{t.common.opensMaps}</span>
              </a>
            )}
            <p className="text-xs text-muted-foreground">{t.journeys.profileHint}</p>
          </div>
        </aside>
      </Container>
    </article>
  );
}

function JourneySkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-80 animate-pulse bg-sand" />
      <Container className="space-y-4 pt-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-sand-soft" />
        ))}
      </Container>
    </div>
  );
}
