"use client";

import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Container } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <Container className="flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-sand text-forest">
        <MapPinOff className="size-7" aria-hidden />
      </span>
      <p className="eyebrow text-terracotta-strong">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.notFound.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={href("/")}>{t.common.toHome}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={href("/aufenthalt")}>{t.nav.stay}</Link>
        </Button>
      </div>
    </Container>
  );
}
