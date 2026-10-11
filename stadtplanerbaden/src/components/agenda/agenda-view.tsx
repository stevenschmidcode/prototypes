"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, Compass, List, MapPin, Plus, Rows3, TriangleAlert } from "lucide-react";
import { AgendaItemDialog } from "@/components/agenda/agenda-item-dialog";
import { FreeTimeSuggestions, type SuggestionData } from "@/components/agenda/free-time-suggestions";
import { PlaceImage } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { findConflicts, groupByTripDays } from "@/lib/agenda";
import { useI18n } from "@/i18n/client";
import { fmt, plural, quote } from "@/i18n/messages";
import {
  diffInDays,
  formatDateLong,
  formatDateShort,
  formatDayNumber,
  formatDuration,
  formatWeekdayShort,
  isWithin,
  minutesToTime,
  todayInZurich,
} from "@/lib/dates";
import type { AgendaItemDto, TripDetailDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  trip: TripDetailDto;
  initialDay?: string;
  openNew?: boolean;
  /** Daten für «Freie Zeit»-Vorschläge (Katalog und Reiseprofil) */
  suggestions?: SuggestionData;
};

type View = "day" | "list";

export function AgendaView({ trip, initialDay, openNew, suggestions }: Props) {
  const { t, locale, href } = useI18n();
  const { days, outside } = groupByTripDays(trip.agenda, trip.startDate, trip.endDate);
  const conflicts = findConflicts(trip.agenda);
  const [view, setView] = useState<View>("day");
  const [selected, setSelected] = useState<string>(() => {
    if (initialDay && isWithin(initialDay, trip.startDate, trip.endDate)) return initialDay;
    const today = todayInZurich();
    return isWithin(today, trip.startDate, trip.endDate) ? today : trip.startDate;
  });
  const [dialog, setDialog] = useState<{ open: boolean; item: AgendaItemDto | null }>({ open: Boolean(openNew), item: null });

  const selectedDay = days.find((d) => d.date === selected) ?? days[0];
  const titleById = new Map(trip.agenda.map((i) => [i.id, i.title]));

  function openNewItem() {
    setDialog({ open: true, item: null });
  }
  function openItem(item: AgendaItemDto) {
    setDialog({ open: true, item });
  }

  const renderItem = (item: AgendaItemDto, showDate = false) => {
    const conflictIds = conflicts.get(item.id) ?? [];
    return (
      <li key={item.id} className="relative flex items-stretch gap-3 md:gap-4">
        <div className="w-14 shrink-0 pt-4 text-right">
          <time className="block font-mono text-sm font-medium">{minutesToTime(item.startMinutes)}</time>
          <span className="block font-mono text-xs text-muted-foreground">{minutesToTime(item.startMinutes + item.durationMinutes)}</span>
        </div>
        <button
          type="button"
          onClick={() => openItem(item)}
          className={cn(
            "group flex min-w-0 flex-1 items-start gap-3 rounded-2xl bg-card p-3.5 text-left ring-1 transition-all hover:-translate-y-px hover:shadow-sm",
            conflictIds.length > 0 ? "ring-terracotta/50" : "ring-border hover:ring-ink/20",
          )}
          aria-label={fmt(t.agenda.itemAria, {
            title: item.title,
            start: minutesToTime(item.startMinutes),
            end: minutesToTime(item.startMinutes + item.durationMinutes),
          })}
          data-testid="agenda-item"
        >
          {item.place && (
            <PlaceImage image={item.place.image} category="entdecken" sizes="56px" className="size-14 shrink-0 rounded-xl" />
          )}
          <span className="min-w-0 flex-1 space-y-1">
            <span className="eyebrow block text-muted-foreground">
              {showDate ? `${formatDateShort(item.date, locale)} · ` : ""}
              {t.agendaCategories[item.category]} · {formatDuration(item.durationMinutes, locale)}
            </span>
            <span className="block font-semibold tracking-tight">{item.title}</span>
            {item.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{item.location}</span>
              </span>
            )}
            {item.notes && <span className="line-clamp-2 block text-sm text-ink/75">{item.notes}</span>}
            {conflictIds.length > 0 && (
              <span className="flex items-start gap-1.5 rounded-lg bg-warning-bg px-2 py-1.5 text-xs font-medium text-warning-fg" data-testid="conflict-badge">
                <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                {fmt(t.agenda.conflictWith, { titles: conflictIds.map((id) => quote(locale, titleById.get(id) ?? "")).join(", ") })}
              </span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t.agenda.view} className="inline-flex gap-1 rounded-full bg-sand-soft p-1">
          {(
            [
              { key: "day", label: t.agenda.viewDays, icon: Rows3 },
              { key: "list", label: t.agenda.viewList, icon: List },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all",
                view === tab.key ? "bg-card shadow-sm" : "text-ink/65 hover:text-ink",
              )}
            >
              <tab.icon className="size-4" aria-hidden /> {tab.label}
            </button>
          ))}
        </div>
        <Button onClick={openNewItem}>
          <Plus data-icon="inline-start" /> {t.agenda.ownEvent}
        </Button>
      </div>

      {view === "day" ? (
        <>
          <div role="tablist" aria-label={t.agenda.tripDays} className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
            {days.map((day, index) => {
              const active = day.date === selectedDay?.date;
              const hasConflict = day.items.some((i) => conflicts.has(i.id));
              return (
                <button
                  key={day.date}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={fmt(t.agenda.dayAria, {
                    date: formatDateLong(day.date, locale),
                    count: day.items.length,
                    entries: plural(t.common.entries, day.items.length),
                  })}
                  onClick={() => setSelected(day.date)}
                  className={cn(
                    "relative flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-2.5 transition-all",
                    active ? "border-forest bg-forest text-paper shadow-sm" : "border-input bg-card hover:border-ink/30",
                  )}
                >
                  <span className={cn("text-[0.7rem] font-medium uppercase", active ? "text-paper/70" : "text-muted-foreground")}>
                    {fmt(t.agenda.dayN, { n: index + 1 })}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatWeekdayShort(day.date, locale)} {formatDayNumber(day.date, locale)}
                  </span>
                  <span className="mt-1 flex h-1.5 gap-0.5" aria-hidden>
                    {day.items.slice(0, 4).map((i) => (
                      <span key={i.id} className={cn("size-1.5 rounded-full", active ? "bg-paper/80" : "bg-forest/60")} />
                    ))}
                  </span>
                  {hasConflict && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-terracotta" aria-hidden />}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <section aria-labelledby="agenda-tag" role="tabpanel">
              <div className="mb-4">
                <p className="eyebrow text-terracotta-strong">
                  {fmt(t.agenda.dayOf, { n: diffInDays(trip.startDate, selectedDay.date) + 1, total: days.length })}
                </p>
                <h2 id="agenda-tag" className="text-2xl font-semibold tracking-tight">
                  {formatDateLong(selectedDay.date, locale)}
                </h2>
              </div>
              {selectedDay.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-input bg-card/60 px-6 py-10 text-center">
                  <CalendarOff className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
                  <p className="font-medium">{t.agenda.emptyTitle}</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                    {t.agenda.emptyText}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={href("/entdecken")}>
                        <Compass data-icon="inline-start" /> {t.agenda.discover}
                      </Link>
                    </Button>
                    <Button size="sm" onClick={openNewItem}>
                      <Plus data-icon="inline-start" /> {t.agenda.appointment}
                    </Button>
                  </div>
                </div>
              ) : (
                <ol className="space-y-3" aria-label={fmt(t.agenda.programOn, { date: formatDateLong(selectedDay.date, locale) })}>
                  {selectedDay.items.map((item) => renderItem(item))}
                </ol>
              )}
              {suggestions && (
                <div className="mt-8">
                  <FreeTimeSuggestions
                    tripId={trip.id}
                    date={selectedDay.date}
                    dayItems={selectedDay.items}
                    allItems={trip.agenda}
                    data={suggestions}
                  />
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <section aria-label={t.agenda.listLabel} className="space-y-8">
          {trip.agenda.length === 0 && (
            <p className="rounded-3xl border border-dashed border-input p-8 text-center text-muted-foreground">
              {t.agenda.listEmpty}
            </p>
          )}
          {days
            .filter((d) => d.items.length > 0)
            .map((day) => (
              <div key={day.date}>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">{formatDateLong(day.date, locale)}</h2>
                <ol className="space-y-3">{day.items.map((item) => renderItem(item))}</ol>
              </div>
            ))}
          {days.some((d) => d.items.length === 0) && trip.agenda.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t.agenda.freeDays}{" "}
              {days
                .filter((d) => d.items.length === 0)
                .map((d) => `${formatWeekdayShort(d.date, locale)} ${formatDayNumber(d.date, locale)}`)
                .join(", ")}
            </p>
          )}
        </section>
      )}

      {outside.length > 0 && (
        <section aria-labelledby="ausserhalb" className="rounded-3xl bg-warning-bg p-5">
          <h2 id="ausserhalb" className="flex items-center gap-2 font-semibold text-warning-fg">
            <TriangleAlert className="size-4" aria-hidden /> {t.agenda.outsideTitle}
          </h2>
          <p className="mt-1 mb-4 text-sm text-warning-fg/85">
            {t.agenda.outsideText}
          </p>
          <ol className="space-y-3">{outside.map((item) => renderItem(item, true))}</ol>
        </section>
      )}

      <AgendaItemDialog
        trip={trip}
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        item={dialog.item}
        defaultDate={selectedDay?.date}
        onSaved={(date) => isWithin(date, trip.startDate, trip.endDate) && setSelected(date)}
      />
    </div>
  );
}
