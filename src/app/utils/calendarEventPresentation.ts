import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";

function formatCalendarDate(date: Date, language: Language) {
  return new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date).replace(".", "").toUpperCase();
}

function formatEventDate(date: string, language: Language) {
  return formatCalendarDate(new Date(`${date}T00:00:00.000Z`), language);
}

function getInclusiveEndDateValue(date: string) {
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  return endDate.toISOString().slice(0, 10);
}

export function getEventDateRangeLabels(
  { date, endDate }: CalendarEvent,
  language: Language = "es",
) {
  const startDateLabel = formatEventDate(date, language);
  const endDateValue = endDate
    ? getInclusiveEndDateValue(endDate)
    : undefined;

  return {
    startDateLabel,
    endDateLabel: endDateValue ? formatEventDate(endDateValue, language) : undefined,
    endDateValue,
  };
}

export function getEventDateLabel(event: CalendarEvent, language: Language = "es") {
  const { startDateLabel, endDateLabel } = getEventDateRangeLabels(event, language);
  return endDateLabel
    ? `${startDateLabel} - ${endDateLabel}`
    : startDateLabel;
}

export function formatEventTime(
  { startTime, endTime }: CalendarEvent,
  language: Language = "es",
) {
  if (!startTime) return language === "en" ? "All day" : "Todo el día";
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

export function getLocationMapUrl(location: string) {
  const params = new URLSearchParams({ api: "1", query: location });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function getEventLocationName(location: string) {
  return location.split(",", 1)[0].trim();
}
