"use client";

import Link from "next/link";
import { CloudOff, RotateCw } from "lucide-react";
import { Container } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** Fehlergrenze: zeigt nie technische Details, bietet aber einen Ausweg. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, href } = useI18n();
  return (
    <Container className="flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-sand text-forest">
        <CloudOff className="size-7" aria-hidden />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{t.error.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.error.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw data-icon="inline-start" /> {t.common.retry}
        </Button>
        <Button asChild variant="outline">
          <Link href={href("/")}>{t.common.toHome}</Link>
        </Button>
      </div>
    </Container>
  );
}
