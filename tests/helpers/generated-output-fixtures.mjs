import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, mock } from "node:test";
import { getGeneratedSiteTime } from "./generated-site.mjs";

import { CALENDAR_EVENTS } from "../../dist-ssr/entry-server.js";

const PANAMA_LEGACY_SLUG = "2026-11-21-panama-torneo-por-equipos";

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

export function getPanamaEvent() {
  const event = CALENDAR_EVENTS.find(({ aliases }) =>
    aliases?.includes(PANAMA_LEGACY_SLUG),
  );
  assert.ok(event, "Panama event must retain its original URL as an alias");
  return event;
}

export { PANAMA_LEGACY_SLUG };
