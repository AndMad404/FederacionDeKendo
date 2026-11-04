import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import { EVENT_GALLERIES } from "../../src/app/data/eventGalleries";
import coverManifest from "../../src/app/data/eventCovers.json" with { type: "json" };

const eventId = "clak-1er-panamericano-brasil";
const gallery = EVENT_GALLERIES[eventId];
const assignedImage = gallery?.thumbnail ?? gallery?.images[0];
const covers: Record<
  string,
  Partial<Record<"calendar" | "archive", { src: string }>>
> = coverManifest.events;

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`calendar date, assigned image or generic fallback and actions at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await preparePage(page, "/eventos/", new Date("2026-10-01T12:00:00-06:00"));
    const exam = page.locator("main li").filter({
      has: page.getByRole("heading", {
        name: "3er Examen 2026",
        exact: true,
      }),
    });
    await expect(
      exam.getByText("1:00p.m. - 3:00p.m.", { exact: true }),
    ).toBeVisible();
    const poster = page.locator("main li").filter({
      has: page.getByRole("heading", {
        name: "1.er Panamericano de Kendo",
        exact: true,
      }),
    });
    await expect(poster.locator("picture img")).toHaveCSS(
      "object-fit",
      "contain",
    );
    const picture = poster.locator("[data-event-thumbnail]");
    const format =
      (await picture.getAttribute("data-cover-format")) === "archive"
        ? "archive"
        : "calendar";
    const expectedImage = assignedImage ?? covers[eventId]?.[format];
    expect(
      expectedImage,
      "An event without assigned artwork needs a generic cover",
    ).toBeDefined();
    await expect(picture).toHaveAttribute(
      "data-thumbnail-source",
      assignedImage
        ? gallery.posterSource
          ? "poster"
          : "gallery"
        : "generated",
    );
    await expect(picture.locator("img")).toHaveAttribute(
      "src",
      expectedImage!.src,
    );
    await expect(
      poster.getByText("Todos los días", { exact: true }),
    ).toHaveCount(0);
    await expect(poster.locator("time")).toHaveText([
      "10 OCT 2026",
      "11 OCT 2026",
    ]);
    const actionRows = await exam
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().top),
      );
    expect(Math.abs(actionRows[0] - actionRows[1])).toBeLessThanOrEqual(1);
    const boxes = await poster.evaluate((card) => {
      const box = (selector: string) => {
        const r = card.querySelector(selector)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      };
      return {
        title: box("h3"),
        date: box("time"),
        image: box("picture"),
        actions: box("a"),
        bottom: card.getBoundingClientRect().bottom,
      };
    });
    expect(boxes.title.bottom).toBeLessThanOrEqual(boxes.date.top + 1);
    expect(boxes.date.bottom).toBeLessThanOrEqual(boxes.image.top + 1);
    expect(boxes.image.bottom).toBeLessThanOrEqual(boxes.actions.top + 1);
    expect(boxes.actions.bottom).toBeLessThanOrEqual(boxes.bottom + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("calendar-card-layout.png"),
      fullPage: true,
    });
    await poster.getByRole("link", { name: /Detalles del evento/ }).click();
    await expect(page).toHaveURL(/\/eventos\/1er-panamericano-de-kendo\/$/);
    await expect(
      page.getByRole("heading", {
        name: "1.er Panamericano de Kendo",
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Evento externo", { exact: true }),
    ).toBeVisible();
    // The clock is before the event: official posters may be displayed already,
    // while ordinary historical photo galleries are shown after the event.
    const hasPublishedPoster = Boolean(
      gallery?.posterSource && gallery.images.length,
    );
    const featured = page.locator("main figure img");
    await expect(featured).toHaveCount(hasPublishedPoster ? 1 : 0);
    if (hasPublishedPoster) await expect(featured).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Link de la publicación original",
        exact: true,
      }),
    ).toHaveAttribute("href", "https://www.instagram.com/p/DeLBKMPkdlM/");
  });
}
