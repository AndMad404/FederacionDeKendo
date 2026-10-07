import { CALENDAR_EVENTS } from "../../src/app/data/calendarEvents";
import { EVENT_GALLERIES } from "../../src/app/data/eventGalleries";
import { isExternalEvent } from "../../src/app/utils/calendarEvents";
import type { ApprovedPage } from "../design/design-contract";
import {
  generatedPages,
  getGeneratedEventPath,
  representativePages,
} from "./generated-pages";

// Geometry belongs to templates, not event slugs. Prefer the longest copy
// within each published layout; synthetic fixtures cover image counts and ratios.
export function designRepresentatives(): ApprovedPage[] {
  const pages = generatedPages({ spanishOnly: true });
  const events = new Map(
    CALENDAR_EVENTS.map((event) => [getGeneratedEventPath(event.id), event]),
  );
  const variants = new Map<string, { page: ApprovedPage; length: number }>();
  for (const page of pages.filter((page) => page.design === "event")) {
    const event = events.get(page.path);
    if (!event)
      throw new Error(`No event data for generated route: ${page.path}`);
    const archived = page.path.startsWith("/eventos/pasados/");
    const photos = archived
      ? (EVENT_GALLERIES[event.id]?.images.length ?? 0)
      : 0;
    const key = [
      archived ? "past" : "upcoming",
      photos > 1
        ? "multiple-photos"
        : photos === 1
          ? "single-photo"
          : "no-photos",
      event.summary ? "description" : "fallback-description",
      !archived && isExternalEvent(event) ? "external" : "internal",
    ].join(":");
    const length = event.summary?.length ?? 0;
    if (!variants.has(key) || length > variants.get(key)!.length) {
      variants.set(key, { page, length });
    }
  }
  const templates = representativePages(
    pages.filter((page) => page.design !== "event"),
  );
  // A mobile archive page opened on desktop has a distinct page-size fallback.
  const secondArchivePage = pages.find(
    (page) => page.path === "/eventos/pasados/pagina/2/",
  );
  return [
    ...templates,
    ...(secondArchivePage ? [secondArchivePage] : []),
    ...Array.from(variants.values(), ({ page }) => page),
  ];
}
