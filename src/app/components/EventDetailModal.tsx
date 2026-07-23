import { CalendarDays, Clock, ExternalLink, MapPin, UserRound } from "lucide-react";
import type { RefObject } from "react";
import type { CalendarEvent } from "../types";
import {
  formatEventTime,
  getEventDateLabel,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";
import { ModalShell } from "./ui/ModalShell";

interface EventDetailModalProps {
  event: CalendarEvent;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function EventDetailModal({
  event,
  triggerRef,
  onClose,
}: EventDetailModalProps) {
  const titleId = `event-detail-${event.id}-title`;
  const descriptionId = event.summary
    ? `event-detail-${event.id}-description`
    : undefined;
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;

  return (
    <ModalShell
      titleId={titleId}
      descriptionId={descriptionId}
      closeLabel={`Cerrar detalle de ${event.title}`}
      triggerRef={triggerRef}
      onClose={onClose}
    >
      <article className="pr-10">
        {event.type ? (
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-site-accent">
            {event.type}
          </p>
        ) : null}
        <h2 id={titleId} className="text-2xl font-bold leading-tight sm:text-3xl">
          {event.title}
        </h2>

        <dl className={`mt-5 grid gap-3 rounded-2xl p-4 ${panelSurfaceClass}`}>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <CalendarDays
              className="mt-0.5 size-5 text-site-accent-soft"
              aria-hidden="true"
            />
            <div>
              <dt className="sr-only">Fecha</dt>
              <dd>
                <time dateTime={event.date} className="font-semibold">
                  {getEventDateLabel(event)}
                </time>
              </dd>
            </div>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <Clock
              className="mt-0.5 size-5 text-site-accent-soft"
              aria-hidden="true"
            />
            <div>
              <dt className="sr-only">Horario</dt>
              <dd>{formatEventTime(event)}</dd>
            </div>
          </div>

          {event.location ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
              <MapPin
                className="mt-0.5 size-5 text-site-accent-soft"
                aria-hidden="true"
              />
              <div>
                <dt className="sr-only">Ubicación</dt>
                <dd>
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block underline decoration-site-action-soft underline-offset-4 hover:text-site-action-text ${focusRingClass}`}
                  >
                    {event.location}
                    <span className="sr-only">
                      . Abre Google Maps en una pestaña nueva.
                    </span>
                  </a>
                </dd>
              </div>
            </div>
          ) : null}

          {event.organizer ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
              <UserRound
                className="mt-0.5 size-5 text-site-accent-soft"
                aria-hidden="true"
              />
              <div>
                <dt className="sr-only">Organiza</dt>
                <dd>
                  <span className="font-semibold">Organiza: </span>
                  {event.organizer}
                </dd>
              </div>
            </div>
          ) : null}
        </dl>

        {event.summary ? (
          <div id={descriptionId} className="mt-5">
            <h3 className="text-lg font-bold">Descripción</h3>
            <p className="mt-2 whitespace-pre-line text-site-subtle">
              {event.summary}
            </p>
          </div>
        ) : null}

        {event.infoUrl ? (
          <a
            href={event.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 font-bold transition-colors hover:bg-site-action-hover/90 hover:text-site-on-dark ${actionControlSurfaceClass} ${focusRingClass}`}
          >
            {event.ctaLabel ?? "Más información"}
            <ExternalLink className="ml-2 size-4" aria-hidden="true" />
            <span className="sr-only">. Abre en una pestaña nueva.</span>
          </a>
        ) : null}
      </article>
    </ModalShell>
  );
}
