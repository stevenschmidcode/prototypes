"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Brücke für die Website-Tour: Läuft die App im Telefon-Rahmen (iframe derselben
 * Origin), nimmt sie Navigationsbefehle der Tour entgegen und meldet Berührungen,
 * damit die Tour die Kontrolle abgibt. Nachrichten anderer Origins werden ignoriert.
 */
export type EmbedMessage =
  | { type: "baden:navigate"; path: string }
  | { type: "baden:ready" }
  | { type: "baden:interaction" }
  /** Esc im Telefon beendet den Demo-Modus der Tour */
  | { type: "baden:escape" };

export function EmbedBridge() {
  const router = useRouter();

  useEffect(() => {
    if (window.parent === window) return;
    const origin = window.location.origin;
    const post = (message: EmbedMessage) => window.parent.postMessage(message, origin);

    function onMessage(event: MessageEvent<EmbedMessage>) {
      if (event.origin !== origin || event.source !== window.parent) return;
      const data = event.data;
      if (data?.type === "baden:navigate" && typeof data.path === "string" && data.path.startsWith("/") && !data.path.startsWith("//")) {
        router.push(data.path);
        window.scrollTo({ top: 0 });
      }
    }
    function onInteraction() {
      post({ type: "baden:interaction" });
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") post({ type: "baden:escape" });
      else onInteraction();
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    post({ type: "baden:ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return null;
}
