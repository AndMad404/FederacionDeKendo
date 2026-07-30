import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getEventEndDate } from "./calendarEvents";

export function getEventPath(event: CalendarEvent) {
  return `/eventos/${event.id}/`;
}

function findEventBySlug(slug: string) {
  return CALENDAR_EVENTS.find(
    (event) => event.id === slug || event.aliases?.includes(slug),
  );
}

export function findEventByPathname(pathname: string) {
  const match = pathname.match(/^\/eventos\/([^/]+)\/?$/);
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

export function getArchivePagePath(page: number) {
  return page <= 1
    ? "/eventos/pasados/"
    : `/eventos/pasados/pagina/${page}/`;
}

export function getArchivePageFromPathname(pathname: string) {
  if (/^\/eventos\/pasados\/?$/.test(pathname)) return 1;
  const match = pathname.match(/^\/eventos\/pasados\/pagina\/(\d+)\/?$/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}
