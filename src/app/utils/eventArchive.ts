import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";
export type ArchiveEventType = "torneo" | "examen" | "seminario" | "evento";
export interface ArchiveFilters {
  year?: string;
  type?: ArchiveEventType;
}
import {
  DEFAULT_EVENT_TIME_ZONE as ARCHIVE_TIME_ZONE,
  resolveCalendarInstant,
} from "./calendarDate.ts";
import { getArchivePagePath } from "./eventArchiveRoutes.ts";
export { getArchivePageNumber } from "./eventArchiveRoutes.ts";

const ARCHIVE_EVENT_TYPES = new Set([
  "torneo",
  "examen",
  "seminario",
  "evento",
]);

function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid event date: ${date}`);

  return match.slice(1).map(Number);
}

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = parseDate(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return [
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  ];
}

function localMidnightToInstant(parts: number[], timeZone: string) {
  const [year, month, day] = parts;
  const approximate = new Date(Date.UTC(year, month - 1, day));
  return resolveCalendarInstant(approximate, timeZone);
}

export function calculateArchiveEligibleAt(
  lastEventDate: string,
  timeZone: string = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 2), timeZone);
}

export function calculatePublicPastAt(
  lastEventDate: string,
  timeZone: string = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 1), timeZone);
}

export function calculateGalleryCheckAt(
  lastEventDate: string,
  timeZone: string = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 1), timeZone);
}

export function calculateGalleryDeadlineAt(
  lastEventDate: string,
  timeZone: string = ARCHIVE_TIME_ZONE,
) {
  return localMidnightToInstant(addCalendarDays(lastEventDate, 2), timeZone);
}

export function getArchiveEligibleAt(event: Omit<CalendarEvent, "id">) {
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

export function isArchiveEligible(
  event: Omit<CalendarEvent, "id">,
  now: Date = new Date(),
) {
  return getArchiveEligibleAt(event).getTime() <= now.getTime();
}

export function normalizeArchiveFilters(
  filters: ArchiveFilters | Record<string, string | undefined>,
): ArchiveFilters {
  const normalized: ArchiveFilters = {};
  if (/^\d{4}$/.test(filters.year ?? "")) normalized.year = filters.year;
  if (filters.type && ARCHIVE_EVENT_TYPES.has(filters.type))
    normalized.type = filters.type as ArchiveEventType;
  return normalized;
}

export function filterAndSortArchiveEvents(
  events: CalendarEvent[],
  filters: ArchiveFilters | Record<string, string | undefined>,
) {
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

export function getArchiveYears(events: CalendarEvent[]) {
  return [...new Set(events.map((event) => event.date.slice(0, 4)))].sort(
    (a, b) => Number(b) - Number(a),
  );
}

export function buildArchiveUrl(
  page: number,
  language: Language = "es",
  filters: ArchiveFilters = {},
) {
  const normalized = normalizeArchiveFilters(filters);
  const basePath = getArchivePagePath(page, language);
  const search = new URLSearchParams(Object.entries(normalized)).toString();
  return search ? `${basePath}?${search}` : basePath;
}
