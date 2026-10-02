import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";
import { getEventInclusiveEndDate } from "./calendarEvents";

function formatCalendarDate(date: Date, language: Language) {
  return new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function formatEventDate(date: string, language: Language) {
  return formatCalendarDate(new Date(`${date}T00:00:00.000Z`), language);
}

export function getEventDateRangeLabels(
  event: CalendarEvent,
  language: Language = "es",
) {
  const { date } = event;
  const startDateLabel = formatEventDate(date, language);
  const endDateValue = getEventInclusiveEndDate(event);

  return {
    startDateLabel,
    endDateLabel: endDateValue
      ? formatEventDate(endDateValue, language)
      : undefined,
    endDateValue,
  };
}

export function getEventDateLabel(
  event: CalendarEvent,
  language: Language = "es",
) {
  const { startDateLabel, endDateLabel } = getEventDateRangeLabels(
    event,
    language,
  );
  return endDateLabel ? `${startDateLabel} - ${endDateLabel}` : startDateLabel;
}

export function formatEventTime(
  event: CalendarEvent,
  language: Language = "es",
) {
  const endDate = getEventInclusiveEndDate(event);
  if (endDate && endDate > event.date) {
    return language === "en" ? "Every day" : "Todos los días";
  }
  const { startTime, endTime } = event;
  if (!startTime) {
    return language === "en" ? "Time to be confirmed" : "Horario por confirmar";
  }
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

export function getLocationMapUrl(location: string) {
  const params = new URLSearchParams({ api: "1", query: location });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function formatGoogleCalendarDate(date: string, time?: string) {
  const dateValue = date.replace(/-/g, "");
  return time ? `${dateValue}T${time.replace(":", "")}00` : dateValue;
}

function getNextDay(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export function getGoogleCalendarUrl(event: CalendarEvent) {
  const endDate =
    event.endDate ?? (event.startTime ? event.date : getNextDay(event.date));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleCalendarDate(event.date, event.startTime)}/${formatGoogleCalendarDate(endDate, event.endTime)}`,
  });

  if (event.timeZone && event.startTime) params.set("ctz", event.timeZone);
  if (event.location) params.set("location", event.location);
  if (event.summary) params.set("details", event.summary);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getEventLocationName(location: string) {
  return location.split(",", 1)[0].trim();
}
