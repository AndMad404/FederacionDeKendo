import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  Info,
  MapPin,
  Share2,
} from "lucide-react";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import {
  getUpcomingEventGroups,
  type UpcomingEventGroup,
} from "../utils/calendarEvents";
import {
  formatEventTime,
  getEventDateLabel,
  getEventLocationName,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";
import { EventDetailModal } from "./EventDetailModal";
import { PageTitle } from "./PageTitle";
import { NavigationArrowButton } from "./ui/ModalControls";

const eventsPerPage = 2;
const monthSwipeThreshold = 48;
const monthFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthNameFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  timeZone: "UTC",
});
const legacyEventHashPattern = /-[a-f0-9]{8}$/i;

function findEventByUrlId(events: CalendarEvent[], urlId: string) {
  const exactMatch = events.find((event) => event.id === urlId);

  if (exactMatch) return exactMatch;
  if (!legacyEventHashPattern.test(urlId)) return undefined;

  const cleanId = urlId.replace(legacyEventHashPattern, "");
  return events.find((event) => event.id === cleanId);
}

function CalendarBanner() {
  return (
    <div className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20">
      <picture className="absolute inset-0 h-full w-full" aria-hidden="true">
        <source
          srcSet="/images/calendar/kendo-calendar-480.webp 480w, /images/calendar/kendo-calendar-960.webp 960w, /images/calendar/kendo-calendar-1600.webp 1600w"
          sizes="100vw"
          type="image/webp"
        />
        <img
          src="/images/calendar/kendo-calendar-1600.webp"
          alt=""
          width={1600}
          height={1069}
          loading="eager"
          decoding="async"
          fetchpriority="high"
          className="h-full w-full object-cover object-[center_20%]"
        />
      </picture>
      <div
        className="absolute inset-0 bg-gradient-to-r from-site-navy/95 via-site-navy/80 to-site-navy/45"
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-start px-4 pt-4 text-center text-site-on-dark">
        <PageTitle id="calendar-title" tone="media" className="!p-0">
          Calendario de eventos
        </PageTitle>
        <p className="mt-1 text-sm text-site-subtle land-compact:hidden">
          Torneos, exámenes y actividades de kendo.
        </p>
      </div>
    </div>
  );
}

function formatMonth(monthKey: string) {
  const label = monthFormatter
    .format(new Date(`${monthKey}-01T00:00:00.000Z`))
    .replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatMonthRange(
  currentMonthKey: string,
  nextMonthKey: string | undefined,
) {
  if (!nextMonthKey) return formatMonth(currentMonthKey);

  const currentDate = new Date(`${currentMonthKey}-01T00:00:00.000Z`);
  const nextDate = new Date(`${nextMonthKey}-01T00:00:00.000Z`);

  if (currentDate.getUTCFullYear() !== nextDate.getUTCFullYear()) {
    return `${formatMonth(currentMonthKey)} — ${formatMonth(nextMonthKey)}`;
  }

  const currentMonth = monthNameFormatter.format(currentDate);
  const capitalizedCurrentMonth =
    currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  return `${capitalizedCurrentMonth} — ${formatMonth(nextMonthKey)}`;
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

interface CalendarMonthProps {
  group: UpcomingEventGroup;
  pageIndex: number;
  copiedEventId: string | null;
  onPageChange: (page: number) => void;
  onOpenEvent: (event: CalendarEvent, trigger: HTMLElement) => void;
  onShareEvent: (event: CalendarEvent) => void;
}

function CalendarMonth({
  group,
  pageIndex,
  copiedEventId,
  onPageChange,
  onOpenEvent,
  onShareEvent,
}: CalendarMonthProps) {
  const pageCount = Math.ceil(group.events.length / eventsPerPage);
  const visibleEvents = group.events.slice(
    pageIndex * eventsPerPage,
    (pageIndex + 1) * eventsPerPage,
  );
  const headingId = `calendar-month-${group.monthKey}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="sr-only">
        {formatMonth(group.monthKey)}
      </h2>

      <ul className="mx-auto grid w-full gap-2">
        {visibleEvents.map((event) => {
          const eventDateLabel = getEventDateLabel(event);
          const locationUrl = event.location
            ? getLocationMapUrl(event.location)
            : undefined;
          const locationName = event.location
            ? getEventLocationName(event.location)
            : undefined;
          const locationDescriptionId = `${event.id}-calendar-location`;

          return (
            <li
              key={event.id}
              className="relative flex min-h-40 flex-col items-center justify-around gap-2 rounded-xl border border-site-border bg-site-canvas p-3 text-center transition-colors hover:border-site-action lg:min-h-36 lg:gap-1 lg:px-2 lg:py-1"
            >
              <button
                type="button"
                data-calendar-event-id={event.id}
                aria-haspopup="dialog"
                aria-label={`Abrir más información sobre ${event.title}`}
                onClick={(clickEvent) =>
                  onOpenEvent(event, clickEvent.currentTarget)
                }
                className={`absolute inset-0 cursor-pointer rounded-lg ${focusRingClass}`}
              />
              <h3 className="text-base font-bold leading-tight">
                {event.title}
              </h3>
              <time
                dateTime={event.date}
                aria-label={eventDateLabel}
                className="rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action lg:px-2 lg:py-1.5"
              >
                {eventDateLabel}
              </time>
              <p className="text-sm leading-tight text-site-muted">
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
                    className={`pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
                  >
                    <MapPin
                      className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    Ver ubicación
                    <span id={locationDescriptionId} className="sr-only">
                      Lugar: {locationName}. Abre Google Maps en una pestaña
                      nueva.
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-site-border bg-site-surface px-3 py-1.5 text-sm font-semibold text-site-muted lg:min-h-8 lg:px-2.5 lg:py-1">
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
                  onClick={() => onShareEvent(event)}
                  className={`pointer-events-auto flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:border-site-action hover:bg-site-media lg:size-8 ${actionControlSurfaceClass} ${focusRingClass}`}
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

      {pageCount > 1 ? (
        <nav
          aria-label={`Paginación de eventos de ${formatMonth(group.monthKey)}`}
          className="flex min-h-11 items-center justify-center gap-4"
        >
          <NavigationArrowButton
            direction="previous"
            label="Ver eventos anteriores del mes"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          />
          <p
            className="min-w-24 text-center text-sm font-semibold"
            aria-live="polite"
          >
            Página {pageIndex + 1} de {pageCount}
          </p>
          <NavigationArrowButton
            direction="next"
            label="Ver más eventos del mes"
            disabled={pageIndex === pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          />
        </nav>
      ) : null}
    </section>
  );
}

interface CalendarNavigationProps {
  currentGroup: UpcomingEventGroup;
  nextGroup: UpcomingEventGroup | undefined;
  canPreviousMonth: boolean;
  canNextMonth: boolean;
  canPreviousPair: boolean;
  canNextPair: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onPreviousPair: () => void;
  onNextPair: () => void;
}

function CalendarNavigation({
  currentGroup,
  nextGroup,
  canPreviousMonth,
  canNextMonth,
  canPreviousPair,
  canNextPair,
  onPreviousMonth,
  onNextMonth,
  onPreviousPair,
  onNextPair,
}: CalendarNavigationProps) {
  return (
    <nav
      aria-label="Navegación del calendario"
      className="flex items-center justify-center gap-4"
    >
      <span className="md:hidden">
        <NavigationArrowButton
          direction="previous"
          label="Ver mes anterior"
          disabled={!canPreviousMonth}
          onClick={onPreviousMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="previous"
          label="Ver los dos meses anteriores"
          disabled={!canPreviousPair}
          onClick={onPreviousPair}
        />
      </span>

      <p
        className="min-w-0 flex-1 text-center text-lg font-bold sm:flex-none sm:min-w-72"
        aria-live="polite"
      >
        <span className="md:hidden">
          {formatMonth(currentGroup.monthKey)}
        </span>
        <span className="hidden md:inline">
          {formatMonthRange(currentGroup.monthKey, nextGroup?.monthKey)}
        </span>
      </p>

      <span className="md:hidden">
        <NavigationArrowButton
          direction="next"
          label="Ver mes siguiente"
          disabled={!canNextMonth}
          onClick={onNextMonth}
        />
      </span>
      <span className="hidden md:block">
        <NavigationArrowButton
          direction="next"
          label="Ver los dos meses siguientes"
          disabled={!canNextPair}
          onClick={onNextPair}
        />
      </span>
    </nav>
  );
}

function usesTwoMonthLayout() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getVisibleGroupStart(groupIndex: number) {
  return usesTwoMonthLayout() ? groupIndex - (groupIndex % 2) : groupIndex;
}

export function CalendarSection() {
  const eventGroups = getUpcomingEventGroups(CALENDAR_EVENTS);
  const allEvents = eventGroups.flatMap((group) => group.events);
  const [groupIndex, setGroupIndex] = useState(0);
  const [pageIndexes, setPageIndexes] = useState<Record<string, number>>({});
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

      const matchingEvent = findEventByUrlId(allEvents, eventId);

      if (!matchingEvent) {
        setSelectedEvent(null);
        return;
      }

      const matchingGroupIndex = eventGroups.findIndex((group) =>
        group.events.some((event) => event.id === matchingEvent.id),
      );
      const matchingGroup = eventGroups[matchingGroupIndex];
      const matchingEventIndex = matchingGroup.events.findIndex(
        (event) => event.id === matchingEvent.id,
      );
      setGroupIndex(getVisibleGroupStart(matchingGroupIndex));
      setPageIndexes((currentPageIndexes) => ({
        ...currentPageIndexes,
        [matchingGroup.monthKey]: Math.floor(
          matchingEventIndex / eventsPerPage,
        ),
      }));
      setSelectedEvent(matchingEvent);

      if (matchingEvent.id !== eventId) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#${encodeURIComponent(matchingEvent.id)}`,
        );
      }
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

  useEffect(() => {
    const tabletMediaQuery = window.matchMedia("(min-width: 768px)");
    const syncGroupStart = () => {
      if (!tabletMediaQuery.matches) return;

      setGroupIndex((currentGroupIndex) =>
        currentGroupIndex - (currentGroupIndex % 2),
      );
    };

    tabletMediaQuery.addEventListener("change", syncGroupStart);
    return () => {
      tabletMediaQuery.removeEventListener("change", syncGroupStart);
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
      const nextGroup = eventGroups[nextGroupIndex];
      setGroupIndex(getVisibleGroupStart(nextGroupIndex));
      setPageIndexes((currentPageIndexes) => ({
        ...currentPageIndexes,
        [nextGroup.monthKey]: Math.floor(nextEventIndex / eventsPerPage),
      }));
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

  const currentGroup = eventGroups[groupIndex];
  const nextGroup = eventGroups[groupIndex + 1];

  function changeMonth(nextIndex: number) {
    setGroupIndex(nextIndex);
    setPageIndexes({});
  }

  function changeMonthPage(monthKey: string, nextPage: number) {
    setPageIndexes((currentPageIndexes) => ({
      ...currentPageIndexes,
      [monthKey]: nextPage,
    }));
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

    const groupStep = usesTwoMonthLayout() ? 2 : 1;
    const nextIndex =
      deltaX < 0 ? groupIndex + groupStep : groupIndex - groupStep;

    if (nextIndex >= 0 && nextIndex < eventGroups.length) {
      changeMonth(nextIndex);
    }
  }

  return (
    <>
      <section
        aria-labelledby="calendar-title"
        className="relative mt-2 flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-xl bg-site-canvas text-site-text land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-[calc(100%_-_0.5rem)] tall-md:min-h-0"
      >
        <CalendarBanner />
        {currentGroup ? (
          <div className="relative z-20 -mt-11 flex min-h-0 flex-1 items-start justify-center p-3 sm:-mt-13 sm:p-4 xl:absolute xl:inset-0 xl:mt-0 xl:items-start xl:px-4 xl:pb-4 xl:pt-20 land-sm:p-2 land-compact:-mt-8">
            <div
              className={`flex w-full touch-pan-y select-none flex-col justify-start gap-3 px-3 py-4 text-center sm:px-2 md:max-w-6xl md:gap-2 md:py-3 xl:min-h-[26.125rem] land-sm:gap-2 land-sm:px-2 land-sm:py-2 ${panelSurfaceClass}`}
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
              <CalendarNavigation
                currentGroup={currentGroup}
                nextGroup={nextGroup}
                canPreviousMonth={groupIndex > 0}
                canNextMonth={groupIndex < eventGroups.length - 1}
                canPreviousPair={groupIndex >= 2}
                canNextPair={groupIndex + 2 < eventGroups.length}
                onPreviousMonth={() => changeMonth(groupIndex - 1)}
                onNextMonth={() => changeMonth(groupIndex + 1)}
                onPreviousPair={() => changeMonth(groupIndex - 2)}
                onNextPair={() => changeMonth(groupIndex + 2)}
              />

              <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4 xl:gap-8">
                <CalendarMonth
                  group={currentGroup}
                  pageIndex={pageIndexes[currentGroup.monthKey] ?? 0}
                  copiedEventId={copiedEventId}
                  onPageChange={(nextPage) =>
                    changeMonthPage(currentGroup.monthKey, nextPage)
                  }
                  onOpenEvent={openEvent}
                  onShareEvent={(event) => void shareEvent(event)}
                />

                {nextGroup ? (
                  <div className="hidden md:block">
                    <CalendarMonth
                      group={nextGroup}
                      pageIndex={pageIndexes[nextGroup.monthKey] ?? 0}
                      copiedEventId={copiedEventId}
                      onPageChange={(nextPage) =>
                        changeMonthPage(nextGroup.monthKey, nextPage)
                      }
                      onOpenEvent={openEvent}
                      onShareEvent={(event) => void shareEvent(event)}
                    />
                  </div>
                ) : null}
              </div>

              <p className="sr-only" aria-live="polite">
                {copiedEventId
                  ? "Enlace del evento copiado al portapapeles."
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center px-4">
            <p
              className={`rounded-lg px-6 py-5 text-center text-lg ${panelSurfaceClass}`}
            >
              No hay próximos eventos publicados.
            </p>
          </div>
        )}
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
          onShare={() => void shareEvent(selectedEvent)}
          isShareCopied={copiedEventId === selectedEvent.id}
        />
      ) : null}
    </>
  );
}
