import { Info, MapPin } from "lucide-react";
import { Link } from "react-router";
import { actionControlSurfaceClass, focusRingClass } from "../../styles/shared";
import type { CalendarEvent } from "../../types";
import {
  getEventDateRangeLabels,
  getEventLocationName,
  getLocationMapUrl,
} from "../../utils/calendarEventPresentation";
import { getEventPath } from "../../utils/eventRoutes";
import { useLanguage } from "../../config/i18n";

const actionClass = `inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg px-3 py-1.5 text-center text-sm font-semibold leading-tight transition-colors hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass}`;

const eventDetailsClass =
  "inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border border-site-action bg-site-action px-3 py-1 text-center text-sm font-semibold leading-tight text-site-on-dark transition-colors hover:bg-site-action-hover lg:min-h-8";

function getEventVisibilityClass(index: number) {
  if (index === 2) return "land-sm:hidden";
  if (index === 3) return "hidden lg:flex land-sm:hidden land-tall:flex";
  return "";
}

interface UpcomingEventCardProps {
  event: CalendarEvent;
  index: number;
}

export function UpcomingEventCard({ event, index }: UpcomingEventCardProps) {
  const { language, copy } = useLanguage();
  const { startDateLabel, endDateLabel, endDateValue } =
    getEventDateRangeLabels(event, language);
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const locationName = event.location
    ? getEventLocationName(event.location)
    : undefined;
  const locationDescriptionId = `${event.id}-location-description`;

  return (
    <li
      className={`grid grid-cols-2 items-center gap-x-3 gap-y-2 rounded-xl border border-site-border bg-site-surface p-3 shadow-sm land-tall:flex land-tall:flex-col land-tall:justify-around land-tall:gap-2 land-tall:text-center lg:flex lg:flex-col lg:justify-around lg:gap-1.5 lg:p-2 lg:text-center ${getEventVisibilityClass(index)}`}
    >
      <h3 className="col-start-2 row-start-1 min-w-0 text-right text-base font-bold leading-tight land-tall:text-center lg:text-center">
        {event.title}
      </h3>
      <span className="col-start-1 row-start-1 w-28 shrink-0 rounded-lg bg-site-media px-2.5 py-2 text-center text-sm font-bold uppercase leading-tight text-site-action sm:w-auto sm:max-w-[10rem] land-tall:max-w-none lg:max-w-none lg:px-2 lg:py-1.5">
        <time dateTime={event.date} className="whitespace-nowrap">
          {startDateLabel}
        </time>
        {endDateLabel && endDateValue ? (
          <>
            <span className="hidden sm:inline" aria-hidden="true">
              {" - "}
            </span>
            <span className="sr-only"> {copy.common.rangeSeparator} </span>
            <time
              dateTime={endDateValue}
              className="block whitespace-nowrap sm:inline"
            >
              {endDateLabel}
            </time>
          </>
        ) : null}
      </span>

      {locationUrl ? (
        <a
          href={locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${copy.calendar.openLocationLabel} ${event.title} ${copy.calendar.mapsPreposition} Google Maps`}
          aria-describedby={locationDescriptionId}
          className={`col-start-1 row-start-2 w-fit justify-self-center ${actionClass} ${focusRingClass}`}
        >
          <MapPin
            className="mr-1.5 size-3.5 shrink-0 text-site-accent"
            aria-hidden="true"
          />
          <span>{copy.calendar.viewLocation}</span>
          <span id={locationDescriptionId} className="sr-only">
            {copy.common.place}: {locationName}. {copy.common.opensMaps}
          </span>
        </a>
      ) : (
        <span
          className={`col-start-1 row-start-2 w-full justify-self-center text-site-muted ${actionClass}`}
        >
          {copy.common.toBeConfirmed}
        </span>
      )}

      <Link
        to={getEventPath(event, language)}
        aria-label={`${copy.event.viewDetailsLabel} ${event.title}`}
        className={`col-start-2 row-start-2 w-fit justify-self-center ${eventDetailsClass} ${focusRingClass}`}
      >
        <Info className="mr-1.5 size-4 shrink-0" aria-hidden="true" />
        {copy.common.eventDetails}
      </Link>
    </li>
  );
}
