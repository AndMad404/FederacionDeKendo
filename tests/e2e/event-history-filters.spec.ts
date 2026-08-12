import { expect, test } from "@playwright/test";

const ARCHIVE_TIME = new Date("2028-01-01T12:00:00-06:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(ARCHIVE_TIME);
});

test("persists combined filters on reload and localized routes", async ({ page }) => {
  await page.goto("/eventos/pasados/?year=2026&type=examen");
  await expect(page.getByRole("combobox", { name: "Año", exact: true })).toHaveValue("2026");
  await expect(page.getByRole("combobox", { name: "Tipo", exact: true })).toHaveValue("examen");
  await page.reload();
  await expect(page).toHaveURL(/year=2026&type=examen/);

  await page.goto("/en/events/past/?year=2026&type=examen");
  await expect(page).toHaveURL(/\/en\/events\/past\/\?year=2026&type=examen$/);
  await expect(page.getByRole("combobox", { name: "Year", exact: true })).toHaveValue("2026");
  await expect(page.getByRole("combobox", { name: "Type", exact: true })).toHaveValue("examen");
});

test("preserves filters in pagination and resets to page one when changed", async ({ page }) => {
  await page.goto("/eventos/pasados/?type=examen");
  const next = page.getByRole("link", { name: "Siguiente" });
  await expect(next).toHaveAttribute("href", /pagina\/2\/\?type=examen$/);
  await next.click();
  await expect(page).toHaveURL(/pagina\/2\/\?type=examen$/);
  await page.getByRole("combobox", { name: "Año", exact: true }).selectOption("2026");
  await expect(page).toHaveURL(/\/eventos\/pasados\/\?year=2026&type=examen$/);
});

test("filters apply available values and the empty state remains available", async ({ page }) => {
  await page.goto("/eventos/pasados/");
  const yearFilter = page.getByRole("combobox", { name: "Año", exact: true });
  const selectedYear = await yearFilter.locator("option").nth(1).getAttribute("value");
  expect(selectedYear).toMatch(/^\d{4}$/);
  await expect(async () => {
    await yearFilter.selectOption("");
    await yearFilter.selectOption(selectedYear!);
    await expect(page).toHaveURL(new RegExp(`year=${selectedYear}`), { timeout: 500 });
  }).toPass({ timeout: 5_000 });
  const typeFilter = page.getByRole("combobox", { name: "Tipo", exact: true });
  await typeFilter.selectOption("seminario");
  await expect(page).toHaveURL(new RegExp(`year=${selectedYear}&type=seminario`));
  await page.goto("/eventos/pasados/?year=9999&type=seminario");
  await expect(page.getByText("Todavía no hay eventos en el archivo.")).toBeVisible();
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`shows accessible filters at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/eventos/pasados/");
    await expect(page.getByRole("combobox", { name: "Año", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Tipo", exact: true })).toBeVisible();
    if (viewport.width === 1366) {
      await expect(page.locator("nav").first()).toBeVisible();
      await expect(page.getByLabel("Paginación del archivo")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(768);
    }
  });
}
