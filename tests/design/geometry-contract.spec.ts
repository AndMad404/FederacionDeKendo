import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import { expectCssPixels, getBox } from "../helpers/geometry-assertions";
import {
  generatedPages,
  representativePages as selectRepresentatives,
} from "../helpers/generated-pages";
import {
  expectRelativeContent,
  expectNoDuplicateIds,
  expectInteractiveNames,
} from "../helpers/content-assertions";
import {
  APPROVED_VIEWPORTS,
  SHELL_CONTRACT,
  getComponentSpacingContract,
} from "./design-contract";
const representativePages = selectRepresentatives(generatedPages());
for (const viewport of APPROVED_VIEWPORTS) {
  test.describe(`${viewport.name} approved component contracts`, () => {
    test.use({ viewport });

    for (const approvedPage of representativePages) {
      test(`${approvedPage.design} preserves content, spacing and accessibility`, async ({
        page,
      }) => {
        await preparePage(page, approvedPage.path);
        await test.step("content semantics", async () => {
          await expectRelativeContent(page);
          await expectNoDuplicateIds(page);
          await expectInteractiveNames(page);
        });

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
              : approvedPage.design === "pastEvents" && viewport.width === 768
                ? SHELL_CONTRACT.pastEventsTabletMarginBottom
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
