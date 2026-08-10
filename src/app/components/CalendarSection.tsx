import { useMemo } from "react";
import { Link } from "react-router";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import { getUpcomingEventGroups } from "../utils/calendarEvents";
import {
  focusRingClass,
  panelSurfaceClass,
  secondaryButtonClass,
  surfaceClass,
} from "../styles/shared";
import {
  CalendarMonth,
} from "./calendar/CalendarMonth";
import { CalendarNavigation } from "./calendar/CalendarNavigation";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { useLanguage, type Language } from "../config/i18n";
import { getLocalizedEvents } from "../utils/localizedEvents";
import { useCalendarNavigation } from "../hooks/useCalendarNavigation";
import { useCalendarEventSharing } from "../hooks/useCalendarEventSharing";

function CalendarBanner() {
  const { copy } = useLanguage();
  return (
    <MediaPageBanner
      className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
      titleId="calendar-title"
      title={copy.calendar.title}
      description={copy.calendar.description}
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

export function CalendarSection() {
  const { language, copy } = useLanguage();
  const eventGroups = useMemo(
    () => getUpcomingEventGroups(getLocalizedEvents(CALENDAR_EVENTS, language)),
    [language],
  );
  const { copiedEventId, shareEvent } = useCalendarEventSharing(language);
  const {
    changeMonthPage,
    groupIndex,
    nextMonth,
    nextPair,
    pageIndexes,
    previousMonth,
    previousPair,
    swipeHandlers,
  } = useCalendarNavigation(eventGroups.length);

  const currentGroup = eventGroups[groupIndex];
  const nextGroup = eventGroups[groupIndex + 1];
  const archivePath =
    language === "en" ? "/en/events/past/" : "/eventos/pasados/";

  return (
      <section
        aria-labelledby="calendar-title"
        className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0"
      >
        <CalendarBanner />
        {currentGroup ? (
          <div className="relative z-20 -mt-11 flex min-h-0 flex-1 items-start justify-center px-3 pb-0 pt-3 sm:-mt-13 sm:px-4 sm:pb-0 sm:pt-4 tall-md:p-4 page-fit:absolute page-fit:inset-0 page-fit:mt-0 page-fit:items-start page-fit:px-4 page-fit:pb-4 page-fit:pt-20 land-sm:px-2 land-sm:pb-0 land-sm:pt-2 land-compact:-mt-8">
            <div
              data-page-content-boundary
              className={`flex w-full touch-pan-y select-none flex-col justify-start gap-3 px-3 py-4 text-center sm:px-2 md:max-w-6xl md:gap-2 md:py-3 xl:min-h-[26.125rem] land-sm:gap-2 land-sm:px-2 land-sm:py-2 ${panelSurfaceClass}`}
              {...swipeHandlers}
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
                onPreviousMonth={previousMonth}
                onNextMonth={nextMonth}
                onPreviousPair={previousPair}
                onNextPair={nextPair}
              />

              <div className="flex justify-center">
                <Link
                  to={archivePath}
                  className={`${secondaryButtonClass} ${focusRingClass}`}
                >
                  {copy.calendar.pastEvents}
                </Link>
              </div>

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
                {copiedEventId ? copy.calendar.copiedAnnouncement : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center px-4">
            <p
              className={`rounded-lg px-6 py-5 text-center text-lg ${surfaceClass}`}
            >
              {copy.calendar.empty}
            </p>
          </div>
        )}
      </section>
  );
}
