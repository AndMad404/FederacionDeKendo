import { expect, test, type Browser } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CALENDAR_EVENTS } from "../../src/app/data/calendarEvents";
import type { CalendarEvent } from "../../src/app/types";
import { addCalendarDays } from "../../src/app/utils/calendarDate.js";
import { calculatePublicPastAt } from "../../src/app/utils/eventArchive.js";

interface TranslationRecord {
  source: { title: string; summary?: string };
  translation: { title: string; summary?: string };
}

const eventTranslations = JSON.parse(
  readFileSync(path.resolve("src/app/data/eventTranslations.json"), "utf8"),
) as Record<string, TranslationRecord>;

function getValidEnglishTranslation(event: CalendarEvent) {
  const record = eventTranslations[event.id];
  return record?.source.title === event.title &&
    record.source.summary === event.summary
    ? record.translation
    : undefined;
}

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

function getGeneratedFixture(event: CalendarEvent) {
  const currentPath = `/en/events/${event.id}/`;
  const pastPath = `/en/events/past/${event.id}/`;
  const currentExists = routeOutputExists(currentPath);
  const pastExists = routeOutputExists(pastPath);
  if (currentExists === pastExists) {
    throw new Error(`Expected one generated English route for ${event.id}.`);
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
    status: archived ? "Completed activity" : "Scheduled activity",
  };
}

const timedEvent = requireEvent(
  "translated timed tournament",
  (event) =>
    event.eventType === "torneo" &&
    Boolean(event.startTime) &&
    Boolean(event.endTime) &&
    Boolean(getValidEnglishTranslation(event)),
);
const allDayEvent = requireEvent(
  "translated single-day all-day event",
  (event) =>
    !event.startTime &&
    !event.endTime &&
    !event.endDate &&
    Boolean(getValidEnglishTranslation(event)),
);
const timedFixture = getGeneratedFixture(timedEvent);
const allDayFixture = getGeneratedFixture(allDayEvent);
const translatedTimedEvent = getValidEnglishTranslation(timedEvent);
if (!translatedTimedEvent) {
  throw new Error(`Missing English translation for ${timedEvent.id}.`);
}

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

test("known tournament titles use their English dictionary translations", async ({
  page,
}) => {
  await page.clock.setFixedTime(timedFixture.now);
  await page.goto(timedFixture.path);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    translatedTimedEvent.title,
  );
});
