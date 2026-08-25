import { expect, test, type Browser } from "@playwright/test";

const TIMED_EVENT_PUBLIC_PAST = new Date("2026-08-23T06:00:00.000Z");
const BEFORE_TIMED_EVENT_PUBLIC_PAST = new Date("2026-08-23T05:59:59.000Z");
const ALL_DAY_EVENT_PUBLIC_PAST = new Date("2026-05-03T06:00:00.000Z");
const BEFORE_ALL_DAY_EVENT_PUBLIC_PAST = new Date("2026-05-03T05:59:59.000Z");
const buildNow = new Date();
const timedEventArchived = buildNow >= TIMED_EVENT_PUBLIC_PAST;
const allDayEventArchived = buildNow >= ALL_DAY_EVENT_PUBLIC_PAST;
const TIMED_EVENT_PATH = timedEventArchived
  ? "/en/events/past/2026-08-22-3er-torneo/"
  : "/en/events/2026-08-22-3er-torneo/";
const ALL_DAY_EVENT_PATH = allDayEventArchived
  ? "/en/events/past/2026-05-02-examen/"
  : "/en/events/2026-05-02-examen/";
const timedEventNow = timedEventArchived
  ? TIMED_EVENT_PUBLIC_PAST
  : BEFORE_TIMED_EVENT_PUBLIC_PAST;
const allDayEventNow = allDayEventArchived
  ? ALL_DAY_EVENT_PUBLIC_PAST
  : BEFORE_ALL_DAY_EVENT_PUBLIC_PAST;
const timedEventStatus = timedEventArchived
  ? "Completed activity"
  : "Scheduled activity";
const allDayEventStatus = allDayEventArchived
  ? "Completed activity"
  : "Scheduled activity";

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
    TIMED_EVENT_PATH,
    timedEventNow,
    timedEventStatus,
  );
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    TIMED_EVENT_PATH,
    timedEventNow,
    timedEventStatus,
  );
});

test("all-day events end at the next midnight in the event time zone", async ({
  browser,
}) => {
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    ALL_DAY_EVENT_PATH,
    allDayEventNow,
    allDayEventStatus,
  );
});

test("known tournament titles use their English dictionary translations", async ({
  page,
}) => {
  await page.clock.setFixedTime(timedEventNow);
  await page.goto(TIMED_EVENT_PATH);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "3rd Tournament",
  );
});
