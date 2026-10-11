"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, CloudRain, Coffee, Heart, Hourglass, Loader2, Sparkles, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { createAgendaItemAction, deleteAgendaItemAction } from "@/app/actions";
import { PlaceImage } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { overlaps } from "@/lib/agenda";
import { PLACE_KIND_TO_AGENDA } from "@/lib/catalog-meta";
import { formatDuration, minutesToTime, nowMinutesInZurich, todayInZurich, type IsoDate } from "@/lib/dates";
import { findFreeSlots, recommendForSlot, type RecommendationReason } from "@/lib/recommendations";
import type { AgendaItemDto, PlaceSummaryDto } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SuggestionData = {
  places: PlaceSummaryDto[];
  /** Orte der Tour zum Reiseprofil des Aufenthalts */
  profilePlaceIds: string[];
};

type Props = {
  tripId: string;
  date: IsoDate;
  dayItems: AgendaItemDto[];
  allItems: AgendaItemDto[];
  data: SuggestionData;
};

const REASON_ICONS: Record<RecommendationReason, typeof Heart> = {
  profile: Sparkles,
  lunch: UtensilsCrossed,
  dinner: UtensilsCrossed,
  coffee: Coffee,
  rain: CloudRain,
  fits: Hourglass,
};

/** Hat der Tag schon ein Essen in diesem Zeitraum? */
function hasMeal(items: AgendaItemDto[], date: IsoDate, from: number, to: number) {
  return items.some(
    (i) => i.category === "FOOD" && overlaps(i, { date, startMinutes: from, durationMinutes: to - from }),
  );
}

/**
 * «Was passt in meine freie Zeit?» – findet Lücken im Tagesprogramm und schlägt
 * passende Orte vor (Reiseprofil, Essenszeiten, Regen). Ein Tipp plant direkt ein,
 * mit «Rückgängig» im Hinweis.
 */
export function FreeTimeSuggestions({ tripId, date, dayItems, allItems, data }: Props) {
  const { t, locale, href, message } = useI18n();
  const [rainy, setRainy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const slots = useMemo(() => {
    const today = todayInZurich();
    if (date < today) return [];
    const notBefore = date === today ? nowMinutesInZurich() : undefined;
    const planned = new Set(allItems.flatMap((i) => (i.place ? [i.place.id] : [])));
    const profile = new Set(data.profilePlaceIds);
    const candidates = data.places.map((p) => ({ ...p, categorySlug: p.category.slug }));
    const context = {
      profilePlaceIds: profile,
      plannedPlaceIds: planned,
      rainy,
      hasLunch: hasMeal(dayItems, date, 11 * 60 + 30, 14 * 60),
      hasDinner: hasMeal(dayItems, date, 18 * 60, 21 * 60 + 30),
    };
    return findFreeSlots(dayItems, { notBefore })
      .slice(0, 3)
      .map((slot) => ({ slot, suggestions: recommendForSlot(candidates, slot, context) }));
  }, [allItems, dayItems, data, date, rainy]);

  if (slots.length === 0) return null;

  async function plan(place: PlaceSummaryDto, start: number, duration: number) {
    if (pendingId) return;
    setPendingId(place.id);
    const startTime = minutesToTime(start);
    const result = await createAgendaItemAction(
      tripId,
      {
        title: place.name,
        date,
        startTime,
        durationMinutes: duration,
        category: PLACE_KIND_TO_AGENDA[place.kind],
        location: place.locality ?? undefined,
        placeId: place.id,
        clientRequestId: crypto.randomUUID(),
      },
      locale,
    );
    setPendingId(null);
    if (!result.ok) {
      toast.error(message(result.error));
      return;
    }
    const itemId = result.data.item.id;
    toast.success(fmt(t.suggest.planned, { name: place.name, time: startTime }), {
      action: {
        label: t.suggest.undo,
        onClick: async () => {
          const undo = await deleteAgendaItemAction(itemId);
          if (undo.ok) toast(t.suggest.undone);
          else toast.error(message(undo.error));
        },
      },
    });
  }

  return (
    <section aria-labelledby="freie-zeit" className="space-y-4" data-testid="free-time">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-terracotta-strong">{t.suggest.eyebrow}</p>
          <h3 id="freie-zeit" className="text-lg font-semibold tracking-tight">
            {t.suggest.title}
          </h3>
        </div>
        <button
          type="button"
          aria-pressed={rainy}
          onClick={() => setRainy((v) => !v)}
          title={t.suggest.rainyHint}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
            rainy ? "border-forest bg-forest-soft text-forest" : "border-input bg-card hover:border-ink/30",
          )}
        >
          <CloudRain className="size-3.5" aria-hidden /> {t.suggest.rainy}
        </button>
      </div>

      {slots.map(({ slot, suggestions }) => (
        <div key={slot.start} className="rounded-3xl border border-dashed border-input bg-card/60 p-4">
          <p className="mb-3 flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold">
              {fmt(t.suggest.slot, { start: minutesToTime(slot.start), end: minutesToTime(slot.end) })}
            </span>
            <span className="text-muted-foreground">
              {fmt(t.suggest.length, { duration: formatDuration(slot.end - slot.start, locale) })}
            </span>
          </p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.suggest.none}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {suggestions.map(({ place, start, durationMinutes, reasons }) => (
                <li key={place.id} className="flex items-center gap-3 rounded-2xl bg-card p-2 pr-3 ring-1 ring-border">
                  <PlaceImage image={place.image} category={place.category.slug} sizes="56px" className="size-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Link href={href(`/entdecken/${place.slug}`)} className="block truncate text-sm font-semibold hover:underline">
                      {place.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {minutesToTime(start)}–{minutesToTime(start + durationMinutes)} · {place.category.name}
                    </p>
                    {reasons.length > 0 && (
                      <ul className="mt-1 flex flex-wrap gap-1" aria-label={t.suggest.eyebrow}>
                        {reasons.map((reason) => {
                          const Icon = REASON_ICONS[reason];
                          return (
                            <li
                              key={reason}
                              className="inline-flex items-center gap-1 rounded-full bg-sand-soft px-2 py-0.5 text-[0.68rem] font-medium text-ink/80"
                            >
                              <Icon className="size-3" aria-hidden /> {t.suggest.reasons[reason]}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => plan(place, start, durationMinutes)}
                    disabled={pendingId !== null}
                    aria-label={fmt(t.suggest.planAria, { name: place.name, time: minutesToTime(start) })}
                    title={fmt(t.suggest.plan, { time: minutesToTime(start) })}
                  >
                    {pendingId === place.id ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t.suggest.hoursHint}</p>
    </section>
  );
}
