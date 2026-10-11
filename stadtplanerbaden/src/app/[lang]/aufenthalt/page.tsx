import { Suspense } from "react";
import type { Metadata } from "next";
import { TripOnboarding } from "@/components/trip/onboarding";
import { DashboardSkeleton, TripDashboard } from "@/components/trip/trip-dashboard";
import { getI18n } from "@/i18n/server";
import { loadDashboard } from "@/server/queries";
import { getVisitorId } from "@/server/session";
import { getLastActiveTripId } from "@/server/services/trips";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.meta };
}

export default function StayPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ActiveStay />
    </Suspense>
  );
}

/** Öffnet den zuletzt aktiven Aufenthalt – oder zeigt das Onboarding. */
async function ActiveStay() {
  const visitorId = await getVisitorId();
  const tripId = visitorId ? await getLastActiveTripId(visitorId) : null;
  if (!visitorId || !tripId) return <TripOnboarding />;
  return <TripDashboard {...await loadDashboard(visitorId, tripId)} />;
}
