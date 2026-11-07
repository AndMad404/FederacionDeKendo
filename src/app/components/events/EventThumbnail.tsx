import { useEffect, useRef, useState } from "react";
import { EVENT_GALLERIES } from "../../data/eventGalleries";
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
  // Keep the Shogun crest visible by framing the top of the official flyer.
  const showShogunCrest =
    eventId === "panama-5ta-copa-shogun-torneo-por-equipos-y-seminario";
  const showShogunTabletCover = showShogunCrest && calendarArtwork;
  const showSeminarDesktopCover =
    adaptive &&
    format === "calendar" &&
    selection?.source === "generated" &&
    eventId === "seminario-noviembre-2026";
  const thumbnail = showShogunCrest
    ? EVENT_GALLERIES[eventId]?.images[0]
    : selection?.image;
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
  const objectFit = showShogunCrest
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
      {showShogunTabletCover ? (
        <source
          media="(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)"
          srcSet="/images/events/panama-5ta-copa-shogun-torneo-por-equipos-y-seminario/copa-shogun-2026-panama-kendo-tablet-960.webp"
          width={960}
          height={720}
        />
      ) : null}
      {showSeminarDesktopCover ? (
        <source
          media="(min-width: 1280px) and (min-height: 768px)"
          srcSet="/images/calendar/seminario-noviembre-2026-desktop.webp"
          width={1280}
          height={800}
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
        className={`block h-full max-h-full w-full max-w-full rounded-lg ${showShogunCrest ? "object-top" : "object-center"} ${objectFitClass} ${showShogunCrest ? "aspect-[8/5]" : ""} ${showSeminarDesktopCover ? "page-fit:w-auto page-fit:aspect-[8/5]" : ""} ${showShogunTabletCover ? "md:max-xl:portrait:aspect-auto md:max-xl:portrait:object-contain md:max-xl:portrait:object-center" : ""}`}
      />
    </picture>
  );
}
