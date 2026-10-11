"use client";

import Link from "next/link";
import { CloudRain } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { PlaceImage } from "@/components/place/place-image";
import { useI18n } from "@/i18n/client";
import { formatDuration } from "@/lib/dates";
import type { PlaceSummaryDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  place: PlaceSummaryDto;
  variant?: "feature" | "grid" | "row";
  /** Bild vorab laden (nur für die ersten sichtbaren Karten) */
  preload?: boolean;
  className?: string;
};

export function PlaceMeta({ place, className }: { place: PlaceSummaryDto; className?: string }) {
  const { locale } = useI18n();
  return (
    <p className={cn("eyebrow flex items-center gap-1.5 text-muted-foreground", className)}>
      <span>{place.category.name}</span>
      <span aria-hidden>·</span>
      <span>{formatDuration(place.durationMinutes, locale)}</span>
    </p>
  );
}

export function PlaceCard({ place, variant = "grid", preload, className }: Props) {
  const { t, href: localize } = useI18n();
  const href = localize(`/entdecken/${place.slug}`);

  if (variant === "row") {
    return (
      <article className={cn("group relative flex gap-4 rounded-2xl p-2 transition-colors hover:bg-card", className)}>
        <PlaceImage
          image={place.image}
          category={place.category.slug}
          sizes="112px"
          className="aspect-square w-24 shrink-0 rounded-xl sm:w-28"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pr-10">
          <PlaceMeta place={place} />
          <h3 className="truncate text-base font-semibold tracking-tight">
            <Link href={href} className="inline-flex min-h-6 items-center after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
              {place.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{place.shortDescription}</p>
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <FavoriteButton target={{ placeId: place.id }} name={place.name} className="relative z-10 shadow-none ring-0 bg-transparent" />
        </div>
      </article>
    );
  }

  const isFeature = variant === "feature";
  return (
    <article className={cn("group relative flex flex-col gap-3", className)}>
      <div className="relative">
        <PlaceImage
          image={place.image}
          category={place.category.slug}
          sizes={isFeature ? "(min-width: 768px) 360px, 78vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          preload={preload}
          className={cn(
            "rounded-2xl transition-transform duration-500 ease-out-soft group-hover:scale-[1.015]",
            isFeature ? "aspect-[4/5]" : "aspect-[4/3]",
          )}
        />
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton target={{ placeId: place.id }} name={place.name} />
        </div>
        {(place.rainSuitable || place.priceInfo === "FREE") && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex gap-1.5">
            {place.rainSuitable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
                <CloudRain className="size-3.5" aria-hidden /> {t.common.rainOk}
              </span>
            )}
            {place.priceInfo === "FREE" && (
              <span className="rounded-full bg-paper/90 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
                {t.common.free}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-0.5">
        <PlaceMeta place={place} />
        <h3 className={cn("font-semibold tracking-tight", isFeature ? "text-xl" : "text-lg")}>
          <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {place.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{place.shortDescription}</p>
      </div>
    </article>
  );
}

export function PlaceCardSkeleton({ variant = "grid" }: { variant?: "feature" | "grid" | "row" }) {
  if (variant === "row") {
    return (
      <div className="flex gap-4 p-2">
        <div className="aspect-square w-24 shrink-0 animate-pulse rounded-xl bg-sand" />
        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-sand" />
          <div className="h-4 w-40 animate-pulse rounded bg-sand" />
          <div className="h-3 w-full animate-pulse rounded bg-sand-soft" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className={cn("animate-pulse rounded-2xl bg-sand", variant === "feature" ? "aspect-[4/5]" : "aspect-[4/3]")} />
      <div className="h-3 w-24 animate-pulse rounded bg-sand" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-sand" />
    </div>
  );
}

