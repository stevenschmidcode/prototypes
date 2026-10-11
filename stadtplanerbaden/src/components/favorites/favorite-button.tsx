"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import { cn } from "@/lib/utils";

type Props = {
  target: { placeId: string } | { accommodationId: string };
  name: string;
  variant?: "overlay" | "inline";
  className?: string;
};

export function FavoriteButton({ target, name, variant = "overlay", className }: Props) {
  const { isFavorite, toggle, ready } = useFavorites();
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const active = isFavorite(target);

  async function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    await toggle(target, name);
    setPending(false);
  }

  const label = fmt(active ? t.favorite.remove : t.favorite.add, { name });

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!ready}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-all disabled:opacity-60",
          active
            ? "border-terracotta bg-terracotta/10 text-terracotta-strong"
            : "border-input bg-card text-ink hover:border-ink/40",
          className,
        )}
      >
        <Heart
          className={cn("size-[1.1rem] transition-transform duration-300", active && "scale-110 fill-terracotta text-terracotta")}
          aria-hidden
        />
        {active ? t.favorite.saved : t.favorite.save}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!ready}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur transition-all hover:scale-105 disabled:opacity-70",
        className,
      )}
    >
      <Heart
        className={cn("size-[1.15rem] transition-all duration-300", active && "scale-110 fill-terracotta text-terracotta")}
        aria-hidden
      />
    </button>
  );
}
