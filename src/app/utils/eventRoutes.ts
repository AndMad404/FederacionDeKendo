import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";
import { isPastEvent } from "./calendarEvents";
export { getArchivePagePath } from "./eventArchiveRoutes.js";

const EVENT_VANITY_SLUGS: Readonly<Record<string, string>> = {
  "2026-05-29-clak-seminario-instructores-chile": "2026-05-30-seminario",
  "2026-11-21-panama-5ta-copa-shogun-torneo-por-equipos-y-seminario":
    "2026-11-21-panama-torneo-por-equipos",
};

export function getEventPublicSlug(event: Pick<CalendarEvent, "id">) {
  return EVENT_VANITY_SLUGS[event.id] ?? event.id;
}

export function getEventPath(
  event: CalendarEvent,
  language: Language = "es",
  now = new Date(),
) {
  const archived = isPastEvent(event, now);
  const slug = getEventPublicSlug(event);

  if (language === "en") {
    return archived ? `/en/events/past/${slug}/` : `/en/events/${slug}/`;
  }

  return archived ? `/eventos/pasados/${slug}/` : `/eventos/${slug}/`;
}

function findEventBySlug(slug: string) {
  return CALENDAR_EVENTS.find(
    (event) =>
      event.id === slug ||
      getEventPublicSlug(event) === slug ||
      event.aliases?.includes(slug),
  );
}

export function findEventByPathname(pathname: string) {
  const archivedMatch = pathname.match(
    /^\/(?:eventos\/pasados|en\/events\/past)\/([^/]+)\/?$/,
  );
  if (archivedMatch) {
    const event = findEventBySlug(decodeURIComponent(archivedMatch[1]));
    return event && isPastEvent(event) ? event : undefined;
  }

  const currentMatch = pathname.match(/^\/(?:eventos|en\/events)\/([^/]+)\/?$/);
  if (!currentMatch) return undefined;

  return findEventBySlug(decodeURIComponent(currentMatch[1]));
}

export function getPastEvents(now = new Date()) {
  return [...CALENDAR_EVENTS]
    .filter((event) => isPastEvent(event, now))
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.startTime ?? "00:00"}`).getTime() -
        new Date(`${a.date}T${a.startTime ?? "00:00"}`).getTime(),
    );
}

export function getArchivePageFromPathname(pathname: string) {
  if (/^\/(?:eventos\/pasados|en\/events\/past)\/?$/.test(pathname)) return 1;
  const match = pathname.match(
    /^\/(?:eventos\/pasados\/pagina|en\/events\/past\/page)\/(\d+)\/?$/,
  );
  return match ? Number.parseInt(match[1], 10) : undefined;
}
