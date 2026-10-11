"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { countItemsOutsideRangeAction, createTripAction, updateTripAction } from "@/app/actions";
import { JourneyIcon, journeyTheme } from "@/components/journey/journey-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { fmt, plural } from "@/i18n/messages";
import { addDays, diffInDays, formatDateRange, isIsoDate, todayInZurich, type IsoDate } from "@/lib/dates";
import type { JourneySummaryDto } from "@/lib/types";
import { toFieldErrors, tripInputSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Values = { name: string; startDate: string; endDate: string; notes: string; journeySlug: string };

type Props = { journeys: JourneySummaryDto[] } & (
  | { mode: "create"; returnTo?: string; preselectJourney?: string }
  | { mode: "edit"; tripId: string; initial: Values }
);

/** Nächstes Wochenende (Freitag–Sonntag) als Vorschlag. */
function upcomingWeekend(today: IsoDate): { start: IsoDate; end: IsoDate } {
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = So … 5 = Fr
  const offset = (5 - weekday + 7) % 7;
  const start = addDays(today, offset);
  return { start, end: addDays(start, 2) };
}

export function TripForm(props: Props) {
  const router = useRouter();
  const id = useId();
  const { t, locale, href, message } = useI18n();
  const [values, setValues] = useState<Values>(() => {
    if (props.mode === "edit") return props.initial;
    const { start, end } = upcomingWeekend(todayInZurich());
    return { name: t.tripForm.defaultName, startDate: start, endDate: end, notes: "", journeySlug: props.preselectJourney ?? "" };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [outsideCount, setOutsideCount] = useState(0);
  // Idempotenzschlüssel: bleibt für diesen Formularaufruf gleich (Schutz vor Doppelspeicherung)
  const requestId = useRef<string>("");

  useEffect(() => {
    if (!requestId.current) requestId.current = crypto.randomUUID();
  }, []);

  // Beim Bearbeiten warnen, wenn Agendaeinträge ausserhalb des neuen Zeitraums lägen
  const editTripId = props.mode === "edit" ? props.tripId : null;
  useEffect(() => {
    if (!editTripId) return;
    if (!isIsoDate(values.startDate) || !isIsoDate(values.endDate) || values.endDate < values.startDate) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      countItemsOutsideRangeAction(editTripId, values.startDate, values.endDate).then((count) => !cancelled && setOutsideCount(count));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editTripId, values.startDate, values.endDate]);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Anreise nach hinten verschoben → Abreise mitziehen
      if (key === "startDate" && isIsoDate(value) && isIsoDate(prev.endDate) && prev.endDate < value) {
        next.endDate = value;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "", _form: "" }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const input = { ...values, clientRequestId: props.mode === "create" ? requestId.current : undefined };
    const parsed = tripInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setPending(true);
    const result = props.mode === "create" ? await createTripAction(input) : await updateTripAction(props.tripId, input);
    if (!result.ok) {
      setPending(false);
      setErrors(result.fieldErrors ?? { _form: result.error });
      toast.error(message(result.error));
      return;
    }
    toast.success(props.mode === "create" ? t.tripForm.created : t.common.saved);
    if (props.mode === "create") {
      const tripId = result.data.id;
      const returnTo = props.returnTo && props.returnTo.startsWith("/") && !props.returnTo.startsWith("//") ? props.returnTo : null;
      router.push(href(returnTo ?? `/aufenthalt/${tripId}/unterkunft?einrichtung=1`));
    } else {
      router.push(href(`/aufenthalt/${props.tripId}`));
    }
  }

  const validRange = isIsoDate(values.startDate) && isIsoDate(values.endDate) && values.endDate >= values.startDate;
  const nights = validRange ? diffInDays(values.startDate, values.endDate) : 0;
  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} className="text-sm text-destructive">
        {message(errors[key])}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-name`}>{t.tripForm.name}</Label>
        <Input
          id={`${id}-name`}
          name="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={80}
          required
          autoComplete="off"
          aria-invalid={Boolean(errors.name) || undefined}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
        />
        {fieldError("name")}
        {props.mode === "create" && (
          <div className="flex flex-wrap gap-2 pt-1" aria-label={t.tripForm.nameSuggestions}>
            {t.tripForm.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => update("name", suggestion)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                  values.name === suggestion ? "border-forest bg-forest-soft text-forest" : "border-input bg-card hover:border-ink/30",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-start`}>{t.tripForm.arrival}</Label>
          <Input
            id={`${id}-start`}
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            required
            aria-invalid={Boolean(errors.startDate) || undefined}
            aria-describedby={errors.startDate ? `${id}-startDate-error` : undefined}
          />
          {fieldError("startDate")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-end`}>{t.tripForm.departure}</Label>
          <Input
            id={`${id}-end`}
            name="endDate"
            type="date"
            value={values.endDate}
            min={isIsoDate(values.startDate) ? values.startDate : undefined}
            onChange={(e) => update("endDate", e.target.value)}
            required
            aria-invalid={Boolean(errors.endDate) || undefined}
            aria-describedby={errors.endDate ? `${id}-endDate-error` : undefined}
          />
          {fieldError("endDate")}
        </div>
      </div>

      {validRange && (
        <p className="-mt-2 rounded-2xl bg-sand-soft px-4 py-3 text-sm" aria-live="polite">
          <span className="font-medium">{formatDateRange(values.startDate, values.endDate, locale)}</span>
          <span className="text-muted-foreground">
            {" · "}
            {nights === 0 ? t.common.dayTrip : `${nights} ${plural(t.common.nights, nights)}`}
          </span>
        </p>
      )}

      {outsideCount > 0 && (
        <div role="status" className="flex gap-3 rounded-2xl bg-warning-bg p-4 text-sm text-warning-fg">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{outsideCount === 1 ? t.tripForm.outsideOne : fmt(t.tripForm.outsideMany, { count: outsideCount })}</p>
        </div>
      )}

      {props.journeys.length > 0 && (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">
            {t.tripForm.profile} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
          </legend>
          <p className="-mt-1 text-sm text-muted-foreground">{t.tripForm.profileHint}</p>
          <div role="radiogroup" aria-label={t.tripForm.profile} className="grid grid-cols-1 grid-cols-2 gap-2 sm:grid-cols-3">
            {[{ slug: "", title: t.tripForm.profileNone, icon: "", theme: "sand" }, ...props.journeys].map((journey) => {
              const selected = values.journeySlug === journey.slug;
              const theme = journeyTheme(journey.theme);
              return (
                <button
                  key={journey.slug || "none"}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("journeySlug", journey.slug)}
                  className={cn(
                    "relative flex min-h-16 items-center gap-2.5 rounded-2xl border p-3 text-left text-sm font-medium transition-all",
                    selected ? "border-forest bg-forest-soft ring-1 ring-forest" : "border-input bg-card hover:border-ink/30",
                  )}
                >
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", journey.slug ? theme.card : "bg-sand-soft")}>
                    {journey.slug ? <JourneyIcon name={journey.icon} className="size-4" /> : <Sparkles className="size-4" aria-hidden />}
                  </span>
                  <span className="leading-tight">{journey.title}</span>
                  {selected && <Check className="absolute top-2 right-2 size-3.5 text-forest" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${id}-notes`}>
          {t.tripForm.notes} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
        </Label>
        <Textarea
          id={`${id}-notes`}
          name="notes"
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder={t.tripForm.notesPlaceholder}
          aria-invalid={Boolean(errors.notes) || undefined}
        />
        {fieldError("notes")}
      </div>

      {errors._form && <p className="text-sm text-destructive">{message(errors._form)}</p>}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          {t.common.cancel}
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {props.mode === "create" ? t.tripForm.create : t.tripForm.saveChanges}
        </Button>
      </div>
    </form>
  );
}
