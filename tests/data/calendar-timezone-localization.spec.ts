import { expect, test, type Browser } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import { tsImport } from "tsx/esm/api";
import { CALENDAR_EVENTS } from "../../src/app/data/calendarEvents";
import type { CalendarEvent } from "../../src/app/types";
import { addCalendarDays } from "../../src/app/utils/calendarDate.ts";
import { calculatePublicPastAt } from "../../src/app/utils/eventArchive.ts";

// Load the app's publication policy with its JSON translations through tsx.
const { getLocalizedEvent, hasDistinctEventTranslation } = (await tsImport(
  "../../src/app/utils/localizedEvents.ts",
  import.meta.url,
)) as typeof import("../../src/app/utils/localizedEvents.ts");

function requireEvent(
  description: string,
  predicate: (event: CalendarEvent) => boolean,
) {
  const event = CALENDAR_EVENTS.find(predicate);
  if (!event) throw new Error(`Missing ${description} test fixture.`);
  return event;
}

function getLastEventDate(event: CalendarEvent) {
  return event.endDate && !event.startTime && !event.endTime
    ? addCalendarDays(event.endDate, -1)
    : (event.endDate ?? event.date);
}

function routeOutputExists(routePath: string) {
  return existsSync(
    path.resolve("dist", ...routePath.split("/").filter(Boolean), "index.html"),
  );
}

function getGeneratedFixture(event: CalendarEvent, language: "es" | "en") {
  const currentPath =
    language === "en" ? `/en/events/${event.id}/` : `/eventos/${event.id}/`;
  const pastPath =
    language === "en"
      ? `/en/events/past/${event.id}/`
      : `/eventos/pasados/${event.id}/`;
  const currentExists = routeOutputExists(currentPath);
  const pastExists = routeOutputExists(pastPath);
  if (currentExists === pastExists) {
    throw new Error(
      `Expected one generated ${language} route for ${event.id}.`,
    );
  }

  const publicPastAt = calculatePublicPastAt(
    getLastEventDate(event),
    event.timeZone,
  );
  const archived = pastExists;
  return {
    event,
    path: archived ? pastPath : currentPath,
    now: new Date(publicPastAt.getTime() + (archived ? 0 : -1_000)),
    status:
      language === "en"
        ? archived
          ? "Completed activity"
          : "Scheduled activity"
        : archived
          ? "Actividad finalizada"
          : "Actividad programada",
  };
}

const timedEvent = requireEvent(
  "timed event",
  (event) => Boolean(event.startTime) && Boolean(event.endTime),
);
const allDayEvent = requireEvent(
  "single-day all-day event",
  (event) => !event.startTime && !event.endTime && !event.endDate,
);
// Time-zone behavior applies to every event, including Spanish-only pages.
const timedFixture = getGeneratedFixture(timedEvent, "es");
const allDayFixture = getGeneratedFixture(allDayEvent, "es");

async function expectActivityStatusInTimeZone(
  browser: Browser,
  timezoneId: string,
  path: string,
  now: Date,
  status: string,
) {
  const context = await browser.newContext({ timezoneId });
  const page = await context.newPage();
  await page.clock.setFixedTime(now);
  await page.goto(path);

  await expect(page.getByText(status)).toBeVisible();
  await context.close();
}

test("event completion uses the event time zone instead of the visitor time zone", async ({
  browser,
}) => {
  await expectActivityStatusInTimeZone(
    browser,
    "America/Costa_Rica",
    timedFixture.path,
    timedFixture.now,
    timedFixture.status,
  );
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    timedFixture.path,
    timedFixture.now,
    timedFixture.status,
  );
});

test("all-day events end at the next midnight in the event time zone", async ({
  browser,
}) => {
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    allDayFixture.path,
    allDayFixture.now,
    allDayFixture.status,
  );
});

test("events with publishable English translations use their localized titles", async ({
  page,
}) => {
  const event = requireEvent(
    "event with a publishable English translation",
    hasDistinctEventTranslation,
  );
  const fixture = getGeneratedFixture(event, "en");
  const localizedEvent = getLocalizedEvent(event, "en");
  await page.clock.setFixedTime(fixture.now);
  await page.goto(fixture.path);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    localizedEvent!.title,
  );
});
