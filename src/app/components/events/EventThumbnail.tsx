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
  sizes = "(min-width: 1024px) 14rem, (min-width: 768px) 50vw, 100vw",
}: {
  eventId: string;
  className?: string;
  fit?: "cover" | "contain" | "fill";
  sizes?: string;
  fullResolution?: boolean;
  format?: EventCoverFormat;
  adaptive?: boolean;
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
    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      // A small neutral band avoids repeated swaps near a square allocation.
      setPortrait((previous) =>
        previous ? height / width >= 0.95 : height / width > 1.05,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [canAdapt, eventId]);
  // Keep the Shogun crest visible by framing the top of the official flyer.
  const showShogunCrest =
    eventId === "panama-5ta-copa-shogun-torneo-por-equipos-y-seminario";
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
      <img
        src={thumbnail.src}
        srcSet={srcSet()}
        sizes={sizes}
        alt={thumbnail.alt ?? ""}
        width={thumbnail.width}
        height={thumbnail.height}
        style={showShogunCrest ? { aspectRatio: "8 / 5" } : undefined}
        loading="lazy"
        decoding="async"
        className={`block h-full max-h-full w-full max-w-full rounded-lg ${showShogunCrest ? "object-top" : "object-center"} ${objectFitClass}`}
      />
    </picture>
  );
}
