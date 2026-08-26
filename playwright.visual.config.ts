import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: "**/design/visual-regression.spec.ts",
});
