import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { EVENT_AUDIENCE_NOTICE } from "../config/events";
import {
  focusRingClass,
  panelSurfaceClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../styles/shared";
import { getEventEndDate } from "../utils/calendarEvents";
import {
  formatEventTime,
  getEventDateLabel,
  getEventLocationName,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import { findEventByPathname, getEventPath } from "../utils/eventRoutes";
import { MediaPageBanner } from "./ui/MediaPageBanner";

async function shareEvent(title: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export function EventPage() {
  const location = useLocation();
  const event = findEventByPathname(location.pathname);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const isPast = getEventEndDate(event).getTime() < Date.now();
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const canonicalPath = getEventPath(event);
  const eventTitle = event.title;

  async function handleShare() {
    const result = await shareEvent(
      eventTitle,
      new URL(canonicalPath, window.location.origin).toString(),
    );
    if (result === "copied") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <section
        aria-labelledby="event-page-title"
        className="relative mt-2 flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-xl bg-site-canvas land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-[calc(100%_-_0.5rem)] tall-md:min-h-0"
      >
        <MediaPageBanner
          className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
          titleId="event-page-title"
          title={event.title}
          description={event.type ?? "Actividad de kendo"}
          image={{
            src: "/images/calendar/kendo-calendar-1600.webp",
            sources: [
              {
                srcSet:
                  "/images/calendar/kendo-calendar-480.webp 480w, /images/calendar/kendo-calendar-960.webp 960w, /images/calendar/kendo-calendar-1600.webp 1600w",
                sizes: "100vw",
                type: "image/webp",
              },
            ],
            width: 1600,
            height: 1069,
            className: "object-[center_20%]",
          }}
        />

        <div className="flex min-h-0 flex-1 items-start justify-center p-3 sm:p-4 tall-md:items-center">
          <article
            className={`grid w-full max-w-5xl gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] md:p-5 land-sm:gap-2 land-sm:p-3 ${panelSurfaceClass}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wider text-site-accent">
                {isPast ? "Actividad finalizada" : "Actividad programada"}
              </p>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div className="flex gap-2">
                  <CalendarDays className="size-5 shrink-0 text-site-accent-soft" aria-hidden="true" />
                  <div>
                    <dt className="font-bold">Fecha</dt>
                    <dd>{getEventDateLabel(event)}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Clock className="size-5 shrink-0 text-site-accent-soft" aria-hidden="true" />
                  <div>
                    <dt className="font-bold">Horario</dt>
                    <dd>{formatEventTime(event)}</dd>
                  </div>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <MapPin className="size-5 shrink-0 text-site-accent-soft" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-bold">Ubicación</dt>
                    <dd>
                      {event.location && locationUrl ? (
                        <a
                          href={locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`underline underline-offset-4 ${focusRingClass}`}
                        >
                          {getEventLocationName(event.location)}
                          <span className="sr-only">
                            . Abre Google Maps en una pestaña nueva.
                          </span>
                        </a>
                      ) : (
                        "Pendiente de confirmar"
                      )}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4">
                <h2 className="font-bold">Descripción</h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-site-muted">
                  {event.summary ?? "Información pendiente de confirmar."}
                </p>
              </div>
            </div>

            <aside className="flex flex-col justify-between gap-4 rounded-xl bg-site-media p-4">
              <p className="text-sm leading-relaxed">{EVENT_AUDIENCE_NOTICE}</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className={`${primaryButtonClass} ${focusRingClass}`}
                >
                  {copied ? (
                    <Check className="mr-2 size-4" aria-hidden="true" />
                  ) : (
                    <Share2 className="mr-2 size-4" aria-hidden="true" />
                  )}
                  {copied ? "Enlace copiado" : "Compartir evento"}
                </button>
                <Link
                  to="/calendario/"
                  className={`${secondaryButtonClass} ${focusRingClass}`}
                >
                  Volver al calendario
                </Link>
                {isPast ? (
                  <Link
                    to="/eventos/pasados/"
                    className={`text-center text-sm font-semibold underline underline-offset-4 ${focusRingClass}`}
                  >
                    Ver archivo de eventos
                  </Link>
                ) : null}
              </div>
            </aside>
          </article>
        </div>
    </section>
  );
}
