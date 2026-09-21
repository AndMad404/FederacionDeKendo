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

  await page.locator(".gallery-featured-frame > button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const lightboxNext = dialog.getByRole("button", {
    name: "Imagen siguiente",
  });
  const initialBox = await lightboxNext.boundingBox();
  expect(initialBox).not.toBeNull();

  await lightboxNext.hover();
  await expect
    .poll(async () => (await lightboxNext.boundingBox())?.y)
    .toBe(initialBox!.y);

  await lightboxNext.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
  });
  await expect
    .poll(async () => (await lightboxNext.boundingBox())?.y)
    .toBe(initialBox!.y);

  await page.goto("/eventos/");
  const disabledArrow = page
    .getByRole("button", { name: "Ver los dos meses anteriores" })
    .first();
  await expect(disabledArrow).toBeDisabled();
  await expect(disabledArrow).toHaveCSS("opacity", "0.35");

  const spanishCalendar = page.getByRole("button", { name: "Evento" });
  await expect(spanishCalendar).toHaveClass(/border-site-accent/);

  await page.goto("/en/events/past/");
  const englishCalendar = page.getByRole("button", { name: "Event" });
  await expect(englishCalendar).toHaveClass(/border-site-accent/);
});
