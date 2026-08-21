import { expect, test } from "@playwright/test";
import { FIXED_TEST_TIME } from "./design-contract";

test("shared navigation arrows preserve visual interaction states", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto("/galeria/");
  const nextArrow = page.getByRole("button", { name: "Imagen siguiente" });
  const readColors = () =>
    nextArrow.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        color: styles.color,
      };
    });
  const normalColors = await readColors();
  await nextArrow.hover();
  await page.waitForTimeout(250);
  const hoverColors = await readColors();
  expect(hoverColors).not.toEqual(normalColors);
  await nextArrow.click();
  await page.waitForTimeout(50);
  expect(await readColors()).toEqual(hoverColors);

  await page.goto("/eventos/");
  const disabledArrow = page
    .getByRole("button", { name: "Ver los dos meses anteriores" })
    .first();
  await expect(disabledArrow).toBeDisabled();
  await expect(disabledArrow).toHaveCSS("opacity", "0.35");
});
