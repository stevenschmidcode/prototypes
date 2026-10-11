import { expect, test } from "@playwright/test";

/** Desktop-Startseite: geführte Tour mit der echten App im Telefon (Aufbau wie letshaveacoffee). */
test.describe("Website-Tour (Desktop)", () => {
  test.skip(({ isMobile }) => isMobile, "Die Tour gibt es nur ab 1024 px Breite");

  test("Kapitel steuern das Telefon, Demo holt es in die Mitte", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const phone = page.frameLocator("iframe[title^='baden.']");
    // Automatische Rotation anhalten – unter Last könnte sie sonst vor der Prüfung weiterschalten
    await page.getByRole("button", { name: "Automatischen Wechsel pausieren" }).click();
    await page.getByRole("tab", { name: "Start" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Baden wartet auf dich." })).toBeVisible();
    await expect(phone.getByRole("heading", { name: "Baden wartet auf dich." })).toBeVisible();

    // Kapitel per Tab → Telefon zeigt «Entdecken»
    await page.getByRole("tab", { name: "Entdecken" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Baden, kuratiert." })).toBeVisible();
    await expect(phone.getByRole("heading", { level: 1, name: "Baden, kuratiert." })).toBeVisible();

    // Bild antippen → Telefon öffnet den Ort
    await page.getByRole("button", { name: "Museum Langmatt" }).click();
    await expect(phone.getByRole("heading", { level: 1, name: "Museum Langmatt" })).toBeVisible();

    // Pfeiltaste → nächstes Kapitel
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { level: 1, name: "In drei Schritten zu deinem Baden." })).toBeVisible();

    // Demo: Text weg, Telefon bleibt bedienbar; Esc → zurück
    await page.getByRole("button", { name: "Demo ausprobieren" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "In drei Schritten zu deinem Baden." })).toBeHidden();
    await phone.getByRole("link", { name: "Entdecken" }).last().click();
    await expect(phone.getByRole("heading", { level: 1, name: "Baden, kuratiert." })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { level: 1, name: "In drei Schritten zu deinem Baden." })).toBeVisible();
  });

  test("Automatischer Wechsel lässt sich pausieren", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Automatischen Wechsel pausieren" }).click();
    await expect(page.getByRole("button", { name: "Automatischen Wechsel starten" })).toBeVisible();
    await page.waitForTimeout(13_000);
    await expect(page.getByRole("tab", { name: "Start" })).toHaveAttribute("aria-selected", "true");
  });

  test("Unterseiten behalten die volle Web-Ansicht", async ({ page }) => {
    await page.goto("/entdecken");
    await expect(page.locator("[data-website-tour]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Baden, kuratiert." })).toBeVisible();
  });
});
