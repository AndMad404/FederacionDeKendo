export const DEFAULT_EVENT_TIME_ZONE = "America/Costa_Rica";

export function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function parseTimeParts(time: string = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Adds calendar days to an ISO date without consulting the host time zone.
 */
export function addCalendarDays(date: string, days: number) {
  const { year, month, day } = parseDateParts(date);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/**
 * Produces a stable chronological key for calendar wall-clock values.
 */
export function getCalendarDateTimeSortKey(
  date: string,
  time: string | undefined,
) {
  const { year, month, day } = parseDateParts(date);
  const { hours, minutes } = parseTimeParts(time);
  return Date.UTC(year, month - 1, day, hours, minutes);
}

export function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
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
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
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

export function resolveCalendarInstant(approximate: Date, timeZone: string) {
  const firstOffset = getTimeZoneOffsetMilliseconds(approximate, timeZone);
  let instant = new Date(approximate.getTime() - firstOffset);
  const finalOffset = getTimeZoneOffsetMilliseconds(instant, timeZone);
  if (finalOffset !== firstOffset) {
    instant = new Date(approximate.getTime() - finalOffset);
  }
  return instant;
}

export function createEventDate(
  date: string,
  time = "00:00",
  timeZone = DEFAULT_EVENT_TIME_ZONE,
) {
  const approximate = new Date(getCalendarDateTimeSortKey(date, time));
  return resolveCalendarInstant(approximate, timeZone);
}

function formatCalendarUtcOffset(
  date: string,
  time: string,
  timeZone = DEFAULT_EVENT_TIME_ZONE,
) {
  const instant = createEventDate(date, time, timeZone);
  const offsetMinutes = Math.round(
    getTimeZoneOffsetMilliseconds(instant, timeZone) / 60000,
  );
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

export function formatCalendarDateTimeWithOffset(
  date: string,
  time: string,
  timeZone?: string,
) {
  return `${date}T${time}:00${formatCalendarUtcOffset(date, time, timeZone)}`;
}

export function formatCalendarUtcOffsetLabel(
  date: string,
  time: string,
  timeZone?: string,
) {
  const offset = formatCalendarUtcOffset(date, time, timeZone);
  if (offset === "+00:00") return "UTC";
  const [hours, minutes] = offset.slice(1).split(":");
  const sign = offset.startsWith("-") ? "−" : "+";
  return `UTC${sign}${Number(hours)}${minutes === "00" ? "" : `:${minutes}`}`;
}
