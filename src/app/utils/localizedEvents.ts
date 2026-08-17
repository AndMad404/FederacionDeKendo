import type { Language } from "../config/i18n";
import { EVENT_TRANSLATIONS } from "../data/eventTranslations";
import type { CalendarEvent } from "../types";

export type EventTranslationStatus = "valid" | "missing" | "stale";

export function getEventTranslationStatus(
  event: CalendarEvent,
): EventTranslationStatus {
  const record = EVENT_TRANSLATIONS[event.id];
  if (!record) return "missing";
  return record.source.title === event.title &&
    record.source.summary === event.summary
    ? "valid"
    : "stale";
}

export function getLocalizedEvent(
  event: CalendarEvent,
  language: Language,
): CalendarEvent | undefined {
  if (language === "es") return event;
  if (getEventTranslationStatus(event) !== "valid") return undefined;

  const translation = EVENT_TRANSLATIONS[event.id].translation;
  return {
    ...event,
    title: translation.title,
    summary: translation.summary,
  };
}

export function getLocalizedEvents(
  events: CalendarEvent[],
  language: Language,
) {
  return events.flatMap((event) => {
    const localizedEvent = getLocalizedEvent(event, language);
    return localizedEvent ? [localizedEvent] : [];
  });
}
