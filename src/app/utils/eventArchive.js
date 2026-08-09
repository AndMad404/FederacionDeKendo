const ARCHIVE_TIME_ZONE = "America/Costa_Rica";

function parseDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid event date: ${date}`);

  return match.slice(1).map(Number);
}

function addCalendarDays(date, days) {
  const [year, month, day] = parseDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return [result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate()];
}

function getTimeZoneOffsetMilliseconds(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - date.getTime();
}

function localMidnightToInstant(parts, timeZone) {
  const [year, month, day] = parts;
  const approximate = new Date(Date.UTC(year, month - 1, day));
  const firstOffset = getTimeZoneOffsetMilliseconds(approximate, timeZone);
  let instant = new Date(approximate.getTime() - firstOffset);
  const finalOffset = getTimeZoneOffsetMilliseconds(instant, timeZone);
  if (finalOffset !== firstOffset) {
    instant = new Date(approximate.getTime() - finalOffset);
  }
  return instant;
}

export function calculateArchiveEligibleAt(
  lastEventDate,
  timeZone = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 3), timeZone);
}

export function getArchiveEligibleAt(event) {
  const fallbackLastEventDate =
    event.endDate && !event.startTime && !event.endTime
      ? addCalendarDays(event.endDate, -1)
          .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
          .join("-")
      : event.endDate ?? event.date;
  return event.archiveEligibleAt
    ? new Date(event.archiveEligibleAt)
    : calculateArchiveEligibleAt(fallbackLastEventDate, ARCHIVE_TIME_ZONE);
}

export function isArchiveEligible(event, now = new Date()) {
  return getArchiveEligibleAt(event).getTime() <= now.getTime();
}
