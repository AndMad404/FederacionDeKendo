import { expect, type Locator, type Page } from "@playwright/test";

export async function swipeLeft(
  page: Page,
  panel: Locator,
  completed: () => Promise<boolean>,
  maxVerticalOffset = Number.POSITIVE_INFINITY,
) {
  await expect(panel).toBeVisible();
  let box = await panel.boundingBox();
  await expect
    .poll(async () => {
      box = await panel.boundingBox();
      return box !== null;
    })
    .toBe(true);

  const session = await page.context().newCDPSession(page);
  const y = box!.y + Math.min(box!.height / 2, maxVerticalOffset);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      for (const [index, x] of [
        box!.x + box!.width - 30,
        box!.x + box!.width / 2,
        box!.x + 30,
      ].entries()) {
        await session.send("Input.dispatchTouchEvent", {
          type: index === 0 ? "touchStart" : "touchMove",
          touchPoints: [{ x, y }],
        });
        await page.waitForTimeout(30);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await page.waitForTimeout(100);
      if (await completed()) break;
    }
  } finally {
    await session.detach();
  }
}
