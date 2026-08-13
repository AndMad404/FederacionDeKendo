import { expect, test, type Page } from "@playwright/test";
import { FIXED_TEST_TIME } from "./design-contract";

async function openLightbox(page: Page) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.clock.setFixedTime(FIXED_TEST_TIME);
    await page.goto("/galeria/");
    const opener = page.locator(".gallery-featured-frame > button");
    await expect(opener).toBeVisible();
    await opener.click();

    const dialog = page.getByRole("dialog");
    try {
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      return { dialog, opener };
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  throw new Error("Unreachable");
}

test("isolates the open lightbox from the application", async ({ page }) => {
  const { dialog } = await openLightbox(page);

  await expect(dialog).toHaveAttribute("aria-labelledby", "lightbox-title");
  await expect(dialog).toHaveAttribute("aria-describedby", "lightbox-description");
  await expect(dialog.locator("#lightbox-title")).toBeVisible();
  await expect(dialog.locator("#lightbox-description")).toBeVisible();
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();

  const isolation = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#root");
    const openDialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const backgroundTarget = root?.querySelector<HTMLElement>("a[href]");
    backgroundTarget?.focus();

    return {
      dialogIsOutsideRoot: Boolean(root && openDialog && !root.contains(openDialog)),
      rootIsInert: root?.inert ?? false,
      focusStayedInDialog: Boolean(openDialog?.contains(document.activeElement)),
    };
  });

  expect(isolation).toEqual({
    dialogIsOutsideRoot: true,
    rootIsInert: true,
    focusStayedInDialog: true,
  });

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press(index % 2 === 0 ? "Tab" : "Shift+Tab");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.querySelector('[role="dialog"]')?.contains(document.activeElement),
        ),
      )
      .toBe(true);
  }

  await expect(dialog).toBeVisible();
});

test("restores the application after closing the lightbox", async ({ page }) => {
  const { dialog, opener } = await openLightbox(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.querySelector("#root")?.hasAttribute("inert"))).toBe(false);
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(opener).toBeFocused();
});

test("cleans up isolation after backdrop closure", async ({ page }) => {
  const { dialog, opener } = await openLightbox(page);
  const backdrop = dialog.locator("..");

  await backdrop.click({ position: { x: 1, y: 1 } });

  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.querySelector("#root")?.hasAttribute("inert"))).toBe(false);
  await expect(opener).toBeFocused();
});

test("cleans up isolation when the gallery route unmounts", async ({ page }) => {
  const { dialog } = await openLightbox(page);

  await page.evaluate(() => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(dialog).toBeHidden();
  await expect(page.locator("main h1")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.querySelector("#root")?.hasAttribute("inert"))).toBe(false);
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});
