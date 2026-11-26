import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import type { Language } from "../config/i18n";
import { isPastEvent } from "./calendarEvents";
import { hasDistinctEventTranslation } from "./localizedEvents";

export const EVENT_PATHS = {
  es: { current: "/eventos/", archived: "/eventos/pasados/" },
  en: { current: "/en/events/", archived: "/en/events/past/" },
} as const;

export function isArchivedEventPath(pathname: string) {
  return (
    pathname.startsWith(EVENT_PATHS.es.archived) ||
    pathname.startsWith(EVENT_PATHS.en.archived)
  );
}

export function getEventSlugFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return undefined;
  const slug = pathname.slice(prefix.length).replace(/\/$/, "");
  return slug && !slug.includes("/") ? slug : undefined;
}

const EVENT_VANITY_SLUGS: Readonly<Record<string, string>> = {
  "2026-05-29-clak-seminario-instructores-chile": "2026-05-30-seminario",
};

const EVENT_LOCALIZED_SLUGS: Readonly<
  Record<string, Readonly<Record<Language, string>>>
> = {
  "clak-1er-panamericano-brasil": {
    es: "1er-panamericano-de-kendo",
    en: "1st-pan-american-kendo",
  },
};

export function getEventPublicSlug(
  event: Pick<CalendarEvent, "id">,
  language: Language = "es",
) {
  return (
    EVENT_LOCALIZED_SLUGS[event.id]?.[language] ??
    EVENT_VANITY_SLUGS[event.id] ??
    event.id
  );
}

export function getEventLegacySlugs(
  event: Pick<CalendarEvent, "id" | "aliases">,
) {
  return [
    ...new Set([
      ...(event.aliases ?? []),
      ...[event.id, ...(event.aliases ?? [])]
        .map((slug) => EVENT_VANITY_SLUGS[slug])
        .filter((slug): slug is string => Boolean(slug)),
    ]),
  ];
}

export function getEventPath(
  event: CalendarEvent,
  language: Language = "es",
  now = new Date(),
) {
  const archived = isPastEvent(event, now);
  const publishEnglishRoute =
    language === "en" && hasDistinctEventTranslation(event);
  const routeLanguage = publishEnglishRoute ? "en" : "es";
  const slug = getEventPublicSlug(event, routeLanguage);
  const paths = EVENT_PATHS[routeLanguage];
  return `${archived ? paths.archived : paths.current}${slug}/`;
}

function findEventBySlug(slug: string) {
  return CALENDAR_EVENTS.find(
    (event) =>
      event.id === slug ||
      getEventPublicSlug(event) === slug ||
      getEventPublicSlug(event, "en") === slug ||
      getEventLegacySlugs(event).includes(slug),
  );
}

export function findEventByPathname(pathname: string) {
  const archivedSlug =
    getEventSlugFromPath(pathname, EVENT_PATHS.es.archived) ??
    getEventSlugFromPath(pathname, EVENT_PATHS.en.archived);
  if (archivedSlug) {
    const event = findEventBySlug(decodeURIComponent(archivedSlug));
    return event && isPastEvent(event) ? event : undefined;
  }

  const currentSlug =
    getEventSlugFromPath(pathname, EVENT_PATHS.es.current) ??
    getEventSlugFromPath(pathname, EVENT_PATHS.en.current);
  return currentSlug
    ? findEventBySlug(decodeURIComponent(currentSlug))
    : undefined;
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
