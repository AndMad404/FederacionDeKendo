import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import covers, {
  COVER_EVENTS,
  COVER_DRIVE_IMAGES,
} from "../fixtures/calendar-layout/data";

test("calendar selects covers by source and available space on resize", async ({
  page,
}) => {
  const event = COVER_EVENTS[0];
  const picture = page
    .locator("main li")
    .filter({
      has: page.getByRole("heading", { name: event.title, exact: true }),
    })
    .locator("picture");
  const firstImage = COVER_DRIVE_IMAGES[0];
  const formats = covers.events[event.id];
  for (const source of ["generic", "gallery"] as const) {
    await page.setViewportSize({ width: 1280, height: 1500 });
    await preparePage(
      page,
      `http://127.0.0.1:4174/eventos/?coverFixture=${source}`,
      new Date("2026-10-29T12:00:00-06:00"),
    );
    const official = page.locator(
      'picture[data-thumbnail-source="poster"] img',
    );
    const posterSrc = await official.getAttribute("src");
    for (const [width, height, format] of [
      [1280, 1500, "archive"],
      [1280, 800, "calendar"],
      [1936, 1480, "archive"],
      [390, 844, "calendar"],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(picture).toHaveAttribute(
        "data-thumbnail-source",
        source === "generic" ? "generated" : "gallery",
      );
      if (source === "generic") {
        await expect(picture).toHaveAttribute("data-cover-format", format);
        await expect(picture.locator("img")).toHaveAttribute(
          "src",
          formats[format].src,
        );
      } else {
        await expect(picture.locator("img")).toHaveAttribute(
          "src",
          firstImage.src,
        );
        await expect(picture.locator("img")).toHaveAttribute(
          "alt",
          firstImage.alt,
        );
      }
      await expect(picture.locator("img")).toHaveCSS("object-fit", "contain");
      await expect(official).toHaveAttribute("src", posterSrc!);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
