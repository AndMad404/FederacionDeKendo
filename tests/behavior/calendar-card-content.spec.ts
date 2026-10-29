import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";
import coverApproval from "../../src/app/config/eventCoverApproval.json" with { type: "json" };

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`calendar date, optional poster and actions at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await preparePage(page, "/eventos/", new Date("2026-10-01T12:00:00-06:00"));
    const exam = page.locator("main li").filter({
      has: page.getByRole("heading", {
        name: "3er Examen 2026",
        exact: true,
      }),
    });
    if (coverApproval.status === "approved") {
      await expect(exam.locator("picture")).toHaveAttribute(
        "data-thumbnail-source",
        "generated",
      );
    } else {
      await expect(exam.locator("picture")).toHaveCount(0);
    }
    await expect(
      exam.getByText("1:00p.m. - 3:00p.m.", { exact: true }),
    ).toBeVisible();
    const poster = page.locator("main li").filter({
      has: page.getByRole("heading", {
        name: "1.er Panamericano de Kendo",
        exact: true,
      }),
    });
    await expect(poster.locator("picture img")).toHaveCSS(
      "object-fit",
      "contain",
    );
    await expect(
      poster.getByText("Todos los días", { exact: true }),
    ).toHaveCount(0);
    await expect(poster.locator("time")).toHaveText([
      "10 OCT 2026",
      "11 OCT 2026",
    ]);
    const actionRows = await exam
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().top),
      );
    expect(Math.abs(actionRows[0] - actionRows[1])).toBeLessThanOrEqual(1);
    const boxes = await poster.evaluate((card) => {
      const box = (selector: string) => {
        const r = card.querySelector(selector)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      };
      return {
        title: box("h3"),
        date: box("time"),
        image: box("picture"),
        actions: box("a"),
        bottom: card.getBoundingClientRect().bottom,
      };
    });
    expect(boxes.title.bottom).toBeLessThanOrEqual(boxes.date.top + 1);
    expect(boxes.date.bottom).toBeLessThanOrEqual(boxes.image.top + 1);
    expect(boxes.image.bottom).toBeLessThanOrEqual(boxes.actions.top + 1);
    expect(boxes.actions.bottom).toBeLessThanOrEqual(boxes.bottom + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("calendar-card-layout.png"),
      fullPage: true,
    });
    await poster.getByRole("link", { name: /Detalles del evento/ }).click();
    await expect(page.locator("main figure img").first()).toBeVisible();
  });
}
