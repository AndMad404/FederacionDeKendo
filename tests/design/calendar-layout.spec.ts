import { expect, test } from "@playwright/test";
import { generatedPages } from "../helpers/generated-pages";
import { recordCalendarLayout } from "../helpers/calendar-layout";
import { APPROVED_VIEWPORTS } from "./design-contract";
import { CALENDAR_EVENTS } from "../../src/app/data/calendarEvents";
import { EVENT_GALLERIES } from "../../src/app/data/eventGalleries";
import { getGeneratedSiteTime } from "../helpers/generated-site.mjs";

const pages = generatedPages().filter((page) =>
  ["calendar", "pastEvents", "event"].includes(page.design),
);
for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport, reducedMotion: "reduce" });
    for (const route of pages) {
      test(`calendar layout ${route.path}`, async ({ page }, info) => {
        await page.clock.setFixedTime(getGeneratedSiteTime());
        await page.goto(route.path);
        const slug = route.path.split("/").filter(Boolean).at(-1);
        const event =
          route.design === "event"
            ? CALENDAR_EVENTS.find(
                (event) =>
                  event.id === slug || event.aliases?.includes(slug ?? ""),
              )
            : undefined;
        const photos =
          event && /\/(pasados|past)\//.test(route.path)
            ? (EVENT_GALLERIES[event.id]?.images.length ?? 0)
            : 0;
        const findings = await recordCalendarLayout(
          page,
          info,
          "initial",
          photos,
        );
        if (route.design === "calendar") {
          // Traverse every visible month's event pages, then every month. On
          // desktop each pair is inspected before advancing by two months.
          const desktop = viewport.width >= 768;
          const monthNext = page.getByRole("button", {
            name: desktop
              ? /Ver los dos meses siguientes|View next two months/
              : /Ver mes siguiente|View next month/,
          });
          for (let month = 0; month < 1000; month++) {
            const nextPages = page.getByRole("button", {
              name: /Ver más eventos del mes|View more events/,
            });
            for (let index = 0; index < (await nextPages.count()); index++) {
              const next = nextPages.nth(index);
              for (
                let pagination = 0;
                pagination < 1000 && (await next.isEnabled());
                pagination++
              ) {
                await next.click();
                findings.push(
                  ...(await recordCalendarLayout(
                    page,
                    info,
                    `month-${month}-list-${index}-page-${pagination + 2}`,
                  )),
                );
              }
              if (await next.isEnabled())
                throw new Error("Event pagination traversal did not complete");
            }
            if (!(await monthNext.count()) || !(await monthNext.isEnabled()))
              break;
            await monthNext.click();
            findings.push(
              ...(await recordCalendarLayout(page, info, `month-${month + 1}`)),
            );
            if (month === 999)
              throw new Error("Calendar traversal did not complete");
          }
        }
        if (route.design === "pastEvents") {
          const next = page.getByRole("button", { name: /^(Siguiente|Next)$/ });
          for (
            let pagination = 0;
            pagination < 1000 &&
            (await next.count()) &&
            (await next.isEnabled());
            pagination++
          ) {
            await next.click();
            findings.push(
              ...(await recordCalendarLayout(
                page,
                info,
                `archive-page-${pagination + 2}`,
              )),
            );
            if (pagination === 999)
              throw new Error("Archive traversal did not complete");
          }
        }
        expect(findings).toEqual([]);
      });
    }
  });
}
