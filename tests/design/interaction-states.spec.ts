import { expect, test } from "@playwright/test";

import { FIXED_TEST_TIME } from "./design-contract";

test("primary and secondary actions exchange their colors on hover", async ({
  page,
}) => {
  await page.goto("/");

  const home = page.locator("main");
  const secondary = home.getByRole("link", {
    name: "Encuentra un dojo",
    exact: true,
  });
  const primary = home.getByRole("link", {
    name: "Calendario de Próximos Eventos",
    exact: true,
  });

  await expect(secondary).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(secondary).toHaveCSS("color", "rgb(22, 58, 99)");
  await expect(primary).toHaveCSS("background-color", "rgb(22, 58, 99)");
  await expect(primary).toHaveCSS("color", "rgb(255, 255, 255)");

  await secondary.hover();
  await expect(secondary).toHaveCSS("background-color", "rgb(22, 58, 99)");
  await expect(secondary).toHaveCSS("color", "rgb(255, 255, 255)");

  await primary.hover();
  await expect(primary).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(primary).toHaveCSS("color", "rgb(22, 58, 99)");
});

test("reduced motion removes non-essential button and gallery motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const primary = page.locator("main").getByRole("link", {
    name: "Calendario de Próximos Eventos",
    exact: true,
  });
  await expect(primary).toHaveCSS("transition-duration", "0s");

  await page.goto("/galeria/");
  await page.locator(".gallery-featured-frame").hover();

  const featuredImage = page.locator(".gallery-featured-image");
  await expect(featuredImage).toHaveCSS("transform", "none");

  const previous = page.getByRole("button", {
    name: "Imagen anterior",
  });
  await expect(previous).toHaveCSS("transition-duration", "0s");
});

test("shared navigation arrows preserve visual interaction states", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto("/galeria/");

  const nextArrow = page.getByRole("button", {
    name: "Imagen siguiente",
  });

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
    .getByRole("button", {
      name: "Ver los dos meses anteriores",
    })
    .first();

  await expect(disabledArrow).toBeDisabled();
  await expect(disabledArrow).toHaveCSS("opacity", "0.35");

  const spanishCalendar = page.getByRole("button", {
    name: "Evento",
  });
  await expect(spanishCalendar).toHaveClass(/border-site-accent/);

  await page.goto("/en/events/past/");

  const englishCalendar = page.getByRole("button", {
    name: "Event",
  });
  await expect(englishCalendar).toHaveClass(/border-site-accent/);
});
