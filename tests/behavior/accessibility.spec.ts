import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectInteractiveReady } from "../helpers/interactive-ready";

const FIXED_TEST_TIME = new Date("2026-08-12T12:00:00-06:00");
const REPRESENTATIVE_ROUTES = [
  "/",
  "/eventos/",
  "/galeria/",
  "/afiliados/",
  "/eventos/pasados/",
  "/eventos/pasados/2026-08-08-examen/",
  "/en/",
];

async function expectNoAutomatedViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

for (const route of REPRESENTATIVE_ROUTES) {
  test(`${route} has no detectable WCAG A or AA violations`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(FIXED_TEST_TIME);
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await expectNoAutomatedViolations(page);
  });
}

test("the open gallery lightbox has no detectable WCAG A or AA violations", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto("/galeria/");
  await expectInteractiveReady(page, "gallery");
  await page.locator(".gallery-featured-frame > button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAutomatedViolations(page);
});
