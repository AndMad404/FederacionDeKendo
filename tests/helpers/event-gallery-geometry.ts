import { expect, type Page } from "@playwright/test";

export async function expectEventGalleryGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) =>
      document.querySelector(selector)?.getBoundingClientRect();
    const article = rect("main article")!;
    const actions = rect("main article aside")!;
    const gallery = rect('main section[aria-label^="Fotografías del evento"]');
    const figure = rect("main figure");
    const stripElement = document.querySelector('main [role="group"]');
    const strip = stripElement?.getBoundingClientRect();
    const thumbnails = [
      ...(stripElement?.querySelectorAll("button") ?? []),
    ].map((element) => element.getBoundingClientRect());
    const description = document
      .querySelector("main article h2")
      ?.parentElement?.getBoundingClientRect();
    return {
      article,
      actions,
      gallery,
      figure,
      strip,
      thumbnails,
      description,
      event: rect('[aria-labelledby="event-page-title"]')!,
      footer: rect("footer")!,
      columns: getComputedStyle(
        document.querySelector("main article")!.parentElement!,
      ).gridTemplateColumns.split(" ").length,
      width: window.innerWidth,
    };
  });
  if (!geometry.gallery) {
    expect(geometry.columns).toBe(1);
    expect(geometry.actions.y).toBeGreaterThanOrEqual(
      geometry.description!.bottom,
    );
    return;
  }
  const {
    article,
    actions,
    gallery,
    figure,
    strip,
    thumbnails,
    footer,
    width,
  } = geometry;
  expect(figure!.height).toBeGreaterThan(170);
  expect(Math.abs(figure!.width - gallery.width)).toBeLessThanOrEqual(1);
  if (width >= 1280) {
    expect(article.right).toBeLessThan(gallery.left);
    expect(actions.right).toBeLessThan(gallery.left);
    expect(Math.abs(gallery.top - article.top)).toBeLessThanOrEqual(1);
    if (strip) {
      expect(strip.height).toBeLessThanOrEqual(actions.height + 1);
      expect(strip.bottom).toBeGreaterThanOrEqual(article.bottom - 1);
    }
  } else {
    expect(gallery.top).toBeGreaterThanOrEqual(article.bottom);
  }
  // The approved single-photo variant has no strip. Its text column may
  // extend below the photo, so the footer follows the taller column.
  const contentBottom = strip
    ? gallery.bottom
    : Math.max(gallery.bottom, article.bottom);
  expect(footer.top - contentBottom).toBeGreaterThanOrEqual(9);
  expect(footer.top - contentBottom).toBeLessThanOrEqual(11);
  if (strip) {
    expect(strip.top - figure!.bottom).toBeGreaterThanOrEqual(9);
    expect(strip.top - figure!.bottom).toBeLessThanOrEqual(11);
    if (width < 640) {
      expect(
        Math.abs(figure!.width - geometry.event.width),
      ).toBeLessThanOrEqual(1);
      expect(thumbnails[0].width).toBeGreaterThan(thumbnails[0].height);
    }
    if (width >= 640 && thumbnails.length <= 6) {
      const left = thumbnails[0].left - strip.left;
      const right = strip.right - thumbnails.at(-1)!.right;
      expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
    }
  }
}

export async function expectShortEventFitsViewport(page: Page) {
  const geometry = await page.evaluate(() => ({
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    photoHeight: document.querySelector("main figure")!.getBoundingClientRect()
      .height,
    actionGap:
      document.querySelector("main article aside")!.getBoundingClientRect()
        .top -
      document
        .querySelector("main article h2")!
        .parentElement!.getBoundingClientRect().bottom,
  }));
  expect(geometry.documentHeight).toBeLessThanOrEqual(
    geometry.viewportHeight + 1,
  );
  expect(geometry.photoHeight).toBeGreaterThan(300);
  expect(geometry.actionGap).toBeLessThanOrEqual(11);
}
