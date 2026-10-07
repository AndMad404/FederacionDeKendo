import { expect, test } from "@playwright/test";
import {
  calendarLayoutFindings,
  recordCalendarLayout,
  settleCalendarLayout,
} from "../helpers/calendar-layout";
import { measureCalendarBlocks } from "../helpers/calendar-block-measurements";
import {
  IMAGE_SCENARIOS,
  CONTENT_LOADS,
  CALENDAR_EVENTS,
} from "../fixtures/calendar-layout/data";
import {
  expectEventGalleryGeometry,
  expectShortEventFitsViewport,
} from "../helpers/event-gallery-geometry";
import { APPROVED_VIEWPORTS } from "./design-contract";

for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(`isolated ${viewport.name}`, () => {
    test.use({ viewport, reducedMotion: "reduce" });
    for (const [index, scenario] of IMAGE_SCENARIOS.entries()) {
      const { count, dimensions } = scenario;
      test(`real event components ${count} photos and long descriptions`, async ({
        page,
      }, info) => {
        await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
        await page.goto(
          `http://127.0.0.1:4174/eventos/pasados/layout-${index}/`,
        );
        await settleCalendarLayout(page);
        expect(await page.locator('main [role="group"] button').count()).toBe(
          count > 1 ? count : 0,
        );

        expect(
          await recordCalendarLayout(page, info, "initial", count),
        ).toEqual([]);

        await expectEventGalleryGeometry(page);
        if (count)
          await expect(page.locator("main figure img")).toHaveCSS(
            "object-fit",
            "cover",
          );
        const initialPhoto = count
          ? await page.locator("main figure").boundingBox()
          : null;
        const thumbnails = page.locator('main [role="group"] button');
        // Select only changes in natural dimensions. The behavioral suite
        // covers list positions and wrapping; repeating identical image sizes
        // does not add a container-geometry guarantee.
        const initialIndex = dimensions.findIndex(
          ([width, height]) => width >= height,
        );
        const selected = initialIndex < 0 ? 0 : initialIndex;
        for (let photo = 0; count > 1 && photo < dimensions.length; photo++) {
          if (photo === selected) continue;
          await thumbnails.nth(photo).scrollIntoViewIfNeeded();
          await thumbnails.nth(photo).click();
          const image = page.locator("main figure img");
          await expect(image).toHaveAttribute(
            "alt",
            new RegExp(`Fotografía ${photo + 1} `),
          );
          await settleCalendarLayout(page);
          const photoBox = await page.locator("main figure").boundingBox();
          expect(
            Math.abs(photoBox!.width - initialPhoto!.width),
          ).toBeLessThanOrEqual(1);
          expect(
            Math.abs(photoBox!.height - initialPhoto!.height),
          ).toBeLessThanOrEqual(1);
          await expect(image).toHaveCSS("object-fit", "cover");
          expect(
            await image.evaluate(
              (element: HTMLImageElement) => element.naturalWidth,
            ),
          ).toBeGreaterThan(0);
        }
      });
    }
    test("block heights grow across neutral content ranges without imposing a maximum", async ({
      page,
    }, info) => {
      await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
      let previousHeight = 0;
      for (const [index, load] of CONTENT_LOADS.entries()) {
        await page.goto(
          `http://127.0.0.1:4174/eventos/pasados/content-${index}/`,
        );
        expect(
          await recordCalendarLayout(page, info, `content-load-${index}`, 8),
        ).toEqual([]);
        const measured = await measureCalendarBlocks(
          page,
          `content-load-${index}`,
          8,
        );
        expect(measured.content.paragraphs).toBe(load.paragraphs);
        expect(measured.content.listItems).toBe(load.listItems);
        expect(measured.blocks.description.height).toBeGreaterThan(
          previousHeight,
        );
        expect(measured.blocks.description.scrollHeight).toBeLessThanOrEqual(
          measured.blocks.description.height + 1,
        );
        await expectEventGalleryGeometry(page);
        if (viewport.width >= 1280 && index === 0)
          await expectShortEventFitsViewport(page);
        previousHeight = measured.blocks.description.height;
      }
    });
    test("real calendar and archive paginate all isolated events", async ({
      page,
    }) => {
      await page.clock.setFixedTime(new Date("2026-09-01T12:00:00-06:00"));
      await page.goto(`http://127.0.0.1:4174/eventos/`);
      await settleCalendarLayout(page);
      const next = page.getByRole("button", {
        name: /Ver más eventos del mes|View more events/,
      });
      let count = 0;
      do {
        // The long unbroken location is deliberately allowed through the
        // data pipeline; the geometry review must report the affected card.
        const findings = await calendarLayoutFindings(page);
        expect(
          findings.every((item) =>
            ["overflow_horizontal", "recorte", "fuera_del_contenedor"].includes(
              item.rule,
            ),
          ),
        ).toBe(true);
        count += await page.locator("main li").count();
        if (!(await next.isEnabled())) break;
        await next.click();
        await settleCalendarLayout(page);
      } while (count < CALENDAR_EVENTS.length);
      expect(count).toBe(CALENDAR_EVENTS.length);
      await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
      await page.goto(`http://127.0.0.1:4174/eventos/pasados/`);
      await settleCalendarLayout(page);
      const archiveNext = page.getByRole("button", {
        name: /^(Siguiente|Next)$/,
      });
      let pages = 0;
      do {
        expect(await calendarLayoutFindings(page)).toEqual([]);
        pages++;
        if (!(await archiveNext.isEnabled())) break;
        await archiveNext.click();
        await settleCalendarLayout(page);
      } while (pages < 20);
      expect(pages).toBeGreaterThan(1);
    });
  });
}
