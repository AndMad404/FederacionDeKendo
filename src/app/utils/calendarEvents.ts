import type { CalendarEvent } from "../types";
import { addCalendarDays, createEventDate } from "./calendarDate.ts";
import { calculatePublicPastAt } from "./eventArchive.ts";

export interface UpcomingEventGroup {
  monthKey: string;
  events: CalendarEvent[];
}

const EXTERNAL_EVENT_MARKER = /(?:^|\s)#EventoExterno\b/iu;

export function isExternalEvent(event: {
  summary?: string;
  external?: boolean;
}) {
  return (
    event.external === true || EXTERNAL_EVENT_MARKER.test(event.summary ?? "")
  );
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

export function getEventInclusiveEndDate(
  event: Pick<CalendarEvent, "endDate" | "startTime" | "endTime">,
) {
  if (!event.endDate) return undefined;

  return !event.startTime && !event.endTime
    ? addCalendarDays(event.endDate, -1)
    : event.endDate;
}

export function isPastEvent(event: CalendarEvent, now = new Date()) {
  const lastEventDate = getEventInclusiveEndDate(event) ?? event.date;
  return (
    calculatePublicPastAt(lastEventDate, event.timeZone).getTime() <=
    now.getTime()
  );
}

function isUpcomingEvent(event: CalendarEvent, now = new Date()) {
  return getEventEndDate(event).getTime() > now.getTime();
}

export function getUpcomingEvents(
  events: readonly CalendarEvent[],
  now = new Date(),
  max = 4,
) {
  return [...events]
    .filter((event) => isUpcomingEvent(event, now))
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
