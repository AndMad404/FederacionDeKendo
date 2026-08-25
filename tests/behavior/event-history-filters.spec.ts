import { expect, test } from "@playwright/test";

const ARCHIVE_TIME = new Date("2028-01-01T12:00:00-06:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(ARCHIVE_TIME);
});

test("persists combined filters on reload and localized routes", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/?year=2026&type=examen");
  await expect(
    page.getByRole("combobox", { name: "Año", exact: true }),
  ).toHaveValue("2026");
  await expect(
    page.getByRole("combobox", { name: "Tipo", exact: true }),
  ).toHaveValue("examen");
  await page.reload();
  await expect(page).toHaveURL(/year=2026&type=examen/);

  await page.goto("/en/events/past/?year=2026&type=examen");
  await expect(page).toHaveURL(/\/en\/events\/past\/\?year=2026&type=examen$/);
  await expect(
    page.getByRole("combobox", { name: "Year", exact: true }),
  ).toHaveValue("2026");
  await expect(
    page.getByRole("combobox", { name: "Type", exact: true }),
  ).toHaveValue("examen");
});

test("renders localized upcoming and past event navigation with the active page", async ({
  page,
}) => {
  const routes = [
    {
      path: "/eventos/",
      upcomingPath: "/eventos/",
      pastPath: "/eventos/pasados/",
      upcoming: "Próximos eventos",
      past: "Eventos pasados",
      active: "upcoming",
    },
    {
      path: "/eventos/pasados/",
      upcomingPath: "/eventos/",
      pastPath: "/eventos/pasados/",
      upcoming: "Próximos eventos",
      past: "Eventos pasados",
      active: "past",
    },
    {
      path: "/en/events/",
      upcomingPath: "/en/events/",
      pastPath: "/en/events/past/",
      upcoming: "Upcoming events",
      past: "Past events",
      active: "upcoming",
    },
    {
      path: "/en/events/past/",
      upcomingPath: "/en/events/",
      pastPath: "/en/events/past/",
      upcoming: "Upcoming events",
      past: "Past events",
      active: "past",
    },
  ] as const;

  for (const route of routes) {
    await page.goto(route.path);
    const main = page.locator("main");
    const upcoming = main.getByRole("link", {
      name: route.upcoming,
      exact: true,
    });
    const past = main.getByRole("link", { name: route.past, exact: true });
    const inactive = route.active === "upcoming" ? past : upcoming;
    const inactivePath =
      route.active === "upcoming" ? route.pastPath : route.upcomingPath;

    await expect(upcoming).toHaveAttribute("href", route.upcomingPath);
    await expect(past).toHaveAttribute("href", route.pastPath);
    await expect(route.active === "upcoming" ? upcoming : past).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(inactive).not.toHaveAttribute("aria-current");
    await expect(inactive).toBeVisible();
    const inactiveBox = await inactive.boundingBox();
    expect(inactiveBox).not.toBeNull();
    expect(inactiveBox!.height).toBeGreaterThanOrEqual(44);

    await inactive.focus();
    await expect(inactive).toBeFocused();
    await inactive.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${inactivePath}$`));
  }
});

test("aligns the calendar and historical content panels on the reference desktop", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-04T12:00:00-06:00"));
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.goto("/eventos/");
  const calendarTop = await page
    .locator("[data-page-content-boundary]")
    .boundingBox();

  await page.goto("/eventos/pasados/");
  const archiveTop = await page
    .locator("[data-page-content-boundary]")
    .boundingBox();

  expect(calendarTop).not.toBeNull();
  expect(archiveTop).not.toBeNull();
  expect(Math.abs(calendarTop!.y - archiveTop!.y)).toBeLessThanOrEqual(1);
});

test("preserves filters in pagination and resets to page one when changed", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/?type=examen");
  const next = page.getByRole("button", { name: "Siguiente" });
  await expect(next).toBeVisible();
  await expect(next.locator("svg")).toHaveCount(1);
  expect(
    await next.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
  await next.click();
  await expect(page).toHaveURL(/pagina\/2\/\?type=examen$/);
  const previous = page.getByRole("button", { name: "Anterior" });
  await expect(previous.locator("svg")).toHaveCount(1);
  await previous.click();
  await expect(page).toHaveURL(/eventos\/pasados\/\?type=examen$/);

  await page.goto("/en/events/past/?type=examen");
  const englishNext = page.getByRole("button", { name: "Next" });
  await englishNext.click();
  await expect(page).toHaveURL(/en\/events\/past\/page\/2\/\?type=examen$/);
  await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();

  await page.goto("/eventos/pasados/?type=examen");
  await page
    .getByRole("combobox", { name: "Año", exact: true })
    .selectOption("2026");
  await expect(page).toHaveURL(/\/eventos\/pasados\/\?year=2026&type=examen$/);
});

test("filters apply available values and the empty state remains available", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/");
  const yearFilter = page.getByRole("combobox", { name: "Año", exact: true });
  const selectedYear = await yearFilter
    .locator("option")
    .nth(1)
    .getAttribute("value");
  expect(selectedYear).toMatch(/^\d{4}$/);
  await expect(async () => {
    await yearFilter.selectOption("");
    await yearFilter.selectOption(selectedYear!);
    await expect(page).toHaveURL(new RegExp(`year=${selectedYear}`), {
      timeout: 500,
    });
  }).toPass({ timeout: 5_000 });
  const typeFilter = page.getByRole("combobox", { name: "Tipo", exact: true });
  await typeFilter.selectOption("seminario");
  await expect(page).toHaveURL(
    new RegExp(`year=${selectedYear}&type=seminario`),
  );
  await page.goto("/eventos/pasados/?year=9999&type=seminario");
  await expect(
    page.getByText("Todavía no hay eventos en el archivo."),
  ).toBeVisible();
});
