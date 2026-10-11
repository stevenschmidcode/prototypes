import Link from "next/link";
import { ArrowRight, BedDouble, CalendarPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/de";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { nextItem } from "@/lib/agenda";
import {
  diffInDays,
  formatDateRange,
  formatDateShort,
  minutesToTime,
  nowMinutesInZurich,
  relativeDayLabel,
  todayInZurich,
  tripStatus,
} from "@/lib/dates";
import type { TripDetailDto, TripSummaryDto } from "@/lib/types";

/** Kompakte Statuszeile: «In 8 Tagen» · «Tag 2 von 3» · «Abgeschlossen». */
export function tripStatusLabel(
  trip: Pick<TripSummaryDto, "startDate" | "endDate">,
  t: Dictionary,
  locale: Locale,
  today = todayInZurich(),
): string {
  const status = tripStatus(trip, today);
  if (status === "upcoming") return relativeDayLabel(trip.startDate, today, locale);
  if (status === "past") return t.stayTeaser.statusPast;
  return fmt(t.stayTeaser.statusDay, {
    day: diffInDays(trip.startDate, today) + 1,
    total: diffInDays(trip.startDate, trip.endDate) + 1,
  });
}

/** Schnellzugriff auf den aktiven Aufenthalt (Startseite). */
export async function StayTeaser({ trip }: { trip: TripDetailDto }) {
  const { locale, t } = await getI18n();
  const today = todayInZurich();
  const next = nextItem(trip.agenda, today, nowMinutesInZurich());
  return (
    <section
      aria-labelledby="stay-teaser-title"
      className="relative overflow-hidden rounded-3xl bg-forest p-6 text-paper shadow-[0_20px_50px_-24px_rgba(48,62,52,0.6)] md:p-8"
    >
      <div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-terracotta/30" />
      <div aria-hidden className="absolute -right-6 -bottom-20 size-40 rounded-full bg-paper/5" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-paper/70">{t.stayTeaser.eyebrow}</p>
          <span className="rounded-full bg-paper/12 px-3 py-1 text-xs font-medium">{tripStatusLabel(trip, t, locale, today)}</span>
        </div>
        <div>
          <h2 id="stay-teaser-title" className="text-2xl font-semibold tracking-[-0.025em] md:text-3xl">
            {trip.name}
          </h2>
          <p className="mt-1 text-paper/75">{formatDateRange(trip.startDate, trip.endDate, locale)}</p>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-paper/8 p-3.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-paper/70" aria-hidden />
            <div className="min-w-0">
              <dt className="text-paper/65">{next?.ongoing ? t.stayTeaser.now : t.stayTeaser.next}</dt>
              <dd className="truncate font-medium">
                {next
                  ? `${formatDateShort(next.item.date, locale)}, ${minutesToTime(next.item.startMinutes)} – ${next.item.title}`
                  : t.stayTeaser.nothingPlanned}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-paper/8 p-3.5">
            <BedDouble className="mt-0.5 size-4 shrink-0 text-paper/70" aria-hidden />
            <div className="min-w-0">
              <dt className="text-paper/65">{t.stayTeaser.accommodation}</dt>
              <dd className="truncate font-medium">{trip.accommodation?.name ?? t.stayTeaser.noAccommodation}</dd>
            </div>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild variant="secondary" className="bg-paper text-ink hover:bg-sand">
            <Link href={localizePath(locale, `/aufenthalt/${trip.id}`)}>
              {t.stayTeaser.open} <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-paper hover:bg-paper/10 hover:text-paper">
            <Link href={localizePath(locale, `/aufenthalt/${trip.id}/agenda`)}>
              <CalendarPlus data-icon="inline-start" /> {t.stayTeaser.agenda}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Einstieg, wenn noch kein Aufenthalt existiert. */
export async function StayInvite() {
  const { locale, t } = await getI18n();
  return (
    <section
      aria-labelledby="stay-invite-title"
      className="relative overflow-hidden rounded-3xl bg-sand p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8"
    >
      <div aria-hidden className="absolute -right-10 -bottom-24 size-56 rounded-full bg-terracotta/20" />
      <div className="relative space-y-2">
        <p className="eyebrow text-terracotta-strong">{t.stayTeaser.inviteEyebrow}</p>
        <h2 id="stay-invite-title" className="text-2xl font-semibold tracking-[-0.025em]">
          {t.stayTeaser.inviteTitle}
        </h2>
        <p className="max-w-md text-sm text-ink/70">{t.stayTeaser.inviteText}</p>
      </div>
      <Button asChild size="lg" className="relative mt-5 md:mt-0">
        <Link href={localizePath(locale, "/aufenthalt/neu")}>
          <CalendarPlus data-icon="inline-start" /> {t.stayTeaser.inviteCta}
        </Link>
      </Button>
    </section>
  );
}

export function StayTeaserSkeleton() {
  return <div className="h-64 animate-pulse rounded-3xl bg-sand" aria-hidden />;
}
