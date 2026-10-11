import { expect, test } from "@playwright/test";
import { createTripViaUi } from "./helpers";

test("Eigene Termine: hinzufügen, Konflikt erkennen, verschieben, löschen", async ({ page }) => {
  const tripId = await createTripViaUi(page, "Kulturtage", 10, 2);
  // Einrichtung: bewusst ohne Unterkunft weiter
  await page.getByRole("radio", { name: "Keine" }).click();
  await page.getByRole("button", { name: "Ohne Unterkunft fortfahren" }).click();
  await page.waitForURL(`**/aufenthalt/${tripId}`);

  await page.goto(`/aufenthalt/${tripId}/agenda`);
  // Vorherige Route bleibt via <Activity> versteckt im DOM → nur sichtbare Treffer
  await expect(page.getByText("Noch nichts geplant").filter({ visible: true })).toBeVisible();

  // Erster Termin
  await page.getByRole("button", { name: "Eigener Termin" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titel").fill("Abendessen");
  await dialog.getByLabel("Beginn").fill("19:00");
  await dialog.getByRole("button", { name: "2 Std." }).click();
  await dialog.getByRole("button", { name: "Eintragen" }).click();
  await expect(dialog).toBeHidden();

  // Zweiter, überschneidender Termin → Warnung, aber Speichern möglich
  await page.getByRole("button", { name: "Eigener Termin" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titel").fill("Konzert");
  await dialog.getByLabel("Beginn").fill("20:00");
  await expect(dialog.getByTestId("conflict-warning")).toContainText("«Abendessen»");
  await dialog.getByRole("button", { name: "Eintragen" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("conflict-badge")).toHaveCount(2);

  // Konzert auf den nächsten Tag verschieben → Konflikt verschwindet
  await page.getByRole("button", { name: /^Konzert, 20:00/ }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("radio").nth(1).click();
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: "Liste" }).click();
  await expect(page.getByTestId("conflict-badge")).toHaveCount(0);
  await expect(page.getByTestId("agenda-item")).toHaveCount(2);

  // Löschen
  await page.getByRole("button", { name: /^Abendessen, 19:00/ }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Löschen" }).click();
  await dialog.getByRole("button", { name: "Wirklich löschen" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("agenda-item")).toHaveCount(1);
  await page.reload();
  await page.getByRole("tab", { name: "Liste" }).click();
  await expect(page.getByTestId("agenda-item")).toHaveCount(1);
});

test("Validierung: Abreise vor Anreise wird verständlich abgelehnt", async ({ page }) => {
  await page.goto("/aufenthalt/neu", { waitUntil: "networkidle" });
  await page.getByLabel("Anreise").fill("2026-10-18");
  await page.getByLabel("Abreise").fill("2026-10-16");
  await page.getByRole("button", { name: "Aufenthalt erstellen" }).click();
  await expect(page.getByText("Die Abreise kann nicht vor der Anreise liegen.")).toBeVisible();
  await expect(page).toHaveURL(/\/aufenthalt\/neu/);
});
