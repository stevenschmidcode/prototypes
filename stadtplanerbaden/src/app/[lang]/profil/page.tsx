import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, Globe, Heart, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { Container, PageIntro } from "@/components/common/section";
import { DeleteDataButton } from "@/components/profile/delete-data-button";
import { tripStatusLabel } from "@/components/trip/stay-teaser";
import { LOCALE_LABELS, LOCALES, localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/de";
import { fmt, countLabel, plural } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDateRange, todayInZurich, tripStatus } from "@/lib/dates";
import type { TripSummaryDto } from "@/lib/types";
import { getVisitorId } from "@/server/session";
import { listFavorites } from "@/server/services/favorites";
import { listTrips } from "@/server/services/trips";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.profile.meta };
}

export default async function ProfilePage() {
  const { locale, t } = await getI18n();
  return (
    <Container className="max-w-3xl">
      <PageIntro eyebrow={t.profile.eyebrow} title={t.profile.title} description={t.profile.description} />
      <div className="space-y-8">
        <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-sand-soft" />}>
          <GuestOverview />
        </Suspense>

        <section aria-labelledby="sprache" className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-6">
          <h2 id="sprache" className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
            <Globe className="size-4 text-forest" aria-hidden /> {t.profile.language}
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LOCALES.map((l) => (
              <li key={l}>
                {l === locale ? (
                  <span className="flex h-11 items-center justify-between rounded-xl border border-forest bg-forest-soft px-4 text-sm font-medium">
                    {LOCALE_LABELS[l]} <span className="text-xs text-forest">{t.profile.languageActive}</span>
                  </span>
                ) : (
                  <Link
                    href={localizePath(l, "/profil")}
                    hrefLang={l}
                    lang={l}
                    className="flex h-11 items-center justify-between rounded-xl border border-input px-4 text-sm font-medium hover:border-ink/30"
                  >
                    {LOCALE_LABELS[l]} <ChevronRight className="size-4" aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="konto" className="flex gap-4 rounded-3xl bg-sand-soft p-5 md:p-6">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
          <div>
            <h2 id="konto" className="font-semibold tracking-tight">
              {t.profile.devicesTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.profile.devicesText}
            </p>
          </div>
        </section>

        <section aria-labelledby="datenschutz-profil" className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-6">
          <h2 id="datenschutz-profil" className="mb-2 flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-4 text-forest" aria-hidden /> {t.profile.privacyTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.profile.privacyText}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={localizePath(locale, "/datenschutz")}
              className="inline-flex h-11 items-center gap-1 rounded-full border border-input px-5 text-sm font-medium hover:border-ink/30"
            >
              {t.profile.privacyLink} <ChevronRight className="size-4" aria-hidden />
            </Link>
            <a
              href={`/api/me/export?lang=${locale}`}
              download
              className="inline-flex h-11 items-center gap-2 rounded-full border border-input px-5 text-sm font-medium hover:border-ink/30"
            >
              <Download className="size-4" aria-hidden /> {t.profile.download}
            </a>
            <DeleteDataButton />
          </div>
        </section>
      </div>
    </Container>
  );
}

async function GuestOverview() {
  const [{ locale, t }, visitorId] = await Promise.all([getI18n(), getVisitorId()]);
  const [trips, favorites] = visitorId ? await Promise.all([listTrips(visitorId), listFavorites(visitorId, locale)]) : [[], []];
  const today = todayInZurich();
  const current = trips.filter((t) => tripStatus(t, today) !== "past");
  const past = trips.filter((t) => tripStatus(t, today) === "past").reverse();

  return (
    <>
      <section className="flex items-center gap-4 rounded-3xl bg-forest p-5 text-paper md:p-6">
        <span className="flex size-14 items-center justify-center rounded-full bg-paper/12">
          <UserRound className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight">{t.profile.guest}</p>
          <p className="text-sm text-paper/75">
            {fmt(t.profile.tripsCount, {
              trips: countLabel(t.profile.trips, trips.length),
              favorites: countLabel(t.profile.favoritesCount, favorites.length),
            })}
          </p>
        </div>
      </section>

      <TripList title={t.profile.current} trips={current} today={today} empty={t.profile.currentEmpty} showNew t={t} locale={locale} />
      {past.length > 0 && <TripList title={t.profile.past} trips={past} today={today} empty="" t={t} locale={locale} />}

      <Link
        href={localizePath(locale, "/favoriten")}
        className="flex items-center justify-between gap-4 rounded-3xl bg-card p-5 ring-1 ring-border transition-colors hover:ring-ink/20"
      >
        <span className="flex items-center gap-3">
          <Heart className="size-5 text-terracotta" aria-hidden />
          <span>
            <span className="block font-semibold tracking-tight">{t.profile.favorites}</span>
            <span className="text-sm text-muted-foreground">{fmt(t.profile.favoritesSaved, { count: favorites.length })}</span>
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </>
  );
}

function TripList({
  title,
  trips,
  today,
  empty,
  showNew,
  t,
  locale,
}: {
  title: string;
  trips: TripSummaryDto[];
  today: string;
  empty: string;
  showNew?: boolean;
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {showNew && (
          <Link href={localizePath(locale, "/aufenthalt/neu")} className="text-sm font-medium text-forest underline-offset-4 hover:underline">
            {t.profile.newTrip}
          </Link>
        )}
      </div>
      {trips.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-input p-5 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={localizePath(locale, `/aufenthalt/${trip.id}`)} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-sand-soft">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{trip.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDateRange(trip.startDate, trip.endDate, locale)} · {trip.agendaCount} {plural(t.common.entries, trip.agendaCount)}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-sand-soft px-2.5 py-1 text-xs font-medium">{tripStatusLabel(trip, t, locale, today)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
