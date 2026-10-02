import { swipeLeft } from "../helpers/swipe";
import { expect, test } from "@playwright/test";
import { expectInteractiveReady } from "../helpers/interactive-ready";

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
    await page.waitForLoadState("networkidle");
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

    await inactive.focus();
    await expect(inactive).toBeFocused();
    await inactive.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${inactivePath}$`));
  }
});

test("preserves filters in pagination and resets to page one when changed", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/");
  await expectInteractiveReady(page, "past-events");
  const next = page.getByRole("button", { name: "Siguiente" });
  await expect(next).toBeVisible();
  await expect(next).toBeEnabled();
  await expect(next.locator("svg")).toHaveCount(1);
  await next.click();
  await expect(page).toHaveURL(/pagina\/2\/$/);
  const previous = page.getByRole("button", { name: "Anterior" });
  await expect(previous).toBeEnabled();
  await expect(previous.locator("svg")).toHaveCount(1);
  await previous.click();
  await expect(page).toHaveURL(/eventos\/pasados\/$/);

  await page.goto("/en/events/past/");
  await expectInteractiveReady(page, "past-events");
  const englishNext = page.getByRole("button", { name: "Next" });
  await expect(englishNext).toBeEnabled();
  await englishNext.click();
  await expect(page).toHaveURL(/en\/events\/past\/page\/2\/$/);
  const englishPrevious = page.getByRole("button", { name: "Previous" });
  await expect(englishPrevious).toBeEnabled();
  await page.reload();
  await expect(page).toHaveURL(/en\/events\/past\/page\/2\/$/);
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page).toHaveURL(/en\/events\/past\/$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/eventos/pasados/?type=examen");
  await expectInteractiveReady(page, "past-events");
  await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Año", exact: true })
    .selectOption("2026");
  await expect(page).toHaveURL(/\/eventos\/pasados\/\?year=2026&type=examen$/);
});

test("normalizes legacy page query parameters to localized archive URLs", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/?page=2");
  await expect(page).toHaveURL(/eventos\/pasados\/pagina\/2\/$/);
  await expect(page.getByRole("button", { name: "Anterior" })).toBeEnabled();

  await page.goto("/en/events/past/?page=2");
  await expect(page).toHaveURL(/en\/events\/past\/page\/2\/$/);
  await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();
});

test("touch swipe paginates the historical archive on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/eventos/pasados/?type=examen");
  await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

  await swipeLeft(
    page,
    page.locator("[data-page-content-boundary]"),
    async () => /pagina\/2\/\?type=examen$/.test(page.url()),
    240,
  );

  await expect(page).toHaveURL(/pagina\/2\/\?type=examen$/);
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

test("uses an assigned gallery thumbnail and falls back to the event description", async ({
  page,
}) => {
  await page.goto("/eventos/pasados/?year=2026&type=seminario");

  const eventWithGallery = page
    .getByRole("heading", { name: "Gasshuku Monteverde", exact: true })
    .locator("xpath=ancestor::li");
  await expect(
    eventWithGallery.locator("[data-event-thumbnail] img"),
  ).toHaveCount(1);
  await expect(
    eventWithGallery.locator("[data-event-thumbnail] img"),
  ).toHaveCSS("object-fit", "cover");
  await expect(
    eventWithGallery.getByText("La participación incluye:", { exact: true }),
  ).toHaveCount(0);

  const eventWithoutGallery = page
    .getByRole("heading", {
      name: "CLAK 1er Panamericano BRASIL",
      exact: true,
    })
    .locator("xpath=ancestor::li");
  await expect(
    eventWithoutGallery.locator("[data-event-thumbnail]"),
  ).toHaveCount(0);
  await expect(eventWithoutGallery.getByText("#EventoExterno")).toBeVisible();
});
