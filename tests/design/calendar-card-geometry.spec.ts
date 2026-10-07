import { expect, test, type Page } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";

const CALENDAR_PATH = "/eventos/";
const FIXED_CALENDAR_TIME = new Date("2026-08-04T12:00:00-06:00");

async function openCalendar(page: Page, now = FIXED_CALENDAR_TIME) {
  await preparePage(page, CALENDAR_PATH, now);
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
