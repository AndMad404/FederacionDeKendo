import type { CalendarEvent } from "../types";
import { addCalendarDays } from "./calendarDate.js";

export interface UpcomingEventGroup {
  monthKey: string;
  events: CalendarEvent[];
}

const DEFAULT_EVENT_TIME_ZONE = "America/Costa_Rica";

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

function parseTimeParts(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return { hours, minutes };
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
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

function createEventDate(
  date: string,
  time = "00:00",
  timeZone = DEFAULT_EVENT_TIME_ZONE,
) {
  const { year, month, day } = parseDateParts(date);
  const { hours, minutes } = parseTimeParts(time);
  const approximate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const firstOffset = getTimeZoneOffsetMilliseconds(approximate, timeZone);
  let instant = new Date(approximate.getTime() - firstOffset);
  const finalOffset = getTimeZoneOffsetMilliseconds(instant, timeZone);
  if (finalOffset !== firstOffset) {
    instant = new Date(approximate.getTime() - finalOffset);
  }

  return instant;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function getEventStartDate(event: CalendarEvent) {
  return createEventDate(event.date, event.startTime, event.timeZone);
}

export function getEventEndDate(event: CalendarEvent) {
  if (event.endDate) {
    return createEventDate(event.endDate, event.endTime, event.timeZone);
  }

  if (event.endTime) {
    return createEventDate(event.date, event.endTime, event.timeZone);
  }

  if (event.startTime) {
    return addHours(getEventStartDate(event), 1);
  }

  return createEventDate(
    addCalendarDays(event.date, 1),
    undefined,
    event.timeZone,
  );
}

export function getUpcomingEvents(
  events: readonly CalendarEvent[],
  now = new Date(),
  max = 4,
) {
  return [...events]
    .filter((event) => getEventEndDate(event) > now)
    .sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime(),
    )
    .slice(0, max);
}

export function getUpcomingEventGroups(
  events: readonly CalendarEvent[],
  now = new Date(),
) {
  return getUpcomingEvents(events, now, events.length).reduce<
    UpcomingEventGroup[]
  >((groups, event) => {
    const monthKey = event.date.slice(0, 7);
    const currentGroup = groups[groups.length - 1];

    if (currentGroup?.monthKey === monthKey) {
      currentGroup.events.push(event);
      return groups;
    }

    groups.push({ monthKey, events: [event] });
    return groups;
  }, []);
}
