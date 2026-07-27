import { Check, Info, MapPin, Share2 } from "lucide-react";
import type { CalendarEvent } from "../../types";
import {
  formatEventTime,
  getEventDateLabel,
  getEventLocationName,
  getLocationMapUrl,
} from "../../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
} from "../../styles/shared";

interface CalendarEventCardProps {
  event: CalendarEvent;
  isShareCopied: boolean;
  onOpen: (event: CalendarEvent, trigger: HTMLElement) => void;
  onShare: (event: CalendarEvent) => void;
}

export function CalendarEventCard({
  event,
  isShareCopied,
  onOpen,
  onShare,
}: CalendarEventCardProps) {
  const eventDateLabel = getEventDateLabel(event);
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const locationName = event.location
    ? getEventLocationName(event.location)
    : undefined;
  const locationDescriptionId = `${event.id}-calendar-location`;

  return (
    <li className="relative flex min-h-40 flex-col items-center justify-around gap-2 rounded-xl border border-site-border bg-site-canvas p-3 text-center transition-colors hover:border-site-action lg:min-h-36 lg:gap-1 lg:px-2 lg:py-1">
      <button
        type="button"
        data-calendar-event-id={event.id}
        aria-haspopup="dialog"
        aria-label={`Abrir más información sobre ${event.title}`}
        onClick={(clickEvent) => onOpen(event, clickEvent.currentTarget)}
        className={`absolute inset-0 cursor-pointer rounded-lg ${focusRingClass}`}
      />
      <h3 className="text-base font-bold leading-tight">{event.title}</h3>
      <time
        dateTime={event.date}
        aria-label={eventDateLabel}
        className="rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action lg:px-2 lg:py-1.5"
      >
        {eventDateLabel}
      </time>
      <p className="text-sm leading-tight text-site-muted">
        {formatEventTime(event)}
      </p>
      <span
        aria-hidden="true"
        className={`pointer-events-none relative z-10 inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${actionControlSurfaceClass}`}
      >
        <Info className="mr-1.5 size-4" />
        Más información
      </span>
      <div className="pointer-events-none relative z-10 flex items-center justify-center gap-2">
        {locationUrl ? (
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ubicación de ${event.title} en Google Maps`}
            aria-describedby={locationDescriptionId}
            className={`pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:border-site-action hover:bg-site-media lg:min-h-8 lg:px-2.5 lg:py-1 ${actionControlSurfaceClass} ${focusRingClass}`}
          >
            <MapPin
              className="mr-1.5 size-3.5 shrink-0 text-site-accent-soft"
              aria-hidden="true"
            />
            Ver ubicación
            <span id={locationDescriptionId} className="sr-only">
              Lugar: {locationName}. Abre Google Maps en una pestaña nueva.
            </span>
          </a>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-site-border bg-site-surface px-3 py-1.5 text-sm font-semibold text-site-muted lg:min-h-8 lg:px-2.5 lg:py-1">
            Pendiente de confirmar
          </span>
        )}
        <button
          type="button"
          aria-label={
            isShareCopied
              ? `Enlace de ${event.title} copiado`
              : `Compartir ${event.title} por WhatsApp o copiar enlace`
          }
          title={isShareCopied ? "Enlace copiado" : "Compartir evento"}
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
