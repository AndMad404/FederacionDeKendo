import { expect, test, type Page } from "@playwright/test";
import { settleCalendarLayout } from "../helpers/calendar-layout";

async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await settleCalendarLayout(page);
}

const FIXED_UPCOMING_TIME = new Date("2026-08-09T12:00:00-06:00");

async function discoverUpcomingEvent(page: Page) {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await gotoReady(page, "/eventos/");
  return (await page
    .getByRole("link", { name: /Ver detalles del evento/ })
    .first()
    .getAttribute("href"))!;
}

test("mobile event actions remain usable and contained with an optional description", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoReady(page, await discoverUpcomingEvent(page));
  const action = page.getByRole("link", { name: "Añade a tu calendario" });
  const details = page.locator("dl").filter({ has: action });
  const description = page.getByRole("heading", {
    name: "Descripción",
    level: 2,
  });

  await expect(action).toBeVisible();
  await expect(details).toBeVisible();
  await expect(description).toBeVisible();

  const [actionBox, detailsBox, descriptionBox] = await Promise.all([
    action.boundingBox(),
    details.boundingBox(),
    description.boundingBox(),
  ]);
  if (!actionBox || !detailsBox || !descriptionBox) {
    throw new Error(
      "Expected visible event details to have measurable geometry",
    );
  }

  expect(actionBox.height).toBeGreaterThanOrEqual(44);
  expect(actionBox.x).toBeGreaterThanOrEqual(detailsBox.x);
  expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
    detailsBox.x + detailsBox.width,
  );
  expect(
    Math.abs(
      actionBox.x + actionBox.width / 2 - (detailsBox.x + detailsBox.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(descriptionBox.y);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

for (const viewport of [
  { name: "mobile 360x800 portrait", width: 360, height: 800, columns: 1 },
  { name: "mobile 390x844 portrait", width: 390, height: 844, columns: 1 },
  { name: "tablet 768x1024 portrait", width: 768, height: 1024, columns: 1 },
  { name: "desktop 1366x768 landscape", width: 1366, height: 768, columns: 2 },
]) {
  test(`scheduled event details use a ${viewport.columns}-column ${viewport.name} grid`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await gotoReady(page, await discoverUpcomingEvent(page));

    const addToCalendar = page.getByRole("link", {
      name: "Añade a tu calendario",
    });
    const details = addToCalendar.locator("xpath=ancestor::dl");
    await expect(details).toHaveCount(1);
    await expect(details.locator(":scope > div")).toHaveCount(5);
    await expect(
      details.getByText("America/Costa_Rica", { exact: true }),
    ).toHaveCount(1);
    await expect
      .poll(() =>
        details.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length,
        ),
      )
      .toBe(viewport.columns);
  });
}
