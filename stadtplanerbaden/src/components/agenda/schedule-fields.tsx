"use client";

import { useId } from "react";
import { TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { quote } from "@/i18n/messages";
import { conflictsWith, type TimedItem } from "@/lib/agenda";
import {
  eachDay,
  formatDateLong,
  formatDuration,
  formatWeekdayShort,
  isTime,
  MINUTES_PER_DAY,
  minutesToTime,
  timeToMinutes,
  type IsoDate,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export type ScheduleValue = {
  date: IsoDate;
  startTime: string;
  durationMinutes: number;
};

/** Tagesauswahl aus den tatsächlichen Tagen eines Aufenthalts */
export function DayPicker({
  value,
  onChange,
  tripStart,
  tripEnd,
  error,
}: {
  value: IsoDate;
  onChange: (date: IsoDate) => void;
  tripStart: IsoDate;
  tripEnd: IsoDate;
  error?: string;
}) {
  const { t, locale } = useI18n();
  return (
    <fieldset className="grid gap-2.5">
      <legend className="mb-2.5 text-sm font-medium">{t.schedule.day}</legend>
      <div role="radiogroup" aria-label={t.schedule.chooseDay} className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {eachDay(tripStart, tripEnd).map((day) => {
          const selected = day === value;
          return (
            <button
              key={day}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={formatDateLong(day, locale)}
              onClick={() => onChange(day)}
              className={cn(
                "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center transition-all",
                selected ? "border-forest bg-forest text-paper shadow-sm" : "border-input bg-card hover:border-ink/30",
              )}
            >
              <span className={cn("text-[0.7rem] font-medium uppercase", selected ? "text-paper/75" : "text-muted-foreground")}>
                {formatWeekdayShort(day, locale)}
              </span>
              <span className="text-lg leading-tight font-semibold">{Number(day.slice(8))}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  );
}

type Props = {
  value: ScheduleValue;
  onChange: (value: ScheduleValue) => void;
  tripStart: IsoDate;
  tripEnd: IsoDate;
  /** Bestehende Einträge des Aufenthalts – für die Konfliktwarnung */
  existing: (TimedItem & { title: string })[];
  /** ID des bearbeiteten Eintrags (wird bei Konflikten ignoriert) */
  editingId?: string;
  /** Meldungsschlüssel je Feld */
  errors?: Record<string, string>;
};

const DURATION_PRESETS = [30, 60, 90, 120, 180];

/** Datum (aus den echten Reisetagen), Start- und Endzeit inkl. Konfliktwarnung. */
export function ScheduleFields({ value, onChange, tripStart, tripEnd, existing, editingId, errors = {} }: Props) {
  const id = useId();
  const { t, locale, message } = useI18n();
  const startValid = isTime(value.startTime);
  const startMinutes = startValid ? timeToMinutes(value.startTime) : null;
  const endMinutes = startMinutes != null ? startMinutes + value.durationMinutes : null;
  const endTime =
    endMinutes == null || endMinutes > MINUTES_PER_DAY
      ? ""
      : endMinutes === MINUTES_PER_DAY
        ? "00:00"
        : minutesToTime(endMinutes);

  const conflicts =
    startMinutes != null
      ? conflictsWith({ id: editingId, date: value.date, startMinutes, durationMinutes: value.durationMinutes }, existing)
      : [];

  function setEnd(time: string) {
    if (!isTime(time) || startMinutes == null) return;
    let end = timeToMinutes(time);
    if (time === "00:00") end = MINUTES_PER_DAY;
    const duration = end - startMinutes;
    if (duration > 0) onChange({ ...value, durationMinutes: duration });
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <DayPicker
        value={value.date}
        onChange={(date) => onChange({ ...value, date })}
        tripStart={tripStart}
        tripEnd={tripEnd}
        error={errors.date ? message(errors.date) : undefined}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-start`}>{t.schedule.start}</Label>
          <Input
            id={`${id}-start`}
            type="time"
            step={300}
            required
            value={value.startTime}
            onChange={(e) => onChange({ ...value, startTime: e.target.value })}
            aria-invalid={Boolean(errors.startTime) || undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-end`}>{t.schedule.end}</Label>
          <Input
            id={`${id}-end`}
            type="time"
            step={300}
            value={endTime}
            onChange={(e) => setEnd(e.target.value)}
            aria-invalid={Boolean(errors.durationMinutes) || undefined}
            aria-describedby={`${id}-duration`}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <p id={`${id}-duration`} className="text-sm text-muted-foreground">
          {t.schedule.duration} <span className="font-medium text-foreground">{formatDuration(value.durationMinutes, locale)}</span>
        </p>
        <div className="flex flex-wrap gap-2" aria-label={t.schedule.quickDuration}>
          {DURATION_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onChange({ ...value, durationMinutes: minutes })}
              aria-pressed={value.durationMinutes === minutes}
              className={cn(
                "h-9 rounded-full border px-3.5 text-xs font-medium transition-colors",
                value.durationMinutes === minutes ? "border-forest bg-forest-soft text-forest" : "border-input bg-card hover:border-ink/30",
              )}
            >
              {formatDuration(minutes, locale)}
            </button>
          ))}
        </div>
        {(errors.startTime || errors.durationMinutes) && (
          <p className="text-sm text-destructive">{message(errors.startTime ?? errors.durationMinutes)}</p>
        )}
      </div>

      {conflicts.length > 0 && (
        <div role="status" className="flex gap-3 rounded-2xl bg-warning-bg p-4 text-sm text-warning-fg" data-testid="conflict-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium">{t.schedule.conflictTitle}</p>
            <ul className="space-y-0.5">
              {conflicts.map((c) => (
                <li key={c.id}>
                  {quote(locale, c.title)} ({minutesToTime(c.startMinutes)}–{minutesToTime(c.startMinutes + c.durationMinutes)})
                </li>
              ))}
            </ul>
            <p className="text-warning-fg/85">{t.schedule.conflictHint}</p>
          </div>
        </div>
      )}
    </div>
  );
}
