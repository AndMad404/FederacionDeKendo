import { expect, test } from "@playwright/test";

const canonicalEventPath = "/eventos/2026-08-08-examen/";

test("opens a prerendered event route with temporary noindex metadata", async ({
  page,
}) => {
  await page.goto(canonicalEventPath);

  await expect(page.getByRole("heading", { name: "Examen", level: 1 })).toBeVisible();
  await expect(page.getByText("Actividad programada")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://fak-kendo.pages.dev/eventos/2026-08-08-examen/",
  );
});

test("redirects an old calendar hash to the canonical event page", async ({
  page,
}) => {
  await page.goto("/calendario/#examen-2026-08-08");

  await expect(page).toHaveURL(new RegExp(`${canonicalEventPath}$`));
  await expect(page.getByRole("heading", { name: "Examen", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("calendar cards link to the canonical event page", async ({ page }) => {
  await page.goto("/calendario/");

  const eventLink = page
    .getByRole("link", { name: "Ver detalles del evento Examen" })
    .first();
  await expect(eventLink).toHaveAttribute("href", canonicalEventPath);
  await eventLink.click();
  await expect(page).toHaveURL(new RegExp(`${canonicalEventPath}$`));
});

test("homepage event details link to the canonical event page", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("link", { name: "Consultar detalles del evento Examen" })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`${canonicalEventPath}$`));
  await expect(page.getByRole("heading", { name: "Examen", level: 1 })).toBeVisible();
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
  await page.goto(canonicalEventPath);

  await page.getByRole("button", { name: "Compartir evento" }).click();
  await expect(page.getByRole("button", { name: "Enlace copiado" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    canonicalEventPath,
  );

  await expect(page.getByText("Exámenes de 8vo a 2do kyu")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Leer descripción completa" }),
  ).toHaveCount(0);
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

test("preserves homepage vertical geometry when switching languages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1904, height: 904 });
  await page.goto("/");

  const spanishGeometry = await page.evaluate(() => ({
    heroHeight:
      document.querySelector("main section > header")?.getBoundingClientRect()
        .height ?? 0,
    eventsTop:
      document.querySelector("#upcoming-events-title")?.getBoundingClientRect()
        .top ?? 0,
    footerTop: document.querySelector("footer")?.getBoundingClientRect().top ?? 0,
  }));

  await page.getByRole("link", { name: "View site in English" }).click();
  await expect(page).toHaveURL(/\/en\/$/);

  const englishGeometry = await page.evaluate(() => ({
    heroHeight:
      document.querySelector("main section > header")?.getBoundingClientRect()
        .height ?? 0,
    eventsTop:
      document.querySelector("#upcoming-events-title")?.getBoundingClientRect()
        .top ?? 0,
    footerTop: document.querySelector("footer")?.getBoundingClientRect().top ?? 0,
  }));

  expect(englishGeometry.heroHeight).toBeCloseTo(spanishGeometry.heroHeight, 0);
  expect(englishGeometry.eventsTop).toBeCloseTo(spanishGeometry.eventsTop, 0);
  expect(englishGeometry.footerTop).toBeCloseTo(spanishGeometry.footerTop, 0);
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
  canonicalEventPath,
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
