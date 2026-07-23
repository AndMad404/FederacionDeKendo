import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getUpcomingEventGroups } from "../utils/calendarEvents";
import {
  formatEventTime,
  getEventDateLabel,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";
import { EventDetailModal } from "./EventDetailModal";
import { PageTitle } from "./PageTitle";

const eventsPerPage = 4;
const calendarImageVersion = "v=20260723-1004";
const highPriorityImageProps = { fetchpriority: "high" } as const;
const monthFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const controlClass = `inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-site-action/70 bg-site-overlay/70 text-site-on-dark transition enabled:hover:bg-site-action-hover/90 disabled:cursor-not-allowed disabled:opacity-35 ${focusRingClass}`;
const eventGridClassByCount: Record<number, string> = {
  1: "max-w-sm sm:grid-cols-1 lg:grid-cols-1",
  2: "max-w-2xl sm:grid-cols-2 lg:grid-cols-2",
  3: "max-w-4xl sm:grid-cols-2 lg:grid-cols-3",
  4: "max-w-6xl sm:grid-cols-2 lg:grid-cols-4",
};
const contentPanelClassByCount: Record<number, string> = {
  1: "max-w-lg",
  2: "max-w-4xl",
  3: "max-w-5xl",
  4: "max-w-6xl",
};

function CalendarBackdrop() {
  return (
    <picture className="absolute inset-0 h-full w-full" aria-hidden="true">
      <source
        srcSet={`/images/calendar/kendo-calendar-480.webp?${calendarImageVersion} 480w, /images/calendar/kendo-calendar-960.webp?${calendarImageVersion} 960w, /images/calendar/kendo-calendar-1600.webp?${calendarImageVersion} 1600w`}
        sizes="100vw"
        type="image/webp"
      />
      <img
        src={`/images/calendar/kendo-calendar-1600.webp?${calendarImageVersion}`}
        alt=""
        width={1600}
        height={1069}
        className="h-full w-full object-cover object-center"
        loading="eager"
        {...highPriorityImageProps}
      />
    </picture>
  );
}

function CalendarBanner() {
  return (
    <div className="relative z-10 h-24 shrink-0 overflow-hidden sm:h-28 land-sm:h-16 tall-md:h-24">
      <PageTitle
        id="calendar-title"
        className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 land-compact:top-2"
      >
        Calendario de eventos
      </PageTitle>
    </div>
  );
}

function formatMonth(monthKey: string) {
  const label = monthFormatter.format(
    new Date(`${monthKey}-01T00:00:00.000Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CalendarSection() {
  const eventGroups = getUpcomingEventGroups(CALENDAR_EVENTS);
  const [groupIndex, setGroupIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function syncEventFromHash() {
      let eventId = "";

      try {
        eventId = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        eventId = window.location.hash.slice(1);
      }

      const matchingGroupIndex = eventGroups.findIndex((group) =>
        group.events.some((event) => event.id === eventId),
      );

      if (matchingGroupIndex === -1) {
        setSelectedEvent(null);
        return;
      }

      const matchingGroup = eventGroups[matchingGroupIndex];
      const matchingEventIndex = matchingGroup.events.findIndex(
        (event) => event.id === eventId,
      );
      setGroupIndex(matchingGroupIndex);
      setPageIndex(Math.floor(matchingEventIndex / eventsPerPage));
      setSelectedEvent(matchingGroup.events[matchingEventIndex]);
    }

    syncEventFromHash();
    window.addEventListener("hashchange", syncEventFromHash);
    window.addEventListener("popstate", syncEventFromHash);

    return () => {
      window.removeEventListener("hashchange", syncEventFromHash);
      window.removeEventListener("popstate", syncEventFromHash);
    };
  }, []);

  function openEvent(event: CalendarEvent, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setSelectedEvent(event);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${encodeURIComponent(event.id)}`,
    );
  }

  function closeEvent() {
    setSelectedEvent(null);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }

  if (eventGroups.length === 0) {
    return (
      <section
        aria-labelledby="calendar-title"
        className="relative flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-3xl bg-site-canvas text-site-on-dark land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-full tall-md:min-h-0"
      >
        <CalendarBackdrop />
        <CalendarBanner />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4">
          <p className={`rounded-lg px-6 py-5 text-center text-lg ${panelSurfaceClass}`}>
            No hay próximos eventos publicados.
          </p>
        </div>
      </section>
    );
  }

  const currentGroup = eventGroups[groupIndex];
  const pageCount = Math.ceil(currentGroup.events.length / eventsPerPage);
  const visibleEvents = currentGroup.events.slice(
    pageIndex * eventsPerPage,
    (pageIndex + 1) * eventsPerPage,
  );
  function changeMonth(nextIndex: number) {
    setGroupIndex(nextIndex);
    setPageIndex(0);
  }

  return (
    <>
      <section
        aria-labelledby="calendar-title"
        className="relative flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-3xl bg-site-canvas text-site-on-dark land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-full tall-md:min-h-0"
      >
        <CalendarBackdrop />
        <CalendarBanner />
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-3 sm:p-4 land-sm:p-2">
          <div
            className={`flex w-full flex-col justify-center gap-3 rounded-3xl p-4 text-center backdrop-blur-[2px] sm:px-6 land-sm:gap-2 land-sm:px-3 land-sm:py-2 ${contentPanelClassByCount[visibleEvents.length]} ${panelSurfaceClass}`}
          >
        <nav
          aria-label="Navegación por mes"
          className="flex items-center justify-center gap-4"
        >
        <button
          type="button"
          className={controlClass}
          aria-label="Ver mes anterior"
          disabled={groupIndex === 0}
          onClick={() => changeMonth(groupIndex - 1)}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <h2
          className="min-w-0 flex-1 text-center text-xl font-bold capitalize sm:flex-none sm:min-w-56"
          aria-live="polite"
        >
          {formatMonth(currentGroup.monthKey)}
        </h2>
        <button
          type="button"
          className={controlClass}
          aria-label="Ver mes siguiente"
          disabled={groupIndex === eventGroups.length - 1}
          onClick={() => changeMonth(groupIndex + 1)}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
        </nav>

        <ul
          className={`mx-auto grid w-full gap-3 lg:gap-2 ${eventGridClassByCount[visibleEvents.length]}`}
        >
        {visibleEvents.map((event) => {
          const eventDateLabel = getEventDateLabel(event);
          const locationUrl = event.location
            ? getLocationMapUrl(event.location)
            : undefined;
          const locationDescriptionId = `${event.id}-calendar-location`;

          return (
            <li
              key={event.id}
              className="relative flex min-h-40 flex-col items-center justify-around gap-2 rounded-lg border border-site-action/70 bg-site-on-dark/[0.06] p-3 text-center transition-colors hover:bg-site-on-dark/[0.1] lg:p-2"
            >
              <button
                type="button"
                aria-label={`Ver detalle de ${event.title}`}
                onClick={(clickEvent) =>
                  openEvent(event, clickEvent.currentTarget)
                }
                className={`absolute inset-0 rounded-lg ${focusRingClass}`}
              />
              <h3 className="text-base font-bold leading-tight">
                {event.title}
              </h3>
              <time
                dateTime={event.date}
                aria-label={eventDateLabel}
                className="rounded-md bg-site-on-dark/10 px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action-text lg:px-2 lg:py-1.5"
              >
                {eventDateLabel}
              </time>
              <p className="text-sm leading-tight text-site-on-dark/75">
                {formatEventTime(event)}
              </p>
              {locationUrl ? (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir ubicación de ${event.title} en Google Maps`}
                  aria-describedby={locationDescriptionId}
                  className={`relative z-10 inline-flex min-h-11 items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-site-action-hover/90 hover:text-site-on-dark lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
                >
                  <MapPin
                    className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
                    aria-hidden="true"
                  />
                  Ver ubicación
                  <span id={locationDescriptionId} className="sr-only">
                    Dirección: {event.location}. Abre Google Maps en una pestaña
                    nueva.
                  </span>
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-site-on-dark/20 bg-site-overlay/70 px-3 py-1.5 text-sm font-semibold text-site-on-dark/65 lg:min-h-8 lg:px-2.5 lg:py-1">
                  Pendiente de confirmar
                </span>
              )}
            </li>
          );
        })}
        </ul>

        {pageCount > 1 ? (
          <nav
            aria-label="Paginación de eventos del mes"
            className="flex min-h-11 items-center justify-center gap-4"
          >
            <button
              type="button"
              className={controlClass}
              aria-label="Ver eventos anteriores del mes"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex(pageIndex - 1)}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <p
              className="min-w-24 text-center text-sm font-semibold"
              aria-live="polite"
            >
              Página {pageIndex + 1} de {pageCount}
            </p>
            <button
              type="button"
              className={controlClass}
              aria-label="Ver más eventos del mes"
              disabled={pageIndex === pageCount - 1}
              onClick={() => setPageIndex(pageIndex + 1)}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </nav>
        ) : null}
          </div>
        </div>
      </section>
      {selectedEvent ? (
        <EventDetailModal
          event={selectedEvent}
          triggerRef={triggerRef}
          onClose={closeEvent}
        />
      ) : null}
    </>
  );
}
