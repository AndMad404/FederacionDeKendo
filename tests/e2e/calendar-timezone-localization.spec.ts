import { expect, test, type Browser } from "@playwright/test";

const TIMED_EVENT_PATH = "/en/events/2026-08-22-3er-torneo/";
const AFTER_EVENT_END = new Date("2026-08-22T23:30:00.000Z");
const ALL_DAY_EVENT_PATH = "/en/events/2026-05-02-examen/";

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
    AFTER_EVENT_END,
    "Completed activity",
  );
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    TIMED_EVENT_PATH,
    AFTER_EVENT_END,
    "Completed activity",
  );
});

test("all-day events end at the next midnight in the event time zone", async ({ browser }) => {
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    ALL_DAY_EVENT_PATH,
    new Date("2026-05-03T05:59:59.000Z"),
    "Scheduled activity",
  );
  await expectActivityStatusInTimeZone(
    browser,
    "Pacific/Kiritimati",
    ALL_DAY_EVENT_PATH,
    new Date("2026-05-03T06:00:00.000Z"),
    "Completed activity",
  );
});

test("known tournament titles use their English dictionary translations", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-01T12:00:00.000Z"));
  await page.goto(TIMED_EVENT_PATH);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("3rd Tournament");
});
