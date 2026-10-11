import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/common/section";
import { getI18n } from "@/i18n/server";
import catalog from "../../../../prisma/seed-data/catalog.json";
import catalogEn from "../../../../prisma/seed-data/catalog.en.json";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.credits.meta };
}

type ImageCredit = { slug: string; sourceUrl: string; author: string; license: string; licenseUrl: string };
type EnNames = Record<string, { name?: string } | undefined>;

export default async function CreditsPage() {
  const { locale, t } = await getI18n();
  const enPlaces = (catalogEn as { places: EnNames }).places;
  const nameFor = (slug: string) => {
    if (slug === "hero-baden") return t.credits.hero;
    if (locale === "en" && enPlaces[slug]?.name) return enPlaces[slug]!.name!;
    return (
      catalog.places.find((p) => p.slug === slug)?.name ?? catalog.accommodations.find((a) => a.slug === slug)?.name ?? slug
    );
  };
  const images = catalog.images as ImageCredit[];
  return (
    <Container className="max-w-3xl">
      <PageIntro eyebrow={t.credits.eyebrow} title={t.credits.title} description={t.credits.description} />
      <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        {images.map((image) => (
          <li key={image.slug} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">{nameFor(image.slug)}</span>
            <span className="text-muted-foreground">
              {image.author} ·{" "}
              <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">
                {image.license}
              </a>{" "}
              ·{" "}
              <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {t.common.source}
              </a>
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
