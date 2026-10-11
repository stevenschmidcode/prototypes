import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/common/section";
import { JourneyCard, JourneyCardSkeleton } from "@/components/journey/journey-card";
import { getI18n } from "@/i18n/server";
import { loadJourneys } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.journeys.meta, description: t.journeys.metaDescription };
}

export default async function JourneysPage() {
  const { t } = await getI18n();
  return (
    <Container>
      <PageIntro eyebrow={t.journeys.eyebrow} title={t.journeys.title} description={t.journeys.description} />
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <JourneyCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <JourneyGrid />
      </Suspense>
      <p className="mt-8 max-w-xl text-sm text-muted-foreground">{t.journeys.profileHint}</p>
    </Container>
  );
}

async function JourneyGrid() {
  const journeys = await loadJourneys();
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {journeys.map((journey, index) => (
        <li key={journey.id} className="animate-rise" style={{ animationDelay: `${index * 50}ms` }}>
          <JourneyCard journey={journey} className="min-h-72" />
        </li>
      ))}
    </ul>
  );
}
