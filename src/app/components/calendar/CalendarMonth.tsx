import { useRef } from "react";
import { useSequenceTransition } from "../../hooks/useContentTransition";
import type { UpcomingEventGroup } from "../../utils/calendarEvents";
import { NavigationArrowButton } from "../ui/ModalControls";
import { CalendarEventCard } from "./CalendarEventCard";
import { useLanguage } from "../../config/i18n";

const CALENDAR_EVENTS_PER_PAGE = 2;

interface CalendarMonthProps {
  group: UpcomingEventGroup;
  expandedLayout?: boolean;
  monthLabel: string;
  pageIndex: number;
  onPageChange: (page: number) => void;
}

export function CalendarMonth({
  group,
  expandedLayout,
  monthLabel,
  pageIndex,
  onPageChange,
}: CalendarMonthProps) {
  const { copy } = useLanguage();
  const eventsRef = useRef<HTMLUListElement>(null);
  useSequenceTransition(eventsRef, pageIndex, group.monthKey);
  const pageCount = Math.ceil(group.events.length / CALENDAR_EVENTS_PER_PAGE);
  const visibleEvents = group.events.slice(
    pageIndex * CALENDAR_EVENTS_PER_PAGE,
    (pageIndex + 1) * CALENDAR_EVENTS_PER_PAGE,
  );
  const headingId = `calendar-month-${group.monthKey}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 page-fit:h-full page-fit:min-h-0"
    >
      <h2 id={headingId} className="sr-only">
        {monthLabel}
      </h2>

      <ul
        ref={eventsRef}
        className={`mx-auto grid min-h-0 w-full gap-3 sm:gap-4 md:max-xl:portrait:flex-1 md:max-xl:portrait:auto-rows-fr page-fit:flex-1 ${visibleEvents.length === 1 ? "page-fit:grid-rows-1" : "page-fit:grid-rows-2"}`}
      >
        {visibleEvents.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            portraitOnTablet={visibleEvents.length === 1 && !expandedLayout}
            expandedLayout={expandedLayout}
          />
        ))}
      </ul>

      {pageCount > 1 ? (
        <nav
          aria-label={`${copy.calendar.eventPagination} ${monthLabel}`}
          className="flex min-h-11 items-center justify-center gap-4"
        >
          <NavigationArrowButton
            direction="previous"
            label={copy.calendar.previousEvents}
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          />
          <NavigationArrowButton
            direction="next"
            label={copy.calendar.nextEvents}
            disabled={pageIndex === pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          />
        </nav>
      ) : null}
    </section>
  );
}
