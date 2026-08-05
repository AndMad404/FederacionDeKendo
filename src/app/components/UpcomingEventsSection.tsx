import { CALENDAR_EVENTS } from "../data/calendarEvents";
import { getUpcomingEvents } from "../utils/calendarEvents";
import { UpcomingEventCard } from "./events/UpcomingEventCard";
import { useLanguage } from "../config/i18n";
import { getLocalizedEvents } from "../utils/localizedEvents";

const maxHomepageEvents = 4;

export function UpcomingEventsSection() {
  const { copy, language } = useLanguage();
  const homepageEvents = getUpcomingEvents(
    getLocalizedEvents(CALENDAR_EVENTS, language),
    undefined,
    maxHomepageEvents,
  );

  if (homepageEvents.length === 0) return null;

  return (
    <section
      aria-labelledby="upcoming-events-title"
      className="mx-auto w-full max-w-6xl pb-2"
    >
      <div className="mb-2.5 flex items-center justify-center text-center text-site-navy lg:mb-2">
        <h2
          id="upcoming-events-title"
          className="text-lg font-bold leading-tight sm:text-xl tall-md:text-2xl"
        >
          {copy.home.upcoming}
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
