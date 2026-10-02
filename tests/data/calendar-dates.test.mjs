import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateArchiveEligibleAt,
  calculateGalleryCheckAt,
  calculateGalleryDeadlineAt,
  calculatePublicPastAt,
} from "../../src/app/utils/eventArchive.ts";
import {
  addCalendarDays,
  getCalendarDateTimeSortKey,
} from "../../src/app/utils/calendarDate.ts";
test("calendar date helpers cross month and year boundaries independently of the runner zone", () => {
  assert.equal(addCalendarDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addCalendarDays("2026-01-01", -1), "2025-12-31");
  assert.ok(
    getCalendarDateTimeSortKey("2026-08-08", "09:00") <
      getCalendarDateTimeSortKey("2026-08-08", "10:00"),
  );
});

test("Given an event at month end, When the 48-hour calendar checkpoint arrives, Then it is eligible", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-01-31").toISOString(),
    "2026-02-02T06:00:00.000Z",
  );
});

test("separates public expiry, the first gallery check, and the final 48-hour deadline", () => {
  assert.equal(
    calculatePublicPastAt("2026-08-22").toISOString(),
    "2026-08-23T06:00:00.000Z",
  );
  assert.equal(
    calculateGalleryCheckAt("2026-08-22").toISOString(),
    "2026-08-23T06:00:00.000Z",
  );
  assert.equal(
    calculateGalleryDeadlineAt("2026-08-22").toISOString(),
    "2026-08-24T06:00:00.000Z",
  );
  assert.equal(
    calculateArchiveEligibleAt("2026-08-22").toISOString(),
    "2026-08-24T06:00:00.000Z",
  );
});

test("Given an event at year end, When the 48-hour calendar checkpoint arrives, Then eligibility crosses the year", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-12-31").toISOString(),
    "2027-01-02T06:00:00.000Z",
  );
});

test("Given foreign daylight-saving dates, When eligibility is calculated, Then Costa Rica midnight stays stable", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-03-08").toISOString(),
    "2026-03-10T06:00:00.000Z",
  );
  assert.equal(
    calculateArchiveEligibleAt("2026-11-01").toISOString(),
    "2026-11-03T06:00:00.000Z",
  );
});
