import { expect, test } from "@playwright/test";
import calibration from "../fixtures/calendar-layout-calibration.json" with { type: "json" };
import { recordCalendarLayout } from "../helpers/calendar-layout";
import { measureCalendarBlocks } from "../helpers/calendar-block-measurements";
import {
  expectEventGalleryGeometry,
  expectShortEventFitsViewport,
} from "../helpers/event-gallery-geometry";
import { APPROVED_VIEWPORTS } from "./design-contract";

for (const viewport of APPROVED_VIEWPORTS) {
  test(`dense-page geometry calibration at ${viewport.name}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.setFixedTime(new Date("2026-10-01T12:00:00-06:00"));
    await page.goto("http://127.0.0.1:4174/eventos/pasados/calibration-dense/");
    expect(
      await recordCalendarLayout(
        page,
        info,
        "calibration",
        calibration.photoCount,
      ),
    ).toEqual([]);
    const measured = await measureCalendarBlocks(
      page,
      "calibration",
      calibration.photoCount,
    );
    const reference = calibration.viewports.find(
      (item) => item.width === viewport.width,
    )!;
    // Ranges apply only to this dense specimen, never to arbitrary imported events.
    for (const [component, range] of Object.entries({
      description: reference.description,
      article: reference.article,
      photo: reference.photo,
      thumbnails: reference.thumbnail,
    })) {
      expect(measured.blocks[component].height).toBeGreaterThanOrEqual(
        range.min,
      );
      expect(measured.blocks[component].height).toBeLessThanOrEqual(range.max);
    }
    await expectEventGalleryGeometry(page);
    if (viewport.width === 1366) {
      // Preserve the former desktop spacing coverage around xl and on a wider screen.
      for (const width of [1280, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        expect(
          await recordCalendarLayout(
            page,
            info,
            `dense-desktop-${width}`,
            calibration.photoCount,
          ),
        ).toEqual([]);
        await expectEventGalleryGeometry(page);
      }
      await page.goto("http://127.0.0.1:4174/eventos/pasados/content-0/");
      expect(
        await recordCalendarLayout(page, info, "short-wide-desktop", 8),
      ).toEqual([]);
      await expectEventGalleryGeometry(page);
      await expectShortEventFitsViewport(page);
    }
  });
}
