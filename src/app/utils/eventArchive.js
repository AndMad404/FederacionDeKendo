import { getArchivePagePath } from "./eventArchiveRoutes.js";

const ARCHIVE_TIME_ZONE = "America/Costa_Rica";
const ARCHIVE_EVENT_TYPES = new Set([
  "torneo",
  "examen",
  "seminario",
  "evento",
]);

function parseDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid event date: ${date}`);

  return match.slice(1).map(Number);
}

function addCalendarDays(date, days) {
  const [year, month, day] = parseDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return [
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  ];
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
  return localMidnightToInstant(addCalendarDays(lastEventDate, 2), timeZone);
}

export function calculatePublicPastAt(
  lastEventDate,
  timeZone = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 1), timeZone);
}

export function calculateGalleryCheckAt(
  lastEventDate,
  timeZone = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 1), timeZone);
}

export function calculateGalleryDeadlineAt(
  lastEventDate,
  timeZone = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 2), timeZone);
}

export function getArchiveEligibleAt(event) {
  const fallbackLastEventDate =
    event.endDate && !event.startTime && !event.endTime
      ? addCalendarDays(event.endDate, -1)
          .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
          .join("-")
      : (event.endDate ?? event.date);
  return event.archiveEligibleAt
    ? new Date(event.archiveEligibleAt)
    : calculateArchiveEligibleAt(fallbackLastEventDate, ARCHIVE_TIME_ZONE);
}

export function isArchiveEligible(event, now = new Date()) {
  return getArchiveEligibleAt(event).getTime() <= now.getTime();
}

export function normalizeArchiveFilters(filters) {
  const normalized = {};
  if (/^\d{4}$/.test(filters.year ?? "")) normalized.year = filters.year;
  if (ARCHIVE_EVENT_TYPES.has(filters.type)) normalized.type = filters.type;
  return normalized;
}

export function filterAndSortArchiveEvents(events, filters) {
  const normalized = normalizeArchiveFilters(filters);
  return [...events]
    .filter(
      (event) =>
        !normalized.year || event.date.startsWith(`${normalized.year}-`),
    )
    .filter((event) => !normalized.type || event.eventType === normalized.type)
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.startTime ?? "00:00"}`).getTime() -
        new Date(`${a.date}T${a.startTime ?? "00:00"}`).getTime(),
    );
}

export function getArchiveYears(events) {
  return [...new Set(events.map((event) => event.date.slice(0, 4)))].sort(
    (a, b) => Number(b) - Number(a),
  );
}

export function buildArchiveUrl(page, language = "es", filters = {}) {
  const normalized = normalizeArchiveFilters(filters);
  const basePath = getArchivePagePath(page, language);
  const search = new URLSearchParams(normalized).toString();
  return search ? `${basePath}?${search}` : basePath;
}
