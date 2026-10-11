import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/common/section";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { PlaceImage } from "@/components/place/place-image";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatAddress } from "@/lib/maps";
import type { AccommodationDto } from "@/lib/types";

/** Unterkünfte im Katalog – zum Merken und als Inspiration. Keine Buchung im MVP. */
export async function AccommodationList({ accommodations }: { accommodations: AccommodationDto[] }) {
  if (accommodations.length === 0) return null;
  const { t } = await getI18n();
  return (
    <section aria-labelledby="uebernachten" className="pt-10">
      <SectionHeader
        eyebrow={t.discover.stayEyebrow}
        title={t.discover.stayTitle}
        description={t.discover.stayDescription}
        id="uebernachten"
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {accommodations.map((a) => (
          <li key={a.id} className="flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            <div className="relative">
              <PlaceImage image={a.image} category="unterkunft" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[16/10]" />
              <div className="absolute top-3 right-3">
                <FavoriteButton target={{ accommodationId: a.id }} name={a.name} />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="eyebrow text-muted-foreground">{t.accommodationTypes[a.type]}</p>
              <h3 className="font-semibold tracking-tight">{a.name}</h3>
              {a.shortDescription && <p className="line-clamp-2 text-sm text-muted-foreground">{a.shortDescription}</p>}
              {formatAddress(a.address) && <p className="text-xs text-muted-foreground">{formatAddress(a.address)}</p>}
              {a.websiteUrl && (
                <a
                  href={a.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-forest hover:underline"
                >
                  {t.common.website} <ArrowUpRight className="size-3.5" aria-hidden />
                  <span className="sr-only">{fmt(t.discover.websiteOf, { name: a.name })}</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
