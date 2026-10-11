import {
  BedDouble,
  CalendarHeart,
  Compass,
  Landmark,
  ShoppingBag,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  entdecken: Compass,
  "essen-trinken": Utensils,
  wellness: Waves,
  kultur: Landmark,
  natur: Trees,
  shopping: ShoppingBag,
  veranstaltungen: CalendarHeart,
  unterkunft: BedDouble,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Compass;
  return <Icon className={className} aria-hidden />;
}
