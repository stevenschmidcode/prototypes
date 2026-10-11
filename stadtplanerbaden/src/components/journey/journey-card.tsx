"use client";

import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import { JourneyIcon, journeyTheme } from "@/components/journey/journey-theme";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { formatDuration } from "@/lib/dates";
import type { JourneySummaryDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Karte einer Thementour («Reiseprofil») */
export function JourneyCard({ journey, className }: { journey: JourneySummaryDto; className?: string }) {
  const { t, locale, href } = useI18n();
  const theme = journeyTheme(journey.theme);
  return (
    <Link
      href={href(`/touren/${journey.slug}`)}
      className={cn(
        "group relative flex h-full min-h-60 flex-col justify-between overflow-hidden rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1",
        theme.card,
        className,
      )}
    >
      <span aria-hidden className={cn("absolute -top-10 -right-10 size-36 rounded-full", theme.accent)} />
      <span aria-hidden className={cn("absolute -right-4 bottom-8 size-16 rounded-full", theme.accent)} />
      <div className="relative space-y-3">
        <span className={cn("flex size-11 items-center justify-center rounded-full", theme.badge)}>
          <JourneyIcon name={journey.icon} className="size-5" />
        </span>
        <p className={cn("eyebrow", theme.muted)}>{journey.persona}</p>
        <h3 className="text-xl leading-tight font-semibold tracking-tight">{journey.title}</h3>
        <p className={cn("line-clamp-3 text-sm", theme.muted)}>{journey.tagline}</p>
      </div>
      <div className={cn("relative mt-5 flex items-center justify-between text-xs font-medium", theme.muted)}>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {fmt(t.journeys.stops, { count: journey.stopCount })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden /> {fmt(t.journeys.totalDuration, { duration: formatDuration(journey.totalMinutes, locale) })}
          </span>
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </div>
    </Link>
  );
}

export function JourneyCardSkeleton() {
  return <div className="h-60 animate-pulse rounded-3xl bg-sand" aria-hidden />;
}
