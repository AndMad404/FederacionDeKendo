import type { UpcomingEventGroup } from "../../utils/calendarEvents";
import { NavigationArrowButton } from "../ui/ModalControls";
import { CalendarEventCard } from "./CalendarEventCard";
import { useLanguage } from "../../config/i18n";

const CALENDAR_EVENTS_PER_PAGE = 2;

interface CalendarMonthProps {
  group: UpcomingEventGroup;
  monthLabel: string;
  pageIndex: number;
  onPageChange: (page: number) => void;
}

export function CalendarMonth({
  group,
  monthLabel,
  pageIndex,
  onPageChange,
}: CalendarMonthProps) {
  const { copy } = useLanguage();
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

      <ul className="mx-auto grid w-full gap-3 sm:gap-4 page-fit:flex-1 page-fit:grid-rows-2">
        {visibleEvents.map((event) => (
          <CalendarEventCard key={event.id} event={event} />
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
