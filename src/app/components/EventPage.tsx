import {
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Globe2,
  MapPin,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../config/i18n";
import { getLocalizedEvent } from "../utils/localizedEvents";
import {
  focusRingClass,
  panelSurfaceClass,
  secondaryButtonClass,
} from "../styles/shared";
import { isExternalEvent, isPastEvent } from "../utils/calendarEvents";
import {
  formatEventTime,
  getEventDateLabel,
  getGoogleCalendarUrl,
  getEventLocationName,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import { findEventByPathname, getEventPath } from "../utils/eventRoutes";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { HistoricalEventGallery } from "./HistoricalEventGallery";
import { useHydratedNow } from "../hooks/useHydratedNow";
import { EventSummary } from "./EventSummary";
import { EVENT_GALLERIES } from "../data/eventGalleries";

const SOCIAL_PREVIEW_VERSION = "20260825";

const eventNavigationLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-5 py-2 font-bold transition-[box-shadow,transform] duration-200 hover:scale-[1.025] hover:shadow-md active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100";

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
  const { language, copy } = useLanguage();
  const location = useLocation();
  const sourceEvent = findEventByPathname(location.pathname);
  const [copied, setCopied] = useState(false);
  const now = useHydratedNow();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    const article = content?.querySelector("article");
    const actions = article?.querySelector("aside");
    const footer = document.querySelector("footer");
    if (
      !content ||
      !article ||
      !actions ||
      !footer ||
      !content.querySelector("figure")
    )
      return;

    // Keep short text compact while the gallery fills available space or grows with content.
    const measure = () => {
      const contentTop = content.getBoundingClientRect().top + window.scrollY;
      const availableHeight =
        window.innerHeight -
        footer.getBoundingClientRect().height -
        contentTop -
        10;
      const articleBox = article.getBoundingClientRect();
      const actionsBox = actions.getBoundingClientRect();
      const galleryHeight = Math.max(articleBox.height, availableHeight);
      content.style.setProperty(
        "--event-featured-height",
        `${Math.max(1, galleryHeight - actionsBox.height - 10)}px`,
      );
      content.style.setProperty(
        "--event-thumbnail-height",
        `${actionsBox.height}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(article);
    observer.observe(actions);
    observer.observe(footer);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [language, location.pathname, now]);

  if (!sourceEvent) return null;
  const event = getLocalizedEvent(sourceEvent, language);
  if (!event) return null;

  const isPast = now ? isPastEvent(event, now) : false;
  const hasGallery =
    isPast && Boolean(EVENT_GALLERIES[event.id]?.images.length);
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const canonicalPath = getEventPath(event, language, now);
  const eventTitle = event.title;

  async function handleShare() {
    const shareUrl = new URL(canonicalPath, window.location.origin);
    shareUrl.searchParams.set("share", SOCIAL_PREVIEW_VERSION);
    const result = await shareEvent(eventTitle, shareUrl.toString());
    if (result === "copied") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <section
      aria-labelledby="event-page-title"
      className="relative mb-0 mt-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas"
    >
      <MediaPageBanner
        className="relative z-10 min-h-28 shrink-0 overflow-hidden land-compact:min-h-20"
        titleId="event-page-title"
        title={event.title}
        titleCasing="normal"
        allowTitleWrap
        adaptiveHeight
        description={
          event.eventType
            ? copy.archive.types[event.eventType]
            : (event.type ?? copy.event.defaultType)
        }
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

      <div
        className={`relative z-20 -mt-11 grid w-full justify-items-stretch gap-3 px-3 pb-2.5 pt-3 sm:-mt-13 sm:px-4 sm:pb-2.5 sm:pt-4 tall-md:py-4 tall-md:pb-2.5 ${hasGallery ? "lg:px-4" : "lg:px-0"} land-sm:gap-2 land-sm:px-3 land-sm:pb-2.5 land-sm:pt-3 land-compact:-mt-8`}
      >
        <div
          ref={contentRef}
          className={`mx-auto grid w-full items-start gap-3 land-sm:gap-2 ${hasGallery ? "xl:grid-cols-2 xl:gap-8" : "max-w-5xl"}`}
        >
          <article
            className={`grid min-w-0 gap-3 px-5 py-3 md:px-5 md:py-3 land-sm:gap-2 land-sm:p-3 ${panelSurfaceClass}`}
          >
            <div className="flex min-w-0 flex-col gap-2.5 land-sm:gap-2">
              <div className="grid min-w-0 content-start gap-3 land-sm:gap-2">
                <p className="text-sm font-bold uppercase tracking-wider text-site-accent">
                  {isPast ? copy.event.completed : copy.event.scheduled}
                </p>
                <dl className="grid gap-2 text-sm land-sm:grid-cols-2 land-tall:grid-cols-2">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
                    <CalendarDays
                      className="row-span-2 size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <dt className="font-bold">{copy.event.date}</dt>
                    <dd>{getEventDateLabel(event, language)}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
                    <Clock
                      className="row-span-2 size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <dt className="font-bold">{copy.event.time}</dt>
                    <dd>{formatEventTime(event, language)}</dd>
                  </div>
                  {event.timeZone ? (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
                      <Globe2
                        className="row-span-2 size-5 shrink-0 text-site-accent-soft"
                        aria-hidden="true"
                      />
                      <dt className="font-bold">{copy.event.timeZone}</dt>
                      <dd>{event.timeZone}</dd>
                    </div>
                  ) : null}
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
                    <MapPin
                      className="row-span-2 size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <dt className="font-bold">{copy.event.location}</dt>
                    <dd className="min-w-0">
                      {event.location && locationUrl ? (
                        <a
                          href={locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`underline underline-offset-4 ${focusRingClass}`}
                        >
                          {getEventLocationName(event.location)}
                          <span className="sr-only">
                            . {copy.common.opensMaps}
                          </span>
                        </a>
                      ) : (
                        copy.common.toBeConfirmed
                      )}
                    </dd>
                  </div>
                  {!isPast ? (
                    <div>
                      <dt className="sr-only">{copy.event.addToCalendar}</dt>
                      <dd className="my-2.5 flex items-center justify-center md:my-0 land-sm:my-0 land-sm:justify-start land-tall:justify-start">
                        <a
                          href={getGoogleCalendarUrl(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${secondaryButtonClass} ${focusRingClass}`}
                        >
                          <CalendarPlus
                            className="mr-2 size-4"
                            aria-hidden="true"
                          />
                          {copy.event.addToCalendar}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="grid gap-1">
                  <h2 className="font-bold">{copy.event.description}</h2>
                  <EventSummary
                    summary={event.summary ?? copy.common.informationPending}
                  />
                </div>
              </div>

              <aside className="grid gap-3 rounded-xl bg-site-media p-4 land-sm:gap-2">
                {!isPast ? (
                  <p className="text-sm leading-relaxed">
                    {isExternalEvent(event) ? (
                      <>
                        <strong>
                          {copy.event.externalAudienceNoticeLabel}
                        </strong>{" "}
                        {copy.event.externalAudienceNotice}
                      </>
                    ) : (
                      copy.event.audienceNotice
                    )}
                  </p>
                ) : null}
                <div className="grid gap-2">
                  {isPast ? (
                    <>
                      <Link
                        to="/eventos/pasados/"
                        className={`${eventNavigationLinkClass} border-site-action bg-site-surface text-site-action ${focusRingClass}`}
                      >
                        {copy.event.viewArchive}
                      </Link>
                      <Link
                        to="/eventos/"
                        className={`${eventNavigationLinkClass} border-site-action bg-site-action text-site-on-dark shadow-sm ${focusRingClass}`}
                      >
                        {copy.archive.upcomingEvents}
                      </Link>
                    </>
                  ) : null}
                  {!isPast ? (
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className={`${eventNavigationLinkClass} border-site-action bg-site-surface text-site-action ${focusRingClass}`}
                    >
                      {copied ? (
                        <Check className="mr-2 size-4" aria-hidden="true" />
                      ) : (
                        <Share2 className="mr-2 size-4" aria-hidden="true" />
                      )}
                      {copied ? copy.common.linkCopied : copy.common.shareEvent}
                    </button>
                  ) : null}
                  {!isPast ? (
                    <Link
                      to="/eventos/"
                      className={`${eventNavigationLinkClass} border-site-action bg-site-action text-site-on-dark shadow-sm ${focusRingClass}`}
                    >
                      {copy.event.backToCalendar}
                    </Link>
                  ) : null}
                </div>
              </aside>
            </div>
          </article>
          {hasGallery ? (
            <HistoricalEventGallery
              eventId={event.id}
              eventTitle={eventTitle}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
