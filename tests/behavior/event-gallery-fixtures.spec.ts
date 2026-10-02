import { expect, test } from "@playwright/test";
import { IMAGE_SCENARIOS } from "../fixtures/calendar-layout/data";
import { settleCalendarLayout } from "../helpers/calendar-layout";

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
// Four behavioral classes; pixel sizes and photo counts are exercised in design.
for (const index of [1, 5, 4, 7]) {
  const scenario = IMAGE_SCENARIOS[index];
  test(`gallery prioritizes the first non-vertical image in neutral scenario ${index}`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
    await page.goto(`http://127.0.0.1:4174/eventos/pasados/layout-${index}/`);
    await settleCalendarLayout(page);
    const landscape = scenario.dimensions.findIndex(
      ([width, height]) => width >= height,
    );
    const selected = landscape < 0 ? 0 : landscape;
    const [width, height] = scenario.dimensions[selected];
    // naturalWidth is density-corrected when srcset has width descriptors;
    // currentSrc identifies the selected source independently of that scaling.
    const image = page.locator("main figure img");
    await expect(image).toHaveAttribute(
      "alt",
      new RegExp(`Fotografía ${selected + 1} `),
    );
    expect(
      await image.evaluate((element: HTMLImageElement) => element.currentSrc),
    ).toContain(`/fixture-image/${width}x${height}.jpg`);
    if (index === 1) {
      await page
        .locator("main figure")
        .getByRole("button", { name: /^Abrir Fotografía/ })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    if (index === 5) {
      const gallery = page.getByRole("region", {
        name: /Fotografías del evento/,
      });
      const thumbnails = gallery.getByRole("group").getByRole("button");
      for (const position of [
        0,
        Math.floor(scenario.count / 2),
        scenario.count - 1,
      ]) {
        await thumbnails.nth(position).scrollIntoViewIfNeeded();
        await thumbnails.nth(position).click();
        await expect(thumbnails.nth(position)).toHaveAttribute(
          "aria-current",
          "true",
        );
        await expect(image).toHaveAttribute(
          "alt",
          new RegExp(`Fotografía ${position + 1} `),
        );
      }
      await gallery
        .getByRole("button", { name: "Fotografía siguiente", exact: true })
        .click();
      await expect(thumbnails.first()).toHaveAttribute("aria-current", "true");
      await expect(image).toHaveAttribute("alt", /Fotografía 1 /);
      await gallery
        .getByRole("button", { name: "Fotografía anterior", exact: true })
        .click();
      await expect(thumbnails.last()).toHaveAttribute("aria-current", "true");
      await expect(image).toHaveAttribute(
        "alt",
        new RegExp(`Fotografía ${scenario.count} `),
      );
    }
  });
}
