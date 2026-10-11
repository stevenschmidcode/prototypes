"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addFavoriteAction, removeFavoriteAction } from "@/app/actions";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/messages";
import type { FavoriteIdsDto } from "@/lib/types";

type Target = { placeId: string } | { accommodationId: string };

type FavoritesContextValue = {
  ready: boolean;
  isFavorite: (target: Target) => boolean;
  toggle: (target: Target, name: string) => Promise<void>;
  count: number;
  /** Leert den lokalen Zustand (z. B. nach dem Löschen aller Daten) */
  reset: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function keyOf(target: Target) {
  return "placeId" in target ? `p:${target.placeId}` : `a:${target.accommodationId}`;
}

/**
 * Hält die Favoriten-IDs des Gastes im Client, damit Herz-Buttons überall
 * konsistent und sofort (optimistisch) reagieren. Die Daten kommen aus einer
 * privaten, nicht cachebaren API-Route.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t, href, message } = useI18n();
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/favorites", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? (res.json() as Promise<FavoriteIdsDto>) : { placeIds: [], accommodationIds: [] }))
      .then((data) => {
        if (cancelled) return;
        setKeys(new Set([...data.placeIds.map((id) => `p:${id}`), ...data.accommodationIds.map((id) => `a:${id}`)]));
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((target: Target) => keys.has(keyOf(target)), [keys]);

  const toggle = useCallback(
    async (target: Target, name: string) => {
      const key = keyOf(target);
      const wasFavorite = keys.has(key);
      const apply = (add: boolean) =>
        setKeys((prev) => {
          const next = new Set(prev);
          if (add) next.add(key);
          else next.delete(key);
          return next;
        });

      apply(!wasFavorite);
      const result = wasFavorite ? await removeFavoriteAction(target) : await addFavoriteAction(target);
      if (!result.ok) {
        apply(wasFavorite);
        toast.error(message(result.error));
        return;
      }
      toast.success(fmt(wasFavorite ? t.favorite.toastRemoved : t.favorite.toastAdded, { name }), {
        action: wasFavorite
          ? undefined
          : { label: t.favorite.toastAction, onClick: () => router.push(href("/favoriten")) },
      });
    },
    [keys, router, t, href, message],
  );

  const reset = useCallback(() => setKeys(new Set()), []);

  const value = useMemo(
    () => ({ ready, isFavorite, toggle, count: keys.size, reset }),
    [ready, isFavorite, toggle, keys, reset],
  );
  return <FavoritesContext value={value}>{children}</FavoritesContext>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites muss innerhalb des FavoritesProvider verwendet werden.");
  return context;
}
