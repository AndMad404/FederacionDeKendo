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

function normalizeComparableContent(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function hasDistinctEventTranslation(event: CalendarEvent) {
  if (getEventTranslationStatus(event) !== "valid") return false;

  const translation = EVENT_TRANSLATIONS[event.id].translation;
  return (
    normalizeComparableContent(translation.title) !==
      normalizeComparableContent(event.title) ||
    normalizeComparableContent(translation.summary) !==
      normalizeComparableContent(event.summary)
  );
}

export function getLocalizedEvent(
  event: CalendarEvent,
  language: Language,
): CalendarEvent | undefined {
  if (language === "es") return event;
  // English listings remain complete while editorial translations are paused.
  // Route publication separately requires distinct English content so this
  // fallback cannot create a duplicate indexable event page.
  if (getEventTranslationStatus(event) !== "valid") return event;

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
