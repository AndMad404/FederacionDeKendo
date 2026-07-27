import { MapPin } from "lucide-react";
import { Link } from "react-router";
import { actionControlSurfaceClass, focusRingClass } from "../../styles/shared";
import type { CalendarEvent } from "../../types";
import {
  getEventDateRangeLabels,
  getEventLocationName,
  getLocationMapUrl,
} from "../../utils/calendarEventPresentation";

const actionClass =
  `inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg px-3 py-1.5 text-center text-sm font-semibold leading-tight transition-colors hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass}`;

function getEventVisibilityClass(index: number) {
  if (index === 2) return "land-sm:hidden";
  if (index === 3) return "hidden lg:flex land-sm:hidden land-tall:flex";
  return "";
}

interface UpcomingEventCardProps {
  event: CalendarEvent;
  index: number;
}

export function UpcomingEventCard({
  event,
  index,
}: UpcomingEventCardProps) {
  const { startDateLabel, endDateLabel } = getEventDateRangeLabels(event);
  const eventDateLabel = endDateLabel
    ? `${startDateLabel} - ${endDateLabel}`
    : startDateLabel;
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const locationName = event.location
    ? getEventLocationName(event.location)
    : undefined;
  const locationDescriptionId = `${event.id}-location-description`;

  return (
    <li
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border border-site-border bg-site-surface p-3 shadow-sm land-tall:flex land-tall:flex-col land-tall:justify-around land-tall:gap-2 land-tall:text-center lg:flex lg:flex-col lg:justify-around lg:gap-1.5 lg:p-2 lg:text-center ${getEventVisibilityClass(index)}`}
    >
      <h3 className="col-start-2 row-start-1 min-w-0 text-right text-base font-bold leading-tight land-tall:text-center lg:text-center">
        {event.title}
      </h3>
      <time
        dateTime={event.date}
        aria-label={eventDateLabel}
        className="col-start-1 row-start-1 max-w-[10rem] shrink-0 rounded-lg bg-site-media px-2.5 py-2 text-center text-sm font-bold uppercase leading-tight text-site-action land-tall:max-w-none lg:max-w-none lg:px-2 lg:py-1.5"
      >
        <span className="whitespace-nowrap">{startDateLabel}</span>
        {endDateLabel ? (
          <>
            <span className="hidden sm:inline" aria-hidden="true">
              {" - "}
            </span>
            <span className="block whitespace-nowrap sm:inline">
              {endDateLabel}
            </span>
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
          className={`col-start-1 row-start-2 justify-self-center ${actionClass} ${focusRingClass}`}
        >
          <MapPin
            className="mr-1.5 size-3.5 shrink-0 text-site-accent"
            aria-hidden="true"
          />
          <span>Cómo llegar</span>
          <span id={locationDescriptionId} className="sr-only">
            Lugar: {locationName}. Abre Google Maps en una pestaña nueva.
          </span>
        </a>
      ) : (
        <span
          className={`col-start-1 row-start-2 justify-self-center text-site-muted ${actionClass}`}
        >
          Pendiente de confirmar
        </span>
      )}

      <Link
        to={`/calendario/#${encodeURIComponent(event.id)}`}
        aria-label={`Consultar detalles del evento ${event.title}`}
        className={`col-start-2 row-start-2 justify-self-end ${actionClass} ${focusRingClass}`}
      >
        Detalles del evento
      </Link>
    </li>
  );
}
