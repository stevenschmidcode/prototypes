import { expect, type Page } from "@playwright/test";

/** ISO-Datum relativ zu heute (lokale Zeit des Testrechners reicht für Testdaten). */
export function isoInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Erstellt über die UI einen Aufenthalt und liefert dessen ID. */
export async function createTripViaUi(page: Page, name: string, startOffset = 7, nights = 2): Promise<string> {
  await page.goto("/aufenthalt/neu", { waitUntil: "networkidle" });
  await page.getByLabel("Name des Aufenthalts").fill(name);
  await page.getByLabel("Anreise").fill(isoInDays(startOffset));
  await page.getByLabel("Abreise").fill(isoInDays(startOffset + nights));
  await page.getByRole("button", { name: "Aufenthalt erstellen" }).click();
  await page.waitForURL(/\/aufenthalt\/[0-9a-f-]{36}\/unterkunft/);
  const tripId = page.url().match(/aufenthalt\/([0-9a-f-]{36})/)?.[1];
  expect(tripId).toBeTruthy();
  return tripId!;
}

/** Herz-Button eines bestimmten Ortes (Detailseite: der Button im Inhaltsbereich). */
export function favoriteButton(page: Page, name: string, state: "merken" | "entfernen") {
  const label = state === "merken" ? `«${name}» als Favorit merken` : `«${name}» aus Favoriten entfernen`;
  return page.getByRole("button", { name: label, exact: true }).last();
}
