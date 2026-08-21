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
    page.getByRole("heading", { name: "Eventos", level: 1 }),
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
  context,
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openCalendar(page);

  const panel = page.locator("[data-page-content-boundary]");
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();

  const session = await context.newCDPSession(page);
  const y = box!.y + box!.height / 2;
  const septemberLabel = calendarNavigation(page).getByText("Septiembre 2026", {
    exact: true,
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box!.x + box!.width - 30, y }],
    });
    await page.waitForTimeout(30);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box!.x + box!.width / 2, y }],
    });
    await page.waitForTimeout(30);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box!.x + 30, y }],
    });
    await page.waitForTimeout(30);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(100);
    if (await septemberLabel.isVisible()) break;
  }

  await expect(septemberLabel).toBeVisible();
  await page.getByRole("button", { name: "Ver mes anterior" }).click();
  await expect(
    calendarNavigation(page).getByText("Agosto 2026", { exact: true }),
  ).toBeVisible();
});

test("changing months resets each month pagination", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openCalendar(page, FIXED_PAGINATION_TIME);

  await expect(page.getByText("Página 1 de 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver más eventos del mes" }).click();
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ver mes siguiente" }).click();
  await page.getByRole("button", { name: "Ver mes anterior" }).click();
  await expect(page.getByText("Página 1 de 2", { exact: true })).toBeVisible();
});
