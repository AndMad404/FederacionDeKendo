import { expect, test, type Page } from "@playwright/test";
import type { RouteComponent } from "../../src/app/config/routeTypes";
import { FIXED_TEST_TIME } from "./design-contract";

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
  {
    name: "approved-desktop",
    viewport: { width: 1366, height: 768 },
    routes: ALL_ROUTE_KEYS,
  },
] as const;

async function preparePage(page: Page, path: string) {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto(path);
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function getReachability(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector("main");
    const appShell = document.querySelector("#root > div");
    const contentElements = Array.from(
      main?.querySelectorAll<HTMLElement>(
        'h1, h2, h3, p, a[href], button:not([disabled]), dt, dd, time, img:not([aria-hidden="true"])',
      ) ?? [],
    ).filter((element) => element.getClientRects().length > 0);

    const clippedContent = contentElements.flatMap((element) => {
      const elementRect = element.getBoundingClientRect();
      let ancestor = element.parentElement;

      while (ancestor && ancestor !== document.body) {
        const styles = getComputedStyle(ancestor);
        if (styles.overflowY === "hidden" || styles.overflowY === "clip") {
          const ancestorRect = ancestor.getBoundingClientRect();
          if (
            elementRect.top < ancestorRect.top - 1 ||
            elementRect.bottom > ancestorRect.bottom + 1
          ) {
            return [
              {
                label:
                  element.getAttribute("aria-label")?.trim() ||
                  element.getAttribute("alt")?.trim() ||
                  element.textContent?.trim().slice(0, 80) ||
                  element.outerHTML.slice(0, 80),
                tag: element.tagName.toLowerCase(),
                clippedBy: ancestor.tagName.toLowerCase(),
              },
            ];
          }
        }
        ancestor = ancestor.parentElement;
      }

      return [];
    });

    const internalVerticalScrollOwners = Array.from(
      main?.querySelectorAll<HTMLElement>("*") ?? [],
    )
      .filter((element) => {
        const overflowY = getComputedStyle(element).overflowY;
        return (
          (overflowY === "auto" || overflowY === "scroll") &&
          element.scrollHeight > element.clientHeight + 1
        );
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }));

    return {
      documentOwnsVerticalOverflow: root.scrollHeight > root.clientHeight + 1,
      flowLockOwners: [root, document.body, appShell, main]
        .filter((element): element is Element => element !== null)
        .filter((element) => {
          const overflowY = getComputedStyle(element).overflowY;
          return overflowY === "hidden" || overflowY === "clip";
        })
        .map((element) => element.tagName.toLowerCase()),
      hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      clippedContent,
      internalVerticalScrollOwners,
    };
  });
}

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
        await preparePage(page, route.path);
        const reachability = await getReachability(page);

        expect(reachability.clippedContent).toEqual([]);
        expect(reachability.hasHorizontalOverflow).toBe(false);
      });
    }
  });
}
