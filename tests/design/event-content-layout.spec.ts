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

test("mobile event actions and optional description follow the base layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(await discoverUpcomingEvent(page));
  const action = page.getByRole("link", { name: "Añade a tu calendario" });
  const description = page.getByRole("heading", {
    name: "Descripción",
    level: 2,
  });
  const metrics = await action.evaluate((link) => {
    const styles = getComputedStyle(link.parentElement!);
    return {
      height: link.getBoundingClientRect().height,
      marginTop: styles.marginTop,
      marginBottom: styles.marginBottom,
      justifyContent: styles.justifyContent,
    };
  });
  expect(metrics).toEqual({
    height: 44,
    marginTop: "10px",
    marginBottom: "10px",
    justifyContent: "center",
  });
  await expect(description).toBeVisible();
  expect(
    await description.evaluate(
      (heading) => getComputedStyle(heading.parentElement!).marginTop,
    ),
  ).toBe("0px");
});

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
