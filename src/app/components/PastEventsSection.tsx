import { useEffect, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ChevronDown } from "lucide-react";
import {
  MOBILE_PAST_EVENTS_PAGE_SIZE,
  PAST_EVENTS_PAGE_SIZE,
} from "../config/events";
import {
  focusRingClass,
  panelSurfaceClass,
  primaryButtonClass,
} from "../styles/shared";
import { getEventDateLabel } from "../utils/calendarEventPresentation";
import { getEventPath, getPastEvents } from "../utils/eventRoutes";
import { EVENT_GALLERIES } from "../data/eventGalleries";
import {
  buildArchiveUrl,
  filterAndSortArchiveEvents,
  getArchivePageNumber,
  getArchiveYears,
  normalizeArchiveFilters,
  type ArchiveEventType,
} from "../utils/eventArchive.ts";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { useLanguage } from "../config/i18n";
import { getLocalizedEvents } from "../utils/localizedEvents";
import { useHydratedNow, useIsHydrated } from "../hooks/useHydratedNow";
import { useSwipeNavigation } from "../hooks/useSwipeNavigation";
import { EventSummary } from "./EventSummary";
import { EventSectionNavigation } from "./events/EventSectionNavigation";
import { NavigationArrowButton } from "./ui/ModalControls";

const mobileArchiveQuery = "(max-width: 767px)";
// Native option popups can omit CSS right padding; keep a small trailing gutter.
const nativeOptionTrailingSpace = "\u00a0\u00a0";
const subscribeToViewport = (callback: () => void) => {
  const query = window.matchMedia(mobileArchiveQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getMobileViewport = () => window.matchMedia(mobileArchiveQuery).matches;
const getServerViewport = () => true;

function getEventThumbnail(eventId: string) {
  const images = EVENT_GALLERIES[eventId]?.images ?? [];
  const targetRatio = 16 / 9;
  const horizontalImages = images.filter(
    (image) => image.width / image.height >= 1.3,
  );
  return [...(horizontalImages.length ? horizontalImages : images)].sort(
    (a, b) =>
      Math.abs(a.width / a.height - targetRatio) -
      Math.abs(b.width / b.height - targetRatio),
  )[0];
}

export function PastEventsSection() {
  const { language, copy } = useLanguage();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isHydrated = useIsHydrated();
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getMobileViewport,
    getServerViewport,
  );
  const now = useHydratedNow();
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
  const routePage = getArchivePageNumber(pathname, language);
  // Mobile pages have canonical routes. Keep them readable if opened on a wider screen.
  const desktopPageCount = Math.max(
    1,
    Math.ceil(events.length / PAST_EVENTS_PAGE_SIZE),
  );
  const pageSize =
    isMobile || routePage > desktopPageCount
      ? MOBILE_PAST_EVENTS_PAGE_SIZE
      : PAST_EVENTS_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const legacyPage = Number(searchParams.get("page"));
  const requestedPage =
    Number.isInteger(legacyPage) && legacyPage > 0 ? legacyPage : routePage;
  const page = Math.min(requestedPage, pageCount);
  const canonicalPageUrl = buildArchiveUrl(page, language, filters);
  const hasLegacyPageQuery = searchParams.has("page");
  const pageEvents = events.slice((page - 1) * pageSize, page * pageSize);
  const eventTypes: ArchiveEventType[] = ["torneo", "examen", "seminario"];

  useEffect(() => {
    if (hasLegacyPageQuery) navigate(canonicalPageUrl, { replace: true });
  }, [canonicalPageUrl, hasLegacyPageQuery, navigate]);

  const navigateToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > pageCount) return;
    navigate(buildArchiveUrl(targetPage, language, filters));
  };
  const { swipeHandlers } = useSwipeNavigation({
    onSwipeLeft: () => navigateToPage(page + 1),
    onSwipeRight: () => navigateToPage(page - 1),
    allowInteractiveStart: true,
    preventDefaultOnSwipe: true,
  });

  function changeFilter(name: "year" | "type", value: string) {
    navigate(
      buildArchiveUrl(1, language, {
        ...filters,
        [name]: value || undefined,
      }),
    );
  }

  return (
    <section
      aria-labelledby="past-events-title"
      data-interactive-ready={isHydrated ? "past-events" : undefined}
      className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas tablet-fit:mb-3 page-fit:h-[calc(100%_-_1rem)] page-fit:min-h-0"
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
          className={`flex w-full touch-pan-y select-none flex-col justify-start gap-3 p-3 sm:gap-4 text-center sm:p-4 md:max-w-5xl land-sm:p-2 ${panelSurfaceClass}`}
          {...swipeHandlers}
        >
          <EventSectionNavigation active="past" />

          <div className="my-[-0.1875px] grid w-full grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 sm:mx-auto sm:w-fit sm:grid-cols-[2.75rem_8.5rem_8.5rem_2.75rem] sm:gap-4 md:grid-cols-[3rem_8.5rem_8.5rem_3rem]">
            <nav aria-label={copy.archive.pagination} className="contents">
              <NavigationArrowButton
                direction="previous"
                label={copy.archive.previous}
                disabled={page === 1}
                className="order-[-1] col-start-1"
                onClick={() => navigateToPage(page - 1)}
              />
              <NavigationArrowButton
                direction="next"
                label={copy.archive.next}
                disabled={page === pageCount}
                className="order-1 col-start-4"
                onClick={() => navigateToPage(page + 1)}
              />
            </nav>
            <label className="relative min-w-0 text-xs font-bold text-site-muted sm:w-fit sm:justify-self-end">
              <span
                aria-hidden="true"
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-site-text"
              >
                <span>{filters.year ?? copy.archive.year}</span>
                <ChevronDown className="size-4 shrink-0" />
              </span>
              <select
                name="year"
                aria-label={copy.archive.year}
                value={filters.year ?? ""}
                onChange={(event) => changeFilter("year", event.target.value)}
                className={`absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-lg p-0 text-center text-sm text-transparent [text-align-last:center] ${focusRingClass} border border-site-border bg-transparent`}
              >
                <option value="" hidden>
                  {copy.archive.year}
                </option>
                {years.map((year) => (
                  <option
                    key={year}
                    value={year}
                    className="bg-site-surface text-site-text"
                  >
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative min-w-0 text-xs font-bold text-site-muted sm:w-fit sm:justify-self-start">
              <span
                aria-hidden="true"
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-site-text"
              >
                <ChevronDown className="size-4 shrink-0" />
                <span>
                  {filters.type
                    ? copy.archive.types[filters.type]
                    : copy.archive.type}
                </span>
              </span>
              <select
                name="type"
                aria-label={copy.archive.type}
                value={filters.type ?? ""}
                onChange={(event) => changeFilter("type", event.target.value)}
                className={`absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-lg px-2 py-0 text-left text-sm text-transparent ${focusRingClass} border border-site-border bg-transparent`}
              >
                <option value="" hidden>
                  {copy.archive.type}
                </option>
                {eventTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                    className="bg-site-surface text-site-text"
                  >
                    {copy.archive.types[type]}
                    {nativeOptionTrailingSpace}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pageEvents.length ? (
            <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pageEvents.map((event) => {
                const thumbnail = getEventThumbnail(event.id);

                return (
                  <li
                    key={event.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-site-border bg-site-canvas p-3"
                  >
                    <div>
                      <h2 className="font-bold">{event.title}</h2>
                      <p className="mt-1 inline-block rounded-lg bg-site-media px-2.5 py-2 text-sm font-bold uppercase leading-tight text-site-action lg:px-2 lg:py-1">
                        {getEventDateLabel(event, language)}
                      </p>
                      <div className="mt-2">
                        {thumbnail ? (
                          <picture
                            data-event-thumbnail
                            className="flex aspect-video h-auto w-full max-w-full items-center justify-center overflow-hidden rounded-lg bg-site-surface"
                          >
                            <source
                              srcSet={thumbnail.srcSet.avif}
                              sizes="(min-width: 1024px) 14rem, (min-width: 768px) 50vw, 100vw"
                              type="image/avif"
                            />
                            <img
                              src={thumbnail.src}
                              srcSet={thumbnail.srcSet.webp}
                              sizes="(min-width: 1024px) 14rem, (min-width: 768px) 50vw, 100vw"
                              alt=""
                              width={thumbnail.width}
                              height={thumbnail.height}
                              loading="lazy"
                              decoding="async"
                              className="block h-full max-h-full w-full max-w-full rounded-lg object-cover object-center"
                            />
                          </picture>
                        ) : (
                          <EventSummary
                            summary={
                              event.summary ?? copy.common.informationPending
                            }
                            compact
                          />
                        )}
                      </div>
                    </div>
                    <Link
                      to={getEventPath(event, language)}
                      className={`text-sm ${primaryButtonClass} ${focusRingClass}`}
                    >
                      {copy.archive.viewEvent}
                    </Link>
                  </li>
                );
              })}
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
