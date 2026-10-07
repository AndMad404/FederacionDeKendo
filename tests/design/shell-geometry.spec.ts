import { expect, test } from "@playwright/test";
import { getReachability } from "../helpers/content-reachability";
import { preparePage } from "../helpers/prepare-page";
import { expectCssPixels, getBox } from "../helpers/geometry-assertions";
import { generatedPages } from "../helpers/generated-pages";
import { SHELL_CONTRACT } from "./design-contract";
const approvedPages = generatedPages();
test("calendar and historical content panels align on the reference desktop", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-04T12:00:00-06:00"));
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.goto("/eventos/");
  const calendarTop = await getBox(
    page.locator("[data-page-content-boundary]"),
  );

  await page.goto("/eventos/pasados/");
  const archiveTop = await getBox(page.locator("[data-page-content-boundary]"));

  expect(Math.abs(calendarTop.y - archiveTop.y)).toBeLessThanOrEqual(1);
});

test.describe("all generated routes preserve the desktop shell contract", () => {
  test.use({ viewport: SHELL_CONTRACT.desktopViewport });

  for (const approvedPage of approvedPages) {
    if (approvedPage.design === "event") continue;

    test(`${approvedPage.path} remains bounded and non-overlapping`, async ({
      page,
    }) => {
      if (approvedPage.design === "notFound") {
        await preparePage(page, "/ruta-responsive-inexistente/");
        const reachability = await getReachability(page);
        expect(reachability.clippedContent).toEqual([]);
        expect(reachability.hasHorizontalOverflow).toBe(false);
      }
      await preparePage(page, approvedPage.path);
      expect((await getReachability(page)).clippedContent).toEqual([]);

      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector("main");
        const nav = document.querySelector("nav");
        const footer = document.querySelector("footer");
        const heading = main?.querySelector("h1");
        const primarySection = main?.firstElementChild;
        const headingRect = heading?.getBoundingClientRect();
        const contentBoundaries = Array.from(
          main?.querySelectorAll("[data-page-content-boundary]") ?? [],
          (element) => element.getBoundingClientRect().top,
        );
        const mainStyles = main ? getComputedStyle(main) : null;

        return {
          document: {
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            clientHeight: root.clientHeight,
            scrollHeight: root.scrollHeight,
          },
          mainPaddingLeft: Number.parseFloat(mainStyles?.paddingLeft ?? "0"),
          mainPaddingRight: Number.parseFloat(mainStyles?.paddingRight ?? "0"),
          navTop: nav?.getBoundingClientRect().top ?? -1,
          footerBottom:
            footer?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY,
          headingTop: headingRect?.top ?? -1,
          headingBottom: headingRect?.bottom ?? Number.POSITIVE_INFINITY,
          headingClearsContent: Boolean(
            headingRect &&
            contentBoundaries.every((top) => top >= headingRect.bottom - 1),
          ),
          primaryClientHeight: primarySection?.clientHeight ?? 0,
          primaryScrollHeight:
            primarySection?.scrollHeight ?? Number.POSITIVE_INFINITY,
        };
      });

      expect(geometry.document.scrollWidth).toBeLessThanOrEqual(
        geometry.document.clientWidth + 1,
      );
      expect(geometry.document.scrollHeight).toBeLessThanOrEqual(
        geometry.document.clientHeight + 1,
      );
      expect(geometry.navTop).toBeGreaterThanOrEqual(0);
      expect(geometry.headingTop).toBeGreaterThanOrEqual(0);
      expect(geometry.headingBottom).toBeLessThanOrEqual(
        SHELL_CONTRACT.desktopViewport.height,
      );
      expect(geometry.footerBottom).toBeLessThanOrEqual(
        SHELL_CONTRACT.desktopViewport.height + 1,
      );
      expectCssPixels(
        geometry.footerBottom,
        geometry.document.clientHeight,
        "footer bottom without document scroll",
      );
      expect(geometry.primaryScrollHeight).toBeLessThanOrEqual(
        geometry.primaryClientHeight + 2,
      );
      expect(geometry.headingClearsContent).toBe(true);
      expectCssPixels(
        geometry.mainPaddingLeft,
        SHELL_CONTRACT.mainPaddingInline,
        "main left padding",
      );
      expectCssPixels(
        geometry.mainPaddingRight,
        SHELL_CONTRACT.mainPaddingInline,
        "main right padding",
      );
    });
  }
});

test.describe("event details preserve desktop document flow", () => {
  test.use({ viewport: SHELL_CONTRACT.desktopViewport });

  for (const approvedPage of approvedPages.filter(
    (page) => page.design === "event",
  )) {
    test(`${approvedPage.path} keeps its content reachable`, async ({
      page,
    }) => {
      await preparePage(page, approvedPage.path);
      expect((await getReachability(page)).clippedContent).toEqual([]);

      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const section = document.querySelector("main > section");
        const contentWrapper = section?.querySelector(":scope > div");
        const footer = document.querySelector("footer");
        const contentWrapperStyles = contentWrapper
          ? getComputedStyle(contentWrapper)
          : null;
        return {
          hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          clientHeight: root.clientHeight,
          scrollHeight: root.scrollHeight,
          sectionScrollHeight: section?.scrollHeight ?? 0,
          sectionClientHeight: section?.clientHeight ?? 0,
          hasGallery: Boolean(section?.querySelector("figure")),
          contentWrapperPaddingInline: {
            left: Number.parseFloat(contentWrapperStyles?.paddingLeft ?? "0"),
            right: Number.parseFloat(contentWrapperStyles?.paddingRight ?? "0"),
          },
          footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
        };
      });

      expect(geometry.hasHorizontalOverflow).toBe(false);
      expect(geometry.sectionScrollHeight).toBeLessThanOrEqual(
        geometry.sectionClientHeight + 1,
      );
      expectCssPixels(
        geometry.contentWrapperPaddingInline.left,
        geometry.hasGallery
          ? SHELL_CONTRACT.eventGalleryDesktopPaddingInline
          : SHELL_CONTRACT.eventDesktopPaddingInline,
        "event desktop content wrapper left padding",
      );
      expectCssPixels(
        geometry.contentWrapperPaddingInline.right,
        geometry.hasGallery
          ? SHELL_CONTRACT.eventGalleryDesktopPaddingInline
          : SHELL_CONTRACT.eventDesktopPaddingInline,
        "event desktop content wrapper right padding",
      );
      if (geometry.scrollHeight > geometry.clientHeight + 1) {
        expect(
          geometry.footerBottom,
          "a scrolling event footer must extend beyond the first viewport",
        ).toBeGreaterThan(geometry.clientHeight);
        expectCssPixels(
          geometry.footerBottom,
          geometry.scrollHeight,
          "scrolling event footer bottom",
        );
      } else {
        expectCssPixels(
          geometry.footerBottom,
          geometry.clientHeight,
          "event footer bottom without document scroll",
        );
      }
    });
  }
});
