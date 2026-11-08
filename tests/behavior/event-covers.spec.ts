import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import coverApproval from "../../src/app/config/eventCoverApproval.json" with { type: "json" };

const SHOGUN_POSTER_SELECTOR =
  '[data-thumbnail-source="poster"] img[src*="/panama-5ta-copa-shogun-torneo-por-equipos-y-seminario/"]';

test("generic external archive cover fills the same frame as its neighboring photo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await preparePage(
    page,
    "/eventos/pasados/?year=2026",
    new Date("2026-11-07T12:00:00-06:00"),
  );
  const cover = page.locator("picture").filter({
    has: page.locator('img[src*="/kendo-external-"][src*="-archive-"]'),
  });
  const photo = page
    .locator('picture[data-thumbnail-source="gallery"]')
    .first();
  await expect(cover).toBeVisible();
  await expect(cover).toHaveCSS("background-color", "rgb(250, 250, 250)");
  await expect(cover.locator("img")).toHaveCSS("object-fit", "contain");
  const [coverBox, photoBox] = await Promise.all([
    cover.boundingBox(),
    photo.boundingBox(),
  ]);
  expect(coverBox!.width).toBeCloseTo(photoBox!.width, 0);
  expect(coverBox!.height).toBeCloseTo(photoBox!.height, 0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  for (const [context, route, referenceTime] of [
    ["calendar", "/eventos/", "2026-11-01T12:00:00-06:00"],
    ["archive", "/eventos/pasados/?year=2026", "2026-12-01T12:00:00-06:00"],
  ] as const) {
    test(`Shogun ${context} thumbnail preserves the crest with a top crop at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await preparePage(page, route, new Date(referenceTime));
      const poster = page.locator(SHOGUN_POSTER_SELECTOR);
      await expect(poster).toHaveCount(1);
      await poster.scrollIntoViewIfNeeded();
      await expect(poster).toBeVisible();
      await expect(poster).toHaveAttribute("src", /-flyer-\d+\.webp$/);
      // The calendar swaps in a pre-composed 4:3 tablet artwork (see
      // EventThumbnail `showShogunTabletCover`) on portrait tablets. That
      // artwork already contains the crest, so it is shown uncropped.
      const portraitTablet =
        context === "calendar" &&
        viewport.width >= 768 &&
        viewport.width < 1280 &&
        viewport.height > viewport.width;
      if (portraitTablet) {
        await expect(poster).toHaveCSS("object-fit", "contain");
        await expect(poster).toHaveCSS("object-position", "50% 50%");
        await expect(poster).toHaveCSS("aspect-ratio", "auto");
        await expect
          .poll(() =>
            poster.evaluate((img: HTMLImageElement) => img.currentSrc),
          )
          .toMatch(/-tablet-960\.webp$/);
      } else {
        await expect(poster).toHaveCSS("object-fit", "cover");
        await expect(poster).toHaveCSS("object-position", "50% 0%");
        await expect(poster).toHaveCSS("aspect-ratio", "8 / 5");
      }
      await expect
        .poll(() =>
          poster.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
    });
  }
  for (const [format, route] of [
    ["calendar", "/eventos/"],
    ["archive", "/eventos/pasados/?year=2026&type=examen"],
  ] as const) {
    test(`${format} covers and official posters at ${viewport.width}px`, async ({
      page,
    }) => {
      test.skip(
        coverApproval.status !== "approved" ||
          coverApproval.formats[format] !== "approved",
        "Format composition pending",
      );
      await page.setViewportSize(viewport);
      await preparePage(page, route, new Date("2026-10-28T12:00:00-06:00"));
      const generated = page.locator(
        '[data-thumbnail-source="generated"]:visible',
      );
      // A sync may replace every visible generic cover with Drive artwork.
      // Generated-cover behavior is exercised with controlled calendar fixtures.
      for (const picture of await generated.all()) {
        const selectedFormat = await picture.getAttribute("data-cover-format");
        expect(["calendar", "archive"]).toContain(selectedFormat);
        if (format === "archive") expect(selectedFormat).toBe("archive");
        const image = picture.locator("img");
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveCSS("object-fit", "contain");
        // Seminario Noviembre swaps in 8:5 desktop artwork on page-fit
        // viewports (EventThumbnail `showSeminarDesktopCover`); every other
        // generated cover keeps its calendar (4:3) or archive (3:4) ratio.
        const pageFit = viewport.width >= 1280 && viewport.height >= 768;
        const defaultRatio = selectedFormat === "calendar" ? 4 / 3 : 3 / 4;
        await expect
          .poll(
            () =>
              image.evaluate(
                (
                  img: HTMLImageElement,
                  args: { pageFit: boolean; defaultRatio: number },
                ) => {
                  const desktopArtwork =
                    args.pageFit &&
                    /\/seminario-noviembre-2026-desktop\.webp$/.test(
                      img.currentSrc,
                    );
                  const expected = desktopArtwork ? 8 / 5 : args.defaultRatio;
                  return (
                    Math.abs(img.naturalWidth / img.naturalHeight - expected) <
                    0.01
                  );
                },
                { pageFit, defaultRatio },
              ),
            { message: "generated cover natural aspect ratio" },
          )
          .toBe(true);
        const box = await image.boundingBox();
        expect(box?.width).toBeGreaterThan(0);
        expect(box?.height).toBeGreaterThan(0);
        if (format === "calendar" && viewport.width <= 768) {
          const geometry = await picture.evaluate((element) => {
            const card = element.closest("li")!;
            const style = getComputedStyle(card);
            const available =
              card.clientWidth -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight);
            const image = element.querySelector("img")!;
            return {
              available,
              width: image.getBoundingClientRect().width,
              height: image.getBoundingClientRect().height,
            };
          });
          expect(
            Math.abs(geometry.width - geometry.available),
          ).toBeLessThanOrEqual(1);
          expect(geometry.width / geometry.height).toBeCloseTo(4 / 3, 2);
        }
      }
      for (const poster of await page
        .locator('[data-thumbnail-source="poster"] img')
        .and(page.locator(`img:not(${SHOGUN_POSTER_SELECTOR})`))
        .all()) {
        await expect(poster).toHaveCSS("object-fit", "contain");
        await expect(poster).not.toHaveAttribute("src", /event-covers/);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `.cache/event-cover-review/${format}-${viewport.width}.png`,
        fullPage: true,
      });
    });
  }
}
