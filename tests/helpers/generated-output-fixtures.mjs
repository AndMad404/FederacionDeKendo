import { readFile } from "node:fs/promises";
import { before, mock } from "node:test";
import { getGeneratedSiteTime } from "./generated-site.mjs";

// Expected SSR routes, redirects and SEO use the date of the build being tested.
before(() => {
  mock.timers.enable({ apis: ["Date"], now: getGeneratedSiteTime() });
});

export async function readDist(relativePath) {
  return readFile(
    new URL(`../../dist/${relativePath}`, import.meta.url),
    "utf8",
  );
}
