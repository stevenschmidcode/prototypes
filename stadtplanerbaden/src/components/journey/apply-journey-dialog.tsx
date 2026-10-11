"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarPlus, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { applyJourneyAction } from "@/app/actions";
import { DayPicker } from "@/components/agenda/schedule-fields";
import { AgendaLoading, TripChoice, TripsState, useVisitorTrips } from "@/components/agenda/trip-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { scheduleStops } from "@/lib/recommendations";
import {
  formatDateShort,
  isTime,
  isWithin,
  minutesToTime,
  timeToMinutes,
  todayInZurich,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export type JourneyStopRef = { id: string; name: string; durationMinutes: number };

type Props = {
  journey: { slug: string; title: string; stops: JourneyStopRef[] };
  className?: string;
};

type EditableStop = JourneyStopRef & { included: boolean };

const BUFFERS = [0, 15, 30];
const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120, 150, 180, 240];

/** Thementour – auf Wunsch angepasst – als Tagesprogramm in einen Aufenthalt legen */
export function ApplyJourneyDialog({ journey, className }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className={className}>
          <CalendarPlus data-icon="inline-start" /> {t.journeys.applyTrigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ApplyJourneyContent journey={journey} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ApplyJourneyContent({ journey, onDone }: { journey: Props["journey"]; onDone: () => void }) {
  const router = useRouter();
  const formId = useId();
  const { t, locale, href, message } = useI18n();
  const { trips, tripId, setTripId, trip, error } = useVisitorTrips();
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("10:00");
  const [buffer, setBuffer] = useState(15);
  const [stops, setStops] = useState<EditableStop[]>(() => journey.stops.map((s) => ({ ...s, included: true })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());

  const today = todayInZurich();
  const effectiveDate =
    trip && date && isWithin(date, trip.startDate, trip.endDate)
      ? date
      : trip
        ? isWithin(today, trip.startDate, trip.endDate)
          ? today
          : trip.startDate
        : null;

  const scheduled = isTime(startTime) ? scheduleStops(stops, timeToMinutes(startTime), buffer) : [];
  const includedCount = stops.filter((s) => s.included).length;
  const plannedCount = scheduled.filter((s) => s.start != null).length;
  const customized =
    stops.some((s) => !s.included) ||
    stops.some((s, i) => s.id !== journey.stops[i].id || s.durationMinutes !== journey.stops[i].durationMinutes);

  function updateStop(index: number, patch: Partial<EditableStop>) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function move(index: number, delta: -1 | 1) {
    setStops((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trip || !effectiveDate || pending) return;
    setPending(true);
    setErrors({});
    const result = await applyJourneyAction(
      trip.id,
      {
        journeySlug: journey.slug,
        date: effectiveDate,
        startTime,
        bufferMinutes: buffer,
        // Nur bei Anpassungen eine eigene Liste senden – sonst gilt die kuratierte Tour
        stops: customized
          ? stops.filter((s) => s.included).map((s) => ({ stopId: s.id, durationMinutes: s.durationMinutes }))
          : undefined,
        clientRequestId: requestId,
      },
      locale,
    );
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(message(result.error));
      return;
    }
    onDone();
    const { created, total } = result.data;
    const text =
      created < total
        ? fmt(t.journeys.appliedPartial, { count: created, total })
        : fmt(t.journeys.applied, { count: created, date: formatDateShort(effectiveDate, locale) });
    toast.success(text, {
      action: { label: t.addToTrip.agenda, onClick: () => router.push(href(`/aufenthalt/${trip.id}/agenda?tag=${effectiveDate}`)) },
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.journeys.applyTitle}</DialogTitle>
        <DialogDescription>
          {journey.title} – {t.journeys.applyText}
        </DialogDescription>
      </DialogHeader>

      {error || !trips || trips.length === 0 ? (
        <TripsState trips={trips} error={error} itemName={journey.title} returnTo={`/touren/${journey.slug}`} />
      ) : (
        <form id={formId} onSubmit={onSubmit} className="grid min-w-0 grid-cols-1 gap-5">
          <TripChoice trips={trips} tripId={tripId} onChange={setTripId} />
          {trip && effectiveDate ? (
            <>
              <DayPicker
                value={effectiveDate}
                onChange={setDate}
                tripStart={trip.startDate}
                tripEnd={trip.endDate}
                error={errors.date ? message(errors.date) : undefined}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-2">
                  <Label htmlFor={`${formId}-start`}>{t.journeys.startAt}</Label>
                  <Input
                    id={`${formId}-start`}
                    type="time"
                    step={300}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    aria-invalid={Boolean(errors.startTime) || undefined}
                  />
                </div>
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-sm font-medium">{t.journeys.buffer}</legend>
                  <div className="flex gap-1.5">
                    {BUFFERS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        aria-pressed={buffer === minutes}
                        onClick={() => setBuffer(minutes)}
                        className={cn(
                          "h-11 flex-1 rounded-xl border text-xs font-medium transition-colors",
                          buffer === minutes ? "border-forest bg-forest-soft text-forest" : "border-input bg-card hover:border-ink/30",
                        )}
                      >
                        {fmt(t.journeys.bufferValue, { minutes })}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
              {errors.startTime && <p className="text-sm text-destructive">{message(errors.startTime)}</p>}

              <fieldset className="grid grid-cols-1 gap-2">
                <legend className="sr-only">{t.journeys.customizeTitle}</legend>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm font-medium">
                    {t.journeys.customizeTitle}
                    <span className="block text-xs font-normal text-muted-foreground">{t.journeys.customizeHint}</span>
                  </p>
                  {customized && (
                    <button
                      type="button"
                      onClick={() => setStops(journey.stops.map((s) => ({ ...s, included: true })))}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-forest hover:bg-sand-soft"
                    >
                      <RotateCcw className="size-3.5" aria-hidden /> {t.journeys.reset}
                    </button>
                  )}
                </div>
                <ol className="grid grid-cols-1 gap-1.5" aria-label={t.journeys.stopsTitle} data-testid="journey-stops">
                  {scheduled.map((stop, index) => (
                    <li
                      key={stop.id}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border p-2 pl-3 transition-colors",
                        stop.included ? "border-input bg-card" : "border-dashed border-input opacity-70",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={stop.included}
                        onChange={(e) => updateStop(index, { included: e.target.checked })}
                        aria-label={fmt(t.journeys.includeStop, { name: stop.name })}
                        className="size-4 shrink-0 accent-[var(--brand-forest)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", !stop.included && "line-through")}>{stop.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {stop.start != null
                            ? `${minutesToTime(stop.start)}–${minutesToTime(stop.start + stop.durationMinutes)}`
                            : stop.included
                              ? t.journeys.afterMidnight
                              : t.journeys.skipped}
                        </p>
                      </div>
                      <select
                        value={stop.durationMinutes}
                        onChange={(e) => updateStop(index, { durationMinutes: Number(e.target.value) })}
                        aria-label={fmt(t.journeys.stopDuration, { name: stop.name })}
                        disabled={!stop.included}
                        className="h-9 w-[5.75rem] shrink-0 rounded-lg border border-input bg-card px-1.5 text-xs disabled:opacity-50"
                      >
                        {[...new Set([...DURATIONS, stop.durationMinutes])]
                          .sort((a, b) => a - b)
                          .map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {/* kompakt in Minuten, damit die Auswahl schmal bleibt */}
                              {minutes} {locale === "de" ? "Min." : "min"}
                            </option>
                          ))}
                      </select>
                      <div className="flex shrink-0 flex-col">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={fmt(t.journeys.moveUp, { name: stop.name })}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sand-soft hover:text-ink disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === scheduled.length - 1}
                          aria-label={fmt(t.journeys.moveDown, { name: stop.name })}
                          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sand-soft hover:text-ink disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {fmt(t.journeys.selectedCount, { count: plannedCount, total: journey.stops.length })}
                  {plannedCount < includedCount && ` · ${fmt(t.journeys.appliedPartial, { count: plannedCount, total: includedCount })}`}
                </p>
                {errors.stops && <p className="text-sm text-destructive">{message(errors.stops)}</p>}
              </fieldset>
            </>
          ) : (
            <AgendaLoading />
          )}
        </form>
      )}

      {trips && trips.length > 0 && (
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={!trip || !effectiveDate || plannedCount === 0 || pending}>
            {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <CalendarPlus data-icon="inline-start" />}
            {t.journeys.applySubmit}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}
