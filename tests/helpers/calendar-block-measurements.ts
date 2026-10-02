import type { Page } from "@playwright/test";

export interface BlockMeasurements {
  route: string;
  event: string;
  viewport: { width: number; height: number } | null;
  state: string;
  source: "generated" | "fixture" | "calibration";
  content: {
    characters: number;
    paragraphs: number;
    listItems: number;
    photos: number;
  };
  blocks: Record<
    string,
    { width: number; height: number; scrollHeight: number }
  >;
  margins: { photoToThumbnails: number | null; galleryToFooter: number | null };
}

export async function measureCalendarBlocks(
  page: Page,
  state: string,
  photos: number,
): Promise<BlockMeasurements> {
  const dimensions = await page.evaluate(() => {
    const description =
      document.querySelector("main article h2")?.parentElement;
    const selectors = {
      title: "main h1",
      metadata: "main dl",
      article: "main article",
      actions: "main article aside",
      photo: "main figure",
      thumbnails: 'main [role="group"]',
      footer: "footer",
    };
    const blocks: BlockMeasurements["blocks"] = {};
    for (const [name, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      blocks[name] = {
        width: rect.width,
        height: rect.height,
        scrollHeight: element.scrollHeight,
      };
    }
    if (description) {
      const rect = description.getBoundingClientRect();
      blocks.description = {
        width: rect.width,
        height: rect.height,
        scrollHeight: description.scrollHeight,
      };
    }
    const figure = document
      .querySelector("main figure")
      ?.getBoundingClientRect();
    const strip = document
      .querySelector('main [role="group"]')
      ?.getBoundingClientRect();
    const gallery = document
      .querySelector('main section[aria-label^="Fotografías del evento"]')
      ?.getBoundingClientRect();
    const footer = document.querySelector("footer")?.getBoundingClientRect();
    return {
      event: document.querySelector("main h1")?.textContent ?? "",
      content: {
        characters: description?.textContent?.length ?? 0,
        paragraphs: description?.querySelectorAll("p").length ?? 0,
        listItems: description?.querySelectorAll("li").length ?? 0,
      },
      blocks,
      margins: {
        photoToThumbnails: figure && strip ? strip.top - figure.bottom : null,
        galleryToFooter: gallery && footer ? footer.top - gallery.bottom : null,
      },
    };
  });
  const url = new URL(page.url());
  return {
    ...dimensions,
    route: url.pathname,
    viewport: page.viewportSize(),
    state,
    source: url.pathname.includes("calibration-dense")
      ? "calibration"
      : url.port === "4174"
        ? "fixture"
        : "generated",
    content: { ...dimensions.content, photos },
  };
}
