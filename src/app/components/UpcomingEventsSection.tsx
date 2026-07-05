import { MapPin } from "lucide-react";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getUpcomingEvents } from "../utils/calendarEvents";

const maxHomepageEvents = 4;
const eventDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function formatEventDate(date: string) {
  return eventDateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function formatEventTime({ startTime, endTime }: CalendarEvent) {
  if (!startTime) {
    return "Todo el día";
  }

  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function getEventVisibilityClass(index: number) {
  if (index === 2) {
    return "[@media_(orientation:landscape)_and_(max-height:640px)]:hidden";
  }

  if (index === 3) {
    return "hidden lg:flex [@media_(orientation:landscape)_and_(min-height:641px)]:flex";
  }

  return "";
}

export function UpcomingEventsSection() {
  const homepageEvents = getUpcomingEvents(
    CALENDAR_EVENTS,
    undefined,
    maxHomepageEvents,
  );

  if (homepageEvents.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="upcoming-events-title"
      className="mx-auto w-full max-w-6xl px-1 pt-2.5 pb-0 text-white sm:px-4 [@media_(min-width:768px)_and_(min-height:640px)]:pb-2"
    >
      <div className="mb-2.5 flex items-center justify-center text-center font-semibold text-white">
        <h2
          id="upcoming-events-title"
          className="text-lg font-bold leading-tight sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]"
        >
          Calendario de Proximos Eventos
        </h2>
      </div>

      <ul className="grid gap-3 [@media_(orientation:landscape)_and_(max-height:640px)]:grid-cols-2 [@media_(orientation:landscape)_and_(min-height:641px)]:grid-cols-4 lg:grid-cols-4">
        {homepageEvents.map((event, index) => (
          <li
            key={event.id}
            className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-lg border border-blue-500/70 bg-white/[0.06] p-3 [@media_(orientation:landscape)_and_(min-height:641px)]:flex [@media_(orientation:landscape)_and_(min-height:641px)]:flex-col-reverse [@media_(orientation:landscape)_and_(min-height:641px)]:justify-around [@media_(orientation:landscape)_and_(min-height:641px)]:gap-3 [@media_(orientation:landscape)_and_(min-height:641px)]:text-center lg:flex lg:flex-col-reverse lg:justify-around lg:gap-3 lg:text-center ${getEventVisibilityClass(index)}`}
          >
            <time
              dateTime={event.date}
              className="col-start-1 row-start-1 row-end-3 shrink-0 rounded-md bg-white/10 px-2.5 py-2 text-center text-lg font-bold uppercase leading-tight text-blue-100"
            >
              {formatEventDate(event.date)}
            </time>
            {event.location ? (
              <p className="col-start-2 row-start-3 flex min-w-0 justify-end gap-1 text-right text-sm leading-tight text-white/70 [@media_(orientation:landscape)_and_(min-height:641px)]:justify-center [@media_(orientation:landscape)_and_(min-height:641px)]:text-center lg:justify-center lg:text-center">
                <MapPin className="size-3.5 shrink-0 text-red-300" aria-hidden="true" />
                <span className="min-w-0 truncate">{event.location}</span>
              </p>
            ) : null}
            <p className="col-start-2 row-start-2 min-w-0 text-right text-base leading-tight text-white/75 [@media_(orientation:landscape)_and_(min-height:641px)]:text-center lg:text-center">
              {formatEventTime(event)}
            </p>
            <p className="col-start-2 row-start-1 min-w-0 text-right text-lg font-bold leading-tight [@media_(orientation:landscape)_and_(min-height:641px)]:text-center lg:text-center">
              {event.title}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
