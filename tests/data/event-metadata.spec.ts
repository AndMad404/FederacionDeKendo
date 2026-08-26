import { expect, test, type Page } from "@playwright/test";

const FIXED_UPCOMING_TIME = new Date("2026-08-09T12:00:00-06:00");

async function discoverUpcomingEvent(page: Page) {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/eventos/");
  const eventLink = page.getByRole("link", {
    name: "Ver detalles del evento Gasshuku Monteverde",
  });
  const path = await eventLink.getAttribute("href");
  const accessibleName = await eventLink.getAttribute("aria-label");
  return {
    path: path!,
    title: accessibleName?.replace("Ver detalles del evento ", "") ?? "",
  };
}

test("a prerendered event exposes its approved public metadata", async ({
  page,
}) => {
  const { path, title } = await discoverUpcomingEvent(page);
  await page.goto(path);

  await expect(
    page.getByRole("heading", { name: title, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://fak-kendo.pages.dev${path}`,
  );
});
