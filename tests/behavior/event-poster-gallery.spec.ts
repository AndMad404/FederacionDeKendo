import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import { expectEventGalleryGeometry } from "../helpers/event-gallery-geometry";

const eventPath = "/eventos/pasados/1er-panamericano-de-kendo/";
const eventTitle = "1.er Panamericano de Kendo";
const original = "https://www.instagram.com/p/DeLBKMPkdlM/";

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 2048, height: 1014 },
]) {
  test(`archive aligns equal thumbnail frames and preserves poster text at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await preparePage(page, "/eventos/pasados/");
    const posterCard = page.locator("main li").filter({
      has: page.getByRole("heading", {
        name: eventTitle,
        exact: true,
      }),
    });
    await expect(posterCard.locator("img")).toHaveCSS("object-fit", "contain");
    await expect(posterCard.locator("img")).toHaveAttribute(
      "src",
      /\/thumbnail-\d+\.webp$/,
    );
    await expect
      .poll(() =>
        posterCard
          .locator("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.naturalWidth / image.naturalHeight,
          ),
      )
      .toBeGreaterThan(2.9);
    await expect
      .poll(() =>
        posterCard
          .locator("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    const cards = await page
      .locator("main li:has([data-event-thumbnail])")
      .evaluateAll((elements) =>
        elements.map((card) => {
          const picture = card.querySelector("[data-event-thumbnail]")!;
          const box = picture.getBoundingClientRect();
          const title = card.querySelector("h2")!;
          const link = card.querySelector("a")!.getBoundingClientRect();
          return {
            row: card.getBoundingClientRect().top,
            top: box.top,
            height: box.height,
            width: box.width,
            actionBottom: link.bottom,
            sectionBottom: card.closest("section")!.getBoundingClientRect()
              .bottom,
            titleVisible: title.scrollHeight <= title.clientHeight,
          };
        }),
      );
    expect(cards.length).toBeGreaterThan(1);
    for (const card of cards) {
      expect(card.titleVisible).toBe(true);
      expect(card.actionBottom).toBeLessThanOrEqual(card.sectionBottom + 1);
      expect(card.width).toBeGreaterThan(0);
      expect(card.height).toBeGreaterThan(0);
      for (const sibling of cards.filter(
        (candidate) => Math.abs(candidate.row - card.row) < 1,
      )) {
        expect(Math.abs(sibling.top - card.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(sibling.height - card.height)).toBeLessThanOrEqual(1);
        expect(
          Math.abs(sibling.actionBottom - card.actionBottom),
        ).toBeLessThanOrEqual(1);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("archive-thumbnails.png"),
      fullPage: true,
    });
  });
}

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(`one official flyer remains complete at ${viewport.width}px`, async ({
    page,
    request,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await preparePage(page, eventPath);
    await expect(
      page.getByText("Evento externo", { exact: true }),
    ).toBeVisible();
    const description = page.locator("article");
    await expect(
      page.getByRole("heading", { name: eventTitle, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(description).toContainText("Link de la publicación original");
    await expect(description).toContainText(
      "El programa, los horarios y las sedes anunciadas pueden consultarse en la publicación original de CLAK.",
    );
    await expect(
      description.getByRole("link", {
        name: "Link de la publicación original",
        exact: true,
      }),
    ).toHaveAttribute("href", original);
    const originalBounds = await description
      .getByRole("link", {
        name: "Link de la publicación original",
        exact: true,
      })
      .boundingBox();
    const articleBounds = await description.boundingBox();
    expect(originalBounds!.x).toBeGreaterThanOrEqual(articleBounds!.x);
    expect(originalBounds!.x + originalBounds!.width).toBeLessThanOrEqual(
      articleBounds!.x + articleBounds!.width,
    );
    const profile = description.getByRole("link", {
      name: "@clakendo",
      exact: true,
    });
    await expect(profile).toHaveAttribute(
      "href",
      "https://www.instagram.com/clakendo/",
    );
    await expect(profile).toHaveAttribute("rel", "noopener noreferrer");
    await profile.scrollIntoViewIfNeeded();
    await expect(profile).toBeVisible();
    const gallery = page.getByRole("region", {
      name: /^Imagen oficial del evento/,
    });
    await expect(gallery).toBeVisible();
    await expect(gallery.locator("img")).toHaveCount(1);
    await expect(gallery.getByRole("group")).toHaveCount(0);
    await expectEventGalleryGeometry(page);
    await expect(gallery.locator("figure img")).toHaveAttribute(
      "src",
      /\/photo-1-1086\.webp$/,
    );
    await expect
      .poll(() =>
        gallery
          .locator("figure img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.naturalWidth > 0 &&
              image.naturalHeight > image.naturalWidth,
          ),
      )
      .toBe(true);
    await expect(gallery.locator('a[href$=".pdf"]')).toHaveCount(0);
    await expect(gallery.locator("figure img")).toHaveCSS(
      "object-fit",
      "contain",
    );
    const source = await gallery.locator("img").getAttribute("src");
    const imageResponse = await request.get(source!);
    expect(imageResponse.ok()).toBe(true);
    expect(imageResponse.headers()["content-type"]).toContain("image/webp");
    await expect(
      page.getByRole("link", { name: /^Arena Suzano/ }),
    ).toHaveAttribute("href", /maps/);
    await gallery.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("flyer-page.png"),
      fullPage: true,
    });
    await gallery.getByRole("button", { name: /^Abrir Flyer oficial/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
    await expect(dialog.locator("img")).toHaveAttribute(
      "src",
      /\/photo-1-1086\.webp$/,
    );
    await expect(dialog.getByRole("button")).toHaveCount(1);
    await expect
      .poll(() =>
        dialog
          .locator("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    const imageBounds = (await dialog.locator("img").boundingBox())!;
    const frame = (await dialog
      .locator("[data-lightbox-image]")
      .boundingBox())!;
    expect(imageBounds.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(imageBounds.y).toBeGreaterThanOrEqual(frame.y - 1);
    expect(imageBounds.x + imageBounds.width).toBeLessThanOrEqual(
      frame.x + frame.width + 1,
    );
    expect(imageBounds.y + imageBounds.height).toBeLessThanOrEqual(
      frame.y + frame.height + 1,
    );
    const close = (await dialog
      .getByRole("button", { name: "Cerrar galería" })
      .boundingBox())!;
    expect(close.y + close.height).toBeLessThanOrEqual(imageBounds.y + 1);
    await page.screenshot({ path: testInfo.outputPath("flyer-lightbox.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(
      gallery.getByRole("button", { name: /^Abrir Flyer oficial/ }),
    ).toBeFocused();
  });
}
