import Link from "next/link";
import { CalendarRange, Heart, Route, Sparkles } from "lucide-react";
import { Container } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { localizePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

/** Ansprechender Einstieg, wenn noch kein Aufenthalt existiert. */
export async function TripOnboarding() {
  const { locale, t } = await getI18n();
  const icons = [CalendarRange, Route, Heart, Sparkles];
  return (
    <Container>
      <section className="grid grid-cols-1 items-center gap-10 pt-10 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-16">
        <div className="animate-rise space-y-6">
          <p className="eyebrow text-terracotta-strong">{t.onboarding.eyebrow}</p>
          <h1 className="display text-[2.75rem] md:text-7xl">{t.onboarding.title}</h1>
          <p className="max-w-lg text-lg text-muted-foreground">{t.onboarding.text}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={localizePath(locale, "/aufenthalt/neu")}>
                <CalendarRange data-icon="inline-start" /> {t.onboarding.create}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={localizePath(locale, "/touren")}>{t.onboarding.browse}</Link>
            </Button>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.onboarding.features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <li
                key={feature.title}
                className="animate-rise rounded-3xl bg-card p-5 ring-1 ring-border"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-sand text-forest md:mb-6">
                  <Icon className="size-[1.15rem]" aria-hidden />
                </span>
                <h2 className="font-semibold tracking-tight">{feature.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </Container>
  );
}
