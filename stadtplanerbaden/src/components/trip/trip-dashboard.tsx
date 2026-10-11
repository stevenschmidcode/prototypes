import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Compass,
  Heart,
  Pencil,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { AddToTripDialog } from "@/components/agenda/add-to-trip-dialog";
import { Container } from "@/components/common/section";
import { JourneyCard } from "@/components/journey/journey-card";
import { PlaceImage } from "@/components/place/place-image";
import { AccommodationCard } from "@/components/trip/accommodation-card";
import { tripStatusLabel } from "@/components/trip/stay-teaser";
import { Button } from "@/components/ui/button";
import { localizePath } from "@/i18n/config";
import { fmt, plural } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { findConflicts, groupByTripDays, nextItem } from "@/lib/agenda";
import {
  diffInDays,
  formatDateLong,
  formatDateRange,
  formatDateShort,
  isWithin,
  minutesToTime,
  nightsBetween,
  nowMinutesInZurich,
  todayInZurich,
} from "@/lib/dates";
import type { FavoriteDto, JourneySummaryDto, TripDetailDto, TripSummaryDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  trip: TripDetailDto;
  trips: TripSummaryDto[];
  favorites: FavoriteDto[];
  journeys: JourneySummaryDto[];
};

export async function TripDashboard({ trip, trips, favorites, journeys }: Props) {
  const { locale, t } = await getI18n();
  const href = (path: string) => localizePath(locale, path);
  const today = todayInZurich();
  const next = nextItem(trip.agenda, today, nowMinutesInZurich());
  const conflicts = findConflicts(trip.agenda);
  const { days, outside } = groupByTripDays(trip.agenda, trip.startDate, trip.endDate);
  const focusDate = isWithin(today, trip.startDate, trip.endDate) ? today : trip.startDate;
  const focusDay = days.find((d) => d.date === focusDate) ?? days[0];
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const placeFavorites = favorites.flatMap((f) => (f.type === "place" ? [f.place] : []));
  const plannedPlaceIds = new Set(trip.agenda.map((item) => item.place?.id).filter(Boolean));
  const unplannedFavorites = placeFavorites.filter((p) => !plannedPlaceIds.has(p.id)).slice(0, 4);
  const profile = journeys.find((j) => j.slug === trip.journeySlug) ?? null;
  const base = `/aufenthalt/${trip.id}`;
  const linkClass = "shrink-0 text-sm font-medium whitespace-nowrap text-forest underline-offset-4 hover:underline";

  return (
    <Container className="space-y-8 md:space-y-10">
      {trips.length > 1 && (
        <nav aria-label={t.dashboard.trips} className="pt-6">
          <ul className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
            {trips.map((other) => (
              <li key={other.id} className="shrink-0">
                <Link
                  href={href(`/aufenthalt/${other.id}`)}
                  aria-current={other.id === trip.id ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                    other.id === trip.id ? "border-forest bg-forest text-paper" : "border-input bg-card hover:border-ink/30",
                  )}
                >
                  <span className="font-medium">{other.name}</span>
                  <span className={other.id === trip.id ? "text-paper/70" : "text-muted-foreground"}>
                    {formatDateShort(other.startDate, locale)}
                  </span>
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link
                href={href("/aufenthalt/neu")}
                className="flex h-10 items-center gap-1.5 rounded-full border border-dashed border-input px-4 text-sm font-medium hover:border-ink/30"
              >
                <Plus className="size-4" aria-hidden /> {t.dashboard.newTrip}
              </Link>
            </li>
          </ul>
        </nav>
      )}

      <header className={cn("animate-rise space-y-4", trips.length > 1 ? "pt-2" : "pt-8 md:pt-12")}>
        <div className="flex items-center gap-2">
          <p className="eyebrow text-terracotta-strong">{t.dashboard.eyebrow}</p>
          <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium">{tripStatusLabel(trip, t, locale, today)}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="display text-[2.4rem] md:text-6xl">{trip.name}</h1>
            <p className="text-lg text-muted-foreground">
              {formatDateRange(trip.startDate, trip.endDate, locale)}
              <span aria-hidden> · </span>
              {nights === 0 ? t.common.dayTrip : `${nights} ${plural(t.common.nights, nights)}`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={href(`${base}/bearbeiten`)}>
              <Pencil data-icon="inline-start" /> {t.common.edit}
            </Link>
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t.dashboard.planned} value={trip.agenda.length} hint={plural(t.common.activities, trip.agenda.length)} />
        <Stat label={t.dashboard.days} value={days.length} hint={plural(t.common.days, days.length)} />
        <Stat
          label={t.dashboard.favorites}
          value={favorites.length}
          hint={t.dashboard.favoritesHint}
          href={href("/favoriten")}
          ariaLabel={fmt(t.dashboard.showStat, { value: favorites.length, label: t.dashboard.favorites })}
        />
      </dl>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-labelledby="naechstes" className="relative overflow-hidden rounded-3xl bg-forest p-6 text-paper">
          <div aria-hidden className="absolute -right-12 -bottom-16 size-44 rounded-full bg-terracotta/30" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div className="space-y-1">
              <p id="naechstes" className="eyebrow text-paper/70">
                {next?.ongoing ? t.dashboard.now : t.dashboard.next}
              </p>
              {next ? (
                <>
                  <p className="text-2xl font-semibold tracking-tight">{next.item.title}</p>
                  <p className="text-paper/75">
                    {formatDateShort(next.item.date, locale)} · {minutesToTime(next.item.startMinutes)}–
                    {minutesToTime(next.item.startMinutes + next.item.durationMinutes)}
                    {next.item.location ? ` · ${next.item.location}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight">{t.dashboard.nothingTitle}</p>
                  <p className="text-paper/75">{t.dashboard.nothingText}</p>
                </>
              )}
            </div>
            <Link
              href={href(next ? `${base}/agenda?tag=${next.item.date}` : `${base}/agenda`)}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-paper/12 px-4 py-2.5 text-sm font-medium hover:bg-paper/20"
            >
              {t.dashboard.openAgenda} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
        <AccommodationCard tripId={trip.id} accommodation={trip.accommodation} />
      </div>

      <section aria-labelledby="schnellaktionen">
        <h2 id="schnellaktionen" className="sr-only">
          {t.dashboard.quickActions}
        </h2>
        <ul className="grid grid-cols-1 grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction href={href("/entdecken")} icon={Compass} label={t.dashboard.actionDiscover} />
          <QuickAction href={href(`${base}/agenda?neu=1`)} icon={CalendarPlus} label={t.dashboard.actionOwn} />
          <QuickAction
            href={href(`${base}/unterkunft`)}
            icon={BedDouble}
            label={trip.accommodation ? t.dashboard.actionAccommodationEdit : t.dashboard.actionAccommodationAdd}
          />
          <QuickAction href={href(`${base}/agenda`)} icon={CalendarDays} label={t.dashboard.actionAgenda} />
        </ul>
      </section>

      {outside.length > 0 && (
        <div role="status" className="flex gap-3 rounded-2xl bg-warning-bg p-4 text-sm text-warning-fg">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {outside.length === 1 ? t.dashboard.outsideOne : fmt(t.dashboard.outsideMany, { count: outside.length })}{" "}
            <Link href={href(`${base}/agenda`)} className="font-medium underline underline-offset-2">
              {t.dashboard.moveInAgenda}
            </Link>
          </p>
        </div>
      )}

      {focusDay && (
        <section aria-labelledby="tagesprogramm">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-terracotta-strong">
                {focusDay.date === today ? t.dashboard.today : fmt(t.dashboard.dayN, { n: diffInDays(trip.startDate, focusDay.date) + 1 })}
              </p>
              <h2 id="tagesprogramm" className="text-2xl font-semibold tracking-tight">
                {formatDateLong(focusDay.date, locale)}
              </h2>
            </div>
            <Link href={href(`${base}/agenda?tag=${focusDay.date}`)} className={linkClass}>
              {t.dashboard.fullAgenda}
            </Link>
          </div>
          {focusDay.items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-input bg-card/60 p-6 text-center">
              <p className="font-medium">{t.dashboard.dayFreeTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.dayFreeText}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={href("/entdecken")}>
                    <Compass data-icon="inline-start" /> {t.dashboard.discover}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={href(`${base}/agenda?neu=1&tag=${focusDay.date}`)}>
                    <Plus data-icon="inline-start" /> {t.dashboard.appointment}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <ol className="relative space-y-2 before:absolute before:top-3 before:bottom-3 before:left-[4.25rem] before:w-px before:bg-border">
              {focusDay.items.map((item) => (
                <li key={item.id} className="relative flex items-start gap-4">
                  <time className="w-14 shrink-0 pt-3.5 text-right font-mono text-sm text-muted-foreground">
                    {minutesToTime(item.startMinutes)}
                  </time>
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-10 mt-[1.15rem] size-2.5 shrink-0 rounded-full ring-4 ring-background",
                      conflicts.has(item.id) ? "bg-terracotta" : "bg-forest",
                    )}
                  />
                  <div className="min-w-0 flex-1 rounded-2xl bg-card p-3.5 ring-1 ring-border">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {fmt(t.dashboard.until, { time: minutesToTime(item.startMinutes + item.durationMinutes) })} ·{" "}
                      {t.agendaCategories[item.category]}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    {conflicts.has(item.id) && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning-fg">
                        <TriangleAlert className="size-3.5" aria-hidden /> {t.dashboard.conflict}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <section aria-labelledby="reiseprofil">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-terracotta-strong">{t.dashboard.journeyEyebrow}</p>
            <h2 id="reiseprofil" className="text-2xl font-semibold tracking-tight">
              {profile ? profile.title : t.home.journeysTitle}
            </h2>
          </div>
          <Link href={href(profile ? `/touren/${profile.slug}` : "/touren")} className={linkClass}>
            {profile ? t.dashboard.journeyCta : t.home.allJourneys}
          </Link>
        </div>
        {profile ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.4fr] md:items-center">
            <JourneyCard journey={profile} />
            <div className="space-y-3 rounded-3xl bg-sand-soft p-5">
              <p className="text-ink/80">{profile.tagline}</p>
              <Button asChild>
                <Link href={href(`/touren/${profile.slug}`)}>
                  <CalendarPlus data-icon="inline-start" /> {t.dashboard.journeyApply}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {journeys.slice(0, 3).map((journey) => (
              <li key={journey.id} className="w-[72vw] max-w-72 shrink-0 md:w-auto md:max-w-none">
                <JourneyCard journey={journey} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="favoriten-planen">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-terracotta-strong">{t.dashboard.favEyebrow}</p>
            <h2 id="favoriten-planen" className="text-2xl font-semibold tracking-tight">
              {t.dashboard.favTitle}
            </h2>
          </div>
          <Link href={href("/favoriten")} className={linkClass}>
            {t.dashboard.favAll}
          </Link>
        </div>
        {unplannedFavorites.length === 0 ? (
          <div className="flex items-center gap-4 rounded-3xl bg-sand-soft p-5">
            <Heart className="size-5 shrink-0 text-terracotta" aria-hidden />
            <p className="text-sm text-ink/80">{placeFavorites.length === 0 ? t.dashboard.favEmpty : t.dashboard.favAllPlanned}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {unplannedFavorites.map((place) => (
              <li key={place.id} className="flex items-center gap-4 rounded-2xl bg-card p-2.5 pr-3 ring-1 ring-border">
                <PlaceImage image={place.image} category={place.category.slug} sizes="64px" className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-muted-foreground">{place.category.name}</p>
                  <Link href={href(`/entdecken/${place.slug}`)} className="block truncate font-medium hover:underline">
                    {place.name}
                  </Link>
                </div>
                <AddToTripDialog
                  place={{
                    id: place.id,
                    slug: place.slug,
                    name: place.name,
                    kind: place.kind,
                    durationMinutes: place.durationMinutes,
                    location: place.locality,
                  }}
                  trigger={
                    <Button size="icon-sm" variant="secondary" aria-label={fmt(t.addToTrip.planAria, { name: place.name })}>
                      <CalendarClock />
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {trip.notes && (
        <section aria-labelledby="notizen" className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h2 id="notizen" className="eyebrow mb-2 text-muted-foreground">
            {t.dashboard.notes}
          </h2>
          <p className="whitespace-pre-line text-ink/85">{trip.notes}</p>
        </section>
      )}
    </Container>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
  ariaLabel,
}: {
  label: string;
  value: number;
  hint: string;
  href?: string;
  ariaLabel?: string;
}) {
  const number = <span className="text-3xl font-semibold tracking-tight">{value}</span>;
  return (
    <div className="relative rounded-2xl bg-card p-4 ring-1 ring-border transition-colors has-[a:hover]:ring-ink/20">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-1.5">
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl" aria-label={ariaLabel}>
            {number}
          </Link>
        ) : (
          number
        )}
        <span className="text-xs text-muted-foreground">{hint}</span>
      </dd>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Compass; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full min-h-28 flex-col justify-between gap-4 rounded-2xl bg-card p-4 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-ink/20"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-sand-soft text-forest">
          <Icon className="size-[1.15rem]" aria-hidden />
        </span>
        <span className="text-sm leading-snug font-medium">{label}</span>
      </Link>
    </li>
  );
}

export function DashboardSkeleton() {
  return (
    <Container className="space-y-8 pt-10" aria-busy="true">
      <div className="space-y-3">
        <div className="h-3 w-32 animate-pulse rounded bg-sand" />
        <div className="h-14 w-2/3 animate-pulse rounded-lg bg-sand" />
        <div className="h-5 w-48 animate-pulse rounded bg-sand-soft" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand-soft" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-3xl bg-sand" />
        <div className="h-52 animate-pulse rounded-3xl bg-sand-soft" />
      </div>
    </Container>
  );
}
