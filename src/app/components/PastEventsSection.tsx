import { Link, useLocation, useNavigate } from "react-router";
import { PAST_EVENTS_PAGE_SIZE } from "../config/events";
import {
  focusRingClass,
  panelSurfaceClass,
  primaryButtonClass,
} from "../styles/shared";
import { getEventDateLabel } from "../utils/calendarEventPresentation";
import {
  getArchivePageFromPathname,
  getEventPath,
  getPastEvents,
} from "../utils/eventRoutes";
import {
  buildArchiveUrl,
  filterAndSortArchiveEvents,
  getArchiveYears,
  normalizeArchiveFilters,
  type ArchiveEventType,
} from "../utils/eventArchive.js";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { useLanguage } from "../config/i18n";
import { getLocalizedEvents } from "../utils/localizedEvents";
import { useHydratedNow } from "../hooks/useHydratedNow";
import { EventSummary } from "./EventSummary";
import { EventSectionNavigation } from "./events/EventSectionNavigation";
import { NavigationArrowButton } from "./ui/ModalControls";

export function PastEventsSection() {
  const { language, copy } = useLanguage();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const now = useHydratedNow();
  const requestedPage = getArchivePageFromPathname(pathname) ?? 1;
  const historicalEvents = now ? getPastEvents(now) : [];
  const searchParams = new URLSearchParams(search);
  const filters = normalizeArchiveFilters({
    year: searchParams.get("year") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });
  const events = getLocalizedEvents(
    filterAndSortArchiveEvents(historicalEvents, filters),
    language,
  );
  const years = getArchiveYears(historicalEvents);
  const pageCount = Math.max(
    1,
    Math.ceil(events.length / PAST_EVENTS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, pageCount);
  const pageEvents = events.slice(
    (page - 1) * PAST_EVENTS_PAGE_SIZE,
    page * PAST_EVENTS_PAGE_SIZE,
  );
  const eventTypes: ArchiveEventType[] = ["torneo", "examen", "seminario"];

  function changeFilter(name: "year" | "type", value: string) {
    navigate(
      buildArchiveUrl(1, language, { ...filters, [name]: value || undefined }),
    );
  }

  return (
    <section
      aria-labelledby="past-events-title"
      className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas tall-md:h-[calc(100%_-_1rem)] tall-md:min-h-0"
    >
      <MediaPageBanner
        className="relative z-10 h-28 shrink-0 overflow-hidden land-compact:h-20"
        titleId="past-events-title"
        title={copy.archive.title}
        description={copy.archive.description}
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

      <div className="relative z-20 -mt-11 flex min-h-0 flex-1 items-start justify-center px-3 pb-0 pt-3 sm:-mt-13 sm:px-4 sm:pb-0 sm:pt-4 tall-md:p-4 page-fit:absolute page-fit:inset-0 page-fit:mt-0 page-fit:items-start page-fit:px-4 page-fit:pb-4 page-fit:pt-20 land-sm:px-2 land-sm:pb-0 land-sm:pt-2 land-compact:-mt-8">
        <div
          data-page-content-boundary
          className={`flex w-full touch-pan-y select-none flex-col justify-start gap-3 px-3 py-4 text-center sm:px-2 md:max-w-5xl md:gap-2 md:py-4 xl:min-h-[24.625rem] page-fit:py-[15px] land-sm:gap-2 land-sm:px-2 land-sm:py-2 ${panelSurfaceClass}`}
        >
          <EventSectionNavigation active="past" />

          <div className="grid grid-cols-2 items-end gap-3 md:mx-auto md:w-fit md:grid-cols-[auto_auto]">
            <label className="relative min-w-0 text-xs font-bold text-site-muted">
              <select
                name="year"
                aria-label={copy.archive.year}
                value={filters.year ?? ""}
                onChange={(event) => changeFilter("year", event.target.value)}
                className={`min-h-11 w-full rounded-lg px-3 py-2 text-center text-sm ${focusRingClass} border border-site-border bg-site-surface text-site-action`}
              >
                <option value="">{copy.archive.year}</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative min-w-0 text-xs font-bold text-site-muted">
              <select
                name="type"
                aria-label={copy.archive.type}
                value={filters.type ?? ""}
                onChange={(event) => changeFilter("type", event.target.value)}
                className={`min-h-11 w-full rounded-lg px-3 py-2 text-center text-sm ${focusRingClass} border border-site-border bg-site-surface text-site-action`}
              >
                <option value="">{copy.archive.eventType}</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {copy.archive.types[type]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <nav
            aria-label={copy.archive.pagination}
            className="flex items-center justify-center gap-4"
          >
            <NavigationArrowButton
              direction="previous"
              label={copy.archive.previous}
              disabled={page === 1}
              onClick={() =>
                navigate(buildArchiveUrl(page - 1, language, filters))
              }
            />
            <NavigationArrowButton
              direction="next"
              label={copy.archive.next}
              disabled={page === pageCount}
              onClick={() =>
                navigate(buildArchiveUrl(page + 1, language, filters))
              }
            />
          </nav>

          {pageEvents.length ? (
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {pageEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-site-border bg-site-canvas p-3"
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-site-muted">
                      {getEventDateLabel(event, language)}
                    </p>
                    <h2 className="mt-1 font-bold">{event.title}</h2>
                    <div className="mt-1">
                      <EventSummary
                        summary={
                          event.summary ?? copy.common.informationPending
                        }
                        compact
                      />
                    </div>
                  </div>
                  <Link
                    to={getEventPath(event, language)}
                    className={`text-sm ${primaryButtonClass} ${focusRingClass}`}
                  >
                    {copy.archive.viewEvent}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-site-muted">
              {copy.archive.empty}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
