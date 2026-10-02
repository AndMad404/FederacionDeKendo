import { mergeRegistry } from "../../scripts/sync-calendar-events.ts";

const historicalDefaults = {
  sourceId: "stable-source",
  slug: "2026-01-10-seminario",
  aliases: ["2026-01-10-seminario-anterior"],
  archiveEligibleAt: "2026-01-13T06:00:00.000Z",
  historical: true,
  editorialState: "publicado",
  title: "Seminario original",
  date: "2026-01-10",
  endDate: "2026-01-11",
  startTime: "09:00",
  endTime: "12:00",
  location: "Dojo original",
  summary: "Descripcion original",
  eventType: "seminario",
  organizer: "Organizador original",
  infoUrl: "https://example.test/original",
  timeZone: "America/Costa_Rica",
};

const changedDefaults = {
  sourceId: "stable-source",
  slug: "2026-02-20-torneo-modificado",
  aliases: ["2026-02-20-alias-nuevo"],
  archiveEligibleAt: "2026-02-23T06:00:00.000Z",
  title: "Torneo modificado",
  date: "2026-02-20",
  endDate: "2026-02-22",
  startTime: "14:00",
  endTime: "18:00",
  location: "Ubicacion modificada",
  summary: "Descripcion modificada",
  eventType: "torneo",
  organizer: "Organizador modificado",
  infoUrl: "https://example.test/modificado",
  timeZone: "America/Guatemala",
};

export function makeHistoricalEvent(overrides = {}) {
  return {
    ...structuredClone(historicalDefaults),
    ...structuredClone(overrides),
  };
}

export function makeChangedCalendarEvent(overrides = {}) {
  return { ...structuredClone(changedDefaults), ...structuredClone(overrides) };
}

export function makeRegistry({
  version = 4,
  events = [makeHistoricalEvent()],
} = {}) {
  return { version, events: structuredClone(events) };
}

export function mergeHistorical(
  previousEvent,
  currentEvents = [makeChangedCalendarEvent()],
  { version = 3, observedAt = "2026-03-01T00:00:00.000Z" } = {},
) {
  return mergeRegistry(
    makeRegistry({ version, events: [previousEvent] }),
    structuredClone(currentEvents),
    new Date(observedAt),
  );
}

export function makePendingRevision({
  event = makeHistoricalEvent(),
  received = makeChangedCalendarEvent(),
  observedAt = "2026-03-01T00:00:00.000Z",
  version = 4,
} = {}) {
  const published = structuredClone(event);
  const present = makeHistoricalEvent({
    ...published,
    sourceId: "present-source",
    slug: "2026-01-11-present",
    aliases: undefined,
  });
  const missing = received === null;
  const previous = makeRegistry({
    version,
    events: missing ? [published, present] : [published],
  });
  const current = missing ? [present] : [structuredClone(received)];
  return mergeRegistry(previous, current, new Date(observedAt)).events.find(
    ({ sourceId }) => sourceId === published.sourceId,
  );
}

export const REMOVED_HISTORICAL_FIELDS = [
  "endDate",
  "endTime",
  "location",
  "summary",
  "organizer",
  "infoUrl",
];
