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
    await expect(details.locator(":scope > div")).toHaveCount(5);
    await expect(
      details.getByText("America/Costa_Rica", { exact: true }),
    ).toHaveCount(1);
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
  test(`Monteverde keeps text and actions beside its gallery only on desktop at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
    await page.goto("/eventos/pasados/2026-09-12-gasshuku-monteverde/");

    const article = page.locator("main article");
    const gallery = page.getByRole("region", {
      name: "Fotografías del evento Gasshuku Monteverde",
    });
    const archiveLink = article.getByRole("link", {
      name: "Eventos pasados",
    });
    await expect(gallery).toBeVisible();
    await expect(archiveLink).toBeVisible();
    const [textBox, galleryBox, actionBox, figureBox, thumbnailsBox] =
      await Promise.all([
        article.boundingBox(),
        gallery.boundingBox(),
        archiveLink.boundingBox(),
        gallery.locator("figure").boundingBox(),
        gallery.getByRole("group").boundingBox(),
      ]);
    if (!textBox || !galleryBox || !actionBox || !figureBox || !thumbnailsBox) {
      throw new Error("Expected event columns and thumbnails to be measurable");
    }
    expect(thumbnailsBox.y).toBeGreaterThanOrEqual(
      figureBox.y + figureBox.height,
    );
    expect(figureBox.height).toBeGreaterThan(170);
    if (viewport.width >= 1280) {
      expect(figureBox.height).toBeGreaterThan(300);
      expect(textBox.x + textBox.width).toBeLessThan(galleryBox.x);
      expect(actionBox.x + actionBox.width).toBeLessThan(galleryBox.x);
      expect(galleryBox.y).toBeCloseTo(textBox.y, 0);
    } else {
      expect(galleryBox.y).toBeGreaterThanOrEqual(textBox.y + textBox.height);
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    const firstThumbnail = gallery.getByRole("button", {
      name: "Ver imagen: Fotografía 1",
      exact: true,
    });
    await firstThumbnail.click();
    await expect(firstThumbnail).toHaveAttribute("aria-current", "true");
    await gallery
      .getByRole("button", {
        name: "Abrir Fotografía 1 del evento Gasshuku Monteverde",
      })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

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
    if (viewport.width >= 1280) {
      expect(geometry.footerGap).toBeGreaterThanOrEqual(10);
    } else {
      expect(geometry.footerGap).toBeCloseTo(10, 0);
    }
    expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
    if (viewport.width < 640) {
      expect(geometry.figureWidth).toBeCloseTo(geometry.eventWidth, 0);
      expect(geometry.thumbnailWidth).toBeGreaterThan(geometry.thumbnailHeight);
    }
  });
}

for (const slug of [
  "2026-09-12-gasshuku-monteverde",
  "2026-08-22-3er-torneo",
  "2026-08-08-examen",
]) {
  test(`${slug} keeps fixed gallery spacing and grows to fit the content`, async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
    await page.goto(`/eventos/pasados/${slug}/`);
    for (const width of [1366, 1920, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const gallery = page.getByRole("region", {
        name: /Fotografías del evento/,
      });
      await expect(gallery).toBeVisible();
      await expect
        .poll(async () => {
          const [actions, photo, thumbnails, card, footer] = await Promise.all([
            page.locator("main article aside").boundingBox(),
            gallery.locator("figure").boundingBox(),
            gallery.getByRole("group").boundingBox(),
            page.locator("main article").boundingBox(),
            page.locator("footer").boundingBox(),
          ]);
          if (!actions || !photo || !thumbnails || !card || !footer)
            return false;
          return (
            Math.abs(thumbnails.y - photo.y - photo.height - 10) <= 1 &&
            Math.abs(footer.y - thumbnails.y - thumbnails.height - 10) <= 1 &&
            thumbnails.height <= actions.height + 1 &&
            thumbnails.y + thumbnails.height >= card.y + card.height - 1
          );
        })
        .toBe(true);
    }
  });
}

test("events without photos keep text and actions in one column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
  await page.goto("/eventos/pasados/2026-05-02-examen/");
  await expect(page.getByText("Actividad finalizada")).toBeVisible();
  await expect(
    page.getByRole("region", { name: /Fotografías del evento/ }),
  ).toHaveCount(0);
  const description = page
    .getByRole("heading", { name: "Descripción", level: 2 })
    .locator("..");
  const actions = page.locator("main article aside");
  const [descriptionBox, actionsBox] = await Promise.all([
    description.boundingBox(),
    actions.boundingBox(),
  ]);
  if (!descriptionBox || !actionsBox)
    throw new Error("Expected event content to be measurable");
  expect(actionsBox.y).toBeGreaterThanOrEqual(
    descriptionBox.y + descriptionBox.height,
  );
  await expect
    .poll(() =>
      page
        .locator("main article")
        .locator("..")
        .evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length,
        ),
    )
    .toBe(1);
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 900 },
]) {
  test(`short tournament fills spare viewport height without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
    await page.goto("/eventos/pasados/2026-08-22-3er-torneo/");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const gallery = document
            .querySelector("main figure")!
            .closest("section")!
            .getBoundingClientRect();
          const description = document
            .querySelector("main article h2")!
            .parentElement!.getBoundingClientRect();
          const actions = document
            .querySelector("main article aside")!
            .getBoundingClientRect();
          const footer = document
            .querySelector("footer")!
            .getBoundingClientRect();
          const photo = document
            .querySelector("main figure")!
            .getBoundingClientRect();
          return (
            footer.top - gallery.bottom <= 11 &&
            actions.top - description.bottom <= 11 &&
            photo.height > 300 &&
            document.documentElement.scrollHeight <= window.innerHeight + 1
          );
        }),
      )
      .toBe(true);
  });
}
