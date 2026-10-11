import Link from "next/link";
import { ArrowUpRight, BedDouble, LogIn, LogOut, Navigation, Pencil, Phone, Plus } from "lucide-react";
import { PlaceImage } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/de";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDateShort } from "@/lib/dates";
import { formatAddress, mapsUrl } from "@/lib/maps";
import type { TripAccommodationDto } from "@/lib/types";

function checkLabel(date: string | null, time: string | null, template: string, t: Dictionary, locale: Locale) {
  if (!date && !time) return t.accommodationCard.notSpecified;
  return [date ? formatDateShort(date, locale) : null, time ? fmt(template, { time }) : null].filter(Boolean).join(", ");
}

/** Unterkunftskarte mit Adresse, Navigation und Check-in/-out. */
export async function AccommodationCard({
  tripId,
  accommodation,
  editable = true,
}: {
  tripId: string;
  accommodation: TripAccommodationDto | null;
  editable?: boolean;
}) {
  const { locale, t } = await getI18n();
  const editHref = localizePath(locale, `/aufenthalt/${tripId}/unterkunft`);

  if (!accommodation) {
    return (
      <section
        aria-labelledby="unterkunft-titel"
        className="flex flex-col justify-between gap-5 rounded-3xl border border-dashed border-input bg-card/60 p-5"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-forest">
            <BedDouble className="size-5" aria-hidden />
          </span>
          <div>
            <h2 id="unterkunft-titel" className="font-semibold tracking-tight">
              {t.accommodationCard.emptyTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.accommodationCard.emptyText}</p>
          </div>
        </div>
        {editable && (
          <Button asChild variant="outline" className="self-start">
            <Link href={editHref}>
              <Plus data-icon="inline-start" /> {t.accommodationCard.add}
            </Link>
          </Button>
        )}
      </section>
    );
  }

  const address = formatAddress(accommodation.address);
  return (
    <section aria-labelledby="unterkunft-titel" className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <div className="flex gap-4 p-5">
        <PlaceImage image={accommodation.image} category="unterkunft" sizes="80px" className="size-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-muted-foreground">{t.accommodationTypes[accommodation.type]}</p>
          <h2 id="unterkunft-titel" className="truncate text-lg font-semibold tracking-tight">
            {accommodation.name}
          </h2>
          {address && <p className="text-sm text-muted-foreground">{address}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 border-y border-border text-sm">
        <div className="flex items-start gap-2.5 p-4">
          <LogIn className="mt-0.5 size-4 text-forest" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">{t.accommodationCard.checkIn}</dt>
            <dd className="font-medium">
              {checkLabel(accommodation.checkInDate, accommodation.checkInTime, t.accommodationCard.from, t, locale)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5 border-l border-border p-4">
          <LogOut className="mt-0.5 size-4 text-forest" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">{t.accommodationCard.checkOut}</dt>
            <dd className="font-medium">
              {checkLabel(accommodation.checkOutDate, accommodation.checkOutTime, t.accommodationCard.until, t, locale)}
            </dd>
          </div>
        </div>
      </dl>
      {accommodation.notes && <p className="border-b border-border px-5 py-3 text-sm text-ink/80">{accommodation.notes}</p>}
      <div className="flex flex-wrap gap-2 p-4">
        {(address || accommodation.coordinates) && (
          <a
            href={mapsUrl({ name: accommodation.name, address, coordinates: accommodation.coordinates })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-paper hover:bg-forest/90"
          >
            <Navigation className="size-4" aria-hidden /> {t.common.navigation}
            <span className="sr-only">{t.common.opensMaps}</span>
          </a>
        )}
        {accommodation.phone && (
          <a
            href={`tel:${accommodation.phone.replace(/[^+\d]/g, "")}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:border-ink/30"
          >
            <Phone className="size-4" aria-hidden /> {t.common.call}
          </a>
        )}
        {accommodation.websiteUrl && (
          <a
            href={accommodation.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-input px-4 text-sm font-medium hover:border-ink/30"
          >
            {t.common.website} <ArrowUpRight className="size-4" aria-hidden />
            <span className="sr-only">{t.common.externalLink}</span>
          </a>
        )}
        {editable && (
          <Link
            href={editHref}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-forest hover:bg-sand-soft"
          >
            <Pencil className="size-4" aria-hidden /> {t.common.edit}
          </Link>
        )}
      </div>
    </section>
  );
}
