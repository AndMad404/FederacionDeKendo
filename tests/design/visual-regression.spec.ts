import { expect, test } from "@playwright/test";
import { APPROVED_VIEWPORTS, FIXED_TEST_TIME } from "./design-contract";
import {
  generatedPages,
  representativePages as selectRepresentatives,
} from "../helpers/generated-pages";
import { preparePage } from "../helpers/prepare-page";
const VISUAL_VIEWPORTS = APPROVED_VIEWPORTS.filter(
  ({ name }) => name !== "mobile-390x844",
);
const HISTORICAL_EVENT_REFERENCE_TIME = new Date("2026-08-20T12:00:00-06:00");
const representativePages = selectRepresentatives(
  generatedPages({ spanishOnly: true }),
  { event: "/eventos/pasados/2026-08-08-examen/" },
);
for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`${viewport.name} approved visual designs`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.design} matches its approved design`, async ({
        page,
      }) => {
        await preparePage(
          page,
          approvedPage.path,
          approvedPage.design === "event"
            ? HISTORICAL_EVENT_REFERENCE_TIME
            : FIXED_TEST_TIME,
        );
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
