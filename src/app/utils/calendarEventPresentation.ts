import type { CalendarEvent } from "../types";

const eventDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatCalendarDate(date: Date) {
  return eventDateFormatter.format(date).replace(".", "").toUpperCase();
}

function formatEventDate(date: string) {
  return formatCalendarDate(new Date(`${date}T00:00:00.000Z`));
}

function getInclusiveEndDateValue(date: string) {
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  return endDate.toISOString().slice(0, 10);
}

export function getEventDateRangeLabels({ date, endDate }: CalendarEvent) {
  const startDateLabel = formatEventDate(date);
  const endDateValue = endDate
    ? getInclusiveEndDateValue(endDate)
    : undefined;

  return {
    startDateLabel,
    endDateLabel: endDateValue ? formatEventDate(endDateValue) : undefined,
    endDateValue,
  };
}

export function getEventDateLabel(event: CalendarEvent) {
  const { startDateLabel, endDateLabel } = getEventDateRangeLabels(event);
  return endDateLabel
    ? `${startDateLabel} - ${endDateLabel}`
    : startDateLabel;
}

export function formatEventTime({ startTime, endTime }: CalendarEvent) {
  if (!startTime) return "Todo el día";
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

export function getLocationMapUrl(location: string) {
  const params = new URLSearchParams({ api: "1", query: location });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function getEventLocationName(location: string) {
  return location.split(",", 1)[0].trim();
}
