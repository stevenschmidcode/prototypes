import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarClock, Heart } from "lucide-react";
import { AddToTripDialog } from "@/components/agenda/add-to-trip-dialog";
import { Container, EmptyState, PageIntro } from "@/components/common/section";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { PlaceCardSkeleton, PlaceMeta } from "@/components/place/place-card";
import { PlaceImage } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import {
  countFavoritesByFilter,
  FAVORITE_FILTERS,
  filterFavorites,
  isFavoriteFilterKey,
} from "@/lib/catalog-meta";
import { formatAddress } from "@/lib/maps";
import { localizePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { loadFavorites } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.favorites.eyebrow };
}

export default async function FavoritesPage(props: PageProps<"/[lang]/favoriten">) {
  const { t } = await getI18n();
  return (
    <Container>
      <PageIntro eyebrow={t.favorites.eyebrow} title={t.favorites.title} description={t.favorites.description} />
      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoritesList searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}

async function FavoritesList({ searchParams }: { searchParams: PageProps<"/[lang]/favoriten">["searchParams"] }) {
  const [favorites, params, { locale, t }] = await Promise.all([loadFavorites(), searchParams, getI18n()]);
  const href = (p: string) => localizePath(locale, p);
  const raw = typeof params.filter === "string" ? params.filter : undefined;
  const active = isFavoriteFilterKey(raw) ? raw : null;
  const counts = countFavoritesByFilter(favorites);
  const visible = filterFavorites(favorites, active);

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-6" />}
        title={t.favorites.emptyTitle}
        description={t.favorites.emptyText}
      >
        <Button asChild>
          <Link href={href("/entdecken")}>{t.favorites.discover}</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label={t.favorites.filterLabel}>
        <ul className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <li className="shrink-0">
            <FilterChip href={href("/favoriten")} active={!active} label={t.common.all} count={favorites.length} />
          </li>
          {FAVORITE_FILTERS.filter((f) => counts.has(f.key)).map((f) => (
            <li key={f.key} className="shrink-0">
              <FilterChip
                href={href(`/favoriten?filter=${f.key}`)}
                active={active === f.key}
                label={t.favorites.filters[f.key]}
                count={counts.get(f.key) ?? 0}
              />
            </li>
          ))}
        </ul>
      </nav>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-input p-8 text-center text-muted-foreground">
          {t.favorites.noneInFilter}{" "}
          <Link href={href("/favoriten")} className="font-medium text-forest underline underline-offset-2">
            {t.favorites.showAll}
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((favorite) =>
            favorite.type === "place" ? (
              <li key={favorite.id} className="relative flex gap-4 rounded-3xl bg-card p-3 ring-1 ring-border">
                <PlaceImage
                  image={favorite.place.image}
                  category={favorite.place.category.slug}
                  sizes="112px"
                  className="aspect-square w-24 shrink-0 rounded-2xl sm:w-28"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                  <PlaceMeta place={favorite.place} />
                  <h2 className="font-semibold tracking-tight">
                    <Link href={href(`/entdecken/${favorite.place.slug}`)} className="hover:underline">
                      {favorite.place.name}
                    </Link>
                  </h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{favorite.place.shortDescription}</p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <AddToTripDialog
                      place={{
                        id: favorite.place.id,
                        slug: favorite.place.slug,
                        name: favorite.place.name,
                        kind: favorite.place.kind,
                        durationMinutes: favorite.place.durationMinutes,
                        location: favorite.place.locality,
                      }}
                      trigger={
                        <Button size="sm" variant="secondary">
                          <CalendarClock data-icon="inline-start" /> {t.favorites.plan}
                        </Button>
                      }
                    />
                    <FavoriteButton target={{ placeId: favorite.place.id }} name={favorite.place.name} className="size-9 bg-transparent shadow-none ring-0" />
                  </div>
                </div>
              </li>
            ) : (
              <li key={favorite.id} className="relative flex gap-4 rounded-3xl bg-card p-3 ring-1 ring-border">
                <PlaceImage
                  image={favorite.accommodation.image}
                  category="unterkunft"
                  sizes="112px"
                  className="aspect-square w-24 shrink-0 rounded-2xl sm:w-28"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                  <p className="eyebrow text-muted-foreground">{t.favorites.accommodation}</p>
                  <h2 className="font-semibold tracking-tight">{favorite.accommodation.name}</h2>
                  <p className="text-sm text-muted-foreground">{formatAddress(favorite.accommodation.address)}</p>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    {favorite.accommodation.websiteUrl && (
                      <a
                        href={favorite.accommodation.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-secondary px-3.5 text-[0.8rem] font-medium"
                      >
                        {t.common.website} <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    )}
                    <FavoriteButton
                      target={{ accommodationId: favorite.accommodation.id }}
                      name={favorite.accommodation.name}
                      className="size-9 bg-transparent shadow-none ring-0"
                    />
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-forest bg-forest text-paper" : "border-input bg-card hover:border-ink/30",
      )}
    >
      {label}
      <span className={cn("text-xs", active ? "text-paper/70" : "text-muted-foreground")}>{count}</span>
    </Link>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <PlaceCardSkeleton key={i} variant="row" />
      ))}
    </div>
  );
}
