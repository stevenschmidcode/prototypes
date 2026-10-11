"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarHeart,
  CalendarRange,
  Compass,
  Download,
  Home,
  Pause,
  Play,
  Route,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { JourneyIcon, journeyTheme } from "@/components/journey/journey-theme";
import { LanguageSwitch } from "@/components/layout/app-nav";
import type { EmbedMessage } from "@/components/layout/embed-bridge";
import { CategoryIcon } from "@/components/place/category-icon";
import type { TourData } from "@/components/website/tour-data";
import { useI18n } from "@/i18n/client";
import type { Dictionary } from "@/i18n/dictionaries/de";
import { cn } from "@/lib/utils";

type ChapterId = keyof Dictionary["tour"]["chapter"];

type Chapter = {
  id: ChapterId;
  icon: LucideIcon;
  /** Pfad (ohne Sprachpräfix), den das Telefon beim Kapitel zeigt */
  path: string;
};

const CHAPTERS: Chapter[] = [
  { id: "start", icon: Home, path: "/" },
  { id: "journeys", icon: Route, path: "/touren" },
  { id: "discover", icon: Compass, path: "/entdecken" },
  { id: "howto", icon: CalendarRange, path: "/aufenthalt" },
  { id: "agenda", icon: CalendarHeart, path: "/aufenthalt" },
  { id: "install", icon: Download, path: "/" },
  { id: "privacy", icon: ShieldCheck, path: "/profil" },
];

/** Sekunden pro Kapitel (WCAG 2.2.2: pausierbar, bei reduzierter Bewegung aus). */
const CHAPTER_SECONDS = 12;
const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL = 12;
const REDUCED = "(prefers-reduced-motion: reduce)";
const DESKTOP = "(min-width: 1024px)";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Nie innerhalb eines eingebetteten Fensters rendern – sonst würde sich die App
 * im Telefon-Rahmen endlos selbst einbetten. Serverseitig wird die Hülle gerendert
 * (per CSS erst ab 1024 px sichtbar), das iframe entsteht nur im Browser.
 */
function useIsEmbedded() {
  return useSyncExternalStore(
    () => () => undefined,
    () => window.self !== window.top,
    () => false,
  );
}

export function WebsiteTour({ data }: { data: TourData }) {
  const embedded = useIsEmbedded();
  if (embedded) return null;
  return <Tour data={data} />;
}

function Tour({ data }: { data: TourData }) {
  const { t, href } = useI18n();
  const [index, setIndex] = useState(0);
  const [demo, setDemo] = useState(false);
  const [hovering, setHovering] = useState(false);
  // null = Standard (an, ausser bei «reduzierter Bewegung»); sonst die Wahl des Nutzers
  const [autoplayChoice, setAutoplayChoice] = useState<boolean | null>(null);
  const reducedMotion = useMediaQuery(REDUCED);
  const autoplay = autoplayChoice ?? !reducedMotion;
  const setAutoplay = useCallback((value: boolean | ((current: boolean) => boolean)) => {
    setAutoplayChoice((choice) => (typeof value === "function" ? value(choice ?? !window.matchMedia(REDUCED).matches) : value));
  }, []);
  const [phonePath, setPhonePath] = useState(href("/"));
  const frameRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const pathRef = useRef(href("/"));

  const chapter = CHAPTERS[index];
  const running = autoplay && !demo && !hovering;

  /** Navigiert das Telefon (Pfad ohne Sprachpräfix) */
  const navigatePhone = useCallback(
    (path: string) => {
      const target = href(path);
      pathRef.current = target;
      setPhonePath(target);
      const frame = frameRef.current?.contentWindow;
      if (frame && readyRef.current) {
        const message: EmbedMessage = { type: "baden:navigate", path: target };
        frame.postMessage(message, window.location.origin);
      }
    },
    [href],
  );

  const goTo = useCallback(
    (next: number) => {
      const target = (next + CHAPTERS.length) % CHAPTERS.length;
      setIndex(target);
      setDemo(false);
      navigatePhone(CHAPTERS[target].path);
    },
    [navigatePhone],
  );

  // Nachrichten aus dem Telefon
  useEffect(() => {
    function onMessage(event: MessageEvent<EmbedMessage>) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "baden:ready") {
        readyRef.current = true;
        frameRef.current?.contentWindow?.postMessage(
          { type: "baden:navigate", path: pathRef.current },
          window.location.origin,
        );
      }
      // Wer selbst im Telefon tippt, übernimmt die Kontrolle
      if (event.data?.type === "baden:interaction") setAutoplay(false);
      if (event.data?.type === "baden:escape") setDemo(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setAutoplay]);

  // Tastatur: Pfeile wechseln Kapitel, Esc beendet die Demo
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      else if (event.key === "ArrowLeft") goTo(index - 1);
      else if (event.key === "Escape" && demo) setDemo(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, demo, goTo]);

  const next = CHAPTERS[(index + 1) % CHAPTERS.length];

  return (
    <div data-website-tour className="fixed inset-0 z-[60] hidden overflow-hidden bg-paper text-ink lg:block" aria-label={t.tour.aria}>
      {/* Dezente Hintergrundformen */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 size-[34rem] rounded-full bg-sand/60" />
        <div className="absolute right-[18%] -bottom-48 size-[30rem] rounded-full bg-terracotta/10" />
      </div>

      <div className="relative mx-auto flex h-full max-w-[1320px] flex-col px-10 xl:px-14">
        {/* Kopfzeile */}
        <header className="flex h-20 shrink-0 items-center justify-between">
          <button type="button" onClick={() => goTo(0)} className="rounded-md text-2xl" aria-label={t.tour.toStart}>
            <Wordmark />
          </button>
          <nav aria-label={t.tour.webApp} className="flex items-center gap-2 text-sm">
            <Link href={href("/touren")} className="rounded-full px-4 py-2 font-medium text-ink/70 hover:bg-sand-soft hover:text-ink">
              {t.nav.journeys}
            </Link>
            <Link href={href("/entdecken")} className="rounded-full px-4 py-2 font-medium text-ink/70 hover:bg-sand-soft hover:text-ink">
              {t.nav.discover}
            </Link>
            <Link href={href("/aufenthalt")} className="rounded-full px-4 py-2 font-medium text-ink/70 hover:bg-sand-soft hover:text-ink">
              {t.nav.stay}
            </Link>
            <LanguageSwitch className="border border-input" />
            <Link
              href={href("/entdecken")}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 font-medium text-paper hover:bg-forest/90"
            >
              {t.tour.openWebApp} <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </nav>
        </header>

        {/* Bühne: Text links, Telefon rechts (Demo: Telefon in der Mitte) */}
        <div className="relative min-h-0 flex-1">
          <section
            aria-labelledby={`kapitel-${chapter.id}`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(44rem,calc(100%-30rem))] flex-col justify-center pb-24 transition-all duration-700 ease-out-soft",
              demo ? "pointer-events-none invisible -translate-x-16 opacity-0" : "visible translate-x-0 opacity-100",
            )}
            inert={demo}
          >
            <div key={chapter.id} className="animate-rise">
              <ChapterContent chapter={chapter.id} data={data} onPhone={navigatePhone} />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-forest px-6 text-[0.95rem] font-medium text-paper shadow-sm transition-colors hover:bg-forest/90"
              >
                {index === CHAPTERS.length - 1 ? t.tour.restart : t.tour.chapter[next.id]} <ArrowRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setDemo(true)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-input bg-card px-6 text-[0.95rem] font-medium transition-colors hover:border-ink/30"
              >
                <Smartphone className="size-4" aria-hidden /> {t.tour.tryDemo}
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">{t.common.disclaimerShort}</p>
          </section>

          <PhoneStage demo={demo} onExitDemo={() => setDemo(false)} frameRef={frameRef} path={phonePath} />
        </div>

        {/* Kapitel-Tabs */}
        <footer className="flex h-24 shrink-0 items-center gap-3">
          <div role="tablist" aria-label={t.tour.chapters} className="flex items-center gap-2.5">
            {CHAPTERS.map((c, i) => {
              const active = i === index && !demo;
              const label = t.tour.chapter[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={label}
                  title={label}
                  onClick={() => goTo(i)}
                  className={cn(
                    "group relative flex size-12 items-center justify-center rounded-full bg-forest text-sand shadow-[0_6px_16px_-8px_rgba(48,62,52,0.8)] ring-2 transition-all hover:-translate-y-0.5",
                    active ? "ring-terracotta" : "ring-forest/0 hover:ring-terracotta/50",
                  )}
                >
                  <c.icon className="size-5" aria-hidden />
                  {active && (
                    <svg aria-hidden className="absolute -inset-1.5 size-[calc(100%+0.75rem)] -rotate-90" viewBox="0 0 60 60">
                      <circle
                        key={`${index}-${autoplay}`}
                        cx="30"
                        cy="30"
                        r="28"
                        fill="none"
                        stroke="var(--brand-terracotta)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray="100"
                        className={autoplay ? "tour-countdown" : ""}
                        style={{
                          animationDuration: `${CHAPTER_SECONDS}s`,
                          animationPlayState: running ? "running" : "paused",
                          strokeDashoffset: autoplay ? undefined : 0,
                        }}
                        // Ring abgelaufen → nächstes Kapitel (pausiert synchron mit Hover/Demo)
                        onAnimationEnd={() => goTo(index + 1)}
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          <div className="ml-2 flex h-11 items-center gap-1 rounded-full border border-input bg-card pr-1 pl-4 text-sm">
            <span className="font-medium">{demo ? t.tour.demo : t.tour.chapter[chapter.id]}</span>
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {index + 1} / {CHAPTERS.length}
            </span>
            <button
              type="button"
              onClick={() => setAutoplay((v) => !v)}
              aria-label={autoplay ? t.tour.pause : t.tour.play}
              className="ml-1 flex size-9 items-center justify-center rounded-full hover:bg-sand-soft"
            >
              {autoplay ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Telefon ─────────────────────────────────────────────────────────────────

function PhoneStage({
  demo,
  onExitDemo,
  frameRef,
  path,
}: {
  demo: boolean;
  onExitDemo: () => void;
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  path: string;
}) {
  const { t, href } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  // Telefon-App nur laden, wenn die Tour tatsächlich sichtbar ist (Desktop)
  const wide = useMediaQuery(DESKTOP);

  // Telefon an die verfügbare Höhe anpassen (Originalgrösse 390 × 844)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      setScale(Math.max(0.55, Math.min(1, (height - 8) / (PHONE_H + BEZEL * 2))));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const width = (PHONE_W + BEZEL * 2) * scale;
  const height = (PHONE_H + BEZEL * 2) * scale;

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0">
      <div
        className="pointer-events-auto absolute top-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out-soft"
        style={{ width, height, left: demo ? `calc(50% - ${width / 2}px)` : `calc(100% - ${width}px)` }}
      >
        <div
          className="origin-top-left rounded-[3.25rem] bg-ink p-3 shadow-[0_40px_80px_-30px_rgba(34,37,33,0.55),0_0_0_1px_rgba(0,0,0,0.04)]"
          style={{ width: PHONE_W + BEZEL * 2, height: PHONE_H + BEZEL * 2, transform: `scale(${scale})` }}
        >
          <div className="relative size-full overflow-hidden rounded-[2.5rem] bg-paper">
            {wide && (
              <iframe
                ref={frameRef}
                src={href("/")}
                title={t.tour.phoneTitle}
                className="size-full border-0"
                width={PHONE_W}
                height={PHONE_H}
              />
            )}
          </div>
        </div>
        <div className={cn("absolute -bottom-9 left-0 flex w-full justify-center gap-4 text-xs transition-opacity", demo ? "opacity-100" : "opacity-0")}>
          <button type="button" onClick={onExitDemo} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-ink" tabIndex={demo ? 0 : -1}>
            <X className="size-3.5" aria-hidden /> {t.tour.backToTour}
          </button>
          <Link href={path} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-ink" tabIndex={demo ? 0 : -1}>
            {t.tour.fullSize} <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Kapitel ─────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-4 text-terracotta-strong">{children}</p>;
}

function Headline({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h1 id={`kapitel-${id}`} className="display text-[clamp(2.75rem,5.6vw,5.25rem)]">
      {children}
    </h1>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 max-w-xl text-lg text-ink/75 xl:text-xl">{children}</p>;
}

function ChapterContent({ chapter, data, onPhone }: { chapter: ChapterId; data: TourData; onPhone: (path: string) => void }) {
  const { t, href } = useI18n();
  switch (chapter) {
    case "start":
      return (
        <>
          <Eyebrow>{t.home.regionLong}</Eyebrow>
          <Headline id={chapter}>
            {t.home.headline.replace(/\.$/, "")}
            <span className="text-terracotta">.</span>
          </Headline>
          <Lead>{t.tour.start.lead}</Lead>
          <dl className="mt-8 flex gap-8">
            {(
              [
                [data.counts.places, t.tour.start.places],
                [data.counts.journeys, t.tour.start.journeys],
                [data.counts.accommodations, t.tour.start.accommodations],
              ] as const
            ).map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-4xl font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      );
    case "journeys":
      return (
        <>
          <Eyebrow>{t.tour.chapter.journeys}</Eyebrow>
          <Headline id={chapter}>{t.tour.journeys.title}</Headline>
          <Lead>{t.tour.journeys.lead}</Lead>
          <ul className="mt-7 grid max-w-2xl grid-cols-3 gap-2.5">
            {data.journeys.map((journey) => {
              const theme = journeyTheme(journey.theme);
              return (
                <li key={journey.slug}>
                  <button
                    type="button"
                    onClick={() => onPhone(`/touren/${journey.slug}`)}
                    className={cn("flex h-full w-full items-start gap-3 rounded-2xl p-3.5 text-left transition-transform hover:-translate-y-0.5", theme.card)}
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", theme.badge)}>
                      <JourneyIcon name={journey.icon} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm leading-tight font-semibold">{journey.title}</span>
                      <span className={cn("mt-0.5 block text-xs", theme.muted)}>{journey.persona}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      );
    case "discover":
      return (
        <>
          <Eyebrow>{t.discover.eyebrow}</Eyebrow>
          <Headline id={chapter}>{t.discover.title}</Headline>
          <Lead>{t.tour.discover.lead}</Lead>
          <ul className="mt-7 grid max-w-2xl grid-cols-4 gap-3">
            {data.highlights.slice(0, 4).map((place) => (
              <li key={place.slug}>
                <button
                  type="button"
                  onClick={() => onPhone(`/entdecken/${place.slug}`)}
                  className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl text-left"
                >
                  <Image src={place.image} alt="" fill sizes="180px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 text-sm leading-tight font-semibold text-paper">{place.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex max-w-2xl flex-wrap gap-2">
            {data.categories.map((slug) => (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => onPhone(`/entdecken?kategorie=${slug}`)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3.5 text-sm font-medium hover:border-ink/30"
                >
                  <CategoryIcon slug={slug} className="size-4" /> {t.categories[slug]}
                </button>
              </li>
            ))}
          </ul>
        </>
      );
    case "howto": {
      const paths = ["/aufenthalt/neu", "/aufenthalt", "/touren"];
      return (
        <>
          <Eyebrow>{t.tour.chapter.howto}</Eyebrow>
          <Headline id={chapter}>{t.tour.howto.title}</Headline>
          <ol className="mt-8 grid max-w-xl gap-3">
            {t.tour.howto.steps.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => onPhone(paths[i])}
                  className="flex w-full items-start gap-4 rounded-2xl bg-card p-4 text-left ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-ink/20"
                >
                  <span className="font-mono text-sm text-terracotta-strong">0{i + 1}</span>
                  <span>
                    <span className="block font-semibold tracking-tight">{step.title}</span>
                    <span className="text-sm text-muted-foreground">{step.text}</span>
                  </span>
                  <ArrowRight className="mt-1 ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        </>
      );
    }
    case "agenda":
      return (
        <>
          <Eyebrow>{t.tour.chapter.agenda}</Eyebrow>
          <Headline id={chapter}>{t.tour.agenda.title}</Headline>
          <Lead>{t.tour.agenda.lead}</Lead>
          <div className="mt-7 max-w-md space-y-2 rounded-3xl bg-card p-5 ring-1 ring-border" aria-label={t.tour.agenda.example}>
            <p className="eyebrow text-muted-foreground">{t.tour.agenda.exampleDay}</p>
            {["09:00", "11:00", "13:00", "19:00"].map((time, i) => {
              const conflict = i === 1 || i === 2;
              return (
                <div key={time} className="flex items-center gap-3 text-sm">
                  <span className="w-12 font-mono text-muted-foreground">{time}</span>
                  <span className={cn("size-2 rounded-full", conflict ? "bg-terracotta" : "bg-forest")} aria-hidden />
                  <span className="font-medium">{t.tour.agenda.items[i]}</span>
                  {conflict && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning-fg">
                      <TriangleAlert className="size-3" aria-hidden /> {t.tour.agenda.conflict}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      );
    case "install":
      return (
        <>
          <Eyebrow>{t.tour.chapter.install}</Eyebrow>
          <Headline id={chapter}>{t.tour.install.title}</Headline>
          <Lead>{t.tour.install.lead}</Lead>
          <ul className="mt-7 grid max-w-2xl grid-cols-3 gap-3">
            {t.tour.install.items.map((item) => (
              <li key={item.title} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <p className="font-semibold tracking-tight">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ul>
        </>
      );
    case "privacy":
      return (
        <>
          <Eyebrow>{t.tour.chapter.privacy}</Eyebrow>
          <Headline id={chapter}>{t.privacy.title}</Headline>
          <ul className="mt-7 grid max-w-xl gap-2.5 text-ink/80">
            {t.tour.privacy.points.map((text) => (
              <li key={text} className="flex items-center gap-3">
                <ShieldCheck className="size-5 shrink-0 text-forest" aria-hidden /> {text}
              </li>
            ))}
          </ul>
          <Link href={href("/datenschutz")} className="mt-6 inline-block text-sm font-medium text-forest underline underline-offset-4">
            {t.tour.privacy.read}
          </Link>
        </>
      );
  }
}
