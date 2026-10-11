import { expect, test } from "@playwright/test";
import { createTripViaUi, isoInDays } from "./helpers";

test("Reiseprofil: Tour ansehen und als Tagesprogramm übernehmen", async ({ page }) => {
  const tripId = await createTripViaUi(page, "Geschichtswochenende", 5, 2);
  await page.getByRole("radio", { name: "Keine" }).click();
  await page.getByRole("button", { name: "Ohne Unterkunft fortfahren" }).click();
  await page.waitForURL(`**/aufenthalt/${tripId}`);

  await page.goto("/touren", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Mittelalter & Geschichte/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mittelalter & Geschichte" })).toBeVisible();
  await expect(page.getByText("Warum hier?").first()).toBeVisible();

  await page.getByRole("button", { name: "Als Tagesprogramm übernehmen" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Als Tagesprogramm übernehmen" })).toBeVisible();
  await dialog.getByRole("radio").nth(1).click();
  await dialog.getByLabel("Start um").fill("09:00");
  await expect(dialog.getByText("09:00–09:45")).toBeVisible(); // Vorschau: erste Station
  await dialog.getByRole("button", { name: "Tour einplanen" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/8 Stationen am .* eingeplant/)).toBeVisible();

  await page.goto(`/aufenthalt/${tripId}/agenda?tag=${isoInDays(6)}`);
  await expect(page.getByTestId("agenda-item")).toHaveCount(8);
  await expect(page.getByRole("button", { name: /^Ruine Stein,/ })).toBeVisible();
});

test("Reiseprofil beim Erstellen wählen – Dashboard empfiehlt die Tour", async ({ page }) => {
  await page.goto("/aufenthalt/neu?profil=coffee-lover", { waitUntil: "networkidle" });
  await expect(page.getByRole("radio", { name: "Coffee Lover" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Aufenthalt erstellen" }).click();
  await page.waitForURL(/unterkunft/);
  await page.getByRole("radio", { name: "Keine" }).click();
  await page.getByRole("button", { name: "Ohne Unterkunft fortfahren" }).click();
  await page.waitForURL(/\/aufenthalt\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 2, name: "Coffee Lover" })).toBeVisible();
});

test("English: switch language on the same page and plan a stay", async ({ page }) => {
  await page.goto("/entdecken/heisse-brunnen", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "de-CH");
  // Sprachumschalter (Desktop-Kopfzeile oder Fusszeile auf Mobile)
  await page.getByRole("link", { name: "Switch to English" }).last().click();
  await page.waitForURL("**/en/entdecken/heisse-brunnen");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  await expect(page.getByRole("heading", { level: 1, name: /Hot Spring/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to my stay" })).toBeVisible();

  // Validierung auf Englisch
  await page.goto("/en/aufenthalt/neu", { waitUntil: "networkidle" });
  await page.getByLabel("Arrival").fill("2026-10-18");
  await page.getByLabel("Departure").fill("2026-10-16");
  await page.getByRole("button", { name: "Create stay" }).click();
  await expect(page.getByText("Departure can't be before arrival.")).toBeVisible();

  // Aufenthalt auf Englisch erstellen – alle Links bleiben unter /en
  await page.getByLabel("Arrival").fill(isoInDays(3));
  await page.getByLabel("Departure").fill(isoInDays(4));
  await page.getByRole("button", { name: "Create stay" }).click();
  await page.waitForURL(/\/en\/aufenthalt\/[0-9a-f-]{36}\/unterkunft/);
  await expect(page.getByRole("heading", { level: 1, name: "Where are you staying?" })).toBeVisible();
  await page.getByRole("radio", { name: "None" }).click();
  await page.getByRole("button", { name: "Continue without accommodation" }).click();
  await page.waitForURL(/\/en\/aufenthalt\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Weekend in Baden").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open agenda" }).first()).toBeVisible();
});

test("Deutsche URLs mit /de-Präfix leiten auf die kanonische URL um", async ({ request }) => {
  const response = await request.get("/de/touren", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()["location"]).toMatch(/\/touren$/);
});

test("Tour anpassen: Station auslassen, Reihenfolge und Dauer ändern", async ({ page }) => {
  const tripId = await createTripViaUi(page, "Angepasste Tour", 8, 1);
  await page.getByRole("radio", { name: "Keine" }).click();
  await page.getByRole("button", { name: "Ohne Unterkunft fortfahren" }).click();
  await page.waitForURL(`**/aufenthalt/${tripId}`);

  await page.goto("/touren/wellness-thermalwasser", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Als Tagesprogramm übernehmen" }).first().click();
  const dialog = page.getByRole("dialog");
  const stops = dialog.getByTestId("journey-stops");
  await expect(stops.getByRole("listitem")).toHaveCount(5);
  // Der Dialog darf nicht breiter als der Bildschirm werden (lange Ortsnamen)
  const overflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await dialog.getByLabel("Start um").fill("09:00");
  await dialog.getByRole("button", { name: "0 Min.", exact: true }).click();
  // Kurpark auslassen, FORTYSEVEN nach oben, Heisse Brunnen auf 1 Std.
  await dialog.getByRole("checkbox", { name: "Kurpark einplanen" }).uncheck();
  await dialog.getByRole("button", { name: "Wellness-Therme FORTYSEVEN nach oben" }).click();
  await dialog.getByLabel("Zeit vor Ort für Heisse Brunnen").selectOption("60");
  await expect(dialog.getByText("4 von 5 Stationen")).toBeVisible();
  await dialog.getByRole("button", { name: "Tour einplanen" }).click();
  await expect(dialog).toBeHidden();

  await page.goto(`/aufenthalt/${tripId}/agenda?tag=${isoInDays(8)}`);
  await page.getByRole("tab", { name: "Liste" }).click();
  const items = page.getByTestId("agenda-item");
  await expect(items).toHaveCount(4);
  await expect(items.nth(2)).toContainText("Wellness-Therme FORTYSEVEN");
  await expect(items.nth(3)).toContainText("Limmatpromenade");
  await expect(page.getByRole("button", { name: /^Heisse Brunnen, 09:40 bis 10:40/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Kurpark/ })).toHaveCount(0);
});

test("Freie Zeit: Vorschläge einplanen und rückgängig machen", async ({ page }) => {
  const tripId = await createTripViaUi(page, "Spontan in Baden", 9, 0);
  await page.getByRole("radio", { name: "Keine" }).click();
  await page.getByRole("button", { name: "Ohne Unterkunft fortfahren" }).click();
  await page.waitForURL(`**/aufenthalt/${tripId}`);

  await page.goto(`/aufenthalt/${tripId}/agenda`, { waitUntil: "networkidle" });
  const free = page.getByTestId("free-time").filter({ visible: true });
  await expect(free.getByText("Frei von 09:00 bis 21:00")).toBeVisible();

  // Regenwetter: nur wetterfeste Vorschläge
  await free.getByRole("button", { name: "Regenwetter" }).click();
  await expect(free.getByText("Auch bei Regen").first()).toBeVisible();

  const first = free.getByRole("button", { name: /einplanen$/ }).first();
  await first.click();
  await expect(page.getByText(/um \d\d:\d\d eingeplant/)).toBeVisible();
  await expect(page.getByTestId("agenda-item")).toHaveCount(1);

  await page.getByRole("button", { name: "Rückgängig" }).click();
  await expect(page.getByText("Wieder entfernt")).toBeVisible();
  await expect(page.getByTestId("agenda-item")).toHaveCount(0);
});
