import { expect, test } from "@playwright/test";
import { favoriteButton } from "./helpers";

test("Entdecken: Kategorie filtern und leere Suche", async ({ page }) => {
  await page.goto("/entdecken?kategorie=wellness");
  await expect(page.getByRole("link", { name: "Wellness", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Heisse Brunnen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Museum Langmatt" })).toHaveCount(0);

  await page.goto("/entdecken?q=xyzunbekannt");
  await expect(page.getByRole("heading", { name: "Nichts gefunden" })).toBeVisible();
});

test("Favoriten: leerer Zustand und Filter", async ({ page }) => {
  await page.goto("/favoriten");
  await expect(page.getByRole("heading", { name: "Noch keine Favoriten" })).toBeVisible();

  await page.goto("/entdecken/museum-langmatt");
  await favoriteButton(page, "Museum Langmatt", "merken").click();
  await expect(favoriteButton(page, "Museum Langmatt", "entfernen")).toHaveAttribute("aria-pressed", "true");
  // Bestätigung abwarten: der Server hat gespeichert
  await expect(page.getByText("«Museum Langmatt» gemerkt")).toBeVisible();

  await page.goto("/favoriten?filter=museen");
  await expect(page.getByRole("link", { name: "Museum Langmatt" })).toBeVisible();
  await favoriteButton(page, "Museum Langmatt", "entfernen").click();
  await expect(page.getByText("«Museum Langmatt» aus Favoriten entfernt")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Noch keine Favoriten" })).toBeVisible();
});

test("PWA: Manifest, Icons und Offline-Seite sind verfügbar", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const json = await manifest.json();
  expect(json).toMatchObject({ short_name: "baden.", display: "standalone", lang: "de-CH" });
  for (const icon of json.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok()).toBe(true);
  }
  expect((await request.get("/sw.js")).ok()).toBe(true);

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Gerade keine Verbindung" })).toBeVisible();
});

test("Sicherheit: private API-Antworten werden nicht gecacht, Header sind gesetzt", async ({ request }) => {
  const response = await request.get("/api/me/trips");
  expect(response.headers()["cache-control"]).toContain("no-store");
  const page = await request.get("/");
  // Einbetten nur durch die eigene Website-Tour (Telefon-Vorschau), nie durch fremde Seiten
  expect(page.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(page.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(page.headers()["x-powered-by"]).toBeUndefined();
});

test("Datenschutz: Gast kann alle Daten löschen", async ({ page }) => {
  await page.goto("/entdecken/ruine-stein");
  await favoriteButton(page, "Ruine Stein", "merken").click();
  await expect(favoriteButton(page, "Ruine Stein", "entfernen")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("«Ruine Stein» gemerkt")).toBeVisible();
  const cookies = await page.context().cookies();
  const guest = cookies.find((c) => c.name.endsWith("baden_guest"));
  expect(guest?.httpOnly).toBe(true);
  expect(guest?.sameSite).toBe("Lax");

  await page.goto("/profil");
  await page.getByRole("button", { name: "Alle meine Daten löschen" }).click();
  await page.getByRole("button", { name: "Endgültig löschen" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/favoriten");
  await expect(page.getByRole("heading", { name: "Noch keine Favoriten" })).toBeVisible();
});

test("Layout: keine Seite läuft auf dem Smartphone horizontal über", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Nur für den Smartphone-Viewport relevant");
  for (const path of ["/", "/entdecken", "/entdecken/badenfahrt", "/touren", "/touren/mittelalter-geschichte", "/en/touren/coffee-lover", "/aufenthalt", "/aufenthalt/neu", "/favoriten", "/profil"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} ist breiter als der Bildschirm`).toBeLessThanOrEqual(0);
  }
});
