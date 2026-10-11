import { Baby, Castle, Coffee, Mountain, Palette, Route, Waves, type LucideIcon } from "lucide-react";

/** Farbthemen der Thementouren – alle Kombinationen erfüllen WCAG AA für Text. */
export const JOURNEY_THEMES: Record<string, { card: string; muted: string; badge: string; accent: string }> = {
  forest: { card: "bg-forest text-paper", muted: "text-paper/75", badge: "bg-paper/12 text-paper", accent: "bg-paper/10" },
  terracotta: {
    card: "bg-terracotta-strong text-white",
    muted: "text-white/80",
    badge: "bg-white/15 text-white",
    accent: "bg-white/10",
  },
  sand: { card: "bg-sand text-ink", muted: "text-ink/70", badge: "bg-paper/70 text-ink", accent: "bg-terracotta/15" },
  sky: { card: "bg-[#dbe6ec] text-ink", muted: "text-ink/70", badge: "bg-paper/70 text-ink", accent: "bg-[#b9cdd8]/60" },
  sage: { card: "bg-[#dfe7da] text-ink", muted: "text-ink/70", badge: "bg-paper/70 text-ink", accent: "bg-forest/10" },
  plum: { card: "bg-[#ece0e6] text-ink", muted: "text-ink/70", badge: "bg-paper/70 text-ink", accent: "bg-[#c9a9b8]/40" },
};

const ICONS: Record<string, LucideIcon> = {
  castle: Castle,
  waves: Waves,
  coffee: Coffee,
  palette: Palette,
  mountain: Mountain,
  baby: Baby,
};

export function JourneyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Route;
  return <Icon className={className} aria-hidden />;
}

export function journeyTheme(theme: string) {
  return JOURNEY_THEMES[theme] ?? JOURNEY_THEMES.sand;
}
