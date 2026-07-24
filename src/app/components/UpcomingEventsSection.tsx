import { MapPin } from "lucide-react";
import { Link } from "react-router";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";
import { getUpcomingEvents } from "../utils/calendarEvents";
import { actionControlSurfaceClass, focusRingClass } from "../styles/shared";

const maxHomepageEvents = 4;
const actionPillClass =
  `inline-flex min-h-11 min-w-0 items-center justify-center rounded-full px-3 py-1.5 text-center text-sm font-semibold leading-tight transition-colors lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass}`;
const eventDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatCalendarDate(date: Date) {
  return eventDateFormatter.format(date).replace(".", "").toUpperCase();
}

function formatEventDate(date: string) {
  return formatCalendarDate(new Date(`${date}T00:00:00.000Z`));
}

function getInclusiveEndDate(date: string) {
  const endDate = new Date(`${date}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  return formatCalendarDate(endDate);
}

function getEventDateRangeLabels({ date, endDate }: CalendarEvent) {
  const startDateLabel = formatEventDate(date);

  return {
    startDateLabel,
    endDateLabel: endDate ? getInclusiveEndDate(endDate) : undefined,
  };
}

function getLocationMapUrl(location: string) {
  const params = new URLSearchParams({
    api: "1",
    query: location,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function getEventVisibilityClass(index: number) {
  if (index === 2) {
    return "land-sm:hidden";
  }

  if (index === 3) {
    return "hidden lg:flex land-sm:hidden land-tall:flex";
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
      className="mx-auto w-full max-w-6xl pt-2.5 pb-0 text-site-on-dark sm:px-4 tall-md:pb-1 tall-md:pt-1.5"
    >
      <div className="mb-2.5 flex items-center justify-center text-center font-semibold text-site-on-dark lg:mb-2">
        <h2
          id="upcoming-events-title"
          className="text-lg font-bold leading-tight sm:text-xl tall-md:text-2xl"
        >
          Calendario de Próximos Eventos
        </h2>
      </div>

      <ul className="grid gap-3 land-sm:grid-cols-2 land-tall:grid-cols-4 lg:grid-cols-4 lg:gap-2">
        {homepageEvents.map((event, index) => {
          const { startDateLabel, endDateLabel } = getEventDateRangeLabels(event);
          const eventDateLabel = endDateLabel
            ? `${startDateLabel} - ${endDateLabel}`
            : startDateLabel;
          const locationUrl = event.location ? getLocationMapUrl(event.location) : undefined;
          const locationDescriptionId = `${event.id}-location-description`;

          return (
            <li
              key={event.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-lg border border-site-action/70 bg-site-on-dark/[0.06] p-3 land-tall:flex land-tall:flex-col land-tall:justify-around land-tall:gap-2 land-tall:text-center lg:flex lg:flex-col lg:justify-around lg:gap-1.5 lg:p-2 lg:text-center ${getEventVisibilityClass(index)}`}
            >
              <h3 className="col-start-2 row-start-1 min-w-0 text-right text-base font-bold leading-tight land-tall:text-center lg:text-center">
                {event.title}
              </h3>

              <time
                dateTime={event.date}
                aria-label={eventDateLabel}
                className="col-start-1 row-start-1 max-w-[10rem] shrink-0 rounded-md bg-site-on-dark/10 px-2.5 py-2 text-center text-sm font-bold uppercase leading-tight text-site-action-text land-tall:max-w-none lg:max-w-none lg:px-2 lg:py-1.5"
              >
                <span className="whitespace-nowrap">{startDateLabel}</span>
                {endDateLabel ? (
                  <>
                    <span className="hidden sm:inline" aria-hidden="true">
                      {" - "}
                    </span>
                    <span className="block whitespace-nowrap sm:inline">{endDateLabel}</span>
                  </>
                ) : null}
              </time>

              {locationUrl ? (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir ubicación de ${event.title} en Google Maps`}
                  aria-describedby={locationDescriptionId}
                  className={`col-start-1 row-start-2 justify-self-center ${actionPillClass} hover:bg-site-action-hover/90 hover:text-site-on-dark ${focusRingClass}`}
                >
                  <MapPin className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft" aria-hidden="true" />
                  <span>Cómo llegar</span>
                  <span id={locationDescriptionId} className="sr-only">
                    Dirección: {event.location}. Abre Google Maps en una pestaña nueva.
                  </span>
                </a>
              ) : (
                <span className={`col-start-1 row-start-2 justify-self-center ${actionPillClass} border-site-on-dark/20 text-site-on-dark/65`}>
                  Pendiente de confirmar
                </span>
              )}

              <Link
                to={`/calendario/#${encodeURIComponent(event.id)}`}
                aria-label={`Consultar detalles del evento ${event.title}`}
                className={`col-start-2 row-start-2 justify-self-end ${actionPillClass} hover:bg-site-action-hover/90 hover:text-site-on-dark ${focusRingClass}`}
              >
                Detalles del evento
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
