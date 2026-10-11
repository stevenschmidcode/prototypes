import { Suspense } from "react";
import type { Metadata } from "next";
import { BackLink } from "@/components/common/back-link";
import { Container, PageIntro } from "@/components/common/section";
import { DeleteTripButton } from "@/components/trip/delete-trip-button";
import { TripForm } from "@/components/trip/trip-form";
import { localizePath } from "@/i18n/config";
import { fmt } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { loadJourneys } from "@/server/queries";
import { loadOwnedTrip } from "@/server/trip-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.editTrip.meta };
}

export default function EditTripPage(props: PageProps<"/[lang]/aufenthalt/[tripId]/bearbeiten">) {
  return (
    <Container className="max-w-2xl">
      <Suspense fallback={<div className="mt-10 h-[28rem] animate-pulse rounded-3xl bg-sand-soft" />}>
        <EditTrip params={props.params} />
      </Suspense>
    </Container>
  );
}

async function EditTrip({ params }: { params: PageProps<"/[lang]/aufenthalt/[tripId]/bearbeiten">["params"] }) {
  const [{ trip }, { locale, t }, journeys] = await Promise.all([loadOwnedTrip(params), getI18n(), loadJourneys()]);
  return (
    <>
      <BackLink href={localizePath(locale, `/aufenthalt/${trip.id}`)} label={t.editTrip.backToTrip} />
      <PageIntro eyebrow={t.editTrip.eyebrow} title={trip.name} className="pt-4 md:pt-6" />
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border md:p-8">
        <TripForm
          mode="edit"
          tripId={trip.id}
          journeys={journeys}
          initial={{
            name: trip.name,
            startDate: trip.startDate,
            endDate: trip.endDate,
            notes: trip.notes ?? "",
            journeySlug: trip.journeySlug ?? "",
          }}
        />
      </div>
      <section aria-labelledby="loeschen" className="mt-8 rounded-3xl border border-destructive/25 p-5 md:p-6">
        <h2 id="loeschen" className="font-semibold tracking-tight">
          {t.editTrip.deleteTitle}
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">{fmt(t.editTrip.deleteText, { count: trip.agendaCount })}</p>
        <DeleteTripButton tripId={trip.id} tripName={trip.name} />
      </section>
    </>
  );
}
