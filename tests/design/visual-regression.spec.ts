import { expect, test } from "@playwright/test";
import { APPROVED_VIEWPORTS } from "./design-contract";
import {
  generatedPages,
  getGeneratedEventPath,
  representativePages as selectRepresentatives,
} from "../helpers/generated-pages";
import { preparePage } from "../helpers/prepare-page";
const VISUAL_VIEWPORTS = APPROVED_VIEWPORTS.filter(
  ({ name }) => name !== "mobile-390x844",
);
const representativePages = selectRepresentatives(
  generatedPages({ spanishOnly: true }),
  { event: getGeneratedEventPath("2026-08-08-examen") },
);
for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`${viewport.name} approved visual designs`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.design} matches its approved design`, async ({
        page,
      }) => {
        await preparePage(page, approvedPage.path);
        await expect(page).toHaveScreenshot(
          `${approvedPage.design}-${viewport.name}.png`,
        );
      });
    }

    test("gallery lightbox details match their approved design", async ({
      page,
    }) => {
      await preparePage(page, "/galeria/");
      await page.locator(".gallery-featured-frame > button").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveScreenshot(
        `gallery-lightbox-${viewport.name}.png`,
      );
    });
  });
}
