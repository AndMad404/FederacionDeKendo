import { expect, test, type Page } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import { expectCssPixels, getBox } from "../helpers/geometry-assertions";
import { SHELL_CONTRACT } from "./design-contract";

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
    ).toHaveCount(0);
    await expect(
      panel.getByText("1:00p.m. - 3:00p.m.", { exact: true }),
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

const FIXED_TABLET_TIME = new Date("2026-11-07T12:00:00-06:00");

function visibleCalendarCards(page: Page) {
  return page.locator('section[aria-labelledby^="calendar-month-"] li:visible');
}

async function expectStandardFooterGap(page: Page) {
  const panel = await getBox(page.locator("[data-page-content-boundary]"));
  const footer = await getBox(page.getByRole("contentinfo"));
  expectCssPixels(
    footer.y - panel.y - panel.height,
    SHELL_CONTRACT.routeSurfaceMarginBlock,
    "calendar panel to footer",
  );
}

test.describe("responsive calendar display rules", () => {
  test.use({ reducedMotion: "reduce" });

  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 960, height: 1440 },
  ]) {
    test(`three tablet events keep two matching 4:3 covers and a compact 3:4 card at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openCalendar(page, FIXED_TABLET_TIME);
      const cards = visibleCalendarCards(page);
      await expect(cards).toHaveCount(3);

      const shogun = cards.filter({
        has: page.getByRole("heading", { name: "Copa Shogun 2026 — Panamá" }),
      });
      const seminar = cards.filter({
        has: page.getByRole("heading", { name: "Seminario Noviembre 2026" }),
      });
      const tournament = cards.filter({
        has: page.getByRole("heading", { name: "4to Torneo" }),
      });
      const portrait = tournament.locator("picture");
      await expect(portrait).toHaveAttribute("data-cover-format", "archive");

      const shogunImage = shogun.locator("picture img");
      const seminarImage = seminar.locator("picture img");
      await expect
        .poll(() => shogunImage.evaluate((image) => image.currentSrc))
        .toMatch(/copa-shogun-2026-panama-kendo-tablet-960\.webp$/);
      const [shogunMedia, seminarMedia, portraitMedia] = await Promise.all([
        getBox(shogunImage),
        getBox(seminarImage),
        getBox(portrait.locator("img")),
      ]);
      expectCssPixels(
        shogunMedia.width,
        seminarMedia.width,
        "stacked cover widths",
      );
      expectCssPixels(
        shogunMedia.height,
        seminarMedia.height,
        "stacked cover heights",
      );
      expectCssPixels(
        shogunMedia.height,
        shogunMedia.width * 0.75,
        "4:3 cover height",
      );
      expectCssPixels(
        portraitMedia.height,
        portraitMedia.width / 0.75,
        "3:4 cover height",
      );
      expect(portraitMedia.width).toBeGreaterThan(shogunMedia.width);

      const [top, bottom, isolated, actions] = await Promise.all([
        getBox(shogun),
        getBox(seminar),
        getBox(tournament),
        getBox(tournament.locator(":scope > div").last()),
      ]);
      expectCssPixels(top.width, bottom.width, "stacked card widths");
      expectCssPixels(top.height, bottom.height, "stacked card heights");
      expectCssPixels(top.width, isolated.width, "column widths");
      expectCssPixels(top.x, bottom.x, "stacked card alignment");
      expectCssPixels(top.y, isolated.y, "column top alignment");
      expect(bottom.y).toBeGreaterThan(top.y + top.height);
      expect(isolated.x).toBeGreaterThan(top.x + top.width);
      expect(isolated.y + isolated.height).toBeLessThan(
        bottom.y + bottom.height,
      );
      expectCssPixels(
        actions.y - portraitMedia.y - portraitMedia.height,
        16,
        "portrait to actions",
      );
      expectCssPixels(
        isolated.y + isolated.height - actions.y - actions.height,
        13,
        "compact card bottom inset",
      );
      await expectStandardFooterGap(page);
    });
  }

  for (const viewport of [
    { width: 960, height: 1440, coverWidth: 403 },
    { width: 1366, height: 768, coverWidth: 469 },
  ]) {
    test(`four events use two centered month pairs and matching full-width 4:3 covers at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openCalendar(page, FIXED_TABLET_TIME);
      const cards = visibleCalendarCards(page);
      const next = page.getByRole("button", {
        name: "Ver los dos meses siguientes",
      });
      const previous = page.getByRole("button", {
        name: "Ver los dos meses anteriores",
      });
      await expect(cards).toHaveCount(3);
      const getArrowSlots = () =>
        Promise.all([
          getBox(previous.locator("..")),
          getBox(next.locator("..")),
        ]);
      const initialArrows = await getArrowSlots();
      const expectAlignedArrows = async () => {
        const arrows = await getArrowSlots();
        arrows.forEach((arrow, index) => {
          expectCssPixels(arrow.x, initialArrows[index].x, "calendar arrow x");
          expectCssPixels(arrow.y, initialArrows[index].y, "calendar arrow y");
        });
      };
      await next.click();

      const headings = cards.getByRole("heading");
      const expectedEvents = [
        "1er Examen 2027",
        "5to Torneo",
        "2do Examen 2027",
        "3er Examen 2027",
      ];
      await expect(headings).toHaveText(expectedEvents);
      await expectAlignedArrows();
      const separators = page.getByText("—", { exact: true });
      await expect(separators).toHaveCount(2);
      await expect(separators.first().locator("..")).toHaveText(
        /Enero\s*—\s*Abril 2027/,
      );
      await expect(separators.last().locator("..")).toHaveText(
        /Mayo\s*—\s*Julio 2027/,
      );
      const center = await page.evaluate(
        () => document.documentElement.clientWidth / 2,
      );
      await expect
        .poll(
          () =>
            separators.evaluateAll(
              (nodes, pageCenter) =>
                Math.max(
                  ...nodes.map((node) => {
                    const box = node.getBoundingClientRect();
                    return Math.abs(box.x + box.width / 2 - pageCenter);
                  }),
                ),
              center,
            ),
          { message: "both month separators are centered after navigation" },
        )
        .toBeLessThanOrEqual(0.51);

      const [first, second, third, fourth] = await Promise.all(
        (await cards.all()).map((card) => getBox(card.locator("picture img"))),
      );
      for (const cover of [first, second, third, fourth]) {
        expectCssPixels(
          cover.width,
          viewport.coverWidth,
          "reference cover width",
        );
        expectCssPixels(cover.height, cover.width * 0.75, "4:3 cover height");
      }
      expectCssPixels(first.y, second.y, "first image row");
      expectCssPixels(third.y, fourth.y, "second image row");
      expectCssPixels(first.x, third.x, "left image column");
      expectCssPixels(second.x, fourth.x, "right image column");
      expect(third.y).toBeGreaterThan(first.y + first.height);
      const secondPair = await getBox(separators.last());
      expect(secondPair.y).toBeGreaterThan(first.y + first.height);
      expect(secondPair.y + secondPair.height).toBeLessThan(third.y);
      await expectStandardFooterGap(page);

      const lastAction = cards
        .last()
        .getByRole("link", { name: /Detalles del evento/ });
      await lastAction.scrollIntoViewIfNeeded();
      await expect(lastAction).toBeInViewport({ ratio: 1 });
      await next.click();
      await expect(headings.first()).toHaveText("6to Torneo");
      await expectAlignedArrows();
      await previous.click();
      await expect(headings).toHaveText(expectedEvents);
      await previous.click();
      await expect(cards).toHaveCount(3);
    });
  }

  test("desktop seminar cover matches the Shogun cover dimensions", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openCalendar(page, FIXED_TABLET_TIME);
    const cards = visibleCalendarCards(page);
    const shogun = cards
      .filter({
        has: page.getByRole("heading", { name: "Copa Shogun 2026 — Panamá" }),
      })
      .locator("picture img");
    const seminar = cards
      .filter({
        has: page.getByRole("heading", { name: "Seminario Noviembre 2026" }),
      })
      .locator("picture img");
    await expect
      .poll(() => seminar.evaluate((image) => image.currentSrc))
      .toMatch(/seminario-noviembre-2026-desktop\.webp$/);
    const [reference, generated] = await Promise.all([
      getBox(shogun),
      getBox(seminar),
    ]);
    expectCssPixels(generated.width, reference.width, "desktop cover widths");
    expectCssPixels(
      generated.height,
      reference.height,
      "desktop cover heights",
    );
    expectCssPixels(
      generated.width,
      generated.height * 1.6,
      "8:5 desktop cover",
    );
  });

  test("mobile continues to show one month at a time", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCalendar(page, FIXED_TABLET_TIME);
    const headings = visibleCalendarCards(page).getByRole("heading");
    const next = page.getByRole("button", { name: "Ver mes siguiente" });
    await expect(headings).toHaveText([
      "Copa Shogun 2026 — Panamá",
      "Seminario Noviembre 2026",
    ]);
    await next.click();
    await expect(headings).toHaveText(["4to Torneo"]);
    await next.click();
    await expect(headings).toHaveText(["1er Examen 2027"]);
  });
});
