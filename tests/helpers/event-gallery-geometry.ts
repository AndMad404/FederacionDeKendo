import { expect, type Page } from "@playwright/test";

// Allow small rendering differences while catching visible misalignment.
const ALIGNMENT_TOLERANCE = 4;

export async function expectEventGalleryAlignment(page: Page) {
  const layout = await page.evaluate(() => {
    const article = document.querySelector("main article")!;
    const figure = document.querySelector("main figure");
    const gallery = figure?.closest("section");
    const strip = gallery?.querySelector('[role="group"]');
    const thumbnails = [...(strip?.querySelectorAll("button") ?? [])];
    return {
      article: article.getBoundingClientRect(),
      actions: article.querySelector("aside")!.getBoundingClientRect(),
      description: article
        .querySelector("h2")!
        .parentElement!.getBoundingClientRect(),
      gallery: gallery?.getBoundingClientRect(),
      figure: figure?.getBoundingClientRect(),
      strip: strip?.getBoundingClientRect(),
      thumbnails: thumbnails.map((element) => element.getBoundingClientRect()),
      isPoster:
        gallery
          ?.getAttribute("aria-label")
          ?.match(/^(Imagen oficial|Official image)/) != null,
      footer: document.querySelector("footer")!.getBoundingClientRect(),
      desktop:
        getComputedStyle(article.parentElement!).gridTemplateColumns.split(" ")
          .length > 1,
      width: window.innerWidth,
    };
  });
  const {
    article,
    actions,
    description,
    gallery,
    figure,
    strip,
    thumbnails,
    footer,
  } = layout;
  expect(actions.top, "Actions follow the description").toBeGreaterThanOrEqual(
    description.bottom - ALIGNMENT_TOLERANCE,
  );
  if (!gallery || !figure) return;

  if (layout.desktop) {
    expect(
      gallery.left,
      "Text and gallery occupy separate columns",
    ).toBeGreaterThanOrEqual(article.right);
    if (strip || layout.isPoster) {
      // The approved album and official-poster layouts start with the text.
      expect(
        Math.abs(gallery.top - article.top),
        "Gallery aligns with the top of the left card",
      ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
    } else {
      const spaceAbove = figure.top - article.top;
      const spaceBelow = article.bottom - figure.bottom;
      expect(
        Math.abs(spaceAbove - spaceBelow),
        "Single photo has balanced space above and below relative to the left card",
      ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE * 2);
    }
  } else {
    expect(
      gallery.top,
      "Stacked gallery follows the text card",
    ).toBeGreaterThanOrEqual(article.bottom - ALIGNMENT_TOLERANCE);
  }
  expect(
    footer.top,
    "Footer follows both columns without overlap",
  ).toBeGreaterThanOrEqual(
    Math.max(article.bottom, gallery.bottom) - ALIGNMENT_TOLERANCE,
  );
  if (!strip) return;

  expect(strip.top, "Thumbnails stay below the featured image").toBeGreaterThan(
    figure.bottom,
  );
  expect(
    Math.abs(strip.left - figure.left),
    "Thumbnail strip aligns with the image's left edge",
  ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
  expect(
    Math.abs(strip.right - figure.right),
    "Thumbnail strip aligns with the image's right edge",
  ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
  if (layout.width >= 640 && thumbnails.length) {
    if (thumbnails.length <= 6) {
      const spaceLeft = thumbnails[0].left - strip.left;
      const spaceRight = strip.right - thumbnails.at(-1)!.right;
      expect(
        Math.abs(spaceLeft - spaceRight),
        "Short thumbnail rows are centered",
      ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
    } else {
      expect(
        Math.abs(thumbnails[0].left - strip.left),
        "Scrollable thumbnail rows start at the left edge",
      ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
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
