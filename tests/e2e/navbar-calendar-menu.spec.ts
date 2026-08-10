import { expect, test } from "@playwright/test";

test("calendar menu opens on hover and navigates to past events", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/calendario/");

  const calendarButton = page.getByRole("button", { name: "Calendario" });
  await calendarButton.hover();

  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  const calendarMenu = page.getByLabel("Opciones del calendario");
  const buttonBox = await calendarButton.boundingBox();
  const menuBox = await calendarMenu.boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(menuBox).not.toBeNull();

  await page.mouse.move(
    menuBox!.x + menuBox!.width / 2,
    (buttonBox!.y + buttonBox!.height + menuBox!.y) / 2,
  );
  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  await page.mouse.move(menuBox!.x + menuBox!.width / 2, menuBox!.y + 8);
  await expect(calendarMenu).toBeVisible();

  await page
    .getByLabel("Opciones del calendario")
    .getByRole("link", { name: "Eventos pasados", exact: true })
    .click();
  await expect(page).toHaveURL(/\/eventos\/pasados\/$/);
  await expect(calendarButton).toHaveClass(/border-site-accent/);
});

test("calendar menu supports keyboard opening and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/calendario/");

  const calendarButton = page.getByRole("button", { name: "Calendario" });
  await calendarButton.focus();
  await page.keyboard.press("Enter");
  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Próximos eventos", exact: true }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(calendarButton).toHaveAttribute("aria-expanded", "false");
  await expect(calendarButton).toBeFocused();
});

test("calendar section expands inside the mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calendario/");

  await page.getByRole("button", { name: "Abrir menú" }).click();
  const calendarButton = page.getByRole("button", { name: "Calendario" });
  await calendarButton.click();

  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  await page
    .locator("#mobile-calendar-menu")
    .getByRole("link", { name: "Eventos pasados", exact: true })
    .click();
  await expect(page).toHaveURL(/\/eventos\/pasados\/$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
});
