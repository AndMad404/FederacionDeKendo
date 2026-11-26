import { readFile } from "node:fs/promises";
import { before, mock } from "node:test";
import { getGeneratedSiteTime } from "./generated-site.mjs";
import { createEventDate } from "../../src/app/utils/calendarDate.ts";

// Expected SSR routes, redirects and SEO use the date of the build being tested.
before(() => {
  mock.timers.enable({ apis: ["Date"], now: getGeneratedSiteTime() });
});

// Use Intl's zone-name representation as a formatting oracle, not the product formatter.
export function getExpectedEventZoneName(
  date,
  time,
  timeZone = "America/Costa_Rica",
  style = "longOffset",
) {
  const instant = createEventDate(date, time, timeZone);
  return new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: style })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName").value;
}

export async function readDist(relativePath) {
  return readFile(
    new URL(`../../dist/${relativePath}`, import.meta.url),
    "utf8",
  );
}
