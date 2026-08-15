function parseDateParts(date) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function parseTimeParts(time = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Adds calendar days to an ISO date without consulting the host time zone.
 */
export function addCalendarDays(date, days) {
  const { year, month, day } = parseDateParts(date);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/**
 * Produces a stable chronological key for calendar wall-clock values.
 */
export function getCalendarDateTimeSortKey(date, time) {
  const { year, month, day } = parseDateParts(date);
  const { hours, minutes } = parseTimeParts(time);
  return Date.UTC(year, month - 1, day, hours, minutes);
}
