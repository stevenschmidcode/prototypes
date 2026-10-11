import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/common/section";
import { TripForm } from "@/components/trip/trip-form";
import { getI18n } from "@/i18n/server";
import { loadJourneys } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.newTrip.meta };
}

export default async function NewTripPage(props: PageProps<"/[lang]/aufenthalt/neu">) {
  const { t } = await getI18n();
  return (
    <Container className="max-w-2xl">
      <PageIntro eyebrow={t.newTrip.eyebrow} title={t.newTrip.title} description={t.newTrip.description} />
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-sand-soft" />}>
          <NewTripForm searchParams={props.searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}

async function NewTripForm({ searchParams }: { searchParams: PageProps<"/[lang]/aufenthalt/neu">["searchParams"] }) {
  const [params, journeys] = await Promise.all([searchParams, loadJourneys()]);
  const returnTo = typeof params.zurueck === "string" ? params.zurueck : undefined;
  const profile = typeof params.profil === "string" && journeys.some((j) => j.slug === params.profil) ? params.profil : undefined;
  return <TripForm mode="create" returnTo={returnTo} preselectJourney={profile} journeys={journeys} />;
}
