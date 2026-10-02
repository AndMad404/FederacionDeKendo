import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: [
    "**/calendar-card-geometry.spec.ts",
    "**/calendar-layout.spec.ts",
    "**/calendar-layout-detectors.spec.ts",
    "**/calendar-layout-fixtures.spec.ts",
    "**/calendar-layout-calibration.spec.ts",
  ],
  retries: 0,
  reporter: [["list"], ["json"]],
  outputDir: process.env.CALENDAR_LAYOUT_REPORT_DIR
    ? `${process.env.CALENDAR_LAYOUT_REPORT_DIR}/captures`
    : "test-results/calendar-layout",
});
