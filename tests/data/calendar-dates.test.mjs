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
  formatCalendarDateTimeWithOffset,
  formatCalendarUtcOffsetLabel,
} from "../../src/app/utils/calendarDate.ts";
test("calendar date helpers cross month and year boundaries independently of the runner zone", () => {
  assert.equal(addCalendarDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addCalendarDays("2026-01-01", -1), "2025-12-31");
  assert.ok(
    getCalendarDateTimeSortKey("2026-08-08", "09:00") <
      getCalendarDateTimeSortKey("2026-08-08", "10:00"),
  );
  for (const [date, zone, isoOffset, label, instant] of [
    [
      "2026-08-08",
      "America/Costa_Rica",
      "-06:00",
      "UTC−6",
      "2026-08-08T15:00:00.000Z",
    ],
    [
      "2026-08-08",
      "America/Panama",
      "-05:00",
      "UTC−5",
      "2026-08-08T14:00:00.000Z",
    ],
    [
      "2026-01-08",
      "America/New_York",
      "-05:00",
      "UTC−5",
      "2026-01-08T14:00:00.000Z",
    ],
    [
      "2026-07-08",
      "America/New_York",
      "-04:00",
      "UTC−4",
      "2026-07-08T13:00:00.000Z",
    ],
    [
      "2026-08-08",
      "Asia/Kolkata",
      "+05:30",
      "UTC+5:30",
      "2026-08-08T03:30:00.000Z",
    ],
    ["2026-08-08", "UTC", "+00:00", "UTC", "2026-08-08T09:00:00.000Z"],
  ]) {
    const timed = formatCalendarDateTimeWithOffset(date, "09:00", zone);
    assert.equal(timed, `${date}T09:00:00${isoOffset}`);
    assert.equal(new Date(timed).toISOString(), instant);
    assert.equal(formatCalendarUtcOffsetLabel(date, "09:00", zone), label);
  }
  assert.equal(
    formatCalendarDateTimeWithOffset("2026-08-08", "09:00"),
    "2026-08-08T09:00:00-06:00",
  );
});

test("archive eligibility crosses month, year and daylight-saving boundaries", () => {
  for (const [date, expected] of [
    ["2026-01-31", "2026-02-02T06:00:00.000Z"],
    ["2026-12-31", "2027-01-02T06:00:00.000Z"],
    ["2026-03-08", "2026-03-10T06:00:00.000Z"],
    ["2026-11-01", "2026-11-03T06:00:00.000Z"],
  ]) {
    assert.equal(
      calculateArchiveEligibleAt(date).toISOString(),
      expected,
      date,
    );
  }
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
