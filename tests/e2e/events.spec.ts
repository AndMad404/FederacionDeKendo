import { expect, test, type Page } from "@playwright/test";

const FIXED_UPCOMING_TIME = new Date("2026-08-09T12:00:00-06:00");
const HISTORICAL_EVENT_PATH = "/eventos/2026-08-08-examen/";

async function discoverUpcomingEvent(page: Page) {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/calendario/");

  const eventLink = page.getByRole("link", { name: /Ver detalles del evento/ }).first();
  const path = await eventLink.getAttribute("href");
  expect(path).toMatch(/^\/eventos\/[^/]+\/$/);

  const accessibleName = await eventLink.getAttribute("aria-label");
  const title = accessibleName?.replace("Ver detalles del evento ", "");
  expect(title).toBeTruthy();

  return { eventLink, path: path!, title: title! };
}

test("opens a prerendered event route with temporary noindex metadata", async ({
  page,
}) => {
  const { path, title } = await discoverUpcomingEvent(page);
  await page.goto(path);

  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText("Actividad programada")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://fak-kendo.pages.dev${path}`,
  );
});

test("calendar cards link to the canonical event page", async ({ page }) => {
  const { eventLink, path } = await discoverUpcomingEvent(page);
  await expect(eventLink).toHaveAttribute("href", path);
  await eventLink.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
});

test("accepts only current canonical event routes", async ({ page }) => {
  await page.goto("/eventos/examen-2026-08-08/");
  await expect(page.getByText(/página que buscas no existe/i)).toBeVisible();

  await page.goto("/calendario/#examen-2026-08-08");
  await expect(page).toHaveURL(/\/calendario\/#examen-2026-08-08$/);
  await expect(
    page.getByRole("heading", { name: "Calendario de eventos", level: 1 }),
  ).toBeVisible();
});

test("homepage event details link to the canonical event page", async ({ page }) => {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/");

  const eventLink = page
    .getByRole("link", { name: /Consultar detalles del evento/ })
    .first();
  const path = await eventLink.getAttribute("href");
  expect(path).toMatch(/^\/eventos\/[^/]+\/$/);
  await eventLink.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
});

test("shares the canonical page and displays the complete description", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  const { path } = await discoverUpcomingEvent(page);
  await page.goto(path);

  await page.getByRole("button", { name: "Compartir evento" }).click();
  await expect(page.getByRole("button", { name: "Enlace copiado" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    path,
  );

  await expect(
    page.getByRole("heading", { name: "Descripción", level: 2 }).locator("+ p"),
  ).not.toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Leer descripción completa" }),
  ).toHaveCount(0);
});

test("uses injected time for the current transition into event history", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-08T14:00:00-06:00"));
  await page.goto("/eventos/pasados/");
  await expect(page.locator(`a[href="${HISTORICAL_EVENT_PATH}"]`)).toHaveCount(0);

  await page.clock.setFixedTime(new Date("2026-08-08T15:01:00-06:00"));
  await page.reload();
  await expect(page.locator(`a[href="${HISTORICAL_EVENT_PATH}"]`)).toBeVisible();

  await page.goto(HISTORICAL_EVENT_PATH);
  await expect(page.getByText("Actividad finalizada")).toBeVisible();
});

test("renders the historical archive and a custom not-found view", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/eventos/pasados/");
  await expect(
    page.getByRole("heading", { name: "Eventos pasados", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Página 1 de 1")).toBeVisible();

  await page.goto("/eventos/ruta-inexistente/");
  await expect(page.getByText(/página que buscas no existe/i)).toBeVisible();

  await page.goto("/en/events/missing-route/");
  await expect(page.getByText(/page you are looking for does not exist/i)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(consoleErrors).toEqual([]);
});

test("switches languages while preserving the current section", async ({ page }) => {
  await page.goto("/galeria/");

  await page.getByRole("link", { name: "View site in English" }).click();
  await expect(page).toHaveURL(/\/en\/gallery\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Kendo gallery", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Ver sitio en español" }).click();
  await expect(page).toHaveURL(/\/galeria\/$/);
});

test("exposes the language selector inside the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByText("Language", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View site in English" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("preserves scroll position when switching languages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 320));
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("link", { name: "View site in English" }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await page.waitForTimeout(350);

  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollBefore, 0);
});

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
];
const routes = [
  "/",
  "/calendario/",
  "/galeria/",
  "/afiliados/",
  HISTORICAL_EVENT_PATH,
  "/eventos/pasados/",
  "/en/",
  "/en/calendar/",
  "/en/gallery/",
  "/en/affiliates/",
];

for (const viewport of viewports) {
  test(`key routes render at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("nav").first()).toBeVisible();
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("footer")).toBeAttached();

      if (viewport.width === 1366) {
        const dimensions = await page.evaluate(() => ({
          scrollHeight: document.documentElement.scrollHeight,
          innerHeight: window.innerHeight,
          sectionScrollHeight:
            document.querySelector("main > section")?.scrollHeight ?? 0,
          sectionClientHeight:
            document.querySelector("main > section")?.clientHeight ?? 0,
        }));
        expect(dimensions.scrollHeight).toBeLessThanOrEqual(
          dimensions.innerHeight + 1,
        );
        expect(dimensions.sectionScrollHeight).toBeLessThanOrEqual(
          dimensions.sectionClientHeight + 1,
        );
        await expect(page.locator("footer")).toBeVisible();
      }
    }
  });
}
