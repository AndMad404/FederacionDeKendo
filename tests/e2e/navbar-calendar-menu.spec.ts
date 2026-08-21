import { expect, test } from "@playwright/test";

test("calendar menu opens on hover and navigates to past events", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/eventos/");

  const calendarButton = page.getByRole("button", {
    name: "Opciones del calendario",
  });
  await calendarButton.hover();

  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  const calendarMenu = page.getByRole("list", {
    name: "Opciones del calendario",
  });
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
    .getByRole("list", { name: "Opciones del calendario" })
    .getByRole("link", { name: "Eventos pasados", exact: true })
    .click();
  await expect(page).toHaveURL(/\/eventos\/pasados\/$/);
  await expect(
    page.getByRole("link", { name: "Calendario", exact: true }),
  ).toHaveClass(/border-site-accent/);
  await expect(calendarButton).toHaveAttribute("aria-expanded", "false");
});

test("calendar menu opens on focus, closes with Escape and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/eventos/");

  const calendarButton = page.getByRole("button", {
    name: "Opciones del calendario",
  });
  await calendarButton.focus();
  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Próximos eventos", exact: true }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(calendarButton).toHaveAttribute("aria-expanded", "false");
  await expect(calendarButton).toBeFocused();
});

test("calendar menu closes on an outside click and keeps English destinations active", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/en/events/");

  const calendarButton = page.getByRole("button", {
    name: "Calendar options",
  });
  await calendarButton.click();
  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");

  await page.mouse.click(8, 300);
  await expect(calendarButton).toHaveAttribute("aria-expanded", "false");

  await calendarButton.click();
  await page
    .getByRole("list", { name: "Calendar options" })
    .getByRole("link", { name: "Past events", exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/events\/past\/$/);
  await expect(
    page.getByRole("link", { name: "Calendar", exact: true }),
  ).toHaveClass(/border-site-accent/);
});

test("calendar section expands inside the mobile navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/eventos/");

  await page.getByRole("button", { name: "Abrir menú" }).click();
  const calendarButton = page.getByRole("button", {
    name: "Opciones del calendario",
  });
  await calendarButton.click();

  await expect(calendarButton).toHaveAttribute("aria-expanded", "true");
  await page
    .locator("#mobile-calendar-menu")
    .getByRole("link", { name: "Eventos pasados", exact: true })
    .click();
  await expect(page).toHaveURL(/\/eventos\/pasados\/$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
});

test("navigation history invalidates open desktop and mobile menus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/eventos/");

  const desktopCalendarButton = page.getByRole("button", {
    name: "Opciones del calendario",
  });
  await desktopCalendarButton.focus();
  await expect(desktopCalendarButton).toHaveAttribute("aria-expanded", "true");

  await page.evaluate(() => {
    window.history.pushState({}, "", "/galeria/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/galeria\/$/);
  await expect(desktopCalendarButton).toHaveAttribute("aria-expanded", "false");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('button[aria-controls="mobile-menu"]').click();
  await expect(page.locator("#mobile-menu")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/eventos\/$/);
  await expect(page.locator("#mobile-menu")).toHaveCount(0);
});
