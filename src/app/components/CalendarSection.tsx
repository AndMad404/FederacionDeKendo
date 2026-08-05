import {
  useEffect,
  useRef,
  useState,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getUpcomingEventGroups } from "../utils/calendarEvents";
import { panelSurfaceClass, surfaceClass } from "../styles/shared";
import { getEventPath } from "../utils/eventRoutes";
import {
  CalendarMonth,
} from "./calendar/CalendarMonth";
import { CalendarNavigation } from "./calendar/CalendarNavigation";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { useLanguage, type Language } from "../config/i18n";
import { getLocalizedEvents } from "../utils/localizedEvents";

const monthSwipeThreshold = 48;
const legacyEventHashPattern = /-[a-f0-9]{8}$/i;

function findEventByUrlId(events: CalendarEvent[], urlId: string) {
  const exactMatch = events.find(
    (event) => event.id === urlId || event.aliases?.includes(urlId),
  );

  if (exactMatch) return exactMatch;
  if (!legacyEventHashPattern.test(urlId)) return undefined;

  const cleanId = urlId.replace(legacyEventHashPattern, "");
  return events.find((event) => event.id === cleanId);
}

function CalendarBanner({ language }: { language: Language }) {
  return (
    <MediaPageBanner
      className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
      titleId="calendar-title"
      title={language === "en" ? "Events calendar" : "Calendario de eventos"}
      description={language === "en" ? "Kendo tournaments, examinations, and activities." : "Torneos, exámenes y actividades de kendo."}
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

function formatMonth(monthKey: string, language: Language) {
  const label = new Intl.DateTimeFormat(language === "en" ? "en" : "es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${monthKey}-01T00:00:00.000Z`))
    .replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatMonthRange(
  currentMonthKey: string,
  nextMonthKey: string | undefined,
  language: Language,
) {
  if (!nextMonthKey) return formatMonth(currentMonthKey, language);

  const currentDate = new Date(`${currentMonthKey}-01T00:00:00.000Z`);
  const nextDate = new Date(`${nextMonthKey}-01T00:00:00.000Z`);

  if (currentDate.getUTCFullYear() !== nextDate.getUTCFullYear()) {
    return `${formatMonth(currentMonthKey, language)} — ${formatMonth(nextMonthKey, language)}`;
  }

  const currentMonth = new Intl.DateTimeFormat(language === "en" ? "en" : "es-CR", {
    month: "long",
    timeZone: "UTC",
  }).format(currentDate);
  const capitalizedCurrentMonth =
    currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  return `${capitalizedCurrentMonth} — ${formatMonth(nextMonthKey, language)}`;
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

export function CalendarSection() {
  const { language } = useLanguage();
  const eventGroups = useMemo(
    () => getUpcomingEventGroups(getLocalizedEvents(CALENDAR_EVENTS, language)),
    [language],
  );
  const allEvents = useMemo(
    () => eventGroups.flatMap((group) => group.events),
    [eventGroups],
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [groupIndex, setGroupIndex] = useState(0);
  const [pageIndexes, setPageIndexes] = useState<Record<string, number>>({});
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
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

    const matchingEvent = findEventByUrlId(allEvents, eventId);

    if (matchingEvent) {
      void navigate(getEventPath(matchingEvent, language), { replace: true });
    }
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    language,
    allEvents,
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

  async function shareEvent(event: CalendarEvent) {
    const eventUrl = new URL(getEventPath(event, language), window.location.origin);

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

    if (nextIndex >= 0 && nextIndex < eventGroups.length) {
      changeMonth(nextIndex);
    }
  }

  return (
      <section
        aria-labelledby="calendar-title"
        className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0"
      >
        <CalendarBanner language={language} />
        {currentGroup ? (
          <div className="relative z-20 -mt-11 flex min-h-0 flex-1 items-start justify-center px-3 pb-0 pt-3 sm:-mt-13 sm:px-4 sm:pb-0 sm:pt-4 tall-md:p-4 xl:absolute xl:inset-0 xl:mt-0 xl:items-start xl:px-4 xl:pb-4 xl:pt-20 tall-md:xl:pt-20 land-sm:px-2 land-sm:pb-0 land-sm:pt-2 land-compact:-mt-8">
            <div
              data-page-content-boundary
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
                currentMonthLabel={formatMonth(currentGroup.monthKey, language)}
                monthRangeLabel={formatMonthRange(
                  currentGroup.monthKey,
                  nextGroup?.monthKey,
                  language,
                )}
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
                  monthLabel={formatMonth(currentGroup.monthKey, language)}
                  pageIndex={pageIndexes[currentGroup.monthKey] ?? 0}
                  copiedEventId={copiedEventId}
                  onPageChange={(nextPage) =>
                    changeMonthPage(currentGroup.monthKey, nextPage)
                  }
                  onShareEvent={(event) => void shareEvent(event)}
                />

                {nextGroup ? (
                  <div className="hidden md:block">
                    <CalendarMonth
                      group={nextGroup}
                      monthLabel={formatMonth(nextGroup.monthKey, language)}
                      pageIndex={pageIndexes[nextGroup.monthKey] ?? 0}
                      copiedEventId={copiedEventId}
                      onPageChange={(nextPage) =>
                        changeMonthPage(nextGroup.monthKey, nextPage)
                      }
                      onShareEvent={(event) => void shareEvent(event)}
                    />
                  </div>
                ) : null}
              </div>

              <p className="sr-only" aria-live="polite">
                {copiedEventId
                  ? language === "en" ? "Event link copied to the clipboard." : "Enlace del evento copiado al portapapeles."
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center px-4">
            <p
              className={`rounded-lg px-6 py-5 text-center text-lg ${surfaceClass}`}
            >
              {language === "en" ? "There are no upcoming published events." : "No hay próximos eventos publicados."}
            </p>
          </div>
        )}
      </section>
  );
}
