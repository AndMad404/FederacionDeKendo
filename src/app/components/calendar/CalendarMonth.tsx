import type { CalendarEvent } from "../../types";
import type { UpcomingEventGroup } from "../../utils/calendarEvents";
import { NavigationArrowButton } from "../ui/ModalControls";
import { CalendarEventCard } from "./CalendarEventCard";
import { useLanguage } from "../../config/i18n";

const CALENDAR_EVENTS_PER_PAGE = 2;

interface CalendarMonthProps {
  group: UpcomingEventGroup;
  monthLabel: string;
  pageIndex: number;
  copiedEventId: string | null;
  onPageChange: (page: number) => void;
  onShareEvent: (event: CalendarEvent) => void;
}

export function CalendarMonth({
  group,
  monthLabel,
  pageIndex,
  copiedEventId,
  onPageChange,
  onShareEvent,
}: CalendarMonthProps) {
  const { language } = useLanguage();
  const pageCount = Math.ceil(
    group.events.length / CALENDAR_EVENTS_PER_PAGE,
  );
  const visibleEvents = group.events.slice(
    pageIndex * CALENDAR_EVENTS_PER_PAGE,
    (pageIndex + 1) * CALENDAR_EVENTS_PER_PAGE,
  );
  const headingId = `calendar-month-${group.monthKey}`;
  const pageLabel = language === "en"
    ? `Page ${pageIndex + 1} of ${pageCount}`
    : `Página ${pageIndex + 1} de ${pageCount}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="sr-only">
        {monthLabel}
      </h2>

      <ul className="mx-auto grid w-full gap-2">
        {visibleEvents.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            isShareCopied={copiedEventId === event.id}
            onShare={onShareEvent}
          />
        ))}
      </ul>

      {pageCount > 1 ? (
        <nav
          aria-label={language === "en" ? `Event pagination for ${monthLabel}` : `Paginación de eventos de ${monthLabel}`}
          className="flex min-h-11 items-center justify-center gap-4"
        >
          <NavigationArrowButton
            direction="previous"
            label={language === "en" ? "View previous events this month" : "Ver eventos anteriores del mes"}
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
          />
          <p
            className="min-w-24 text-center text-sm font-semibold"
            aria-live="polite"
          >
            {pageLabel}
          </p>
          <NavigationArrowButton
            direction="next"
            label={language === "en" ? "View more events this month" : "Ver más eventos del mes"}
            disabled={pageIndex === pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          />
        </nav>
      ) : null}
    </section>
  );
}
