"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAgendaItemAction } from "@/app/actions";
import { ScheduleFields, type ScheduleValue } from "@/components/agenda/schedule-fields";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { suggestStartMinutes } from "@/lib/agenda";
import { PLACE_KIND_TO_AGENDA, type PlaceKindValue } from "@/lib/catalog-meta";
import { formatDateShort, isWithin, minutesToTime, todayInZurich } from "@/lib/dates";
import type { TripDetailDto } from "@/lib/types";

type PlaceRef = {
  id: string;
  slug: string;
  name: string;
  kind: PlaceKindValue;
  durationMinutes: number;
  location: string | null;
};

type Props = {
  place: PlaceRef;
  trigger?: React.ReactNode;
};

function defaultSchedule(trip: TripDetailDto, duration: number): ScheduleValue {
  const today = todayInZurich();
  const date = isWithin(today, trip.startDate, trip.endDate) ? today : trip.startDate;
  const start = suggestStartMinutes(trip.agenda, date);
  return { date, startTime: minutesToTime(start), durationMinutes: Math.min(duration, 24 * 60 - start) };
}

/** Ort mit Datum und Uhrzeit in die Agenda eines Aufenthalts übernehmen. */
export function AddToTripDialog({ place, trigger }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="flex-1 sm:flex-none">
            <CalendarPlus data-icon="inline-start" /> {t.addToTrip.trigger}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        {/* Inhalt mountet erst beim Öffnen → frischer Zustand und neuer Idempotenzschlüssel */}
        <AddToTripContent place={place} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddToTripContent({ place, onDone }: { place: PlaceRef; onDone: () => void }) {
  const router = useRouter();
  const formId = useId();
  const { t, locale, href, message } = useI18n();
  const { trips, tripId, setTripId, trip, error } = useVisitorTrips();
  const [schedule, setSchedule] = useState<ScheduleValue | null>(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());

  // Zeitvorschlag, sobald die Agenda des gewählten Aufenthalts geladen ist
  const effectiveSchedule = schedule && trip && isWithin(schedule.date, trip.startDate, trip.endDate)
    ? schedule
    : trip
      ? defaultSchedule(trip, place.durationMinutes)
      : null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trip || !effectiveSchedule || pending) return;
    setPending(true);
    setErrors({});
    const result = await createAgendaItemAction(
      trip.id,
      {
        title: place.name,
        date: effectiveSchedule.date,
        startTime: effectiveSchedule.startTime,
        durationMinutes: effectiveSchedule.durationMinutes,
        category: PLACE_KIND_TO_AGENDA[place.kind],
        location: place.location ?? undefined,
        notes,
        placeId: place.id,
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
    const { item, conflicts } = result.data;
    const text = fmt(t.addToTrip.planned, {
      name: place.name,
      date: formatDateShort(item.date, locale),
      time: minutesToTime(item.startMinutes),
    });
    const action = { label: t.addToTrip.agenda, onClick: () => router.push(href(`/aufenthalt/${trip.id}/agenda?tag=${item.date}`)) };
    if (conflicts.length > 0) {
      toast.warning(text, { description: fmt(t.addToTrip.conflictWith, { title: conflicts[0].title }), action });
    } else {
      toast.success(text, { action });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.addToTrip.title}</DialogTitle>
        <DialogDescription>{fmt(t.addToTrip.question, { name: place.name })}</DialogDescription>
      </DialogHeader>

      {error || !trips || trips.length === 0 ? (
        <TripsState trips={trips} error={error} itemName={place.name} returnTo={`/entdecken/${place.slug}`} />
      ) : (
        <form id={formId} onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
          <TripChoice trips={trips} tripId={tripId} onChange={setTripId} />
          {trip && effectiveSchedule ? (
            <ScheduleFields
              value={effectiveSchedule}
              onChange={setSchedule}
              tripStart={trip.startDate}
              tripEnd={trip.endDate}
              existing={trip.agenda}
              errors={errors}
            />
          ) : (
            <AgendaLoading />
          )}
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-notes`}>{t.addToTrip.note}</Label>
            <Textarea
              id={`${formId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder={t.addToTrip.notePlaceholder}
              rows={2}
            />
          </div>
        </form>
      )}

      {trips && trips.length > 0 && (
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={!trip || !effectiveSchedule || pending}>
            {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <CalendarPlus data-icon="inline-start" />}
            {t.addToTrip.submit}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}
