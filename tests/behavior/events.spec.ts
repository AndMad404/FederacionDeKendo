import { expect, test, type Page } from "@playwright/test";

const FIXED_UPCOMING_TIME = new Date("2026-08-23T12:00:00-06:00");
const TOURNAMENT_EVENT_PATH = "/eventos/2026-08-22-3er-torneo/";
const GASSHUKU_EVENT_PATH = "/eventos/2026-09-12-gasshuku-monteverde/";
const HISTORICAL_EVENT_PATH = "/eventos/pasados/2026-08-08-examen/";
const HISTORICAL_EVENT_WITHOUT_GALLERY_PATH =
  "/eventos/pasados/2026-08-22-3er-torneo/";
const FIXED_HISTORICAL_TIME = new Date("2026-08-24T12:00:00-06:00");

async function discoverUpcomingEvent(page: Page) {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/eventos/");
  await page.waitForLoadState("networkidle");

  const eventLink = page.getByRole("link", {
    name: "Ver detalles del evento Gasshuku Monteverde",
  });
  await expect(eventLink).toHaveAttribute("href", GASSHUKU_EVENT_PATH);
  const path = await eventLink.getAttribute("href");
  expect(path).toMatch(/^\/eventos\/[^/]+\/$/);

  const accessibleName = await eventLink.getAttribute("aria-label");
  const title = accessibleName?.replace("Ver detalles del evento ", "");
  expect(title).toBeTruthy();

  return { eventLink, path: path!, title: title! };
}

test("calendar cards link to the canonical event page", async ({ page }) => {
  const { eventLink, path } = await discoverUpcomingEvent(page);
  await expect(eventLink).toHaveAttribute("href", path);
  await eventLink.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
});

test("shows the next event after the previous event ends", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-22T16:59:59-06:00"));
  await page.goto("/eventos/");

  const firstEventLink = page
    .getByRole("link", { name: /Ver detalles del evento/ })
    .first();
  await expect(firstEventLink).toHaveAttribute("href", TOURNAMENT_EVENT_PATH);

  await page.clock.setFixedTime(new Date("2026-08-22T17:00:00-06:00"));
  await page.reload();
  await expect(firstEventLink).toHaveAttribute("href", GASSHUKU_EVENT_PATH);
});

test("scheduled event pages offer an add-to-calendar button", async ({
  page,
}) => {
  const { path, title } = await discoverUpcomingEvent(page);
  await page.goto(path);

  const addToCalendar = page.getByRole("link", {
    name: "Añade a tu calendario",
  });
  await expect(addToCalendar).toBeVisible();
  await expect(addToCalendar).toHaveAttribute("target", "_blank");
  const href = await addToCalendar.getAttribute("href");
  expect(href).toBeTruthy();
  expect(new URL(href!).searchParams.get("text")).toBe(title);
});

test("accepts only current canonical event routes", async ({ page }) => {
  await page.goto("/eventos/examen-2026-08-08/");
  await expect(page.getByText(/página que buscas no existe/i)).toBeVisible();

  await page.goto("/eventos/#examen-2026-08-08");
  await expect(page).toHaveURL(/\/eventos\/#examen-2026-08-08$/);
  await expect(
    page.getByRole("heading", { name: "Eventos", level: 1 }),
  ).toBeVisible();
});

test("homepage event details link to the canonical event page", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const eventLink = page.getByRole("link", {
    name: "Consultar detalles del evento Gasshuku Monteverde",
  });
  await expect(eventLink).toHaveAttribute("href", GASSHUKU_EVENT_PATH);
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
  await expect(
    page.getByRole("button", { name: "Enlace copiado" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    path,
  );
  expect(
    new URL(
      await page.evaluate(() => navigator.clipboard.readText()),
    ).searchParams.get("share"),
  ).toBe("20260825");

  await expect(
    page.getByRole("heading", { name: "Descripción", level: 2 }).locator("+ p"),
  ).toHaveCount(0);
  const description = page
    .getByRole("heading", { name: "Descripción", level: 2 })
    .locator("+ div");
  await expect(description.locator("ul > li")).toHaveCount(7);
  await expect(
    description.getByText("Transporte ida y vuelta", { exact: true }),
  ).toBeVisible();
  await expect(description.locator("p")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Leer descripción completa" }),
  ).toHaveCount(0);
});

test("moves an event from upcoming to history after its local date expires", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-08-08T23:59:59-06:00"));
  await page.goto("/eventos/pasados/");
  await expect(page.locator(`a[href="${HISTORICAL_EVENT_PATH}"]`)).toHaveCount(
    0,
  );

  await page.clock.setFixedTime(new Date("2026-08-09T00:00:00-06:00"));
  await page.reload();
  await expect(
    page.locator(`a[href="${HISTORICAL_EVENT_PATH}"]`),
  ).toBeVisible();

  await page.goto(HISTORICAL_EVENT_PATH);
  await expect(page.getByText("Actividad finalizada")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Añade a tu calendario" }),
  ).toHaveCount(0);
});

test("historical event details preserve complete information without a gallery manifest", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_HISTORICAL_TIME);
  await page.goto(HISTORICAL_EVENT_WITHOUT_GALLERY_PATH);

  await expect(page.getByText("Actividad finalizada")).toBeVisible();
  await expect(page.getByText("3er Torneo", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Tamashii Martial Arts Pinares", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Categoría con Bogu y sin Bogu", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: /Fotografías del evento/ }),
  ).toHaveCount(0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`historical gallery is operable and accessible at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(FIXED_HISTORICAL_TIME);
    await page.goto(HISTORICAL_EVENT_PATH);

    const gallery = page.getByRole("region", {
      name: "Fotografías del evento Examen",
    });
    await expect(gallery).toBeVisible();
    const thumbnails = gallery.getByRole("group", {
      name: "Seleccionar fotografía",
    });
    await expect(gallery.locator("figure")).toBeVisible();
    await expect(thumbnails).toBeVisible();
    await expect(gallery.locator("img[alt]")).toHaveCount(4);
    await expect(
      gallery.getByRole("img", { name: "Fotografía 1 del evento Examen" }),
    ).toBeVisible();
    await expect(gallery.locator('img[alt=""]')).toHaveCount(3);
    expect(
      await gallery
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image.loading === "lazy"),
        ),
    ).toBe(true);

    await gallery.getByRole("button", { name: "Fotografía siguiente" }).click();
    await expect(
      gallery.getByRole("img", { name: "Fotografía 2 del evento Examen" }),
    ).toBeVisible();

    const opener = gallery.getByRole("button", {
      name: "Abrir Fotografía 2 del evento Examen",
    });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Fotografía 2 del evento Examen");
    await expect(
      dialog.getByRole("img", { name: "Fotografía 2 del evento Examen" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.querySelector<HTMLElement>("#root")?.inert,
        ),
      )
      .toBe(true);

    await page.keyboard.press("ArrowRight");
    await expect(
      dialog.getByRole("img", { name: "Fotografía 3 del evento Examen" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

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
  await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Siguiente" })).toBeEnabled();

  await page.goto("/eventos/ruta-inexistente/");
  await expect(page.getByText(/página que buscas no existe/i)).toBeVisible();

  await page.goto("/en/events/missing-route/");
  await expect(
    page.getByText(/page you are looking for does not exist/i),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(consoleErrors).toEqual([]);
});

test("switches languages while preserving the current section", async ({
  page,
}) => {
  await page.goto("/galeria/");

  await page.getByRole("link", { name: "View site in English" }).click();
  await expect(page).toHaveURL(/\/en\/gallery\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Kendo gallery", level: 1 }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Ver sitio en español" }).click();
  await expect(page).toHaveURL(/\/galeria\/$/);
});

test("exposes language controls inside the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/");

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByText("Español", { exact: true })).toBeVisible();
  await expect(page.getByText("English", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View site in English" }),
  ).toHaveAttribute("aria-current", "page");
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

  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(
    scrollBefore,
    0,
  );
});
