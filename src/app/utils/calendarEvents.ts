import type { CalendarEvent } from "../types";

export interface UpcomingEventGroup {
  monthKey: string;
  events: CalendarEvent[];
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

function parseTimeParts(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return { hours, minutes };
}

function createLocalDate(date: string, time = "00:00") {
  const { year, month, day } = parseDateParts(date);
  const { hours, minutes } = parseTimeParts(time);

  return new Date(year, month - 1, day, hours, minutes);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addHours(date: Date, hours: number) {
  const nextDate = new Date(date);
  nextDate.setHours(nextDate.getHours() + hours);

  return nextDate;
}

function getEventStartDate(event: CalendarEvent) {
  return createLocalDate(event.date, event.startTime);
}

function getEventEndDate(event: CalendarEvent) {
  if (event.endDate) {
    return createLocalDate(event.endDate, event.endTime);
  }

  if (event.endTime) {
    return createLocalDate(event.date, event.endTime);
  }

  if (event.startTime) {
    return addHours(getEventStartDate(event), 1);
  }

  return addDays(createLocalDate(event.date), 1);
}

export function getUpcomingEvents(
  events: readonly CalendarEvent[],
  now = new Date(),
  max = 4,
) {
  return [...events]
    .filter((event) => getEventEndDate(event) >= now)
    .sort((a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime())
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
