import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import coverApproval from "../../src/app/config/eventCoverApproval.json" with { type: "json" };

const SHOGUN_POSTER_SELECTOR =
  '[data-thumbnail-source="poster"] img[src*="/panama-5ta-copa-shogun-torneo-por-equipos-y-seminario/"]';

test.skip(
  coverApproval.status !== "approved",
  "Awaiting the user's final illustration; no cover screenshots while paused.",
);

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`Shogun thumbnail preserves the crest with a top crop at ${viewport.width}px`, async ({
    page,
  }) => {
    test.skip(
      coverApproval.formats.calendar !== "approved",
      "Format composition pending",
    );
    await page.setViewportSize(viewport);
    await preparePage(page, "/eventos/", new Date("2026-11-01T12:00:00-06:00"));
    const poster = page.locator(SHOGUN_POSTER_SELECTOR);
    await expect(poster).toHaveCount(1);
    await poster.scrollIntoViewIfNeeded();
    await expect(poster).toBeVisible();
    await expect(poster).toHaveAttribute("src", /-flyer-\d+\.webp$/);
    await expect(poster).toHaveCSS("object-fit", "cover");
    await expect(poster).toHaveCSS("object-position", "50% 0%");
    await expect(poster).toHaveCSS("aspect-ratio", "8 / 5");
    await expect
      .poll(() =>
        poster.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  });
  for (const [format, route] of [
    ["calendar", "/eventos/"],
    ["archive", "/eventos/pasados/?year=2026&type=examen"],
  ] as const) {
    test(`${format} covers and official posters at ${viewport.width}px`, async ({
      page,
    }) => {
      test.skip(
        coverApproval.formats[format] !== "approved",
        "Format composition pending",
      );
      await page.setViewportSize(viewport);
      await preparePage(page, route, new Date("2026-10-28T12:00:00-06:00"));
      const generated = page.locator(
        '[data-thumbnail-source="generated"]:visible',
      );
      await expect(generated.first()).toBeVisible();
      for (const picture of await generated.all()) {
        const selectedFormat = await picture.getAttribute("data-cover-format");
        expect(["calendar", "archive"]).toContain(selectedFormat);
        if (format === "archive") expect(selectedFormat).toBe("archive");
        const image = picture.locator("img");
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveCSS("object-fit", "contain");
        await expect
          .poll(() =>
            image.evaluate(
              (img: HTMLImageElement) => img.naturalWidth / img.naturalHeight,
            ),
          )
          .toBeCloseTo(selectedFormat === "calendar" ? 4 / 3 : 3 / 4, 2);
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
