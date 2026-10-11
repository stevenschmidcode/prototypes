import { Suspense } from "react";
import type { Metadata } from "next";
import { BackLink } from "@/components/common/back-link";
import { Container, PageIntro } from "@/components/common/section";
import { AccommodationForm } from "@/components/trip/accommodation-form";
import { localizePath } from "@/i18n/config";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDateRange } from "@/lib/dates";
import { loadAccommodations } from "@/server/queries";
import { loadOwnedTrip } from "@/server/trip-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.accommodationForm.meta };
}

export default function AccommodationPage(props: PageProps<"/[lang]/aufenthalt/[tripId]/unterkunft">) {
  return (
    <Container className="max-w-2xl">
      <Suspense fallback={<div className="mt-10 h-[32rem] animate-pulse rounded-3xl bg-sand-soft" />}>
        <AccommodationContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}

async function AccommodationContent({
  params,
  searchParams,
}: Pick<PageProps<"/[lang]/aufenthalt/[tripId]/unterkunft">, "params" | "searchParams">) {
  const [{ trip }, query, catalog, { locale, t }] = await Promise.all([
    loadOwnedTrip(params),
    searchParams,
    loadAccommodations(),
    getI18n(),
  ]);
  const onboarding = query.einrichtung === "1";
  return (
    <>
      {!onboarding && <BackLink href={localizePath(locale, `/aufenthalt/${trip.id}`)} label={t.editTrip.backToTrip} />}
      <PageIntro
        eyebrow={onboarding ? t.accommodationForm.stepEyebrow : `${trip.name} · ${t.accommodationForm.meta}`}
        title={onboarding ? t.accommodationForm.stepTitle : trip.accommodation ? t.accommodationForm.editTitle : t.accommodationForm.addTitle}
        description={fmt(t.accommodationForm.description, { range: formatDateRange(trip.startDate, trip.endDate, locale) })}
        className={onboarding ? undefined : "pt-4 md:pt-6"}
      />
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-8">
        <AccommodationForm
          tripId={trip.id}
          tripStart={trip.startDate}
          tripEnd={trip.endDate}
          current={trip.accommodation}
          catalog={catalog}
          onboarding={onboarding}
        />
      </div>
    </>
  );
}
