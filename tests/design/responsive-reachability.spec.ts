import { expect, test } from "@playwright/test";
import type { RouteComponent } from "../../src/app/config/routeTypes";
import { getReachability } from "../helpers/content-reachability";
import { preparePage } from "../helpers/prepare-page";

const ROUTES = {
  home: { name: "home", path: "/" },
  calendar: { name: "calendar", path: "/eventos/" },
  gallery: { name: "gallery", path: "/galeria/" },
  affiliates: { name: "affiliates", path: "/afiliados/" },
  event: { name: "event", path: "/eventos/pasados/2026-08-08-examen/" },
  pastEvents: { name: "past events", path: "/eventos/pasados/" },
  notFound: { name: "not found", path: "/ruta-responsive-inexistente/" },
} satisfies Record<RouteComponent, { name: string; path: string }>;

const ALL_ROUTE_KEYS = Object.keys(ROUTES) as RouteComponent[];

const FLOW_CASES = [
  {
    name: "land-compact-entry",
    viewport: { width: 1024, height: 480 },
    routes: ["affiliates", "event"],
  },
  {
    name: "land-compact-exit",
    viewport: { width: 1024, height: 481 },
    routes: ["affiliates", "event"],
  },
  {
    name: "below-width-and-height-boundary",
    viewport: { width: 767, height: 640 },
    routes: ["home"],
  },
  {
    name: "at-width-below-height-boundary",
    viewport: { width: 768, height: 640 },
    routes: ["home"],
  },
  {
    name: "below-width-at-height-boundary",
    viewport: { width: 767, height: 641 },
    routes: ["home"],
  },
  {
    name: "at-width-and-height-boundary",
    viewport: { width: 768, height: 641 },
    routes: ["home"],
  },
  {
    name: "intermediate-tall-md",
    viewport: { width: 768, height: 720 },
    routes: ["home"],
  },
  {
    name: "short-landscape-non-compact",
    viewport: { width: 1024, height: 600 },
    routes: ["gallery"],
  },
  {
    name: "before-tablet-fit",
    viewport: { width: 768, height: 1023 },
    routes: ["home"],
  },
  {
    name: "before-page-fit",
    viewport: { width: 1280, height: 767 },
    routes: ["calendar"],
  },
] as const;

const REACHABILITY_CASES = [
  {
    name: "tablet-fit-entry",
    viewport: { width: 768, height: 1024 },
    routes: ALL_ROUTE_KEYS,
  },
  {
    name: "page-fit-entry",
    viewport: { width: 1280, height: 768 },
    routes: ["calendar", "affiliates"],
  },
] as const;

for (const scenario of FLOW_CASES) {
  test.describe(`${scenario.name} uses document flow`, () => {
    test.use({ viewport: scenario.viewport });

    for (const routeKey of scenario.routes) {
      const route = ROUTES[routeKey];
      test(`${route.name} keeps all route content reachable`, async ({
        page,
      }) => {
        await preparePage(page, route.path);
        const reachability = await getReachability(page);

        expect
          .soft(
            reachability.flowLockOwners,
            "the page shell must remain in normal document flow at this viewport",
          )
          .toEqual([]);
        expect
          .soft(
            reachability.internalVerticalScrollOwners,
            "routes must not introduce nested vertical scroll owners",
          )
          .toEqual([]);
        expect
          .soft(
            reachability.clippedContent,
            "route content must not extend outside an overflow-hidden ancestor",
          )
          .toEqual([]);
        expect.soft(reachability.hasHorizontalOverflow).toBe(false);
      });
    }
  });
}

for (const scenario of REACHABILITY_CASES) {
  test.describe(`${scenario.name} preserves route reachability`, () => {
    test.use({ viewport: scenario.viewport });

    for (const routeKey of scenario.routes) {
      const route = ROUTES[routeKey];
      test(`${route.name} keeps all route content reachable`, async ({
        page,
      }) => {
        const tabletArchive =
          scenario.name === "tablet-fit-entry" && routeKey === "pastEvents";
        await preparePage(
          page,
          route.path,
          tabletArchive ? new Date("2026-10-01T12:00:00-06:00") : undefined,
        );
        if (tabletArchive) {
          await expect(
            page.locator('[data-interactive-ready="past-events"]'),
          ).toBeVisible();
          await expect
            .poll(
              async () =>
                (await getReachability(page)).documentOwnsVerticalOverflow,
            )
            .toBe(true);
        }
        const reachability = await getReachability(page);

        expect(reachability.clippedContent).toEqual([]);
        expect(reachability.hasHorizontalOverflow).toBe(false);
        if (tabletArchive) {
          expect(reachability.flowLockOwners).toEqual([]);
          expect(reachability.internalVerticalScrollOwners).toEqual([]);
          expect(reachability.documentOwnsVerticalOverflow).toBe(true);

          const footer = page.getByRole("contentinfo");
          const geometry = await page.evaluate(() => ({
            contentBottom: document
              .querySelector("main")!
              .getBoundingClientRect().bottom,
            footerTop: document.querySelector("footer")!.getBoundingClientRect()
              .top,
            footerBottom:
              document.querySelector("footer")!.getBoundingClientRect().bottom +
              window.scrollY,
            viewportHeight: document.documentElement.clientHeight,
          }));
          expect(geometry.footerTop).toBeGreaterThanOrEqual(
            geometry.contentBottom - 1,
          );
          expect(geometry.footerBottom).toBeGreaterThan(
            geometry.viewportHeight,
          );
          await page.evaluate(() =>
            window.scrollTo(0, document.documentElement.scrollHeight),
          );
          await expect(footer).toBeInViewport({ ratio: 1 });
          expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        }
      });
    }
  });
}
