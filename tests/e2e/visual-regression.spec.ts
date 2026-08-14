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
  component:
    | "home"
    | "calendar"
    | "gallery"
    | "affiliates"
    | "event"
    | "pastEvents"
    | "notFound";
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
    component: getPageComponent(path),
  })),
  {
    name: "not-found",
    path: "/ruta-visual-inexistente/",
    component: "notFound",
  },
];

const preferredRepresentativePaths: Partial<
  Record<ApprovedPage["component"], string>
> = {
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
  test.describe(`${viewport.name} approved visual designs`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.component} matches its approved design`, async ({
        page,
      }) => {
        await prepareApprovedPage(page, approvedPage.path);
        await expect(page).toHaveScreenshot(
          `${approvedPage.component}-${viewport.name}.png`,
        );
      });
    }

    test("gallery lightbox details match their approved design", async ({
      page,
    }) => {
      await prepareApprovedPage(page, "/galeria/");
      await page.locator(".gallery-featured-frame > button").click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveScreenshot(
        `gallery-lightbox-${viewport.name}.png`,
      );
    });
  });
}
