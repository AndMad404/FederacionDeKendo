import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";

for (const viewport of [
  { width: 1280, height: 768 },
  { width: 1366, height: 768 },
  { width: 1920, height: 906 },
]) {
  for (const month of ["10", "12"]) {
    test(`calendar balances image and compact actions in month ${month} at ${viewport.width}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await preparePage(
        page,
        "/eventos/",
        new Date(`2026-${month}-01T12:00:00-06:00`),
      );
      const cards = page.locator(
        'main li:visible:has([data-thumbnail-source="generated"])',
      );
      expect(await cards.count()).toBeGreaterThan(0);
      for (const card of await cards.all()) {
        const geometry = await card.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const picture = element
            .querySelector("picture")!
            .getBoundingClientRect();
          const actionRow =
            element.querySelector("picture")!.nextElementSibling!;
          const actions = [...actionRow.children].map((action) => ({
            rect: action.getBoundingClientRect().toJSON(),
            grow: getComputedStyle(action).flexGrow,
          }));
          const list = element.closest("ul")!;
          return {
            box: box.toJSON(),
            picture: picture.toJSON(),
            actions,
            rowHeight: actionRow.getBoundingClientRect().height,
            eventCount: list.children.length,
            rowCount: getComputedStyle(list).gridTemplateRows.split(" ").length,
          };
        });
        expect(geometry.picture.height).toBeGreaterThan(24);
        if (geometry.eventCount === 1) {
          expect(geometry.rowCount).toBe(1);
          expect(geometry.picture.height).toBeGreaterThan(150);
        }
        expect(geometry.rowHeight).toBeLessThanOrEqual(80);
        for (const action of geometry.actions) {
          expect(action.grow).toBe("0");
          expect(action.rect.width).toBeLessThan(geometry.box.width * 0.65);
          expect(action.rect.bottom).toBeLessThanOrEqual(
            geometry.box.bottom + 1,
          );
          expect(action.rect.top).toBeGreaterThanOrEqual(
            geometry.picture.bottom,
          );
        }
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
    });
  }
}
