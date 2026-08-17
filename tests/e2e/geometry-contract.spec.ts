import { expect, test, type Locator, type Page } from "@playwright/test";
import { readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import {
  APPROVED_VIEWPORTS,
  FIXED_TEST_TIME,
  PREFERRED_REPRESENTATIVE_PATHS,
  SHELL_CONTRACT,
  getComponentSpacingContract,
  type ApprovedPage,
  type PageDesign,
} from "./design-contract";

const DIST_DIRECTORY = resolve(process.cwd(), "dist");
const CSS_PIXEL_TOLERANCE = 0.51;

function getPageDesign(path: string): PageDesign {
  if (path === "/" || path === "/en/") return "home";
  if (path === "/calendario/" || path === "/en/calendar/") return "calendar";
  if (path === "/galeria/" || path === "/en/gallery/") return "gallery";
  if (path === "/afiliados/" || path === "/en/affiliates/") return "affiliates";
  if (
    path.startsWith("/eventos/pasados/") ||
    path.startsWith("/en/events/past/")
  ) {
    return "pastEvents";
  }
  return "event";
}

const generatedRoutePaths = readdirSync(DIST_DIRECTORY, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name === "index.html")
  .map((entry) => {
    const directory = relative(DIST_DIRECTORY, entry.parentPath)
      .split(sep)
      .join("/");
    return directory ? `/${directory}/` : "/";
  })
  .sort();

const approvedPages: ApprovedPage[] = [
  ...generatedRoutePaths.map((path) => ({
    name:
      path === "/"
        ? "home"
        : path.replace(/^\//, "").replace(/\/$/, "").replaceAll("/", "-"),
    path,
    design: getPageDesign(path),
  })),
  { name: "not-found", path: "/ruta-visual-inexistente/", design: "notFound" },
];

const representativePages = Array.from(
  approvedPages.reduce((pagesByDesign, page) => {
    const preferredPath = PREFERRED_REPRESENTATIVE_PATHS[page.design];
    const current = pagesByDesign.get(page.design);
    if (!current || page.path === preferredPath)
      pagesByDesign.set(page.design, page);
    return pagesByDesign;
  }, new Map<PageDesign, ApprovedPage>()),
  ([, page]) => page,
);

async function preparePage(page: Page, path: string) {
  await page.clock.setFixedTime(FIXED_TEST_TIME);
  await page.goto(path);
  await expect(page.locator("main h1")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images, (image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolveImage) => {
              image.addEventListener("load", () => resolveImage(), {
                once: true,
              });
              image.addEventListener("error", () => resolveImage(), {
                once: true,
              });
            }),
      ),
    );
  });
}

async function getBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, `expected ${locator} to have rendered geometry`).not.toBeNull();
  return box!;
}

function expectCssPixels(actual: number, expected: number, label: string) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}px, received ${actual}px`,
  ).toBeLessThanOrEqual(CSS_PIXEL_TOLERANCE);
}

async function expectRelativeContent(page: Page) {
  const heading = page.locator("main h1");
  await expect(heading).toHaveCount(1);
  await expect(heading).not.toHaveText(/^\s*$/);

  const visibleLinkDestinations = await page
    .locator("main a:visible")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")?.trim()),
    );
  for (const destination of visibleLinkDestinations) {
    expect(destination, "visible links must have a destination").toBeTruthy();
  }

  for (const image of await page.locator("main img").all()) {
    expect(
      (await image.getAttribute("src"))?.trim(),
      "images must have a source",
    ).toBeTruthy();
    expect(
      await image.getAttribute("alt"),
      'images must declare alt, including alt="" when decorative',
    ).not.toBeNull();
  }
}

async function expectNoDuplicateIds(page: Page) {
  const duplicateIds = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return Array.from(counts).filter(([, count]) => count > 1);
  });
  expect(duplicateIds, "document IDs must be unique").toEqual([]);
}

async function expectInteractiveNames(page: Page) {
  const unnamedControls = await page
    .locator("main a:visible, main button:visible")
    .evaluateAll((controls) =>
      controls
        .filter((control) => {
          const label = control.getAttribute("aria-label")?.trim();
          const text = control.textContent?.trim();
          const imageAlt = control
            .querySelector("img")
            ?.getAttribute("alt")
            ?.trim();
          return !label && !text && !imageAlt;
        })
        .map((control) => control.outerHTML),
    );
  expect(
    unnamedControls,
    "visible links and buttons must have an accessible name",
  ).toEqual([]);
}

test.describe("all generated routes preserve the desktop shell contract", () => {
  test.use({ viewport: SHELL_CONTRACT.desktopViewport });

  for (const approvedPage of approvedPages) {
    if (approvedPage.design === "event") continue;

    test(`${approvedPage.path} remains bounded and non-overlapping`, async ({
      page,
    }) => {
      await preparePage(page, approvedPage.path);

      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector("main");
        const nav = document.querySelector("nav");
        const footer = document.querySelector("footer");
        const heading = main?.querySelector("h1");
        const primarySection = main?.firstElementChild;
        const headingRect = heading?.getBoundingClientRect();
        const contentBoundaries = Array.from(
          main?.querySelectorAll("[data-page-content-boundary]") ?? [],
          (element) => element.getBoundingClientRect().top,
        );
        const mainStyles = main ? getComputedStyle(main) : null;

        return {
          document: {
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            clientHeight: root.clientHeight,
            scrollHeight: root.scrollHeight,
          },
          mainPaddingLeft: Number.parseFloat(mainStyles?.paddingLeft ?? "0"),
          mainPaddingRight: Number.parseFloat(mainStyles?.paddingRight ?? "0"),
          navTop: nav?.getBoundingClientRect().top ?? -1,
          footerBottom:
            footer?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY,
          headingTop: headingRect?.top ?? -1,
          headingBottom: headingRect?.bottom ?? Number.POSITIVE_INFINITY,
          headingClearsContent: Boolean(
            headingRect &&
            contentBoundaries.every((top) => top >= headingRect.bottom - 1),
          ),
          primaryClientHeight: primarySection?.clientHeight ?? 0,
          primaryScrollHeight:
            primarySection?.scrollHeight ?? Number.POSITIVE_INFINITY,
        };
      });

      expect(geometry.document.scrollWidth).toBeLessThanOrEqual(
        geometry.document.clientWidth + 1,
      );
      expect(geometry.document.scrollHeight).toBeLessThanOrEqual(
        geometry.document.clientHeight + 1,
      );
      expect(geometry.navTop).toBeGreaterThanOrEqual(0);
      expect(geometry.headingTop).toBeGreaterThanOrEqual(0);
      expect(geometry.headingBottom).toBeLessThanOrEqual(
        SHELL_CONTRACT.desktopViewport.height,
      );
      expect(geometry.footerBottom).toBeLessThanOrEqual(
        SHELL_CONTRACT.desktopViewport.height + 1,
      );
      expect(geometry.primaryScrollHeight).toBeLessThanOrEqual(
        geometry.primaryClientHeight + 1,
      );
      expect(geometry.headingClearsContent).toBe(true);
      expectCssPixels(
        geometry.mainPaddingLeft,
        SHELL_CONTRACT.mainPaddingInline,
        "main left padding",
      );
      expectCssPixels(
        geometry.mainPaddingRight,
        SHELL_CONTRACT.mainPaddingInline,
        "main right padding",
      );
    });
  }
});

test.describe("event details preserve desktop document flow", () => {
  test.use({ viewport: SHELL_CONTRACT.desktopViewport });

  for (const approvedPage of approvedPages.filter(
    (page) => page.design === "event",
  )) {
    test(`${approvedPage.path} keeps its content reachable`, async ({
      page,
    }) => {
      await preparePage(page, approvedPage.path);

      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const section = document.querySelector("main > section");
        const footer = document.querySelector("footer");
        return {
          hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          sectionScrollHeight: section?.scrollHeight ?? 0,
          sectionClientHeight: section?.clientHeight ?? 0,
          footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
        };
      });

      expect(geometry.hasHorizontalOverflow).toBe(false);
      expect(geometry.sectionScrollHeight).toBeLessThanOrEqual(
        geometry.sectionClientHeight + 1,
      );
      expect(geometry.footerBottom).toBeGreaterThan(0);
    });
  }
});

test("a short event detail keeps the footer at the desktop viewport bottom", async ({
  page,
}) => {
  await page.setViewportSize(SHELL_CONTRACT.desktopViewport);
  await preparePage(page, PREFERRED_REPRESENTATIVE_PATHS.event!);

  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const footer = document.querySelector("footer");
    return {
      clientHeight: root.clientHeight,
      scrollHeight: root.scrollHeight,
      footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
    };
  });

  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  expectCssPixels(
    geometry.footerBottom,
    geometry.clientHeight,
    "short event footer bottom",
  );
});

for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(`${viewport.name} approved component contracts`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.design} preserves content, spacing and accessibility`, async ({
        page,
      }) => {
        await preparePage(page, approvedPage.path);
        await expectRelativeContent(page);
        await expectNoDuplicateIds(page);
        await expectInteractiveNames(page);

        const mainBox = await getBox(page.locator("main"));
        expect(mainBox.x).toBeGreaterThanOrEqual(0);
        expect(mainBox.x + mainBox.width).toBeLessThanOrEqual(
          viewport.width + 1,
        );

        if (approvedPage.design !== "notFound") {
          const surface =
            approvedPage.design === "home"
              ? page.locator("main > section > header")
              : page.locator("main > section");
          const styles = await surface.evaluate((element) => {
            const computed = getComputedStyle(element);
            return {
              marginTop: Number.parseFloat(computed.marginTop),
              marginBottom: Number.parseFloat(computed.marginBottom),
              borderRadius: Number.parseFloat(computed.borderTopLeftRadius),
            };
          });
          expectCssPixels(
            styles.marginTop,
            SHELL_CONTRACT.routeSurfaceMarginBlock,
            "route surface top margin",
          );
          expectCssPixels(
            styles.marginBottom,
            approvedPage.design === "event"
              ? 0
              : SHELL_CONTRACT.routeSurfaceMarginBlock,
            "route surface bottom margin",
          );
          expectCssPixels(
            styles.borderRadius,
            SHELL_CONTRACT.routeSurfaceRadius,
            "route surface radius",
          );
        }

        const spacing = getComponentSpacingContract(
          approvedPage.design,
          viewport.width,
        );
        if (spacing) {
          const actual = await page
            .locator(spacing.selector)
            .first()
            .evaluate((element) => {
              const computed = getComputedStyle(element);
              return {
                paddingTop: Number.parseFloat(computed.paddingTop),
                paddingRight: Number.parseFloat(computed.paddingRight),
                paddingBottom: Number.parseFloat(computed.paddingBottom),
                paddingLeft: Number.parseFloat(computed.paddingLeft),
                rowGap: Number.parseFloat(computed.rowGap),
                columnGap: Number.parseFloat(computed.columnGap),
              };
            });

          expectCssPixels(
            actual.paddingTop,
            spacing.paddingTop,
            "component top padding",
          );
          expectCssPixels(
            actual.paddingRight,
            spacing.paddingRight,
            "component right padding",
          );
          expectCssPixels(
            actual.paddingBottom,
            spacing.paddingBottom,
            "component bottom padding",
          );
          expectCssPixels(
            actual.paddingLeft,
            spacing.paddingLeft,
            "component left padding",
          );
          if (spacing.rowGap !== undefined)
            expectCssPixels(actual.rowGap, spacing.rowGap, "component row gap");
          if (spacing.columnGap !== undefined)
            expectCssPixels(
              actual.columnGap,
              spacing.columnGap,
              "component column gap",
            );
        }

        const headingBox = await getBox(page.locator("main h1"));
        for (const boundary of await page
          .locator("[data-page-content-boundary]")
          .all()) {
          const boundaryBox = await getBox(boundary);
          expect(
            boundaryBox.y,
            "declared content must begin at or below the approved heading boundary",
          ).toBeGreaterThanOrEqual(headingBox.y + headingBox.height - 1);
        }

        if (approvedPage.design === "gallery") {
          const thumbnailStrip = page
            .locator("main [role='group'][aria-label]")
            .first();
          const thumbnail = thumbnailStrip.getByRole("button").first();
          const thumbnailGeometry = await thumbnail.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          });
          if (viewport.width < 640) {
            expect(thumbnailGeometry.width).toBeGreaterThan(
              thumbnailGeometry.height,
            );
          }
          expect(
            await thumbnailStrip
              .locator("xpath=..")
              .locator("[class*='bg-gradient']")
              .count(),
            "thumbnail strip must not have lateral gradient overlays",
          ).toBe(0);
        }
      });
    }
  });
}
