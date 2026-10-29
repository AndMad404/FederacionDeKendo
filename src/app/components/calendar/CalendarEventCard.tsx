import { EventThumbnail } from "../events/EventThumbnail";
import { getEventThumbnail } from "../../utils/eventThumbnail";
import { MapPin } from "lucide-react";
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
  const isGeneratedThumbnail =
    getEventThumbnail(event.id)?.source === "generated";

  return (
    <li className="relative flex min-h-40 flex-col items-center gap-4 rounded-xl border border-site-border bg-site-canvas p-3 text-center transition-colors hover:border-site-action lg:min-h-36 page-fit:min-h-0 page-fit:gap-1 page-fit:p-2">
      <div className="flex w-full shrink-0 flex-col items-center gap-2 page-fit:gap-1">
        <h3 className="text-base font-bold leading-tight">{event.title}</h3>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold leading-tight text-site-action lg:px-2 lg:py-1 page-fit:py-0">
            {endDateLabel ? (
              <span className="font-normal">
                {language === "es" ? "Del " : "From "}
              </span>
            ) : null}
            <time dateTime={event.date}>{startDateLabel}</time>
            {endDateLabel && endDateValue ? (
              <>
                <span className="font-normal">
                  {language === "es" ? " hasta el " : " to "}
                </span>
                <time dateTime={endDateValue}>{endDateLabel}</time>
              </>
            ) : null}
          </span>
          {!endDateLabel ? (
            <p
              className={`text-sm leading-tight ${
                event.startTime ? "text-site-action-soft" : "text-black"
              }`}
            >
              {formatEventTime(event, language)}
            </p>
          ) : null}
        </div>
      </div>
      <EventThumbnail
        eventId={event.id}
        adaptive
        fit="contain"
        className={
          isGeneratedThumbnail
            ? "min-h-0 shrink-0 page-fit:shrink page-fit:basis-0 page-fit:flex-1 page-fit:aspect-auto"
            : "max-h-48 min-h-0 shrink page-fit:max-h-none page-fit:basis-0 page-fit:flex-1 page-fit:aspect-auto [&_img]:w-auto"
        }
      />
      <div className="mt-auto flex w-full shrink-0 items-stretch justify-between gap-2 pt-2 page-fit:gap-2 page-fit:pt-0">
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${copy.calendar.viewLocation}: ${event.title} ${copy.calendar.mapsPreposition} Google Maps`}
            aria-describedby={locationDescriptionId}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold sm:px-4 sm:text-sm transition hover:border-site-action hover:bg-site-media desktop-fine:min-h-8 desktop-fine:px-3 desktop-fine:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
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
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-site-border bg-site-surface px-2 py-2 text-xs font-semibold sm:px-3 sm:text-sm text-site-muted desktop-fine:min-h-8 desktop-fine:px-3 desktop-fine:py-1">
            {copy.common.toBeConfirmed}
          </span>
        )}
        <Link
          to={getEventPath(event, language)}
          aria-label={`${copy.common.eventDetails}: ${event.title}`}
          className={`ml-auto inline-flex min-h-11 origin-center cursor-pointer items-center justify-center rounded-full border border-site-action bg-site-action px-2 py-2 text-xs font-semibold sm:px-4 sm:text-sm text-site-on-dark desktop-fine:min-h-8 desktop-fine:px-3 desktop-fine:py-1 transition-[background-color,transform,scale] duration-200 hover:scale-[1.04] hover:bg-site-action-hover motion-reduce:transition-none motion-reduce:hover:scale-100 ${focusRingClass}`}
        >
          {copy.common.eventDetails}
        </Link>
      </div>
    </li>
  );
}
