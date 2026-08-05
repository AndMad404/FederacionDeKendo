import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getEventEndDate } from "./calendarEvents";
import type { Language } from "../config/i18n";

export function getEventPath(event: CalendarEvent, language: Language = "es") {
  return language === "en"
    ? `/en/events/${event.id}/`
    : `/eventos/${event.id}/`;
}

function findEventBySlug(slug: string) {
  return CALENDAR_EVENTS.find(
    (event) => event.id === slug || event.aliases?.includes(slug),
  );
}

export function findEventByPathname(pathname: string) {
  const match = pathname.match(/^\/(?:eventos|en\/events)\/([^/]+)\/?$/);
  return match ? findEventBySlug(decodeURIComponent(match[1])) : undefined;
}

export function getPastEvents(now = new Date()) {
  return [...CALENDAR_EVENTS]
    .filter((event) => getEventEndDate(event).getTime() < now.getTime())
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.startTime ?? "00:00"}`).getTime() -
        new Date(`${a.date}T${a.startTime ?? "00:00"}`).getTime(),
    );
}

export function getArchivePagePath(page: number, language: Language = "es") {
  if (language === "en") {
    return page <= 1
      ? "/en/events/past/"
      : `/en/events/past/page/${page}/`;
  }

  return page <= 1 ? "/eventos/pasados/" : `/eventos/pasados/pagina/${page}/`;
}

export function getArchivePageFromPathname(pathname: string) {
  if (/^\/(?:eventos\/pasados|en\/events\/past)\/?$/.test(pathname)) return 1;
  const match = pathname.match(
    /^\/(?:eventos\/pasados\/pagina|en\/events\/past\/page)\/(\d+)\/?$/,
  );
  return match ? Number.parseInt(match[1], 10) : undefined;
}
