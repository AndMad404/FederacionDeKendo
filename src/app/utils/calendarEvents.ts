import type { CalendarEvent, CalendarEventType } from "../types";

const eventTypeKeywords: Array<[CalendarEventType, string[]]> = [
  ["Examen", ["examen"]],
  ["Torneo", ["torneo", "panamericano", "competencia"]],
  ["Seminario", ["seminario"]],
  ["Entrenamiento especial", ["entrenamiento especial"]],
  ["Actividad federativa", ["actividad federativa", "federativa"]],
];

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

function formatGoogleDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatGoogleDateTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formatGoogleDate(date)}T${hours}${minutes}00`;
}

function getEventStartDate(event: CalendarEvent) {
  return createLocalDate(event.date, event.startTime);
}

function getEventEndDate(event: CalendarEvent) {
  if (event.endTime) {
    return createLocalDate(event.date, event.endTime);
  }

  if (event.startTime) {
    return addHours(getEventStartDate(event), 1);
  }

  return addDays(createLocalDate(event.date), 1);
}

function getGoogleDateRange(event: CalendarEvent) {
  const startDate = getEventStartDate(event);

  if (!event.startTime) {
    return `${formatGoogleDate(startDate)}/${formatGoogleDate(getEventEndDate(event))}`;
  }

  return `${formatGoogleDateTime(startDate)}/${formatGoogleDateTime(
    getEventEndDate(event),
  )}`;
}

function buildEventDetails(event: CalendarEvent) {
  const details = [event.summary, event.organizer ? `Organiza: ${event.organizer}` : ""]
    .filter(Boolean)
    .join("\n\n");

  return details || undefined;
}

export function inferCalendarEventType(event: CalendarEvent): CalendarEventType {
  if (event.type) {
    return event.type;
  }

  const searchableText = `${event.title} ${event.summary ?? ""}`.toLowerCase();
  const match = eventTypeKeywords.find(([, keywords]) =>
    keywords.some((keyword) => searchableText.includes(keyword)),
  );

  return match?.[0] ?? "Actividad federativa";
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

export function buildGoogleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: getGoogleDateRange(event),
  });
  const details = buildEventDetails(event);

  if (details) {
    params.set("details", details);
  }

  if (event.location) {
    params.set("location", event.location);
  }

  if (event.timeZone) {
    params.set("ctz", event.timeZone);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
