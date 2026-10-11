import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX, X } from "lucide-react";
import { Container, EmptyState, PageIntro } from "@/components/common/section";
import { AccommodationList } from "@/components/place/accommodation-list";
import { CategoryIcon } from "@/components/place/category-icon";
import { PlaceCard, PlaceCardSkeleton } from "@/components/place/place-card";
import { Button } from "@/components/ui/button";
import { localizePath, type Locale } from "@/i18n/config";
import { fmt, plural } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { DISCOVER_CATEGORIES, isDiscoverCategory } from "@/lib/catalog-meta";
import { cn } from "@/lib/utils";
import { loadAccommodations, loadPlaces } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.discover.eyebrow, description: t.discover.metaDescription };
}

export default async function DiscoverPage(props: PageProps<"/[lang]/entdecken">) {
  const { t } = await getI18n();
  return (
    <Container>
      <PageIntro eyebrow={t.discover.eyebrow} title={t.discover.title} description={t.discover.description} />
      <Suspense fallback={<DiscoverSkeleton label={t.discover.loading} />}>
        <DiscoverResults searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}

function hrefFor(locale: Locale, category: string | null, query: string) {
  const params = new URLSearchParams();
  if (category) params.set("kategorie", category);
  if (query) params.set("q", query);
  const qs = params.toString();
  return localizePath(locale, qs ? `/entdecken?${qs}` : "/entdecken");
}

async function DiscoverResults({ searchParams }: { searchParams: PageProps<"/[lang]/entdecken">["searchParams"] }) {
  const [{ locale, t }, params] = await Promise.all([getI18n(), searchParams]);
  const rawCategory = typeof params.kategorie === "string" ? params.kategorie : undefined;
  const category = isDiscoverCategory(rawCategory) ? rawCategory : null;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const showAccommodations = !category && !query;
  const [places, accommodations] = await Promise.all([
    loadPlaces({ category: category ?? undefined, query }),
    showAccommodations ? loadAccommodations() : Promise.resolve([]),
  ]);
  const categoryName = category ? t.categories[category] : undefined;
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
      active ? "border-forest bg-forest text-paper" : "border-input bg-card hover:border-ink/30",
    );

  return (
    <div className="space-y-6">
      <form action={localizePath(locale, "/entdecken")} role="search" className="flex gap-2">
        {category && <input type="hidden" name="kategorie" value={category} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="discover-search" className="sr-only">
            {t.discover.searchLabel}
          </label>
          <input
            id="discover-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t.discover.searchPlaceholder}
            className="h-12 w-full rounded-full border border-input bg-card pr-4 pl-11 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>
        <Button type="submit" size="lg">
          {t.home.search}
        </Button>
      </form>

      <nav aria-label={t.discover.categoriesLabel}>
        <ul className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <li className="shrink-0">
            <Link href={hrefFor(locale, null, query)} aria-current={!category ? "page" : undefined} className={chip(!category)}>
              {t.common.all}
            </Link>
          </li>
          {DISCOVER_CATEGORIES.map((c) => {
            const active = c.slug === category;
            return (
              <li key={c.slug} className="shrink-0">
                <Link href={hrefFor(locale, c.slug, query)} aria-current={active ? "page" : undefined} className={chip(active)}>
                  <CategoryIcon slug={c.slug} className="size-4" />
                  {t.categories[c.slug]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-h-6 flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <span>
          {fmt(t.discover.resultCount, { count: places.length, places: plural(t.common.places, places.length) })}
          {categoryName ? fmt(t.discover.inCategory, { category: categoryName }) : ""}
          {query ? fmt(t.discover.forQuery, { query }) : ""}
        </span>
        {query && (
          <Link
            href={hrefFor(locale, category, "")}
            className="inline-flex items-center gap-1 rounded-full bg-sand-soft px-2.5 py-1 text-xs font-medium text-ink hover:bg-sand"
          >
            <X className="size-3" aria-hidden /> {t.discover.resetSearch}
          </Link>
        )}
      </div>

      {places.length === 0 ? (
        <EmptyState icon={<SearchX className="size-6" />} title={t.discover.emptyTitle} description={t.discover.emptyText}>
          <Button asChild variant="outline">
            <Link href={localizePath(locale, "/entdecken")}>{t.discover.showAll}</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, index) => (
            <li key={place.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
              <PlaceCard place={place} preload={index < 3} />
            </li>
          ))}
        </ul>
      )}
      {showAccommodations && <AccommodationList accommodations={accommodations} />}
    </div>
  );
}

function DiscoverSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={label}>
      <div className="h-12 animate-pulse rounded-full bg-sand" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-sand" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
