import { expect, type Page } from "@playwright/test";
import { FIXED_TEST_TIME } from "../design/design-contract";

export async function preparePage(
  page: Page,
  path: string,
  referenceTime = FIXED_TEST_TIME,
) {
  await page.clock.setFixedTime(referenceTime);
  await page.goto(path);
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Hidden and offscreen lazy images are not requested by the browser.
  // Read the current DOM on each poll because hydration can replace images.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.images)
            .filter((image) => {
              if (image.complete || image.getClientRects().length === 0)
                return false;
              const rect = image.getBoundingClientRect();
              return (
                image.loading !== "lazy" ||
                (rect.bottom > 0 &&
                  rect.top < window.innerHeight &&
                  rect.right > 0 &&
                  rect.left < window.innerWidth)
              );
            })
            .map((image) => image.currentSrc || image.src),
        ),
      {
        message:
          "rendered images required in this viewport must finish loading",
      },
    )
    .toEqual([]);
}
