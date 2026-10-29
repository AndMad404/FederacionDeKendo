import { EVENT_GALLERIES } from "../data/eventGalleries";
import coverManifest from "../data/eventCovers.json";
import coverApproval from "../config/eventCoverApproval.json";
import seoData from "../config/seo-data.json";
import { CALENDAR_EVENTS } from "../data/calendarEvents";

export type EventCoverFormat = "calendar" | "archive";
interface Thumbnail {
  alt?: string;
  src: string;
  width: number;
  height: number;
  srcSet: { webp: string };
}
const covers: Record<
  string,
  Partial<Record<EventCoverFormat, Thumbnail>>
> = coverManifest.events;

/** Preserve existing event artwork; generate a cover only when none exists. */
export function getEventThumbnail(
  eventId: string,
  format: EventCoverFormat = "calendar",
  approval: {
    status: string;
    formats?: Record<string, string>;
  } = coverApproval,
) {
  const gallery = EVENT_GALLERIES[eventId];
  const existing = gallery?.thumbnail ?? gallery?.images[0];
  if (existing) {
    return {
      image: existing,
      source: gallery?.posterSource
        ? ("poster" as const)
        : ("gallery" as const),
    };
  }
  const cover =
    approval.status === "approved" &&
    (!approval.formats || approval.formats[format] === "approved")
      ? covers[eventId]?.[format]
      : undefined;
  if (!cover) return undefined;
  const event = CALENDAR_EVENTS.find((candidate) => candidate.id === eventId);
  const eventTitle = (event?.title ?? eventId)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
  return {
    image: { ...cover, alt: `Afiche de ${seoData.siteName}, ${eventTitle}` },
    source: "generated" as const,
  };
}
