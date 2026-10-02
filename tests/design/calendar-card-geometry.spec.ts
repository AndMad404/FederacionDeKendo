import { expect, test, type Page } from "@playwright/test";

const CALENDAR_PATH = "/eventos/";
const FIXED_CALENDAR_TIME = new Date("2026-08-04T12:00:00-06:00");

test("historical tournament thumbnails scroll to follow carousel selection on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.clock.setFixedTime(new Date("2026-08-24T12:00:00-06:00"));
  await page.goto("/eventos/pasados/2026-08-22-3er-torneo/");
  await page.waitForLoadState("networkidle");
  const gallery = page.getByRole("region", { name: /Fotografías del evento/ });
  const thumbnails = gallery.getByRole("group", {
    name: "Seleccionar fotografía",
  });
  await expect(thumbnails).toBeVisible();
  expect(await thumbnails.evaluate((strip) => strip.scrollLeft)).toBe(0);
  await gallery.getByRole("button", { name: "Fotografía siguiente" }).click();
  await expect
    .poll(() => thumbnails.evaluate((strip) => strip.scrollLeft))
    .toBeGreaterThan(0);
});

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

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 906 },
]) {
  test(`calendar October cards fit with equal gaps at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openCalendar(page, new Date("2026-10-01T12:00:00-06:00"));
    const panel = page.locator("[data-page-content-boundary]");
    await expect(
      panel.getByText("Todos los días", { exact: true }),
    ).toHaveCount(2);
    await expect(
      panel.getByText("13:00 - 15:00", { exact: true }),
    ).toBeVisible();
    const geometry = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        contentBottom: rect.bottom - Number.parseFloat(style.paddingBottom) - 1,
        cardBottoms: Array.from(element.querySelectorAll("li")).map(
          (card) => card.getBoundingClientRect().bottom,
        ),
        gaps: [
          style.gap,
          ...Array.from(element.children).map(
            (child) => getComputedStyle(child).gap,
          ),
          ...Array.from(element.querySelectorAll("ul")).map(
            (list) => getComputedStyle(list).gap,
          ),
        ],
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
      };
    });
    for (const bottom of geometry.cardBottoms)
      expect(bottom).toBeLessThanOrEqual(geometry.contentBottom + 1);
    expect(new Set(geometry.gaps)).toEqual(new Set(["16px"]));
    expect(geometry.documentHeight).toBe(geometry.viewportHeight);
  });
}
