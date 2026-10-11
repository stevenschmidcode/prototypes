"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createAgendaItemAction, deleteAgendaItemAction, updateAgendaItemAction } from "@/app/actions";
import { ScheduleFields, type ScheduleValue } from "@/components/agenda/schedule-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestStartMinutes } from "@/lib/agenda";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { formatDateShort, isWithin, minutesToTime } from "@/lib/dates";
import type { AgendaItemDto, TripDetailDto } from "@/lib/types";
import {
  AGENDA_CATEGORIES,
  agendaItemInputSchema,
  toFieldErrors,
  type AgendaCategoryValue,
} from "@/lib/validation";

type Props = {
  trip: Pick<TripDetailDto, "id" | "startDate" | "endDate" | "agenda">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Zu bearbeitender Eintrag – ohne: neuer eigener Termin */
  item?: AgendaItemDto | null;
  defaultDate?: string;
  onSaved?: (date: string) => void;
};

type Values = { title: string; category: AgendaCategoryValue; location: string; notes: string };

function initialSchedule(trip: Props["trip"], item: AgendaItemDto | null | undefined, defaultDate?: string): ScheduleValue {
  if (item) return { date: item.date, startTime: minutesToTime(item.startMinutes), durationMinutes: item.durationMinutes };
  const date = defaultDate && isWithin(defaultDate, trip.startDate, trip.endDate) ? defaultDate : trip.startDate;
  return { date, startTime: minutesToTime(suggestStartMinutes(trip.agenda, date)), durationMinutes: 60 };
}

export function AgendaItemDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {/* Inhalt mountet bei jedem Öffnen neu → frischer Zustand und neuer Idempotenzschlüssel */}
        <AgendaItemForm key={props.item?.id ?? "neu"} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function AgendaItemForm({ trip, onOpenChange, item, defaultDate, onSaved }: Props) {
  const id = useId();
  const { t, locale, href, message } = useI18n();
  const editing = Boolean(item);
  const [values, setValues] = useState<Values>(() => ({
    title: item?.title ?? "",
    category: item?.category ?? "OTHER",
    location: item?.location ?? "",
    notes: item?.notes ?? "",
  }));
  const [schedule, setSchedule] = useState<ScheduleValue>(() => initialSchedule(trip, item, defaultDate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const input = {
      ...values,
      ...schedule,
      placeId: item?.place?.id,
      clientRequestId: editing ? undefined : requestId,
    };
    const parsed = agendaItemInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setPending(true);
    const result = item
      ? await updateAgendaItemAction(item.id, input, locale)
      : await createAgendaItemAction(trip.id, input, locale);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(message(result.error));
      return;
    }
    const saved = result.data.item;
    const text = fmt(editing ? t.agendaDialog.savedToast : t.agendaDialog.createdToast, {
      date: formatDateShort(saved.date, locale),
      time: minutesToTime(saved.startMinutes),
    });
    if (result.data.conflicts.length > 0) {
      toast.warning(text, { description: fmt(t.addToTrip.conflictWith, { title: result.data.conflicts[0].title }) });
    } else {
      toast.success(text);
    }
    onOpenChange(false);
    onSaved?.(saved.date);
  }

  async function onDelete() {
    if (!item || pending) return;
    setPending(true);
    const result = await deleteAgendaItemAction(item.id);
    setPending(false);
    if (!result.ok) {
      toast.error(message(result.error));
      return;
    }
    toast.success(fmt(t.agendaDialog.deletedToast, { title: item.title }));
    onOpenChange(false);
  }

  return (
    <>
        <DialogHeader>
          <DialogTitle>{editing ? t.agendaDialog.editTitle : t.agendaDialog.newTitle}</DialogTitle>
          <DialogDescription>
            {editing ? t.agendaDialog.editText : t.agendaDialog.newText}
          </DialogDescription>
        </DialogHeader>

        <form id={id} onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-title`}>{t.agendaDialog.title}</Label>
            <Input
              id={`${id}-title`}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t.agendaDialog.titlePlaceholder}
              maxLength={120}
              aria-invalid={Boolean(errors.title) || undefined}
              aria-describedby={errors.title ? `${id}-title-error` : undefined}
            />
            {errors.title && (
              <p id={`${id}-title-error`} className="text-sm text-destructive">
                {message(errors.title)}
              </p>
            )}
            {item?.place && (
              <p className="text-xs text-muted-foreground">
                {t.agendaDialog.linkedWith}{" "}
                <Link href={href(`/entdecken/${item.place.slug}`)} className="font-medium underline underline-offset-2">
                  {item.place.name}
                </Link>
              </p>
            )}
          </div>

          <ScheduleFields
            value={schedule}
            onChange={setSchedule}
            tripStart={trip.startDate}
            tripEnd={trip.endDate}
            existing={trip.agenda}
            editingId={item?.id}
            errors={errors}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-category`}>{t.agendaDialog.category}</Label>
              <select
                id={`${id}-category`}
                value={values.category}
                onChange={(e) => set("category", e.target.value as AgendaCategoryValue)}
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {AGENDA_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t.agendaCategories[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-location`}>
                {t.agendaDialog.location} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
              </Label>
              <Input
                id={`${id}-location`}
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder={t.agendaDialog.locationPlaceholder}
                maxLength={160}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${id}-notes`}>
              {t.agendaDialog.notes} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
            </Label>
            <Textarea id={`${id}-notes`} value={values.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} rows={2} />
          </div>
          {errors._form && <p className="text-sm text-destructive">{message(errors._form)}</p>}
        </form>

        <DialogFooter className="sm:justify-between">
          {editing ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  {t.agendaDialog.no}
                </Button>
                <Button type="button" size="sm" className="bg-destructive text-white hover:bg-destructive/90" onClick={onDelete} disabled={pending}>
                  {t.agendaDialog.confirmDelete}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" /> {t.common.delete}
              </Button>
            )
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" form={id} disabled={pending}>
              {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {editing ? t.agendaDialog.submitEdit : t.agendaDialog.submitNew}
            </Button>
          </div>
        </DialogFooter>
    </>
  );
}
