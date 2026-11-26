import { useEffect, useRef, useState } from "react";
import { EVENT_GALLERIES } from "../../data/eventGalleries";
import { eventCoverPresentation } from "../../config/eventCoverPresentation";
import {
  getEventThumbnail,
  type EventCoverFormat,
} from "../../utils/eventThumbnail";

export function EventThumbnail({
  eventId,
  className = "",
  fit,
  fullResolution = false,
  format: requestedFormat = "calendar",
  adaptive = false,
  calendarArtwork = adaptive,
  portraitOnTablet = false,
  sizes = "(min-width: 1024px) 14rem, (min-width: 768px) 50vw, 100vw",
}: {
  eventId: string;
  className?: string;
  fit?: "cover" | "contain" | "fill";
  sizes?: string;
  fullResolution?: boolean;
  format?: EventCoverFormat;
  adaptive?: boolean;
  calendarArtwork?: boolean;
  portraitOnTablet?: boolean;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [portrait, setPortrait] = useState(false);
  const format = adaptive && portrait ? "archive" : requestedFormat;
  const selection = getEventThumbnail(eventId, format);
  const canAdapt =
    adaptive &&
    selection?.source === "generated" &&
    getEventThumbnail(eventId, "archive")?.source === "generated";
  useEffect(() => {
    const container = containerRef.current;
    if (!canAdapt || !container) return;
    const card = container.closest("li");
    const tablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)",
    );
    const measure = () => {
      if (tablet.matches) {
        setPortrait(portraitOnTablet);
        return;
      }
      // Desktop cards receive their height from the calendar grid. Use the
      // whole card so its heading and actions do not disguise a portrait slot.
      // On mobile the image sets the card height; keep the requested format
      // rather than letting the selected image determine its own orientation.
      if (
        !card ||
        Number.parseFloat(getComputedStyle(container).flexGrow) <= 0
      ) {
        setPortrait(false);
        return;
      }
      const { width, height } = card.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      // A small neutral band avoids repeated swaps near a square allocation.
      setPortrait((previous) =>
        previous ? height / width >= 0.95 : height / width > 1.05,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (card) observer.observe(card);
    tablet.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      tablet.removeEventListener("change", measure);
    };
  }, [canAdapt, eventId, portraitOnTablet]);
  const presentation = eventCoverPresentation[eventId];
  const officialFlyer =
    selection?.source === "poster" && presentation?.officialFlyer
      ? EVENT_GALLERIES[eventId]?.images.find(({ kind }) => kind === "flyer")
      : undefined;
  const tabletCover =
    officialFlyer && calendarArtwork
      ? presentation?.officialFlyer?.portraitTablet
      : undefined;
  const desktopCover =
    adaptive && format === "calendar" && selection?.source === "generated"
      ? presentation?.generatedCalendarDesktop
      : undefined;
  const thumbnail = officialFlyer ?? selection?.image;
  if (!thumbnail) return null;
  // Enlarged archive cards use the largest existing variant, avoiding browser
  // selection of a small thumbnail left over from the compact layout.
  const srcSet = () => {
    const candidates = thumbnail.srcSet.webp;
    if (!fullResolution) return candidates;
    return candidates
      .split(",")
      .sort((a, b) => {
        const width = (candidate: string) =>
          Number(candidate.trim().split(/\s+/).slice(-1)[0]?.replace("w", ""));
        return width(b) - width(a);
      })[0]
      .trim();
  };
  const objectFit = officialFlyer
    ? "cover"
    : selection?.source === "generated"
      ? "contain"
      : (fit ?? "contain");
  const objectFitClass = {
    contain: "object-contain",
    cover: "object-cover",
    fill: "object-fill",
  }[objectFit];
  const aspectClass =
    selection?.source === "generated"
      ? format === "calendar"
        ? "aspect-[4/3]"
        : "aspect-[3/4]"
      : "aspect-video";
  return (
    <picture
      ref={containerRef}
      data-event-thumbnail
      data-thumbnail-source={selection?.source}
      data-cover-format={format}
      className={`flex ${aspectClass} h-auto w-full max-w-full items-center justify-center overflow-hidden rounded-lg bg-site-surface ${className}`}
    >
      {tabletCover ? (
        <source
          media="(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)"
          srcSet={tabletCover.src}
          width={tabletCover.width}
          height={tabletCover.height}
        />
      ) : null}
      {desktopCover ? (
        <source
          media="(min-width: 1280px) and (min-height: 768px)"
          srcSet={desktopCover.src}
          width={desktopCover.width}
          height={desktopCover.height}
        />
      ) : null}
      <img
        src={thumbnail.src}
        srcSet={srcSet()}
        sizes={sizes}
        alt={thumbnail.alt ?? ""}
        width={thumbnail.width}
        height={thumbnail.height}
        loading="lazy"
        decoding="async"
        className={`block h-full max-h-full w-full max-w-full rounded-lg ${officialFlyer ? "object-top" : "object-center"} ${objectFitClass} ${officialFlyer ? "aspect-[8/5]" : ""} ${desktopCover ? "page-fit:w-auto page-fit:aspect-[8/5]" : ""} ${tabletCover ? "md:max-xl:portrait:aspect-auto md:max-xl:portrait:object-contain md:max-xl:portrait:object-center" : ""}`}
      />
    </picture>
  );
}
