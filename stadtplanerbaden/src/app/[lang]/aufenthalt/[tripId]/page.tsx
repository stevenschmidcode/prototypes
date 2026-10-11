import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardSkeleton, TripDashboard } from "@/components/trip/trip-dashboard";
import { getI18n } from "@/i18n/server";
import { loadDashboard } from "@/server/queries";
import { markTripOpened } from "@/server/services/trips";
import { loadOwnedTrip } from "@/server/trip-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.meta };
}

export default function TripPage(props: PageProps<"/[lang]/aufenthalt/[tripId]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TripContent params={props.params} />
    </Suspense>
  );
}

async function TripContent({ params }: { params: PageProps<"/[lang]/aufenthalt/[tripId]">["params"] }) {
  const { visitorId, trip } = await loadOwnedTrip(params);
  const [data] = await Promise.all([loadDashboard(visitorId, trip.id), markTripOpened(visitorId, trip.id)]);
  return <TripDashboard {...data} />;
}
