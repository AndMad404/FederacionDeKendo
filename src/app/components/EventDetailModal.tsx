import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
  UserRound,
} from "lucide-react";
import { useCallback, type RefObject } from "react";
import type { CalendarEvent } from "../types";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { useTransientDirectionFeedback } from "../hooks/useTransientDirectionFeedback";
import {
  formatEventTime,
  getEventDateLabel,
  getEventLocationName,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import {
  actionControlSurfaceClass,
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";
import { ModalShell } from "./ui/ModalShell";
import { NavigationArrowButton } from "./ui/ModalControls";

interface EventDetailModalProps {
  event: CalendarEvent;
  index: number;
  total: number;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShare: () => void;
  isShareCopied: boolean;
}

export function EventDetailModal({
  event,
  index,
  total,
  triggerRef,
  onClose,
  onPrevious,
  onNext,
  onShare,
  isShareCopied,
}: EventDetailModalProps) {
  const titleId = `event-detail-${event.id}-title`;
  const descriptionId = event.summary
    ? `event-detail-${event.id}-description`
    : undefined;
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const locationName = event.location
    ? getEventLocationName(event.location)
    : undefined;
  const {
    activeDirection: activeArrow,
    showDirection: showArrowFeedback,
  } = useTransientDirectionFeedback();
  const handlePrevious = useCallback(() => {
    showArrowFeedback("left");
    onPrevious();
  }, [onPrevious, showArrowFeedback]);
  const handleNext = useCallback(() => {
    showArrowFeedback("right");
    onNext();
  }, [onNext, showArrowFeedback]);
  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });
  const handleDialogKeyDown = useCallback(
    (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "ArrowLeft") {
        keyboardEvent.preventDefault();
        handlePrevious();
      } else if (keyboardEvent.key === "ArrowRight") {
        keyboardEvent.preventDefault();
        handleNext();
      }
    },
    [handleNext, handlePrevious],
  );

  return (
    <ModalShell
      titleId={titleId}
      descriptionId={descriptionId}
      closeLabel={`Cerrar detalle de ${event.title}`}
      triggerRef={triggerRef}
      onClose={onClose}
      onKeyDown={handleDialogKeyDown}
    >
      <article className="flex h-full touch-pan-y flex-col" {...swipeHandlers}>
        <div className="pr-12">
          {event.type ? (
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-site-accent">
              {event.type}
            </p>
          ) : null}
          <h2 id={titleId} className="text-2xl font-bold leading-tight sm:text-3xl">
            {event.title}
          </h2>
        </div>

        <dl
          className={`relative mt-5 grid gap-3 p-4 ${panelSurfaceClass}`}
        >
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

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <MapPin
              className={`mt-0.5 size-5 ${
                event.location
                  ? "text-site-accent-soft"
                  : "text-site-muted"
              }`}
              aria-hidden="true"
            />
            <div>
              <dt className="sr-only">Ubicación</dt>
              <dd>
                {event.location ? (
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block underline decoration-site-action-soft underline-offset-4 hover:text-site-action-text ${focusRingClass}`}
                  >
                    {locationName}
                    <span className="sr-only">
                      . Abre Google Maps en una pestaña nueva.
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full bg-site-media px-3 py-1 text-sm font-semibold text-site-muted">
                    Pendiente de confirmar
                  </span>
                )}
              </dd>
            </div>
          </div>

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

          <button
            type="button"
            aria-label={
              isShareCopied
                ? `Enlace de ${event.title} copiado`
                : `Compartir ${event.title}`
            }
            title={isShareCopied ? "Enlace copiado" : "Compartir evento"}
            onClick={onShare}
            className={`absolute right-3 top-3 flex size-11 items-center justify-center rounded-full transition-colors hover:border-site-action hover:bg-site-media ${actionControlSurfaceClass} ${focusRingClass}`}
          >
            {isShareCopied ? (
              <Check className="size-5" aria-hidden="true" />
            ) : (
              <Share2 className="size-5" aria-hidden="true" />
            )}
          </button>
        </dl>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {event.summary ? (
            <div id={descriptionId} className="mt-5">
              <h3 className="text-lg font-bold">Descripción</h3>
              <p className="mt-2 whitespace-pre-line text-site-muted">
                {event.summary}
              </p>
            </div>
          ) : null}

          {event.infoUrl ? (
            <a
              href={event.infoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 font-bold transition-colors hover:border-site-action hover:bg-site-media ${actionControlSurfaceClass} ${focusRingClass}`}
            >
              {event.ctaLabel ?? "Más información"}
              <ExternalLink className="ml-2 size-4" aria-hidden="true" />
              <span className="sr-only">. Abre en una pestaña nueva.</span>
            </a>
          ) : null}
        </div>

        {total > 1 ? (
          <nav
            aria-label="Navegación entre eventos"
            className="mt-6 flex min-h-11 shrink-0 items-center justify-center gap-4"
          >
            <NavigationArrowButton
              direction="previous"
              label="Ver evento anterior"
              isActive={activeArrow === "left"}
              onClick={handlePrevious}
            />
            <p className="min-w-24 text-center text-sm font-semibold" aria-live="polite">
              Evento {index + 1} de {total}
            </p>
            <NavigationArrowButton
              direction="next"
              label="Ver evento siguiente"
              isActive={activeArrow === "right"}
              onClick={handleNext}
            />
          </nav>
        ) : null}
      </article>
    </ModalShell>
  );
}
