import { expect, test } from "@playwright/test";

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
    name: "Próximos eventos",
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
    name: "Próximos eventos",
    exact: true,
  });
  await expect(primary).toHaveCSS("transition-duration", "0s");

  await page.goto("/galeria/");
  await page.locator(".gallery-featured-frame").hover();
  const featuredImage = page.locator(".gallery-featured-image");
  await expect(featuredImage).toHaveCSS("transform", "none");

  const previous = page.getByRole("button", { name: "Imagen anterior" });
  await expect(previous).toHaveCSS("transition-duration", "0s");
});
