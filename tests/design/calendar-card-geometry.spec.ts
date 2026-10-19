import { expect, test, type Page } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";

const CALENDAR_PATH = "/eventos/";
const FIXED_CALENDAR_TIME = new Date("2026-08-04T12:00:00-06:00");

async function openCalendar(page: Page, now = FIXED_CALENDAR_TIME) {
  await preparePage(page, CALENDAR_PATH, now);
}

for (const viewport of [
  { width: 1280, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 906 },
]) {
  test(`calendar October cards keep block margins without scroll at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openCalendar(page, new Date("2026-10-01T12:00:00-06:00"));
    const panel = page.locator("[data-page-content-boundary]");
    await expect(
      panel.getByText("Todos los días", { exact: true }),
    ).toHaveCount(2);
    await expect(
      panel.getByText("1:00 p. m. - 3:00 p. m.", { exact: true }),
    ).toBeVisible();
    const geometry = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        minimumBlockMargin:
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ) * 0.5,
        topMargin:
          element.firstElementChild!.getBoundingClientRect().top -
          rect.top -
          Number.parseFloat(style.borderTopWidth),
        innerBottom: rect.bottom - Number.parseFloat(style.borderBottomWidth),
        cardBottoms: Array.from(element.querySelectorAll("li")).map(
          (card) => card.getBoundingClientRect().bottom,
        ),
        internalScrollOwners: [element, ...element.querySelectorAll("*")]
          .filter(
            (child) =>
              child.scrollHeight > child.clientHeight + 1 &&
              /^(auto|scroll)$/.test(getComputedStyle(child).overflowY),
          )
          .map((child) => child.tagName),
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
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });
    expect(geometry.topMargin).toBeGreaterThanOrEqual(
      geometry.minimumBlockMargin,
    );
    for (const bottom of geometry.cardBottoms)
      expect(geometry.innerBottom - bottom).toBeGreaterThanOrEqual(
        geometry.minimumBlockMargin,
      );
    expect(new Set(geometry.gaps)).toEqual(new Set(["16px"]));
    expect(geometry.documentHeight).toBe(geometry.viewportHeight);
    expect(geometry.documentWidth).toBe(geometry.viewportWidth);
    expect(geometry.internalScrollOwners).toEqual([]);
  });
}
