import { Suspense } from "react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { AgendaView } from "@/components/agenda/agenda-view";
import { BackLink } from "@/components/common/back-link";
import { Container, PageIntro } from "@/components/common/section";
import { localizePath } from "@/i18n/config";
import { plural } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { formatDateRange } from "@/lib/dates";
import { loadJourney, loadPlaces } from "@/server/queries";
import { loadOwnedTrip } from "@/server/trip-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.agenda.meta };
}

export default function AgendaPage(props: PageProps<"/[lang]/aufenthalt/[tripId]/agenda">) {
  return (
    <Container className="max-w-3xl">
      <Suspense fallback={<AgendaSkeleton />}>
        <AgendaContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}

async function AgendaContent({
  params,
  searchParams,
}: Pick<PageProps<"/[lang]/aufenthalt/[tripId]/agenda">, "params" | "searchParams">) {
  const [{ trip }, query, { locale, t }, places] = await Promise.all([
    loadOwnedTrip(params),
    searchParams,
    getI18n(),
    loadPlaces(),
  ]);
  const suggestions = { places, profilePlaceIds: await profilePlaceIds(trip.journeySlug) };
  const day = typeof query.tag === "string" ? query.tag : undefined;
  const count = trip.agenda.length;
  return (
    <>
      <BackLink href={localizePath(locale, `/aufenthalt/${trip.id}`)} label={trip.name} />
      <PageIntro
        eyebrow={t.agenda.eyebrow}
        title={t.agenda.title}
        description={`${formatDateRange(trip.startDate, trip.endDate, locale)} · ${count} ${plural(t.common.entries, count)}`}
        className="pt-4 md:pt-6"
      />
      {/* key: Ansicht bei Wechsel des Tages-Parameters neu initialisieren */}
      <AgendaView
        key={`${day ?? ""}-${query.neu ?? ""}`}
        trip={trip}
        initialDay={day}
        openNew={query.neu === "1"}
        suggestions={suggestions}
      />
    </>
  );
}

/** Orte der Tour zum Reiseprofil – sie werden bei «Freie Zeit»-Vorschlägen bevorzugt */
async function profilePlaceIds(journeySlug: string | null): Promise<string[]> {
  if (!journeySlug) return [];
  try {
    return (await loadJourney(journeySlug)).stops.map((s) => s.place.id);
  } catch (error) {
    unstable_rethrow(error);
    return []; // Tour inzwischen entfernt → Vorschläge ohne Profil-Bonus
  }
}

function AgendaSkeleton() {
  return (
    <div className="space-y-6 pt-10" aria-busy="true">
      <div className="h-14 w-2/3 animate-pulse rounded-lg bg-sand" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-20 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand-soft" />
      ))}
    </div>
  );
}
