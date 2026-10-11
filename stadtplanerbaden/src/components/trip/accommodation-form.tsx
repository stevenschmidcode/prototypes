"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeAccommodationAction, saveAccommodationAction } from "@/app/actions";
import { PlaceImage } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { normalizeSearch } from "@/lib/catalog-meta";
import { formatAddress } from "@/lib/maps";
import type { AccommodationDto, TripAccommodationDto } from "@/lib/types";
import {
  ACCOMMODATION_TYPES,
  accommodationInputSchema,
  toFieldErrors,
  type AccommodationTypeValue,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

type Mode = "catalog" | "manual" | "none";

type Values = {
  accommodationId: string;
  type: AccommodationTypeValue;
  name: string;
  street: string;
  postalCode: string;
  locality: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  phone: string;
  websiteUrl: string;
  notes: string;
};

type Props = {
  tripId: string;
  tripStart: string;
  tripEnd: string;
  current: TripAccommodationDto | null;
  catalog: AccommodationDto[];
  onboarding?: boolean;
};

export function AccommodationForm({ tripId, tripStart, tripEnd, current, catalog, onboarding }: Props) {
  const router = useRouter();
  const id = useId();
  const { t, href, message } = useI18n();
  const [mode, setMode] = useState<Mode>(current ? (current.accommodationId ? "catalog" : "manual") : "catalog");
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<Values>({
    accommodationId: current?.accommodationId ?? "",
    type: current?.type ?? "HOTEL",
    name: current?.name ?? "",
    street: current?.address.street ?? "",
    postalCode: current?.address.postalCode ?? "",
    locality: current?.address.locality ?? "",
    checkInDate: current?.checkInDate ?? tripStart,
    checkInTime: current?.checkInTime ?? "",
    checkOutDate: current?.checkOutDate ?? tripEnd,
    checkOutTime: current?.checkOutTime ?? "",
    phone: current?.phone ?? "",
    websiteUrl: current?.websiteUrl ?? "",
    notes: current?.notes ?? "",
  });

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return catalog;
    return catalog.filter((a) => normalizeSearch(`${a.name} ${a.address.street ?? ""}`).includes(q));
  }, [catalog, query]);

  const selected = catalog.find((a) => a.id === values.accommodationId) ?? null;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function choose(accommodation: AccommodationDto) {
    setValues((prev) => ({
      ...prev,
      accommodationId: accommodation.id,
      type: accommodation.type,
      name: accommodation.name,
      street: accommodation.address.street ?? "",
      postalCode: accommodation.address.postalCode ?? "",
      locality: accommodation.address.locality ?? "",
      phone: accommodation.phone ?? "",
      websiteUrl: accommodation.websiteUrl ?? "",
      checkInTime: prev.checkInTime || accommodation.defaultCheckIn || "",
      checkOutTime: prev.checkOutTime || accommodation.defaultCheckOut || "",
    }));
    setErrors({});
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    if (next === "manual" && values.accommodationId) {
      // Bei Wechsel zu «eigene Unterkunft» die Katalogverknüpfung lösen
      setValues((prev) => ({ ...prev, accommodationId: "", name: "", street: "", postalCode: "", locality: "", phone: "", websiteUrl: "" }));
    }
  }

  const dashboard = href(`/aufenthalt/${tripId}`);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (mode === "catalog" && !values.accommodationId) {
      setErrors({ accommodationId: t.accommodationForm.chooseError });
      return;
    }
    const input = { ...values, accommodationId: mode === "catalog" ? values.accommodationId : undefined };
    const parsed = accommodationInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setPending(true);
    const result = await saveAccommodationAction(tripId, input);
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(message(result.error));
      return;
    }
    toast.success(t.accommodationForm.saved);
    router.push(dashboard);
  }

  async function removeOrSkip() {
    if (!current) {
      router.push(dashboard);
      return;
    }
    setPending(true);
    const result = await removeAccommodationAction(tripId);
    setPending(false);
    if (!result.ok) {
      toast.error(message(result.error));
      return;
    }
    toast.success(t.accommodationForm.removed);
    router.push(dashboard);
  }

  const modes: { key: Mode; label: string }[] = [
    { key: "catalog", label: t.accommodationForm.modeCatalog },
    { key: "manual", label: t.accommodationForm.modeManual },
    { key: "none", label: t.accommodationForm.modeNone },
  ];

  const err = (key: string) =>
    errors[key] ? (
      <p id={`${id}-${key}-error`} className="text-sm text-destructive">
        {message(errors[key])}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div role="radiogroup" aria-label={t.accommodationForm.modes} className="grid grid-cols-3 gap-1 rounded-full bg-sand-soft p-1">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            onClick={() => switchMode(m.key)}
            className={cn(
              "h-10 rounded-full px-2 text-sm font-medium transition-all",
              mode === m.key ? "bg-card text-ink shadow-sm" : "text-ink/65 hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "none" ? (
        <div className="space-y-4 rounded-2xl bg-sand-soft p-5">
          <p className="font-medium">{t.accommodationForm.noneTitle}</p>
          <p className="text-sm text-muted-foreground">{t.accommodationForm.noneText}</p>
          <Button type="button" onClick={removeOrSkip} disabled={pending} variant={current ? "destructive" : "default"}>
            {current ? <Trash2 data-icon="inline-start" /> : null}
            {current ? t.accommodationForm.remove : t.accommodationForm.skip}
          </Button>
        </div>
      ) : (
        <>
          {mode === "catalog" ? (
            <fieldset className="grid gap-3">
              <legend className="mb-3 text-sm font-medium">{t.accommodationForm.chooseLegend}</legend>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.accommodationForm.searchPlaceholder}
                  aria-label={t.accommodationForm.search}
                  className="pl-10"
                />
              </div>
              <div role="radiogroup" aria-label={t.accommodationForm.list} className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
                {filtered.map((accommodation) => {
                  const active = accommodation.id === values.accommodationId;
                  return (
                    <div key={accommodation.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => choose(accommodation)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                          active ? "border-forest bg-forest-soft" : "border-input bg-card hover:border-ink/30",
                        )}
                      >
                        <PlaceImage image={accommodation.image} category="unterkunft" sizes="56px" className="size-14 shrink-0 rounded-xl" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{accommodation.name}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {t.accommodationTypes[accommodation.type]}
                            {accommodation.address.street ? ` · ${accommodation.address.street}` : ""}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-forest bg-forest text-paper" : "border-input",
                          )}
                        >
                          {active && <Check className="size-3.5" />}
                        </span>
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="rounded-2xl bg-sand-soft p-4 text-sm text-muted-foreground">
                    {t.accommodationForm.notFound}{" "}
                    <button type="button" className="font-medium text-forest underline" onClick={() => switchMode("manual")}>
                      {t.accommodationForm.enterOwn}
                    </button>
                  </p>
                )}
              </div>
              {err("accommodationId")}
              {selected && (
                <p className="text-sm text-muted-foreground">
                  {t.accommodationForm.selected} <span className="font-medium text-foreground">{selected.name}</span>
                  {formatAddress(selected.address) ? `, ${formatAddress(selected.address)}` : ""}
                </p>
              )}
            </fieldset>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>{t.accommodationForm.name}</Label>
                <Input
                  id={`${id}-name`}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t.accommodationForm.namePlaceholder}
                  maxLength={120}
                  aria-invalid={Boolean(errors.name) || undefined}
                  aria-describedby={errors.name ? `${id}-name-error` : undefined}
                />
                {err("name")}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-type`}>{t.accommodationForm.type}</Label>
                <select
                  id={`${id}-type`}
                  value={values.type}
                  onChange={(e) => set("type", e.target.value as AccommodationTypeValue)}
                  className="h-11 rounded-xl border border-input bg-card px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {ACCOMMODATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t.accommodationTypes[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-street`}>{t.accommodationForm.street}</Label>
                <Input id={`${id}-street`} value={values.street} onChange={(e) => set("street", e.target.value)} autoComplete="street-address" maxLength={120} />
                {err("street")}
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-plz`}>{t.accommodationForm.postalCode}</Label>
                  <Input id={`${id}-plz`} value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} inputMode="numeric" autoComplete="postal-code" maxLength={10} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-ort`}>{t.accommodationForm.locality}</Label>
                  <Input id={`${id}-ort`} value={values.locality} onChange={(e) => set("locality", e.target.value)} autoComplete="address-level2" placeholder="Baden" maxLength={80} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-phone`}>
                    {t.accommodationForm.phone} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
                  </Label>
                  <Input id={`${id}-phone`} type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={Boolean(errors.phone) || undefined} />
                  {err("phone")}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${id}-web`}>
                    {t.accommodationForm.website} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
                  </Label>
                  <Input id={`${id}-web`} type="url" inputMode="url" value={values.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} aria-invalid={Boolean(errors.websiteUrl) || undefined} />
                  {err("websiteUrl")}
                </div>
              </div>
            </div>
          )}

          <fieldset className="grid gap-4 rounded-2xl bg-sand-soft p-4">
            <legend className="sr-only">{t.accommodationForm.checkInOut}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-cid`}>{t.accommodationForm.checkIn}</Label>
                <Input id={`${id}-cid`} type="date" value={values.checkInDate} onChange={(e) => set("checkInDate", e.target.value)} aria-invalid={Boolean(errors.checkInDate) || undefined} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-cit`}>{t.accommodationForm.from}</Label>
                <Input id={`${id}-cit`} type="time" value={values.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-cod`}>{t.accommodationForm.checkOut}</Label>
                <Input id={`${id}-cod`} type="date" value={values.checkOutDate} min={values.checkInDate || undefined} onChange={(e) => set("checkOutDate", e.target.value)} aria-invalid={Boolean(errors.checkOutDate) || undefined} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-cot`}>{t.accommodationForm.until}</Label>
                <Input id={`${id}-cot`} type="time" value={values.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} aria-invalid={Boolean(errors.checkOutTime) || undefined} />
              </div>
            </div>
            {err("checkOutDate")}
            {err("checkOutTime")}
            {mode === "catalog" && selected && !selected.defaultCheckIn && (
              <p className="text-xs text-muted-foreground">
                {t.accommodationForm.noTimes}
              </p>
            )}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor={`${id}-notes`}>
              {t.accommodationForm.notes} <span className="font-normal text-muted-foreground">{t.common.optional}</span>
            </Label>
            <Textarea
              id={`${id}-notes`}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={t.accommodationForm.notesPlaceholder}
              maxLength={1000}
              rows={3}
            />
            {err("notes")}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {onboarding ? (
              <Button asChild variant="ghost" size="lg">
                <Link href={dashboard}>{t.accommodationForm.later}</Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
                {t.common.cancel}
              </Button>
            )}
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {t.accommodationForm.submit}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
