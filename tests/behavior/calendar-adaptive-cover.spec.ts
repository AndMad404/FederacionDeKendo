import { expect, test } from "@playwright/test";
import { preparePage } from "../helpers/prepare-page";

test("calendar selects covers by available space and updates on resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1500 });
  await preparePage(page, "/eventos/", new Date("2026-10-29T12:00:00-06:00"));
  const exam = page
    .locator("main li")
    .filter({
      has: page.getByRole("heading", { name: "3er Examen 2026", exact: true }),
    })
    .locator("picture");
  const seminar = page
    .locator("main li")
    .filter({
      has: page.getByRole("heading", {
        name: "Seminario Noviembre 2026",
        exact: true,
      }),
    })
    .locator("picture");
  const official = page.locator('picture[data-thumbnail-source="poster"]');
  await expect(exam).toHaveAttribute("data-cover-format", "archive");
  await expect(seminar).toHaveAttribute("data-cover-format", "calendar");
  const posterSrc = await official.locator("img").getAttribute("src");
  await expect(exam.locator("img")).toHaveAttribute("src", /-archive-/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(exam).toHaveAttribute("data-cover-format", "calendar");
  await expect(exam.locator("img")).toHaveAttribute("src", /-calendar-/);
  await page.setViewportSize({ width: 1280, height: 1500 });
  await expect(exam).toHaveAttribute("data-cover-format", "archive");
  await expect(official.locator("img")).toHaveAttribute("src", posterSrc!);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});
