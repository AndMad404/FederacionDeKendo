import { expect, type Locator } from "@playwright/test";
const CSS_PIXEL_TOLERANCE = 0.51;
export async function getBox(locator: Locator) {
  await expect(locator).toBeVisible();

  let box = await locator.boundingBox();

  await expect
    .poll(async () => {
      box = await locator.boundingBox();
      return box !== null;
    })
    .toBe(true);

  return box!;
}

export function expectCssPixels(
  actual: number,
  expected: number,
  label: string,
) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}px, received ${actual}px`,
  ).toBeLessThanOrEqual(CSS_PIXEL_TOLERANCE);
}
