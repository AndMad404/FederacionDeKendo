import { expect, type Page } from "@playwright/test";

export async function expectInteractiveReady(page: Page, surface: string) {
  await expect(
    page.locator(`[data-interactive-ready="${surface}"]`),
  ).toBeVisible();
}
