import { expect, test } from "@playwright/test";
import { createTripViaUi, favoriteButton } from "./helpers";

/**
 * Vollständiger Ablauf gemäss Abnahmekriterien:
 * öffnen → Aufenthalt → Unterkunft → Aktivität entdecken → Favorit → Agenda →
 * Uhrzeit ändern → Reload → Daten vorhanden → fremder Gast hat keinen Zugriff.
 */
test("Gast plant einen Aufenthalt von A bis Z", async ({ page, browser, baseURL }) => {
  // 1. Anwendung öffnen (Desktop: Website-Tour mit der App im Telefon; Mobile: die App)
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Baden wartet auf dich." })).toBeVisible();
  const app = test.info().project.name === "desktop" ? page.frameLocator("iframe[title^='baden.']") : page;
  await expect(app.getByRole("heading", { name: "Wann bist du in Baden?" })).toBeVisible();

  // 2. Aufenthalt erstellen
  const tripId = await createTripViaUi(page, "Herbstwochenende in Baden");

  // 3. Unterkunft hinterlegen (aus dem Katalog)
  await expect(page.getByRole("heading", { level: 1, name: "Wo übernachtest du?" })).toBeVisible();
  await page.getByRole("radio", { name: /Limmathof Baden Hotel & Spa/ }).click();
  await page.getByLabel("ab", { exact: true }).fill("15:00");
  await page.getByRole("button", { name: "Unterkunft speichern" }).click();
  await page.waitForURL(`**/aufenthalt/${tripId}`);
  await expect(page.getByRole("heading", { level: 1, name: "Herbstwochenende in Baden" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Limmathof Baden Hotel & Spa" })).toBeVisible();

  // 4. Aktivität entdecken (Suche)
  await page.goto("/entdecken?q=fortyseven");
  const result = page.getByRole("link", { name: "Wellness-Therme FORTYSEVEN" });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByRole("heading", { level: 1, name: "Wellness-Therme FORTYSEVEN" })).toBeVisible();

  // 5. Als Favorit speichern
  const favorite = favoriteButton(page, "Wellness-Therme FORTYSEVEN", "merken");
  await expect(favorite).toBeEnabled();
  await favorite.click();
  await expect(favoriteButton(page, "Wellness-Therme FORTYSEVEN", "entfernen")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("«Wellness-Therme FORTYSEVEN» gemerkt")).toBeVisible();

  // 6. Zur Agenda hinzufügen – zweiter Tag, 11:00
  await page.getByRole("button", { name: "Zum Aufenthalt hinzufügen" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Zum Aufenthalt hinzufügen" })).toBeVisible();
  await dialog.getByRole("radio").nth(1).click();
  await dialog.getByLabel("Beginn").fill("11:00");
  await dialog.getByRole("button", { name: "In Agenda eintragen" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/«Wellness-Therme FORTYSEVEN» am .* um 11:00 geplant/)).toBeVisible();

  // 7. Uhrzeit in der Agenda ändern
  await page.goto(`/aufenthalt/${tripId}/agenda`);
  await page.getByRole("tab", { name: "Liste" }).click();
  await page.getByRole("button", { name: /Wellness-Therme FORTYSEVEN, 11:00 bis/ }).click();
  const edit = page.getByRole("dialog");
  await edit.getByLabel("Beginn").fill("14:00");
  await edit.getByRole("button", { name: "Speichern" }).click();
  await expect(edit).toBeHidden();
  await expect(page.getByRole("button", { name: /Wellness-Therme FORTYSEVEN, 14:00 bis/ })).toBeVisible();

  // 8./9. Neu laden – alles ist noch da
  await page.reload();
  await page.getByRole("tab", { name: "Liste" }).click();
  await expect(page.getByRole("button", { name: /Wellness-Therme FORTYSEVEN, 14:00 bis/ })).toBeVisible();
  await page.goto(`/aufenthalt/${tripId}`);
  await expect(page.getByRole("heading", { name: "Limmathof Baden Hotel & Spa" })).toBeVisible();
  await page.goto("/favoriten");
  await expect(page.getByRole("link", { name: "Wellness-Therme FORTYSEVEN" })).toBeVisible();
  await page.goto("/aufenthalt");
  await expect(page.getByRole("heading", { level: 1, name: "Herbstwochenende in Baden" })).toBeVisible();

  // 10. Ein anderer Gast kann die privaten Daten nicht abrufen
  const stranger = await browser.newContext({ baseURL });
  const strangerPage = await stranger.newPage();
  const api = await strangerPage.request.get(`/api/me/trips/${tripId}`);
  expect(api.status()).toBe(404);
  expect(await api.text()).not.toContain("Herbstwochenende");
  const list = await strangerPage.request.get("/api/me/trips");
  expect(await list.json()).toEqual({ trips: [] });
  await strangerPage.goto(`/aufenthalt/${tripId}`);
  await expect(strangerPage.getByRole("heading", { name: "Hier geht es nicht weiter." })).toBeVisible();
  await expect(strangerPage.getByText("Herbstwochenende in Baden")).toHaveCount(0);
  await expect(strangerPage.getByText("Limmathof Baden Hotel & Spa")).toHaveCount(0);
  await strangerPage.goto("/aufenthalt");
  await expect(strangerPage.getByRole("heading", { level: 1, name: "Dein Baden, gut geplant." })).toBeVisible();
  await stranger.close();
});
