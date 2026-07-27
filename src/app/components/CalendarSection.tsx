import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getUpcomingEventGroups } from "../utils/calendarEvents";
import { panelSurfaceClass } from "../styles/shared";
import {
  CalendarMonth,
  CALENDAR_EVENTS_PER_PAGE,
} from "./calendar/CalendarMonth";
import { CalendarNavigation } from "./calendar/CalendarNavigation";
import { MediaPageBanner } from "./ui/MediaPageBanner";

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
const EVENT_GROUPS = getUpcomingEventGroups(CALENDAR_EVENTS);
const ALL_EVENTS = EVENT_GROUPS.flatMap((group) => group.events);
const EventDetailModal = lazy(() =>
  import("./EventDetailModal").then((module) => ({
    default: module.EventDetailModal,
  })),
);

function findEventByUrlId(events: CalendarEvent[], urlId: string) {
  const exactMatch = events.find((event) => event.id === urlId);

  if (exactMatch) return exactMatch;
  if (!legacyEventHashPattern.test(urlId)) return undefined;

  const cleanId = urlId.replace(legacyEventHashPattern, "");
  return events.find((event) => event.id === cleanId);
}

function CalendarBanner() {
  return (
    <MediaPageBanner
      className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
      titleId="calendar-title"
      title="Calendario de eventos"
      description="Torneos, exámenes y actividades de kendo."
      image={{
        src: "/images/calendar/kendo-calendar-1600.webp",
        sources: [
          {
            srcSet:
              "/images/calendar/kendo-calendar-480.webp 480w, /images/calendar/kendo-calendar-960.webp 960w, /images/calendar/kendo-calendar-1600.webp 1600w",
            sizes: "100vw",
            type: "image/webp",
          },
        ],
        width: 1600,
        height: 1069,
        className: "object-[center_20%]",
      }}
    />
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

function usesTwoMonthLayout() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getVisibleGroupStart(groupIndex: number) {
  return usesTwoMonthLayout() ? groupIndex - (groupIndex % 2) : groupIndex;
}

export function CalendarSection() {
  const location = useLocation();
  const navigate = useNavigate();
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
    let eventId = "";

    try {
      eventId = decodeURIComponent(location.hash.slice(1));
    } catch {
      eventId = location.hash.slice(1);
    }

    const matchingEvent = findEventByUrlId(ALL_EVENTS, eventId);

    if (!matchingEvent) {
      setSelectedEvent(null);
      return;
    }

    const matchingGroupIndex = EVENT_GROUPS.findIndex((group) =>
      group.events.some((event) => event.id === matchingEvent.id),
    );
    const matchingGroup = EVENT_GROUPS[matchingGroupIndex];
    const matchingEventIndex = matchingGroup.events.findIndex(
      (event) => event.id === matchingEvent.id,
    );
    setGroupIndex(getVisibleGroupStart(matchingGroupIndex));
    setPageIndexes((currentPageIndexes) => ({
      ...currentPageIndexes,
      [matchingGroup.monthKey]: Math.floor(
        matchingEventIndex / CALENDAR_EVENTS_PER_PAGE,
      ),
    }));
    setSelectedEvent(matchingEvent);

    if (matchingEvent.id !== eventId) {
      void navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: `#${encodeURIComponent(matchingEvent.id)}`,
        },
        { replace: true },
      );
    }
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
  ]);

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
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${encodeURIComponent(event.id)}`,
      },
      { replace: false },
    );
  }

  function closeEvent() {
    if (selectedEvent) {
      triggerRef.current = document.querySelector<HTMLElement>(
        `[data-calendar-event-id="${selectedEvent.id}"]`,
      );
    }

    setSelectedEvent(null);
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: "",
      },
      { replace: true },
    );
  }

  function selectEvent(event: CalendarEvent) {
    const nextGroupIndex = EVENT_GROUPS.findIndex((group) =>
      group.events.some((groupEvent) => groupEvent.id === event.id),
    );
    const nextEventIndex = EVENT_GROUPS[nextGroupIndex]?.events.findIndex(
      (groupEvent) => groupEvent.id === event.id,
    );

    if (nextGroupIndex !== -1 && nextEventIndex !== undefined) {
      const nextGroup = EVENT_GROUPS[nextGroupIndex];
      setGroupIndex(getVisibleGroupStart(nextGroupIndex));
      setPageIndexes((currentPageIndexes) => ({
        ...currentPageIndexes,
        [nextGroup.monthKey]: Math.floor(
          nextEventIndex / CALENDAR_EVENTS_PER_PAGE,
        ),
      }));
    }

    setSelectedEvent(event);
  }

  function navigateSelectedEvent(direction: -1 | 1) {
    if (!selectedEvent || ALL_EVENTS.length < 2) return;

    const currentIndex = ALL_EVENTS.findIndex(
      (event) => event.id === selectedEvent.id,
    );
    const nextIndex =
      (currentIndex + direction + ALL_EVENTS.length) % ALL_EVENTS.length;
    const nextEvent = ALL_EVENTS[nextIndex];

    selectEvent(nextEvent);
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${encodeURIComponent(nextEvent.id)}`,
      },
      { replace: true },
    );
  }

  async function shareEvent(event: CalendarEvent) {
    const eventUrl = new URL(
      `${location.pathname}${location.search}`,
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

  const currentGroup = EVENT_GROUPS[groupIndex];
  const nextGroup = EVENT_GROUPS[groupIndex + 1];

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
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishMonthSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

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

    if (nextIndex >= 0 && nextIndex < EVENT_GROUPS.length) {
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
              onPointerCancel={(event) => {
                swipeStartRef.current = null;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onClickCapture={(event) => {
                if (!suppressSwipeClickRef.current) return;

                event.preventDefault();
                event.stopPropagation();
                suppressSwipeClickRef.current = false;
              }}
            >
              <CalendarNavigation
                currentMonthLabel={formatMonth(currentGroup.monthKey)}
                monthRangeLabel={formatMonthRange(
                  currentGroup.monthKey,
                  nextGroup?.monthKey,
                )}
                canPreviousMonth={groupIndex > 0}
                canNextMonth={groupIndex < EVENT_GROUPS.length - 1}
                canPreviousPair={groupIndex >= 2}
                canNextPair={groupIndex + 2 < EVENT_GROUPS.length}
                onPreviousMonth={() => changeMonth(groupIndex - 1)}
                onNextMonth={() => changeMonth(groupIndex + 1)}
                onPreviousPair={() => changeMonth(groupIndex - 2)}
                onNextPair={() => changeMonth(groupIndex + 2)}
              />

              <div className="grid items-start gap-3 md:grid-cols-2 md:gap-4 xl:gap-8">
                <CalendarMonth
                  group={currentGroup}
                  monthLabel={formatMonth(currentGroup.monthKey)}
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
                      monthLabel={formatMonth(nextGroup.monthKey)}
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
        <Suspense fallback={null}>
          <EventDetailModal
            event={selectedEvent}
            index={ALL_EVENTS.findIndex(
              (event) => event.id === selectedEvent.id,
            )}
            total={ALL_EVENTS.length}
            triggerRef={triggerRef}
            onClose={closeEvent}
            onPrevious={() => navigateSelectedEvent(-1)}
            onNext={() => navigateSelectedEvent(1)}
            onShare={() => void shareEvent(selectedEvent)}
            isShareCopied={copiedEventId === selectedEvent.id}
          />
        </Suspense>
      ) : null}
    </>
  );
}
