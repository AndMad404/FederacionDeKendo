import { Info, MapPin } from "lucide-react";
import { Link } from "react-router";
import type { CalendarEvent } from "../../types";
import {
  formatEventTime,
  getEventDateRangeLabels,
  getEventLocationName,
  getLocationMapUrl,
} from "../../utils/calendarEventPresentation";
import { actionControlSurfaceClass, focusRingClass } from "../../styles/shared";
import { getEventPath } from "../../utils/eventRoutes";
import { useLanguage } from "../../config/i18n";

interface CalendarEventCardProps {
  event: CalendarEvent;
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const { language, copy } = useLanguage();
  const { startDateLabel, endDateLabel, endDateValue } =
    getEventDateRangeLabels(event, language);
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const locationName = event.location
    ? getEventLocationName(event.location)
    : undefined;
  const locationDescriptionId = `${event.id}-calendar-location`;

  return (
    <li className="relative flex min-h-40 flex-col items-center justify-around gap-2 rounded-xl border border-site-border bg-site-canvas p-3 text-center transition-colors hover:border-site-action lg:min-h-36 lg:gap-1 lg:px-2 lg:py-1">
      <h3 className="text-base font-bold leading-tight">{event.title}</h3>
      <span className="rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action lg:px-2 lg:py-1.5">
        <time dateTime={event.date}>{startDateLabel}</time>
        {endDateLabel && endDateValue ? (
          <>
            <span aria-hidden="true">{" - "}</span>
            <span className="sr-only"> {copy.common.rangeSeparator} </span>
            <time dateTime={endDateValue}>{endDateLabel}</time>
          </>
        ) : null}
      </span>
      <p className="text-sm leading-tight text-site-action-soft">
        {formatEventTime(event, language)}
      </p>
      {locationUrl ? (
        <a
          href={locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${copy.calendar.openLocationLabel} ${event.title} ${copy.calendar.mapsPreposition} Google Maps`}
          aria-describedby={locationDescriptionId}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 touch:!min-h-11 ${actionControlSurfaceClass} ${focusRingClass}`}
        >
          <MapPin
            className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
            aria-hidden="true"
          />
          {copy.calendar.viewLocation}
          <span id={locationDescriptionId} className="sr-only">
            {copy.common.place}: {locationName}. {copy.common.opensMaps}
          </span>
        </a>
      ) : (
        <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-site-border bg-site-surface px-3 py-1.5 text-sm font-semibold text-site-muted lg:min-h-8 lg:px-2.5 lg:py-1">
          {copy.common.toBeConfirmed}
        </span>
      )}
      <div className="flex items-center justify-center gap-2">
        <Link
          to={getEventPath(event, language)}
          aria-label={`${copy.calendar.viewDetailsLabel} ${event.title}`}
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-site-action bg-site-action px-3 py-1 text-sm font-semibold text-site-on-dark transition-colors hover:bg-site-action-hover lg:min-h-8 touch:!min-h-11 ${focusRingClass}`}
        >
          <Info className="mr-1.5 size-4" />
          {copy.common.eventDetails}
        </Link>
      </div>
    </li>
  );
}
