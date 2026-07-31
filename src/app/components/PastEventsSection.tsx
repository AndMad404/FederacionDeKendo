import { Link, useLocation } from "react-router";
import { PAST_EVENTS_PAGE_SIZE } from "../config/events";
import {
  focusRingClass,
  panelSurfaceClass,
  secondaryButtonClass,
} from "../styles/shared";
import { getEventDateLabel } from "../utils/calendarEventPresentation";
import {
  getArchivePageFromPathname,
  getArchivePagePath,
  getEventPath,
  getPastEvents,
} from "../utils/eventRoutes";
import { MediaPageBanner } from "./ui/MediaPageBanner";

export function PastEventsSection() {
  const { pathname } = useLocation();
  const requestedPage = getArchivePageFromPathname(pathname) ?? 1;
  const events = getPastEvents();
  const pageCount = Math.max(1, Math.ceil(events.length / PAST_EVENTS_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageEvents = events.slice(
    (page - 1) * PAST_EVENTS_PAGE_SIZE,
    page * PAST_EVENTS_PAGE_SIZE,
  );

  return (
    <section
      aria-labelledby="past-events-title"
      className="relative mt-2 flex min-h-[calc(100svh_-_4rem_-_10px)] w-full flex-col overflow-hidden rounded-xl bg-site-canvas land-sm:min-h-[calc(100svh_-_3rem_-_6px)] tall-md:h-[calc(100%_-_0.5rem)] tall-md:min-h-0"
    >
      <MediaPageBanner
        className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
        titleId="past-events-title"
        title="Eventos pasados"
        description="Archivo histórico de actividades publicadas."
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

      <div className="flex min-h-0 flex-1 items-start justify-center p-3 sm:p-4">
        <div className={`flex w-full max-w-5xl flex-col gap-3 p-4 ${panelSurfaceClass}`}>
          {pageEvents.length ? (
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pageEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-site-border bg-site-canvas p-3"
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-site-muted">
                      {getEventDateLabel(event)}
                    </p>
                    <h2 className="mt-1 font-bold">{event.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-site-muted">
                      {event.summary ?? "Información pendiente de confirmar."}
                    </p>
                  </div>
                  <Link
                    to={getEventPath(event)}
                    className={`text-sm ${secondaryButtonClass} ${focusRingClass}`}
                  >
                    Ver página del evento
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-site-muted">
              Todavía no hay eventos en el archivo.
            </p>
          )}

          <nav
            aria-label="Paginación del archivo"
            className="mt-auto flex items-center justify-center gap-3"
          >
            {page > 1 ? (
              <Link
                to={getArchivePagePath(page - 1)}
                className={`${secondaryButtonClass} ${focusRingClass}`}
              >
                Anterior
              </Link>
            ) : null}
            <span className="text-sm font-semibold">
              Página {page} de {pageCount}
            </span>
            {page < pageCount ? (
              <Link
                to={getArchivePagePath(page + 1)}
                className={`${secondaryButtonClass} ${focusRingClass}`}
              >
                Siguiente
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </section>
  );
}
