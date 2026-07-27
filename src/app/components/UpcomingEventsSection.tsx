import { CALENDAR_EVENTS } from "../data/calendarEvents";
import { getUpcomingEvents } from "../utils/calendarEvents";
import { UpcomingEventCard } from "./events/UpcomingEventCard";

const maxHomepageEvents = 4;

export function UpcomingEventsSection() {
  const homepageEvents = getUpcomingEvents(
    CALENDAR_EVENTS,
    undefined,
    maxHomepageEvents,
  );

  if (homepageEvents.length === 0) return null;

  return (
    <section
      aria-labelledby="upcoming-events-title"
      className="mx-auto w-full max-w-6xl pb-2 text-site-text"
    >
      <div className="mb-2.5 flex items-center justify-center text-center text-site-navy lg:mb-2">
        <h2
          id="upcoming-events-title"
          className="text-lg font-bold leading-tight sm:text-xl tall-md:text-2xl"
        >
          Próximos encuentros
        </h2>
      </div>

      <ul className="grid gap-3 land-sm:grid-cols-2 land-tall:grid-cols-4 lg:grid-cols-4 lg:gap-2">
        {homepageEvents.map((event, index) => (
          <UpcomingEventCard key={event.id} event={event} index={index} />
        ))}
      </ul>
    </section>
  );
}
