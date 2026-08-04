import { expect, test, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const APPROVED_VIEWPORTS = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1366x768", width: 1366, height: 768 },
] as const;

const FIXED_TEST_TIME = new Date("2026-08-04T12:00:00-06:00");

interface ApprovedPage {
  name: string;
  path: string;
  component: "home" | "calendar" | "gallery" | "affiliates" | "event" | "pastEvents" | "notFound";
}

const DIST_DIRECTORY = resolve(process.cwd(), "dist");

function getPageComponent(path: string): ApprovedPage["component"] {
  if (path === "/") return "home";
  if (path === "/calendario/") return "calendar";
  if (path === "/galeria/") return "gallery";
  if (path === "/afiliados/") return "affiliates";
  if (path.startsWith("/eventos/pasados/")) return "pastEvents";
  return "event";
}

const generatedRoutePaths = readdirSync(DIST_DIRECTORY, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name === "index.html")
  .map((entry) => {
    const directory = relative(DIST_DIRECTORY, entry.parentPath).split(sep).join("/");
    return directory ? `/${directory}/` : "/";
  })
  .sort();

const approvedPages: ApprovedPage[] = [
  ...generatedRoutePaths.map((path) => ({
    name: path === "/" ? "home" : path.replace(/^\//, "").replace(/\/$/, "").replaceAll("/", "-"),
    path,
    component: getPageComponent(path),
  })),
  { name: "not-found", path: "/ruta-visual-inexistente/", component: "notFound" },
];

const preferredRepresentativePaths: Partial<Record<ApprovedPage["component"], string>> = {
  event: "/eventos/2026-08-08-examen/",
};

const representativePages = Array.from(
  approvedPages.reduce((pagesByComponent, page) => {
    const preferredPath = preferredRepresentativePaths[page.component];
    const current = pagesByComponent.get(page.component);

    if (!current || page.path === preferredPath) {
      pagesByComponent.set(page.component, page);
    }

    return pagesByComponent;
  }, new Map<ApprovedPage["component"], ApprovedPage>()),
  ([, page]) => page,
);

async function prepareApprovedPage(page: Page, path: string) {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto(path);
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
  });
}

for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(`${viewport.name} structural guard`, () => {
    test.use({ viewport });

    for (const approvedPage of approvedPages) {
      test(`${approvedPage.path} preserves the approved page structure`, async ({ page }) => {
        await prepareApprovedPage(page, approvedPage.path);

        const geometry = await page.evaluate(() => {
          const root = document.documentElement;
          const nav = document.querySelector("nav");
          const main = document.querySelector("main");
          const footer = document.querySelector("footer");
          const heading = main?.querySelector("h1");
          const primarySection = main?.firstElementChild;
          const headingRect = heading?.getBoundingClientRect();
          const contentBoundaries = Array.from(
            main?.querySelectorAll("[data-page-content-boundary]") ?? [],
            (element) => element.getBoundingClientRect().top,
          );

          const rect = (element: Element | null) => {
            const bounds = element?.getBoundingClientRect();
            return bounds
              ? { top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left }
              : null;
          };

          return {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            document: {
              clientWidth: root.clientWidth,
              scrollWidth: root.scrollWidth,
              clientHeight: root.clientHeight,
              scrollHeight: root.scrollHeight,
            },
            nav: rect(nav),
            main: rect(main),
            footer: rect(footer),
            heading: rect(heading ?? null),
            headingClearsContentBoundaries: Boolean(
              headingRect &&
                contentBoundaries.every((contentTop) => contentTop >= headingRect.bottom - 1),
            ),
            primarySection: primarySection
              ? {
                  ...rect(primarySection),
                  clientHeight: primarySection.clientHeight,
                  scrollHeight: primarySection.scrollHeight,
                }
              : null,
          };
        });

        expect(geometry.document.scrollWidth, "document has horizontal overflow").toBeLessThanOrEqual(
          geometry.document.clientWidth + 1,
        );
        expect(geometry.heading?.top, "page heading starts above the viewport").toBeGreaterThanOrEqual(0);
        expect(geometry.heading?.bottom, "page heading falls below the viewport").toBeLessThanOrEqual(
          geometry.viewport.height,
        );
        expect(
          geometry.headingClearsContentBoundaries,
          "the page heading overlaps a declared primary-content boundary",
        ).toBe(true);

        if (viewport.width === 1366 && viewport.height === 768) {
          expect(geometry.document.scrollHeight, "desktop document scrolls vertically").toBeLessThanOrEqual(
            geometry.document.clientHeight + 1,
          );
          expect(geometry.nav?.top).toBeGreaterThanOrEqual(0);
          expect(geometry.footer?.bottom, "footer falls below the approved viewport").toBeLessThanOrEqual(
            geometry.viewport.height + 1,
          );
          expect(
            geometry.primarySection?.scrollHeight,
            "the primary section clips or scrolls vertically",
          ).toBeLessThanOrEqual((geometry.primarySection?.clientHeight ?? 0) + 1);
        }
      });
    }
  });
}

for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(`${viewport.name} approved visual designs`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.component} matches its approved design`, async ({ page }) => {
        await prepareApprovedPage(page, approvedPage.path);
        await expect(page).toHaveScreenshot(
          `${approvedPage.component}-${viewport.name}.png`,
        );
      });
    }
  });
}
