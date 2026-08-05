import { Check, Info, MapPin, Share2 } from "lucide-react";
import { Link } from "react-router";
import type { CalendarEvent } from "../../types";
import {
  formatEventTime,
  getEventDateRangeLabels,
  getEventLocationName,
  getLocationMapUrl,
} from "../../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
} from "../../styles/shared";
import { getEventPath } from "../../utils/eventRoutes";
import { useLanguage } from "../../config/i18n";

interface CalendarEventCardProps {
  event: CalendarEvent;
  isShareCopied: boolean;
  onShare: (event: CalendarEvent) => void;
}

export function CalendarEventCard({
  event,
  isShareCopied,
  onShare,
}: CalendarEventCardProps) {
  const { language } = useLanguage();
  const english = language === "en";
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
      <span
        className="rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action lg:px-2 lg:py-1.5"
      >
        <time dateTime={event.date}>{startDateLabel}</time>
        {endDateLabel && endDateValue ? (
          <>
            <span aria-hidden="true">{" - "}</span>
            <span className="sr-only"> {english ? "to" : "al"} </span>
            <time dateTime={endDateValue}>{endDateLabel}</time>
          </>
        ) : null}
      </span>
      <p className="text-sm leading-tight text-site-action-soft">
        {formatEventTime(event, language)}
      </p>
      <Link
        to={getEventPath(event, language)}
        aria-label={english ? `View details for ${event.title}` : `Ver detalles del evento ${event.title}`}
        className={`relative z-10 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-3 py-1 text-sm font-semibold transition hover:border-site-action hover:bg-site-media lg:min-h-8 ${actionControlSurfaceClass} ${focusRingClass}`}
      >
        <Info className="mr-1.5 size-4" />
        {english ? "Event details" : "Detalles del evento"}
      </Link>
      <div className="pointer-events-none relative z-10 flex items-center justify-center gap-2">
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={english ? `Open the location of ${event.title} in Google Maps` : `Abrir ubicación de ${event.title} en Google Maps`}
            aria-describedby={locationDescriptionId}
            className={`pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
          >
            <MapPin
              className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
              aria-hidden="true"
            />
            {english ? "View location" : "Ver ubicación"}
            <span id={locationDescriptionId} className="sr-only">
              {english ? "Place" : "Lugar"}: {locationName}. {english ? "Opens Google Maps in a new tab." : "Abre Google Maps en una pestaña nueva."}
            </span>
          </a>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-site-border bg-site-surface px-3 py-1.5 text-sm font-semibold text-site-muted lg:min-h-8 lg:px-2.5 lg:py-1">
            {english ? "To be confirmed" : "Pendiente de confirmar"}
          </span>
        )}
        <button
          type="button"
          aria-label={
            isShareCopied
              ? english ? `Link for ${event.title} copied` : `Enlace de ${event.title} copiado`
              : english ? `Share ${event.title} via WhatsApp or copy link` : `Compartir ${event.title} por WhatsApp o copiar enlace`
          }
          title={isShareCopied ? (english ? "Link copied" : "Enlace copiado") : (english ? "Share event" : "Compartir evento")}
          onClick={() => onShare(event)}
          className={`pointer-events-auto flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:border-site-action hover:bg-site-media lg:size-8 ${actionControlSurfaceClass} ${focusRingClass}`}
        >
          {isShareCopied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
}
