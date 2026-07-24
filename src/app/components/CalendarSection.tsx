import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Share2,
} from "lucide-react";
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
const monthSwipeThreshold = 48;
const calendarImageVersion = "v=20260723-1004";
const highPriorityImageProps = { fetchpriority: "high" } as const;
const monthFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const controlClass = `inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-site-action/70 bg-site-overlay/70 text-site-on-dark transition enabled:hover:bg-site-action-hover/90 disabled:cursor-not-allowed disabled:opacity-35 ${focusRingClass}`;
const eventGridClassByCount: Record<number, string> = {
  1: "max-w-sm sm:grid-cols-1 lg:grid-cols-1",
  2: "max-w-7xl sm:grid-cols-2 lg:grid-cols-2",
  3: "max-w-7xl sm:grid-cols-2 lg:grid-cols-3",
  4: "max-w-7xl sm:grid-cols-2 lg:grid-cols-4",
};
const contentPanelClassByCount: Record<number, string> = {
  1: "max-w-lg",
  2: "max-w-7xl xl:max-w-[77rem]",
  3: "max-w-7xl xl:max-w-[77rem]",
  4: "max-w-7xl xl:max-w-[77rem]",
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
    <div className="relative z-10 h-16 shrink-0 overflow-hidden">
      <PageTitle
        id="calendar-title"
        placement="floating"
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

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.className = "fixed -left-[9999px] top-0 opacity-0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("The event URL could not be copied.");
  }
}

export function CalendarSection() {
  const eventGroups = getUpcomingEventGroups(CALENDAR_EVENTS);
  const allEvents = eventGroups.flatMap((group) => group.events);
  const [groupIndex, setGroupIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const shareFeedbackTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const suppressSwipeClickRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

  function openEvent(event: CalendarEvent, trigger: HTMLElement) {
    triggerRef.current = trigger;
    selectEvent(event);
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${encodeURIComponent(event.id)}`,
    );
  }

  function closeEvent() {
    if (selectedEvent) {
      triggerRef.current = document.querySelector<HTMLElement>(
        `[data-calendar-event-id="${selectedEvent.id}"]`,
      );
    }

    setSelectedEvent(null);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }

  function selectEvent(event: CalendarEvent) {
    const nextGroupIndex = eventGroups.findIndex((group) =>
      group.events.some((groupEvent) => groupEvent.id === event.id),
    );
    const nextEventIndex = eventGroups[nextGroupIndex]?.events.findIndex(
      (groupEvent) => groupEvent.id === event.id,
    );

    if (nextGroupIndex !== -1 && nextEventIndex !== undefined) {
      setGroupIndex(nextGroupIndex);
      setPageIndex(Math.floor(nextEventIndex / eventsPerPage));
    }

    setSelectedEvent(event);
  }

  function navigateSelectedEvent(direction: -1 | 1) {
    if (!selectedEvent || allEvents.length < 2) return;

    const currentIndex = allEvents.findIndex(
      (event) => event.id === selectedEvent.id,
    );
    const nextIndex =
      (currentIndex + direction + allEvents.length) % allEvents.length;
    const nextEvent = allEvents[nextIndex];

    selectEvent(nextEvent);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#${encodeURIComponent(nextEvent.id)}`,
    );
  }

  async function shareEvent(event: CalendarEvent) {
    const eventUrl = new URL(
      `${window.location.pathname}${window.location.search}`,
      window.location.origin,
    );
    eventUrl.hash = event.id;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          url: eventUrl.toString(),
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyToClipboard(eventUrl.toString());
    } catch {
      const whatsappText = `${event.title}\n${eventUrl.toString()}`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    setCopiedEventId(event.id);

    if (shareFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }

    shareFeedbackTimeoutRef.current = window.setTimeout(() => {
      setCopiedEventId(null);
      shareFeedbackTimeoutRef.current = null;
    }, 2200);
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

  function startMonthSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" || !event.isPrimary) return;

    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }

  function finishMonthSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) >= monthSwipeThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

    if (!isHorizontalSwipe) return;

    event.preventDefault();
    suppressSwipeClickRef.current = true;
    window.setTimeout(() => {
      suppressSwipeClickRef.current = false;
    }, 0);

    const nextIndex = deltaX < 0 ? groupIndex + 1 : groupIndex - 1;

    if (nextIndex >= 0 && nextIndex < eventGroups.length) {
      changeMonth(nextIndex);
    }
  }

  return (
    <>
      <section
        aria-labelledby="calendar-title"
        className="relative flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-3xl bg-site-canvas text-site-on-dark land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-full tall-md:min-h-0"
      >
        <CalendarBackdrop />
        <CalendarBanner />
        <div className="relative z-10 flex min-h-0 flex-1 items-start justify-center p-3 sm:p-4 xl:items-center land-sm:p-2">
          <div
            className={`flex w-full touch-pan-y select-none flex-col justify-center gap-3 rounded-3xl px-3 py-4 text-center backdrop-blur-[2px] sm:px-2 land-sm:gap-2 land-sm:px-2 land-sm:py-2 ${contentPanelClassByCount[visibleEvents.length]} ${panelSurfaceClass}`}
            onPointerDown={startMonthSwipe}
            onPointerUp={finishMonthSwipe}
            onPointerCancel={() => {
              swipeStartRef.current = null;
            }}
            onClickCapture={(event) => {
              if (!suppressSwipeClickRef.current) return;

              event.preventDefault();
              event.stopPropagation();
              suppressSwipeClickRef.current = false;
            }}
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
          className="min-w-0 flex-1 text-center text-lg font-bold capitalize sm:flex-none sm:min-w-56"
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
          className={`mx-auto grid w-full gap-3 lg:gap-2 xl:gap-8 ${eventGridClassByCount[visibleEvents.length]}`}
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
                data-calendar-event-id={event.id}
                aria-haspopup="dialog"
                aria-label={`Abrir más información sobre ${event.title}`}
                onClick={(clickEvent) =>
                  openEvent(event, clickEvent.currentTarget)
                }
                className={`absolute inset-0 cursor-pointer rounded-lg ${focusRingClass}`}
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
              <span
                aria-hidden="true"
                className={`pointer-events-none relative z-10 inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${actionControlSurfaceClass}`}
              >
                <Info className="mr-1.5 size-4" />
                Más información
              </span>
              <div className="pointer-events-none relative z-10 flex items-center justify-center gap-2">
                {locationUrl ? (
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ubicación de ${event.title} en Google Maps`}
                    aria-describedby={locationDescriptionId}
                    className={`pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-site-action-hover/90 hover:text-site-on-dark lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
                  >
                    <MapPin
                      className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    Ver ubicación
                    <span id={locationDescriptionId} className="sr-only">
                      Dirección: {event.location}. Abre Google Maps en una
                      pestaña nueva.
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-site-on-dark/20 bg-site-overlay/70 px-3 py-1.5 text-sm font-semibold text-site-on-dark/65 lg:min-h-8 lg:px-2.5 lg:py-1">
                    Pendiente de confirmar
                  </span>
                )}
                <button
                  type="button"
                  aria-label={
                    copiedEventId === event.id
                      ? `Enlace de ${event.title} copiado`
                      : `Compartir ${event.title} por WhatsApp o copiar enlace`
                  }
                  title={
                    copiedEventId === event.id
                      ? "Enlace copiado"
                      : "Compartir evento"
                  }
                  onClick={() => void shareEvent(event)}
                  className={`pointer-events-auto flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-site-action-hover/90 hover:text-site-on-dark lg:size-8 ${actionControlSurfaceClass} ${focusRingClass}`}
                >
                  {copiedEventId === event.id ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Share2 className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </li>
          );
        })}
        </ul>

        <p className="sr-only" aria-live="polite">
          {copiedEventId ? "Enlace del evento copiado al portapapeles." : ""}
        </p>

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
          index={allEvents.findIndex((event) => event.id === selectedEvent.id)}
          total={allEvents.length}
          triggerRef={triggerRef}
          onClose={closeEvent}
          onPrevious={() => navigateSelectedEvent(-1)}
          onNext={() => navigateSelectedEvent(1)}
        />
      ) : null}
    </>
  );
}
