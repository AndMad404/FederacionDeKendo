import { expect, test, type Browser } from "@playwright/test";

const PAST_TIMED_EVENT_PATH = "/en/events/past/2026-08-22-3er-torneo/";
const TIMED_EVENT_PUBLIC_PAST = new Date("2026-08-23T06:00:00.000Z");
const PAST_ALL_DAY_EVENT_PATH = "/en/events/past/2026-05-02-examen/";

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

test("historical event completion uses the event time zone instead of the visitor time zone", async ({
  browser,
}) => {
  await expectActivityStatusInTimeZone(
    browser,
    "America/Costa_Rica",
    PAST_TIMED_EVENT_PATH,
    TIMED_EVENT_PUBLIC_PAST,
    "Completed activity",
  );
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    PAST_TIMED_EVENT_PATH,
    TIMED_EVENT_PUBLIC_PAST,
    "Completed activity",
  );
});

test("all-day events end at the next midnight in the event time zone", async ({
  browser,
}) => {
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    PAST_ALL_DAY_EVENT_PATH,
    new Date("2026-05-03T06:00:00.000Z"),
    "Completed activity",
  );
});

test("known tournament titles use their English dictionary translations", async ({
  page,
}) => {
  await page.clock.setFixedTime(TIMED_EVENT_PUBLIC_PAST);
  await page.goto(PAST_TIMED_EVENT_PATH);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "3rd Tournament",
  );
});
