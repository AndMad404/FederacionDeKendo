import { expect, type Page } from "@playwright/test";
export async function expectRelativeContent(page: Page) {
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

export async function expectNoDuplicateIds(page: Page) {
  const duplicateIds = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return Array.from(counts).filter(([, count]) => count > 1);
  });
  expect(duplicateIds, "document IDs must be unique").toEqual([]);
}

export async function expectInteractiveNames(page: Page) {
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
