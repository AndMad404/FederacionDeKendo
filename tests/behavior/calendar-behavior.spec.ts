import { swipeLeft } from "../helpers/swipe";
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const CALENDAR_PATH = "/eventos/";
const FIXED_CALENDAR_TIME = new Date("2026-08-04T12:00:00-06:00");
const FIXED_PAGINATION_TIME = new Date("2026-05-01T12:00:00-06:00");

async function openCalendar(page: Page, now = FIXED_CALENDAR_TIME) {
  await page.clock.setFixedTime(now);
  await page.goto(CALENDAR_PATH);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", {
      name: "Calendario de Eventos",
      level: 1,
    }),
  ).toBeVisible();
}

function calendarNavigation(page: Page) {
  return page.getByRole("navigation", { name: "Navegación del calendario" });
}

test("mobile calendar navigation advances and returns one month", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openCalendar(page);

  await expect(
    calendarNavigation(page).getByText("Agosto 2026", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver mes siguiente" }).click();
  await expect(
    calendarNavigation(page).getByText("Septiembre 2026", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver mes anterior" }).click();
  await expect(
    calendarNavigation(page).getByText("Agosto 2026", { exact: true }),
  ).toBeVisible();
});

test("desktop calendar navigation advances and returns two months", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openCalendar(page);

  await expect(
    page.getByText("Agosto — Septiembre 2026", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver los dos meses siguientes" })
    .click();
  await expect(
    page.getByText("Octubre — Noviembre 2026", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ver los dos meses anteriores" })
    .click();
  await expect(
    page.getByText("Agosto — Septiembre 2026", { exact: true }),
  ).toBeVisible();
});

test("touch swipe uses the same one-month navigation on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openCalendar(page);

  const septemberLabel = calendarNavigation(page).getByText("Septiembre 2026", {
    exact: true,
  });
  await swipeLeft(page, page.locator("[data-page-content-boundary]"), () =>
    septemberLabel.isVisible(),
  );

  await expect(septemberLabel).toBeVisible();
  await page.getByRole("button", { name: "Ver mes anterior" }).click();
  await expect(
    calendarNavigation(page).getByText("Agosto 2026", { exact: true }),
  ).toBeVisible();
});

test("changing months keeps pagination controls hidden for single-page months", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openCalendar(page, FIXED_PAGINATION_TIME);

  const previousEvents = page.getByRole("button", {
    name: "Ver eventos anteriores del mes",
  });
  const nextEvents = page.getByRole("button", {
    name: "Ver más eventos del mes",
  });

  await expect(previousEvents).toHaveCount(0);
  await expect(nextEvents).toHaveCount(0);

  await page.getByRole("button", { name: "Ver mes siguiente" }).click();
  await expect(previousEvents).toHaveCount(0);
  await expect(nextEvents).toHaveCount(0);

  await page.getByRole("button", { name: "Ver mes anterior" }).click();
  await expect(
    calendarNavigation(page).getByText("Mayo 2026", { exact: true }),
  ).toBeVisible();
  await expect(previousEvents).toHaveCount(0);
  await expect(nextEvents).toHaveCount(0);
});
