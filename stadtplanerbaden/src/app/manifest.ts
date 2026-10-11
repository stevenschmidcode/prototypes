import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "baden. – Dein persönlicher Stadtbegleiter",
    short_name: "baden.",
    description: "Besondere Orte in Baden entdecken, Favoriten merken und den eigenen Aufenthalt planen.",
    lang: "de-CH",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7f3",
    theme_color: "#f8f7f3",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mein Aufenthalt", url: "/aufenthalt", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Entdecken", url: "/entdecken", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
