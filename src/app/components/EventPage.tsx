import {
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useLanguage } from "../config/i18n";
import { getLocalizedEvent } from "../utils/localizedEvents";
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
  getGoogleCalendarUrl,
  getEventLocationName,
  getLocationMapUrl,
} from "../utils/calendarEventPresentation";
import { findEventByPathname, getEventPath } from "../utils/eventRoutes";
import { MediaPageBanner } from "./ui/MediaPageBanner";
import { HistoricalEventGallery } from "./HistoricalEventGallery";

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
  const english = language === "en";
  const location = useLocation();
  const sourceEvent = findEventByPathname(location.pathname);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<Date>();
  useEffect(() => setNow(new Date()), []);

  if (!sourceEvent) return null;
  const event = getLocalizedEvent(sourceEvent, language);

  const isPast = now ? getEventEndDate(event).getTime() <= now.getTime() : false;
  const locationUrl = event.location
    ? getLocationMapUrl(event.location)
    : undefined;
  const canonicalPath = getEventPath(event, language);
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
      className="relative my-2 flex w-full flex-col overflow-hidden rounded-xl bg-site-canvas"
    >
      <MediaPageBanner
        className="relative z-10 min-h-28 shrink-0 overflow-hidden land-compact:min-h-20"
        titleId="event-page-title"
        title={event.title}
        allowTitleWrap
        adaptiveHeight
        description={event.type ?? copy.event.defaultType}
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

      <div className="relative z-20 -mt-11 flex items-start justify-center px-3 pb-0 pt-3 sm:-mt-13 sm:px-4 sm:pb-0 sm:pt-4 tall-md:p-4 land-sm:px-3 land-sm:pb-0 land-sm:pt-3 land-compact:-mt-8">
        <div className="flex w-full max-w-5xl flex-col gap-4 land-sm:gap-2">
          <article
            className={`grid gap-4 p-4 md:p-5 land-sm:gap-2 land-sm:p-3 ${panelSurfaceClass}`}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] land-sm:gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wider text-site-accent">
                  {isPast ? copy.event.completed : copy.event.scheduled}
                </p>
                <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold">{copy.event.date}</dt>
                      <dd>{getEventDateLabel(event, language)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock
                      className="size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold">{copy.event.time}</dt>
                      <dd>{formatEventTime(event, language)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="size-5 shrink-0 text-site-accent-soft"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <dt className="font-bold">{copy.event.location}</dt>
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
                              . {copy.common.opensMaps}
                            </span>
                          </a>
                        ) : (
                          copy.common.toBeConfirmed
                        )}
                      </dd>
                    </div>
                  </div>
                  {!isPast ? (
                    <div className="my-2.5 flex items-center justify-center md:my-0 md:justify-start land-sm:my-0 land-sm:justify-start">
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
                    </div>
                  ) : null}
                </dl>

                <div className="mt-0 md:mt-4 land-sm:mt-4">
                  <h2 className="font-bold">{copy.event.description}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-site-muted">
                    {event.summary ?? copy.common.informationPending}
                  </p>
                </div>
              </div>

              <aside className="flex self-center flex-col justify-between gap-4 rounded-xl bg-site-media p-4">
                {!isPast ? (
                  <p className="text-sm leading-relaxed">
                    {copy.event.audienceNotice}
                  </p>
                ) : null}
                <div className="grid gap-2">
                  {isPast ? (
                    <>
                      <Link
                        to={english ? "/en/events/past/" : "/eventos/pasados/"}
                        className={`${secondaryButtonClass} ${focusRingClass}`}
                      >
                        {copy.event.viewArchive}
                      </Link>
                      <Link
                        to={english ? "/en/calendar/" : "/calendario/"}
                        className={`${primaryButtonClass} ${focusRingClass}`}
                      >
                        {copy.archive.upcomingEvents}
                      </Link>
                    </>
                  ) : null}
                  {!isPast ? (
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className={`${secondaryButtonClass} ${focusRingClass}`}
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
                      to={english ? "/en/calendar/" : "/calendario/"}
                      className={`${primaryButtonClass} ${focusRingClass}`}
                    >
                      {copy.event.backToCalendar}
                    </Link>
                  ) : null}
                </div>
              </aside>
            </div>
          </article>
          {isPast ? (
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
