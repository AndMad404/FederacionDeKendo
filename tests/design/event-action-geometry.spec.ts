import { expect, test, type Page } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import { expectCssPixels } from "../helpers/geometry-assertions";
import { SHELL_CONTRACT } from "./design-contract";
const EVENT_ACTION_SELECTOR =
  "main a[aria-label*='ubicación'], main a[aria-label*='detalles']";

async function getVisibleEventActionSizes(page: Page) {
  return page.locator(EVENT_ACTION_SELECTOR).evaluateAll((elements) =>
    elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
      .filter(({ width, height }) => width > 0 && height > 0),
  );
}

const SCENARIOS = [
  {
    suite: "event actions use mobile-first touch geometry",
    title: "keeps actions at least 44px on mobile",
    viewport: { width: 390, height: 844 },
    hasTouch: false,
    features: [],
    compact: false,
  },
  {
    suite: "event actions preserve touch geometry on desktop",
    title: "keeps actions at least 44px with a coarse pointer",
    viewport: SHELL_CONTRACT.desktopViewport,
    hasTouch: true,
    features: [],
    compact: false,
  },
  {
    suite: "event actions preserve hybrid-device geometry",
    title: "keeps actions at least 44px with fine and coarse pointers",
    viewport: SHELL_CONTRACT.desktopViewport,
    hasTouch: true,
    features: [{ name: "pointer", value: "fine" }],
    compact: false,
  },
  {
    suite: "event actions preserve compact fine-pointer geometry",
    title: "keeps actions at 32px with an exclusively fine pointer",
    viewport: SHELL_CONTRACT.desktopViewport,
    hasTouch: false,
    features: [
      { name: "pointer", value: "fine" },
      { name: "any-pointer", value: "fine" },
    ],
    compact: true,
  },
];

for (const scenario of SCENARIOS) {
  test.describe(scenario.suite, () => {
    test.use({ viewport: scenario.viewport, hasTouch: scenario.hasTouch });
    for (const path of ["/", "/eventos/"]) {
      test(`${path} ${scenario.title}`, async ({ page }) => {
        if (scenario.features.length > 0) {
          const cdpSession = await page.context().newCDPSession(page);
          await cdpSession.send("Emulation.setEmulatedMedia", {
            features: scenario.features,
          });
        }
        await preparePage(page, path);
        let controls: Array<{ width: number; height: number }> = [];
        await expect
          .poll(async () => {
            controls = await getVisibleEventActionSizes(page);
            return controls.length;
          })
          .toBeGreaterThan(0);
        for (const control of controls) {
          if (scenario.compact) {
            expectCssPixels(control.height, 32, "compact event action height");
          } else {
            expect(control.width).toBeGreaterThanOrEqual(44);
            expect(control.height).toBeGreaterThanOrEqual(44);
          }
        }
      });
    }
  });
}
