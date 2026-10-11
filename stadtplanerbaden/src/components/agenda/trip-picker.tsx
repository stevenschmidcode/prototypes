"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { formatDateRange, isWithin, todayInZurich } from "@/lib/dates";
import type { TripDetailDto, TripSummaryDto } from "@/lib/types";
import { cn } from "@/lib/utils";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()) as T;
}

function pickDefaultTrip(trips: TripSummaryDto[]): TripSummaryDto | undefined {
  const today = todayInZurich();
  return (
    trips.find((t) => isWithin(today, t.startDate, t.endDate)) ??
    trips.find((t) => t.startDate >= today) ??
    trips[trips.length - 1]
  );
}

/**
 * Lädt die Aufenthalte des Gastes und die Details (inkl. Agenda) des gewählten
 * Aufenthalts – für Dialoge, die etwas in eine Agenda eintragen.
 * Muss erst beim Öffnen eines Dialogs gemountet werden.
 */
export function useVisitorTrips() {
  const { locale } = useI18n();
  const [trips, setTrips] = useState<TripSummaryDto[] | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<TripDetailDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<{ trips: TripSummaryDto[] }>("/api/me/trips")
      .then((data) => {
        if (cancelled) return;
        setTrips(data.trips);
        setTripId(pickDefaultTrip(data.trips)?.id ?? null);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    getJson<{ trip: TripDetailDto }>(`/api/me/trips/${tripId}?lang=${locale}`)
      .then((data) => !cancelled && setLoaded(data.trip))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [tripId, locale]);

  // Nur Daten des aktuell gewählten Aufenthalts verwenden
  const trip = loaded && loaded.id === tripId ? loaded : null;
  return { trips, tripId, setTripId, trip, error };
}

/** Lade-, Fehler- und «noch kein Aufenthalt»-Zustände für Agenda-Dialoge */
export function TripsState({
  trips,
  error,
  itemName,
  returnTo,
}: {
  trips: TripSummaryDto[] | null;
  error: boolean;
  itemName: string;
  returnTo: string;
}) {
  const { t, href } = useI18n();
  if (error) return <p className="rounded-2xl bg-destructive/10 p-4 text-destructive">{t.addToTrip.loadError}</p>;
  if (trips === null) {
    return (
      <div className="flex items-center gap-2 py-6 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden /> {t.common.loading}
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-2xl bg-sand-soft p-5">
      <p className="font-medium">{t.addToTrip.noTrip}</p>
      <p className="text-muted-foreground">{fmt(t.addToTrip.noTripText, { name: itemName })}</p>
      <Button asChild>
        <Link href={href(`/aufenthalt/neu?zurueck=${encodeURIComponent(returnTo)}`)}>{t.addToTrip.createTrip}</Link>
      </Button>
    </div>
  );
}

/** Auswahl des Aufenthalts (nur sichtbar, wenn es mehrere gibt) */
export function TripChoice({
  trips,
  tripId,
  onChange,
}: {
  trips: TripSummaryDto[];
  tripId: string | null;
  onChange: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  if (trips.length < 2) return null;
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">{t.addToTrip.trip}</legend>
      <div className="grid gap-2">
        {trips.map((trip) => (
          <label
            key={trip.id}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors",
              trip.id === tripId ? "border-forest bg-forest-soft" : "border-input bg-card hover:border-ink/30",
            )}
          >
            <span>
              <span className="block font-medium">{trip.name}</span>
              <span className="text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate, locale)}</span>
            </span>
            <input
              type="radio"
              name="trip"
              value={trip.id}
              checked={trip.id === tripId}
              onChange={() => onChange(trip.id)}
              className="size-4 accent-[var(--brand-forest)]"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Lade-Hinweis für die Agenda des gewählten Aufenthalts */
export function AgendaLoading() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 py-4 text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {t.addToTrip.agendaLoading}
    </div>
  );
}
