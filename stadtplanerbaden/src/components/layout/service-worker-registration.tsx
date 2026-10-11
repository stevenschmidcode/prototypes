"use client";

import { useEffect } from "react";

/** Registriert den Service Worker – nur in Produktion, um Konflikte mit HMR zu vermeiden. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);
  return null;
}
