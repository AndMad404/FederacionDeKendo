import { expect, test, type Page } from "@playwright/test";

const FIXED_UPCOMING_TIME = new Date("2026-08-09T12:00:00-06:00");
const FIXED_HISTORICAL_TIME = new Date("2026-08-24T12:00:00-06:00");
const HISTORICAL_EVENT_PATH = "/eventos/pasados/2026-08-08-examen/";
const PORTRAIT_FIRST_EVENT_PATH = "/eventos/pasados/2026-08-22-3er-torneo/";

async function discoverUpcomingEvent(page: Page) {
  await page.clock.setFixedTime(FIXED_UPCOMING_TIME);
  await page.goto("/eventos/");
  return (await page
    .getByRole("link", { name: /Ver detalles del evento/ })
    .first()
    .getAttribute("href"))!;
}

test("mobile event actions remain usable and contained with an optional description", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(await discoverUpcomingEvent(page));
  const action = page.getByRole("link", { name: "Añade a tu calendario" });
  const details = page.locator("dl").filter({ has: action });
  const description = page.getByRole("heading", {
    name: "Descripción",
    level: 2,
  });

  await expect(action).toBeVisible();
  await expect(details).toBeVisible();
  await expect(description).toBeVisible();

  const [actionBox, detailsBox, descriptionBox] = await Promise.all([
    action.boundingBox(),
    details.boundingBox(),
    description.boundingBox(),
  ]);
  if (!actionBox || !detailsBox || !descriptionBox) {
    throw new Error(
      "Expected visible event details to have measurable geometry",
    );
  }

  expect(actionBox.height).toBeGreaterThanOrEqual(44);
  expect(actionBox.x).toBeGreaterThanOrEqual(detailsBox.x);
  expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
    detailsBox.x + detailsBox.width,
  );
  expect(
    Math.abs(
      actionBox.x + actionBox.width / 2 - (detailsBox.x + detailsBox.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(descriptionBox.y);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

for (const viewport of [
  { name: "mobile 360x800 portrait", width: 360, height: 800, columns: 1 },
  { name: "mobile 390x844 portrait", width: 390, height: 844, columns: 1 },
  { name: "tablet 768x1024 portrait", width: 768, height: 1024, columns: 1 },
  { name: "desktop 1366x768 landscape", width: 1366, height: 768, columns: 2 },
]) {
  test(`scheduled event details use a ${viewport.columns}-column ${viewport.name} grid`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(await discoverUpcomingEvent(page));

    const addToCalendar = page.getByRole("link", {
      name: "Añade a tu calendario",
    });
    const details = addToCalendar.locator("xpath=ancestor::dl");
    await expect(details).toHaveCount(1);
    await expect(details.locator(":scope > div")).toHaveCount(4);
    await expect
      .poll(() =>
        details.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length,
        ),
      )
      .toBe(viewport.columns);
  });
}

test("historical gallery starts with the first landscape image", async ({
  page,
}) => {
  await page.clock.setFixedTime(FIXED_HISTORICAL_TIME);
  await page.goto(PORTRAIT_FIRST_EVENT_PATH);

  await expect(
    page.getByRole("img", {
      name: "Fotografía 3 del evento 3er Torneo",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Ver imagen: Fotografía 1",
    }),
  ).not.toHaveAttribute("aria-current", "true");
});

test("historical tournament thumbnails are centered when they fit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.clock.setFixedTime(FIXED_HISTORICAL_TIME);
  await page.goto(PORTRAIT_FIRST_EVENT_PATH);

  const strip = page.getByRole("group", { name: "Seleccionar fotografía" });
  const buttons = strip.getByRole("button");
  const geometry = await strip.evaluate((element) => {
    const thumbnails = Array.from(element.querySelectorAll("button"));
    const stripBox = element.getBoundingClientRect();
    const firstBox = thumbnails[0].getBoundingClientRect();
    const lastBox = thumbnails.at(-1)!.getBoundingClientRect();
    return {
      leftGap: firstBox.left - stripBox.left,
      rightGap: stripBox.right - lastBox.right,
    };
  });

  await expect(buttons).toHaveCount(5);
  expect(geometry.leftGap).toBeCloseTo(geometry.rightGap, 0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`optional historical gallery remains contained at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(FIXED_HISTORICAL_TIME);
    await page.goto(HISTORICAL_EVENT_PATH);
    const gallery = page.getByRole("region", {
      name: "Fotografías del evento Examen",
    });
    const geometry = await gallery.evaluate((element) => {
      const figure = element.querySelector<HTMLElement>("figure")!;
      const thumbnails = element.querySelector<HTMLElement>('[role="group"]')!;
      const thumb = thumbnails.querySelector<HTMLElement>("button")!;
      const event = document.querySelector<HTMLElement>(
        'section[aria-labelledby="event-page-title"]',
      )!;
      const footer = document.querySelector<HTMLElement>("footer")!;
      return {
        galleryWidth: element.getBoundingClientRect().width,
        figureWidth: figure.getBoundingClientRect().width,
        eventWidth: event.getBoundingClientRect().width,
        thumbnailWidth: thumb.getBoundingClientRect().width,
        thumbnailHeight: thumb.getBoundingClientRect().height,
        footerGap:
          footer.getBoundingClientRect().top -
          thumbnails.getBoundingClientRect().bottom,
        documentOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
    });
    expect(geometry.figureWidth).toBeCloseTo(geometry.galleryWidth, 0);
    expect(geometry.footerGap).toBeCloseTo(10, 0);
    expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
    if (viewport.width < 640) {
      expect(geometry.figureWidth).toBeCloseTo(geometry.eventWidth, 0);
      expect(geometry.thumbnailWidth).toBeGreaterThan(geometry.thumbnailHeight);
    }
  });
}
