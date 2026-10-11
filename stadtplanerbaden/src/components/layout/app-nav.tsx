"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { CalendarHeart, Compass, Heart, Home, Route, UserRound } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { useI18n } from "@/i18n/client";
import { LOCALES, localizePath, splitLocale, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", segment: null, key: "home", icon: Home },
  { path: "/entdecken", segment: "entdecken", key: "discover", icon: Compass },
  { path: "/touren", segment: "touren", key: "journeys", icon: Route },
  { path: "/aufenthalt", segment: "aufenthalt", key: "stay", icon: CalendarHeart },
  { path: "/profil", segment: "profil", key: "profile", icon: UserRound },
] as const;

function useActiveSegment() {
  const segment = useSelectedLayoutSegment();
  // Favoriten gehören zum Profil
  return segment === "favoriten" ? "profil" : segment;
}

type Active = string | null | undefined;

/*
 * Mit Cache Components ist das aktive Segment auf dynamischen Routen erst zur
 * Request-Zeit bekannt. Die Navigation wird deshalb sofort (ohne Markierung)
 * gerendert; der Aktiv-Zustand streamt hinter <Suspense> nach.
 */
function ActiveDesktopHeader() {
  return <DesktopHeaderView active={useActiveSegment()} />;
}
function ActiveBottomNav() {
  return <BottomNavView active={useActiveSegment()} />;
}

/** Desktop: schlanke Kopfzeile mit Navigation. */
export function DesktopHeader() {
  return (
    <Suspense fallback={<DesktopHeaderView active={undefined} />}>
      <ActiveDesktopHeader />
    </Suspense>
  );
}

/** Mobile: Bottom Navigation mit grossen Touch-Zielen. */
export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavView active={undefined} />}>
      <ActiveBottomNav />
    </Suspense>
  );
}

/** Wechselt auf dieselbe Seite in der anderen Sprache */
export function LanguageSwitch({ className }: { className?: string }) {
  return (
    <Suspense fallback={<LanguageSwitchView path="/" className={className} />}>
      <LanguageSwitchWithPath className={className} />
    </Suspense>
  );
}

function LanguageSwitchWithPath({ className }: { className?: string }) {
  const pathname = usePathname();
  return <LanguageSwitchView path={splitLocale(pathname).path} className={className} />;
}

function LanguageSwitchView({ path, className }: { path: string; className?: string }) {
  const { locale, t } = useI18n();
  const other = LOCALES.find((l) => l !== locale) as Locale;
  return (
    <Link
      href={localizePath(other, path)}
      hrefLang={other}
      lang={other}
      aria-label={t.common.switchLanguageLabel}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-3 font-mono text-xs font-medium tracking-wider uppercase transition-colors hover:bg-sand-soft",
        className,
      )}
    >
      {other}
    </Link>
  );
}

function DesktopHeaderView({ active }: { active: Active }) {
  const { t, href } = useI18n();
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 bg-background/85 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={href("/")} className="rounded-md text-2xl" aria-label={t.nav.homeAria}>
          <Wordmark />
        </Link>
        <nav aria-label={t.nav.main}>
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.segment;
              return (
                <li key={item.path}>
                  <Link
                    href={href(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                      isActive ? "bg-forest text-paper" : "text-ink/75 hover:bg-sand-soft hover:text-ink",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {t.nav[item.key]}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href={href("/favoriten")}
                aria-label={t.nav.favorites}
                className="ml-1 inline-flex size-10 items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-sand-soft hover:text-ink"
              >
                <Heart className="size-4" aria-hidden />
              </Link>
            </li>
            <li>
              <LanguageSwitch />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function BottomNavView({ active }: { active: Active }) {
  const { t, href } = useI18n();
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/92 pb-[var(--safe-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.segment;
          const label = item.key === "stay" ? t.nav.stayShort : t.nav[item.key];
          return (
            <li key={item.path}>
              <Link
                href={href(item.path)}
                aria-current={isActive ? "page" : undefined}
                className="group flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 pt-2 pb-1.5 text-[0.66rem] font-medium"
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300 ease-out-soft",
                    isActive ? "bg-forest text-paper" : "text-ink/60 group-hover:bg-sand-soft",
                  )}
                >
                  <item.icon className="size-[1.15rem]" aria-hidden strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className={cn("leading-none", isActive ? "text-ink" : "text-ink/65")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
