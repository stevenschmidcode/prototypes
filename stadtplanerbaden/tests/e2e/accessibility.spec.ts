import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createTripViaUi } from "./helpers";

/** Automatisierte WCAG-2.2-AA-Prüfung (axe-core) der wichtigsten Seiten. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: import("@playwright/test").Page) {
  // Einblend-Animationen abwarten, damit Kontraste im Endzustand gemessen werden
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`);
  expect(summary).toEqual([]);
}

for (const path of ["/", "/entdecken", "/entdecken/museum-langmatt", "/touren", "/touren/mittelalter-geschichte", "/aufenthalt", "/aufenthalt/neu", "/favoriten", "/profil", "/datenschutz", "/en", "/en/touren/coffee-lover"]) {
  test(`Barrierefreiheit: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await expectNoViolations(page);
  });
}

test("Barrierefreiheit: Dashboard und Agenda mit Daten", async ({ page }) => {
  const tripId = await createTripViaUi(page, "Barrierefrei unterwegs");
  await expectNoViolations(page);
  await page.goto(`/aufenthalt/${tripId}`, { waitUntil: "networkidle" });
  await expectNoViolations(page);
  await page.goto(`/aufenthalt/${tripId}/agenda?neu=1`, { waitUntil: "networkidle" });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoViolations(page);
});
