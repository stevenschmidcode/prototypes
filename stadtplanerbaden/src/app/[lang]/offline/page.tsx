import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ReloadButton } from "@/components/common/reload-button";
import { Container } from "@/components/common/section";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.offline.meta };
}

/** Offline-Fallback – wird vom Service Worker vorab gespeichert. Enthält keine persönlichen Daten. */
export default async function OfflinePage() {
  const { t } = await getI18n();
  return (
    <Container className="flex min-h-[70dvh] max-w-md flex-col items-center justify-center text-center">
      <Wordmark className="mb-10 text-3xl" />
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-sand text-forest">
        <WifiOff className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{t.offline.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.offline.text}</p>
      <ReloadButton label={t.common.retry} />
    </Container>
  );
}
