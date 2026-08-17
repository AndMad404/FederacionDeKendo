import { createHash } from "node:crypto";
import {
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  calculateArchiveEligibleAt,
  calculateGalleryCheckAt,
  getArchiveEligibleAt,
  isArchiveEligible,
} from "../src/app/utils/eventArchive.js";
import {
  addCalendarDays,
  getCalendarDateTimeSortKey,
} from "../src/app/utils/calendarDate.js";
import {
  replaceTransaction,
  synchronizeEventGalleries,
} from "./sync-event-galleries.mjs";
import eventTranslations from "../src/app/data/eventTranslations.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultOutputPath = path.join(
  repoRoot,
  "src",
  "app",
  "data",
  "calendarEvents.ts",
);
const defaultRegistryPath = path.join(
  repoRoot,
  "src",
  "app",
  "data",
  "calendarEventRegistry.json",
);
const defaultTimeZone = process.env.CALENDAR_TIME_ZONE ?? "America/Costa_Rica";
const draftPrefix = "[BORRADOR]";
const inferredEventTypes = [
  ["torneo", /(?:^|\s)torneos?(?:$|\s)/],
  ["examen", /(?:^|\s)examen(?:es)?(?:$|\s)/],
];
const googleDriveFolderUrl =
  /^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+(?:[/?#].*)?$/;
const embeddedGoogleDriveFolderUrl =
  /https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+(?:[/?#][^\s]*)?/g;
const albumUrlSymbol = Symbol("privateAlbumUrl");
export const MASS_DISAPPEARANCE_MINIMUM = 2;
export const MASS_DISAPPEARANCE_RATIO = 0.5;

export function getTranslationPublicationCounts(
  events,
  translations = eventTranslations,
) {
  return events.reduce(
    (counts, event) => {
      const translation = translations[event.id];
      if (!translation) {
        counts.missing += 1;
      } else if (
        translation.source.title !== event.title ||
        translation.source.summary !== event.summary
      ) {
        counts.stale += 1;
      } else {
        counts.valid += 1;
      }
      return counts;
    },
    { valid: 0, missing: 0, stale: 0 },
  );
}

export const HISTORICAL_COMPARISON_FIELDS = [
  "slug",
  "archiveEligibleAt",
  "title",
  "date",
  "endDate",
  "startTime",
  "endTime",
  "location",
  "summary",
  "eventType",
  "organizer",
  "infoUrl",
  "timeZone",
];

export const HISTORICAL_SNAPSHOT_FIELDS = [
  "sourceId",
  "slug",
  "aliases",
  "archiveEligibleAt",
  "historical",
  "inactive",
  ...HISTORICAL_COMPARISON_FIELDS.filter(
    (field) => !["slug", "archiveEligibleAt"].includes(field),
  ),
];

const driveUrl =
  /https?:\/\/(?:[A-Za-z0-9-]+\.)?drive\.google\.com\/[^\s<>)\]]+/gi;

export function getPrivateAlbumUrl(event) {
  return event?.[albumUrlSymbol];
}

function unfoldIcsLines(icsText) {
  return icsText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .reduce((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }

      return lines;
    }, []);
}

function decodeIcsText(value) {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsProperty(line) {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return undefined;

  const rawName = line.slice(0, colonIndex);
  const rawValue = line.slice(colonIndex + 1);
  const [name, ...rawParams] = rawName.split(";");
  const params = Object.fromEntries(
    rawParams.map((param) => {
      const equalsIndex = param.indexOf("=");
      return equalsIndex === -1
        ? [param.toUpperCase(), ""]
        : [
            param.slice(0, equalsIndex).toUpperCase(),
            param.slice(equalsIndex + 1).replace(/^"|"$/g, ""),
          ];
    }),
  );

  return {
    name: name.toUpperCase(),
    params,
    rawValue,
    value: decodeIcsText(rawValue),
  };
}

export function parseVEvents(icsText) {
  if (!/BEGIN:VCALENDAR/.test(icsText) || !/END:VCALENDAR/.test(icsText)) {
    throw new Error(
      "Invalid iCalendar feed: VCALENDAR boundaries are missing.",
    );
  }

  const events = [];
  let currentEventLines;

  for (const line of unfoldIcsLines(icsText)) {
    if (line === "BEGIN:VEVENT") {
      if (currentEventLines) {
        throw new Error("Invalid iCalendar feed: nested VEVENT.");
      }
      currentEventLines = [];
    } else if (line === "END:VEVENT" && currentEventLines) {
      events.push(currentEventLines);
      currentEventLines = undefined;
    } else if (currentEventLines) {
      currentEventLines.push(line);
    }
  }

  if (currentEventLines) {
    throw new Error("Invalid iCalendar feed: an event is not closed.");
  }

  return events.map((eventLines) => {
    const properties = new Map();
    for (const line of eventLines) {
      const property = parseIcsProperty(line);
      if (property && !properties.has(property.name)) {
        properties.set(property.name, property);
      }
    }
    return properties;
  });
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseBasicDate(value) {
  return {
    year: Number.parseInt(value.slice(0, 4), 10),
    month: Number.parseInt(value.slice(4, 6), 10),
    day: Number.parseInt(value.slice(6, 8), 10),
  };
}

function parseBasicDateTime(value) {
  return {
    ...parseBasicDate(value),
    hours: Number.parseInt(value.slice(9, 11), 10),
    minutes: Number.parseInt(value.slice(11, 13), 10),
  };
}

function formatDate({ year, month, day }) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatDateTimeInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  };
}

function parseIcsDate(property) {
  if (!property) return undefined;
  const isDateOnly =
    property.params.VALUE === "DATE" || /^\d{8}$/.test(property.rawValue);

  if (isDateOnly) {
    return {
      date: formatDate(parseBasicDate(property.rawValue)),
      isDateOnly: true,
      timeZone: defaultTimeZone,
    };
  }

  if (!/^\d{8}T\d{4,6}Z?$/i.test(property.rawValue)) {
    return undefined;
  }

  const parts = parseBasicDateTime(property.rawValue);
  if (/Z$/i.test(property.rawValue)) {
    const utcDate = new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hours,
        parts.minutes,
      ),
    );
    return {
      ...formatDateTimeInZone(utcDate, defaultTimeZone),
      isDateOnly: false,
      timeZone: defaultTimeZone,
    };
  }

  return {
    date: formatDate(parts),
    time: `${pad(parts.hours)}:${pad(parts.minutes)}`,
    isDateOnly: false,
    timeZone: property.params.TZID ?? defaultTimeZone,
  };
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function hash(value, length = 24) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function createCanonicalSlug(title, date) {
  return `${date}-${slugify(title) || "actividad"}`;
}

function parseTechnicalDescription(description, title) {
  if (!description) return { publicDescription: undefined };

  const lines = description.replace(/\r\n?/g, "\n").split("\n");
  const separatorIndex = lines.findLastIndex((line) => /^---\s*$/.test(line));
  const publicLines =
    separatorIndex === -1 ? lines : lines.slice(0, separatorIndex);

  const metadata = new Map();
  for (const line of separatorIndex === -1
    ? []
    : lines.slice(separatorIndex + 1)) {
    if (!line.trim()) continue;
    const match = /^([A-Z_]+)\s*:\s*(.+)$/.exec(line.trim());
    if (!match || !["TIPO_EVENTO", "ALBUM_FOTOS"].includes(match[1])) {
      throw new Error(
        `Invalid technical metadata for ${title}: ${line.trim()}`,
      );
    }
    if (metadata.has(match[1])) {
      throw new Error(`Duplicate technical metadata ${match[1]} for ${title}.`);
    }
    metadata.set(match[1], match[2].trim());
  }

  let albumUrl = metadata.get("ALBUM_FOTOS");
  if (albumUrl && !googleDriveFolderUrl.test(albumUrl)) {
    throw new Error(`Invalid ALBUM_FOTOS for ${title}.`);
  }

  const sanitizedPublicLines = publicLines.map((line) => {
    const matches = [...line.matchAll(embeddedGoogleDriveFolderUrl)].map(
      (match) => match[0],
    );
    for (const match of matches) {
      if (albumUrl && albumUrl !== match) {
        throw new Error(`Multiple album URLs for ${title}.`);
      }
      albumUrl = match;
    }
    return matches
      .reduce((text, match) => text.replace(match, ""), line)
      .trimEnd();
  });

  return {
    publicDescription: sanitizedPublicLines.join("\n").trim() || undefined,
    albumUrl,
  };
}

function inferEventType(title) {
  const normalizedTitle = slugify(title).replace(/-/g, " ");
  const inferred = inferredEventTypes.find(([, pattern]) =>
    pattern.test(normalizedTitle),
  );
  if (inferred) return inferred[0];
  return "seminario";
}

function getOrganizer(property) {
  if (!property) return undefined;
  return property.params.CN
    ? decodeIcsText(property.params.CN)
    : property.value.replace(/^mailto:/i, "");
}

export function parseCalendarEvent(properties, warnings = []) {
  const rawTitle = properties.get("SUMMARY")?.value;
  if (rawTitle?.toUpperCase().startsWith(draftPrefix)) {
    warnings.push(
      `Draft omitted: ${rawTitle.slice(draftPrefix.length).trim() || "(untitled)"}`,
    );
    return undefined;
  }
  if (properties.has("RRULE")) {
    warnings.push(
      `Recurring event omitted: ${rawTitle || "(untitled)"}. Create individual events instead.`,
    );
    return undefined;
  }
  if (properties.get("STATUS")?.value === "CANCELLED") {
    warnings.push(`Cancelled event omitted: ${rawTitle || "(untitled)"}`);
    return undefined;
  }

  const uid = properties.get("UID")?.value;
  const start = parseIcsDate(properties.get("DTSTART"));
  const missingRequired = [
    !rawTitle?.trim() && "title",
    !start && "date",
  ].filter(Boolean);
  if (!uid || missingRequired.length) {
    const reason = !uid ? "UID" : missingRequired.join(" and ");
    warnings.push(
      `Event omitted because required ${reason} is missing: ${rawTitle || "(untitled)"}`,
    );
    return undefined;
  }

  const title = rawTitle.trim();
  const description = parseTechnicalDescription(
    properties.get("DESCRIPTION")?.value,
    title,
  );
  const end = parseIcsDate(properties.get("DTEND"));
  const event = {
    sourceId: hash(uid),
    slug: createCanonicalSlug(title, start.date),
    title,
    date: start.date,
    timeZone: start.timeZone ?? defaultTimeZone,
  };

  if (!start.isDateOnly && start.time) event.startTime = start.time;
  if (end) {
    if (start.isDateOnly && end.isDateOnly) {
      const defaultEnd = addCalendarDays(start.date, 1);
      if (end.date !== defaultEnd) event.endDate = end.date;
    } else {
      if (end.date !== start.date) event.endDate = end.date;
      if (end.time) event.endTime = end.time;
    }
  }

  const lastEventDate =
    start.isDateOnly && end?.isDateOnly
      ? addCalendarDays(end.date, -1)
      : (end?.date ?? start.date);
  event.archiveEligibleAt = calculateArchiveEligibleAt(
    lastEventDate,
    defaultTimeZone,
  ).toISOString();

  const optionalProperties = {
    location: properties.get("LOCATION")?.value,
    summary: description.publicDescription,
    eventType: inferEventType(title),
    organizer: getOrganizer(properties.get("ORGANIZER")),
    infoUrl: properties.get("URL")?.value,
  };
  Object.assign(
    event,
    Object.fromEntries(
      Object.entries(optionalProperties).filter(([, value]) => Boolean(value)),
    ),
  );
  if (description.albumUrl) {
    Object.defineProperty(event, albumUrlSymbol, {
      value: description.albumUrl,
    });
  }

  return event;
}

function assertUniqueCurrentSlugs(events) {
  const ownerBySlug = new Map();
  for (const event of events) {
    for (const slug of [event.slug, ...(event.aliases ?? [])]) {
      const previousOwner = ownerBySlug.get(slug);
      if (previousOwner) {
        const label =
          slug === event.slug
            ? "Duplicate calendar canonical slug"
            : "Duplicate calendar canonical slug or alias";
        throw new Error(
          `${label}: ${slug} (${previousOwner} and ${event.sourceId}).`,
        );
      }
      ownerBySlug.set(slug, event.sourceId);
    }
  }
}

export function assertSafeCalendarInput(previousRegistry, parsedEvents) {
  if (parsedEvents.length === 0) {
    throw new Error(
      "Calendar feed contains no valid events; no files were changed.",
    );
  }

  const currentSourceIds = new Set();
  for (const event of parsedEvents) {
    if (currentSourceIds.has(event.sourceId)) {
      throw new Error(`Duplicate calendar source identity: ${event.sourceId}.`);
    }
    currentSourceIds.add(event.sourceId);
  }

  const publishedEvents = (previousRegistry.events ?? []).filter(
    (event) => event.editorialState !== "eliminado" && event.inactive !== true,
  );
  const disappeared = publishedEvents.filter(
    (event) => !currentSourceIds.has(event.sourceId),
  ).length;
  const threshold = Math.max(
    MASS_DISAPPEARANCE_MINIMUM,
    Math.ceil(publishedEvents.length * MASS_DISAPPEARANCE_RATIO),
  );
  if (disappeared >= threshold) {
    throw new Error(
      `Mass calendar disappearance detected: ${disappeared} of ${publishedEvents.length} published events are absent (threshold ${threshold}); no files were changed.`,
    );
  }
}

export function mergeRegistry(
  previousRegistry,
  currentEvents,
  now = new Date(),
) {
  const registryVersion = 4;
  assertUniqueCurrentSlugs(currentEvents);
  const historicalEvents = (previousRegistry.events ?? []).filter(
    (event) => event.historical === true || isArchiveEligible(event, now),
  );
  const currentSourceIds = new Set(
    currentEvents.map((event) => event.sourceId),
  );
  if (
    historicalEvents.length > 0 &&
    historicalEvents.every((event) => !currentSourceIds.has(event.sourceId))
  ) {
    throw new Error(
      "All historical events disappeared from the Calendar feed; no files were changed.",
    );
  }
  const previousBySourceId = new Map(
    (previousRegistry.events ?? []).map((event) => [event.sourceId, event]),
  );
  const freezeHistoricalSnapshot = (event) => ({
    ...event,
    archiveEligibleAt: getArchiveEligibleAt(event).toISOString(),
    historical: true,
  });
  const reconciledCurrentEvents = currentEvents.map((currentEvent) => {
    const previousEvent = previousBySourceId.get(currentEvent.sourceId);
    const aliases = previousEvent?.aliases;
    if (previousEvent?.editorialState === "eliminado") {
      return previousEvent;
    }
    const wasHistorical =
      previousEvent?.historical === true ||
      (previousEvent ? isArchiveEligible(previousEvent, now) : false);
    const becomesHistorical =
      new Date(currentEvent.archiveEligibleAt).getTime() <= now.getTime();

    if (wasHistorical) {
      const published = freezeHistoricalSnapshot(previousEvent);
      const matchesPublished = HISTORICAL_COMPARISON_FIELDS.every(
        (field) =>
          JSON.stringify(published[field]) ===
          JSON.stringify(currentEvent[field]),
      );
      if (matchesPublished) {
        const { pendingRevision, ...restored } = published;
        return { ...restored, editorialState: "publicado" };
      }
      return createPendingRevision(
        published,
        currentEvent,
        "historical_change",
        now,
        previousEvent.pendingRevision,
      );
    }

    return {
      ...currentEvent,
      editorialState: "publicado",
      ...(becomesHistorical ? { historical: true } : {}),
      ...(aliases?.length ? { aliases } : {}),
    };
  });
  const reconciledSourceIds = new Set(
    reconciledCurrentEvents.map((event) => event.sourceId),
  );
  const retainedEvents = (previousRegistry.events ?? [])
    .filter((event) => !reconciledSourceIds.has(event.sourceId))
    .map((event) => {
      const { inactive, ...legacyCompatibleEvent } = event;
      const published =
        legacyCompatibleEvent.historical === true ||
        isArchiveEligible(legacyCompatibleEvent, now)
          ? freezeHistoricalSnapshot(legacyCompatibleEvent)
          : legacyCompatibleEvent;
      if (event.editorialState === "eliminado") return published;
      if (event.editorialState === "pendiente") return published;
      return createPendingRevision(
        published,
        undefined,
        event.historical === true || isArchiveEligible(event, now)
          ? "historical_missing"
          : "future_missing",
        now,
        event.pendingRevision,
      );
    });
  const merged = [...reconciledCurrentEvents, ...retainedEvents];
  assertUniqueCurrentSlugs(merged);
  merged.sort(
    (a, b) =>
      getCalendarDateTimeSortKey(a.date, a.startTime) -
      getCalendarDateTimeSortKey(b.date, b.startTime),
  );
  return { version: registryVersion, events: merged };
}

function editorialRevisionId(event, reason) {
  return fingerprintOrderedFields({ reason, ...(event ?? {}) }, [
    "reason",
    "sourceId",
    ...HISTORICAL_COMPARISON_FIELDS,
  ]);
}

const evidenceFields = [
  "sourceId",
  ...HISTORICAL_COMPARISON_FIELDS,
  "aliases",
  "historical",
];

function redactEvidenceValue(value) {
  if (Array.isArray(value)) return value.map(redactEvidenceValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactEvidenceValue(item),
      ]),
    );
  }
  if (typeof value !== "string") return value;
  return value
    .replace(driveUrl, "[redacted]")
    .replace(
      /(?:webcal:|https?):\/\/[^\s<>)\]]+\.ics(?:[?#][^\s<>)\]]*)?/gi,
      "[redacted]",
    );
}

function evidenceSnapshot(event) {
  if (!event) return null;
  return Object.fromEntries(
    evidenceFields
      .filter((field) => event[field] !== undefined)
      .map((field) => [
        field,
        redactEvidenceValue(structuredClone(event[field])),
      ]),
  );
}

export function fingerprintEditorialEvidence({
  sourceId,
  revisionId,
  reason,
  published,
  proposed,
}) {
  return fingerprintOrderedFields(
    { sourceId, revisionId, reason, published, proposed },
    ["sourceId", "revisionId", "reason", "published", "proposed"],
  );
}

function createPendingRevision(
  publishedEvent,
  proposedEvent,
  reason,
  now = new Date(),
  previousRevision,
) {
  const id = editorialRevisionId(proposedEvent, reason);
  const observedAt = now.toISOString();
  const published = evidenceSnapshot(publishedEvent);
  const proposed = evidenceSnapshot(proposedEvent);
  const firstDetectedAt =
    previousRevision?.id === id
      ? (previousRevision.evidence?.firstDetectedAt ?? observedAt)
      : observedAt;
  const lastReceived =
    proposed ?? previousRevision?.evidence?.lastReceived ?? null;
  const missingAt =
    proposed === null
      ? (previousRevision?.evidence?.missingAt ?? observedAt)
      : null;
  const evidence = {
    sourceId: publishedEvent.sourceId,
    firstDetectedAt,
    lastObservedAt: observedAt,
    missingAt,
    lastReceived,
    published,
  };
  const fingerprint = fingerprintEditorialEvidence({
    sourceId: evidence.sourceId,
    revisionId: id,
    reason,
    published: evidence.published,
    proposed: evidence.lastReceived,
  });
  return {
    ...publishedEvent,
    editorialState: "pendiente",
    pendingRevision: {
      id,
      reason,
      proposed,
      evidence: {
        ...evidence,
        fingerprint,
      },
      ...(previousRevision?.notification?.evidenceFingerprint === fingerprint
        ? { notification: previousRevision.notification }
        : {}),
    },
  };
}

export function decidePendingDeletion(event, decision) {
  if (event.editorialState !== "pendiente") {
    throw new Error(
      "Only a pending editorial revision can receive a deletion decision.",
    );
  }
  if (event.pendingRevision?.id !== decision.revisionId) {
    throw new Error(
      "The editorial decision is stale for the pending revision.",
    );
  }
  if (decision.action === "approve_deletion") {
    return {
      ...event,
      editorialState: "eliminado",
      editorialDecision: {
        revisionId: event.pendingRevision.id,
        action: decision.action,
        decidedAt: decision.decidedAt ?? new Date().toISOString(),
        ...(decision.reason
          ? { reason: redactEvidenceValue(decision.reason) }
          : {}),
        evidenceFingerprint: event.pendingRevision.evidence?.fingerprint,
        ...(decision.decisionRecordId
          ? { decisionRecordId: decision.decisionRecordId }
          : {}),
        ...(decision.actorRole ? { actorRole: decision.actorRole } : {}),
      },
    };
  }
  if (decision.action === "reject_deletion") {
    const { pendingRevision, ...published } = event;
    return {
      ...published,
      editorialState: "publicado",
      editorialDecision: {
        revisionId: pendingRevision.id,
        action: decision.action,
        decidedAt: decision.decidedAt ?? new Date().toISOString(),
        ...(decision.reason
          ? { reason: redactEvidenceValue(decision.reason) }
          : {}),
        evidenceFingerprint: pendingRevision.evidence?.fingerprint,
        ...(decision.decisionRecordId
          ? { decisionRecordId: decision.decisionRecordId }
          : {}),
        ...(decision.actorRole ? { actorRole: decision.actorRole } : {}),
      },
    };
  }
  throw new Error("Unsupported editorial decision.");
}

function requireDecisionRecord(decision) {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(decision.decisionRecordId ?? "")
  ) {
    throw new Error(
      "A non-sensitive human decision record identifier is required.",
    );
  }
}

// This is the operational boundary for Phase 5.  The lower-level transition
// helper above remains available to describe the v4 state machine in isolation.
export function applyEditorialDecision(registry, decision) {
  if (registry?.version !== 4 || !Array.isArray(registry.events)) {
    throw new Error(
      "Editorial decisions require a current v4 calendar registry.",
    );
  }
  requireDecisionRecord(decision);
  const index = registry.events.findIndex(
    (event) => event.sourceId === decision.sourceId,
  );
  if (index === -1)
    throw new Error("The editorial decision source identity is stale.");

  const event = registry.events[index];
  if (event.editorialState !== "pendiente" || !event.pendingRevision) {
    throw new Error(
      "The editorial decision no longer targets a pending revision.",
    );
  }
  if (
    event.pendingRevision.id !== decision.revisionId ||
    event.pendingRevision.evidence?.fingerprint !== decision.evidenceFingerprint
  ) {
    throw new Error(
      "The editorial decision is stale for the current revision evidence.",
    );
  }
  if (
    decision.action === "approve_deletion" &&
    event.historical !== true &&
    decision.actorRole !== "presidencia"
  ) {
    throw new Error("Only Presidencia can approve deletion of a future event.");
  }
  if (event.historical === true && !decision.decisionRecordId) {
    throw new Error("Historical revisions require a recorded human decision.");
  }

  const events = [...registry.events];
  events[index] = decidePendingDeletion(event, decision);
  return { ...registry, events };
}

function canonicalValue(value) {
  return value === undefined ? { absent: true } : value;
}

export function fingerprintOrderedFields(value, fields) {
  const canonical = fields.map((field) => [
    field,
    canonicalValue(value[field]),
  ]);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function fingerprintHistoricalSnapshot(event) {
  return fingerprintOrderedFields(event, HISTORICAL_SNAPSHOT_FIELDS);
}

export function fingerprintHistoricalProposal(sourceId, differences) {
  const byField = new Map(
    differences.map((difference) => [difference.field, difference]),
  );
  const canonical = HISTORICAL_COMPARISON_FIELDS.filter((field) =>
    byField.has(field),
  ).map((field) => {
    const difference = byField.get(field);
    return [field, difference.type, canonicalValue(difference.proposed)];
  });
  return createHash("sha256")
    .update(JSON.stringify([sourceId, canonical]))
    .digest("hex");
}

function reportValue(value) {
  if (value === undefined) return null;
  if (typeof value === "string") return value.replace(driveUrl, "[redacted]");
  return value;
}

export function detectHistoricalChanges(
  previousRegistry,
  currentEvents,
  now = new Date(),
) {
  const currentBySourceId = new Map(
    currentEvents.map((event) => [event.sourceId, event]),
  );
  const changes = [];

  for (const publishedEvent of previousRegistry.events ?? []) {
    const isHistorical =
      publishedEvent.historical === true ||
      isArchiveEligible(publishedEvent, now);
    if (!isHistorical) continue;

    const currentEvent = currentBySourceId.get(publishedEvent.sourceId);
    const differences = [];
    if (!currentEvent) {
      differences.push({
        field: "feed",
        published: "presente",
        proposed: "ausente",
        type: "desaparecido_del_feed",
      });
    } else {
      for (const field of HISTORICAL_COMPARISON_FIELDS) {
        const published = publishedEvent[field];
        const proposed = currentEvent[field];
        if (JSON.stringify(published) === JSON.stringify(proposed)) continue;
        differences.push({
          field,
          published: reportValue(published),
          proposed: reportValue(proposed),
          type: proposed === undefined ? "eliminado" : "modificado",
        });
      }
    }

    if (differences.length) {
      const change = {
        sourceId: publishedEvent.sourceId,
        publicIdentity: {
          slug: publishedEvent.slug,
          title: reportValue(publishedEvent.title),
          date: publishedEvent.date,
        },
        differences,
        publishedFingerprint: fingerprintHistoricalSnapshot(publishedEvent),
        proposalFingerprint: fingerprintHistoricalProposal(
          publishedEvent.sourceId,
          differences,
        ),
      };
      const reason = currentEvent ? "historical_change" : "historical_missing";
      const revisionId = editorialRevisionId(currentEvent, reason);
      change.revisionId = revisionId;
      change.evidenceFingerprint = fingerprintEditorialEvidence({
        sourceId: publishedEvent.sourceId,
        revisionId,
        reason,
        published: evidenceSnapshot(publishedEvent),
        proposed: evidenceSnapshot(currentEvent),
      });
      changes.push(change);
    }
  }

  changes.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  return { version: 2, historicalChanges: changes };
}

function redactReportSecrets(report, secrets) {
  const redact = (value) => {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, redact(item)]),
      );
    }
    if (typeof value !== "string") return value;
    return secrets
      .filter((secret) => typeof secret === "string" && secret.length > 0)
      .reduce((text, secret) => text.replaceAll(secret, "[redacted]"), value);
  };
  return redact(report);
}

function redactNotificationValue(value) {
  if (Array.isArray(value)) return value.map(redactNotificationValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactNotificationValue(item),
      ]),
    );
  }
  if (typeof value !== "string") return value;
  return redactEvidenceValue(value).replace(
    /(?:webcal:|https?):\/\/[^\s<>)\]]+/gi,
    "[redacted]",
  );
}

function getNotificationExecution(environment = process.env) {
  const runId = /^\d+$/.test(environment.GITHUB_RUN_ID ?? "")
    ? environment.GITHUB_RUN_ID
    : null;
  const attempt = /^\d+$/.test(environment.GITHUB_RUN_ATTEMPT ?? "")
    ? environment.GITHUB_RUN_ATTEMPT
    : null;
  const trigger = ["schedule", "workflow_dispatch"].includes(
    environment.GITHUB_EVENT_NAME,
  )
    ? environment.GITHUB_EVENT_NAME
    : null;
  return {
    origin: runId ? "github_actions" : "local",
    runId,
    attempt,
    trigger,
  };
}

const pendingNotificationDetails = {
  future_missing: {
    cause: "El evento futuro ya no aparece en la fuente.",
    actionRequired:
      "Confirmar en Calendar si corresponde retirarlo; no se aplica ninguna decision automaticamente.",
  },
  historical_missing: {
    cause: "El evento historico ya no aparece en la fuente.",
    actionRequired:
      "Revisar la ausencia y conservar la version publicada hasta una decision humana posterior.",
  },
  historical_change: {
    cause: "La fuente propone cambios a un evento historico publicado.",
    actionRequired:
      "Revisar las diferencias antes de cualquier correccion humana posterior.",
  },
};

export function createCalendarNotifications(
  registry,
  execution = getNotificationExecution(),
) {
  const notifications = new Map();
  for (const event of registry.events ?? []) {
    if (event.editorialState !== "pendiente" || !event.pendingRevision)
      continue;
    const revision = event.pendingRevision;
    const id = revision.evidence?.fingerprint ?? revision.id;
    if (revision.notification?.evidenceFingerprint === id) continue;
    const details = pendingNotificationDetails[revision.reason] ?? {
      cause: "La fuente produjo una revision editorial pendiente.",
      actionRequired:
        "Revisar la revision antes de aplicar cualquier decision humana posterior.",
    };
    if (notifications.has(id)) continue;
    notifications.set(id, {
      id,
      kind: "revision_pendiente",
      identity: redactNotificationValue({
        slug: event.slug,
        title: event.title,
        date: event.date,
      }),
      temporality: event.historical === true ? "historico" : "futuro",
      cause: details.cause,
      actionRequired: details.actionRequired,
      before: redactNotificationValue(revision.evidence?.published ?? null),
      after: redactNotificationValue(
        revision.proposed ?? revision.evidence?.lastReceived ?? null,
      ),
      execution,
      fingerprints: {
        revisionId: revision.id,
        evidenceFingerprint: revision.evidence?.fingerprint ?? null,
      },
    });
  }
  return {
    version: 1,
    notifications: [...notifications.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
  };
}

export function recordCalendarNotifications(registry, notificationReport) {
  const notificationIds = new Set(
    (notificationReport?.notifications ?? []).map(
      (notification) => notification.id,
    ),
  );
  if (!notificationIds.size) return registry;
  return {
    ...registry,
    events: registry.events.map((event) => {
      const revision = event.pendingRevision;
      const id = revision?.evidence?.fingerprint ?? revision?.id;
      if (!id || !notificationIds.has(id)) return event;
      return {
        ...event,
        pendingRevision: {
          ...revision,
          notification: { evidenceFingerprint: id },
        },
      };
    }),
  };
}

export function createCalendarFailureNotification(
  error,
  execution = getNotificationExecution(),
) {
  const message = redactNotificationValue(
    error instanceof Error ? error.message : String(error),
  );
  const normalized = String(message).toLowerCase();
  const kind = normalized.includes("mass calendar disappearance")
    ? "desaparicion_masiva"
    : normalized.includes("calendar request failed")
      ? "fuente_inaccesible"
      : normalized.includes("icalendar") ||
          normalized.includes("calendar feed") ||
          normalized.includes("duplicate calendar")
        ? "parser_o_fuente_invalida"
        : "verificacion_fallida";
  const actionRequired =
    kind === "desaparicion_masiva"
      ? "Revisar la fuente antes de reintentar; el umbral bloqueo la publicacion y conserva el ultimo conjunto valido."
      : kind === "verificacion_fallida"
        ? "Corregir la verificacion fallida y reejecutar; no publicar ni aprobar cambios a partir de esta ejecucion."
        : "Corregir la fuente o el formato y reejecutar; el ultimo conjunto valido permanece sin cambios.";
  const id = fingerprintOrderedFields({ kind, message }, ["kind", "message"]);
  return {
    version: 1,
    notifications: [
      {
        id,
        kind,
        identity: null,
        temporality: "ejecucion_actual",
        cause: message,
        actionRequired,
        before: null,
        after: null,
        execution,
        fingerprints: {
          revisionId: null,
          evidenceFingerprint: null,
          failureFingerprint: id,
        },
      },
    ],
  };
}

function serializeProperty(name, value, isLast) {
  return `    ${name}: ${JSON.stringify(value)}${isLast ? "" : ","}`;
}

function serializeCalendarEvent(event) {
  const entries = [
    ["id", event.slug],
    ["aliases", event.aliases],
    ["archiveEligibleAt", event.archiveEligibleAt],
    ["title", event.title],
    ["date", event.date],
    ["endDate", event.endDate],
    ["startTime", event.startTime],
    ["endTime", event.endTime],
    ["location", event.location],
    ["summary", event.summary],
    ["eventType", event.eventType],
    ["organizer", event.organizer],
    ["infoUrl", event.infoUrl],
    ["timeZone", event.timeZone],
  ].filter(
    ([, value]) =>
      value !== undefined && (!Array.isArray(value) || value.length),
  );
  return [
    "  {",
    ...entries.map(([name, value], index) =>
      serializeProperty(name, value, index === entries.length - 1),
    ),
    "  }",
  ].join("\n");
}

export function serializeCalendarEvents(events) {
  return `import type { CalendarEvent } from "../types";

// Auto-generated from Google Calendar. Do not edit manually.
export const CALENDAR_EVENTS: CalendarEvent[] = [
${events
  .filter(
    (event) => event.editorialState !== "eliminado" && event.inactive !== true,
  )
  .map(serializeCalendarEvent)
  .join(",\n")}
];
`;
}

async function readCalendarSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `Calendar request failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.text();
  }
  return readFile(path.resolve(repoRoot, source), "utf8");
}

async function readRegistry(registryPath) {
  try {
    const registry = JSON.parse(await readFile(registryPath, "utf8"));
    if (
      ![2, 3, 4].includes(registry.version) ||
      !Array.isArray(registry.events)
    ) {
      throw new Error("Unsupported calendar event registry.");
    }
    return registry;
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 3, events: [] };
    throw error;
  }
}

export async function applyEditorialDecisionToFiles({
  registryPath = defaultRegistryPath,
  outputPath = defaultOutputPath,
  decision,
} = {}) {
  const registry = await readRegistry(registryPath);
  const updatedRegistry = applyEditorialDecision(registry, decision);
  await writeAtomically([
    [registryPath, `${JSON.stringify(updatedRegistry, null, 2)}\n`],
    [outputPath, serializeCalendarEvents(updatedRegistry.events)],
  ]);
  return updatedRegistry;
}

export async function writeAtomically(files) {
  const temporaryFiles = [];
  const backupFiles = [];
  const publishedFiles = [];
  try {
    for (const [filePath, contents] of files) {
      await mkdir(path.dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${process.pid}.tmp`;
      await writeFile(temporaryPath, contents, "utf8");
      temporaryFiles.push([temporaryPath, filePath]);
    }
    for (const [, filePath] of temporaryFiles) {
      const backupPath = `${filePath}.${process.pid}.backup`;
      try {
        await rename(filePath, backupPath);
        backupFiles.push([backupPath, filePath]);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    for (const [temporaryPath, filePath] of temporaryFiles) {
      await rename(temporaryPath, filePath);
      publishedFiles.push(filePath);
    }
    await Promise.allSettled(
      backupFiles.map(([backupPath]) => unlink(backupPath)),
    );
  } catch (error) {
    await Promise.allSettled(
      temporaryFiles.map(([temporaryPath]) => unlink(temporaryPath)),
    );
    await Promise.allSettled(
      publishedFiles.map((filePath) => unlink(filePath)),
    );
    await Promise.allSettled(
      backupFiles.map(([backupPath, filePath]) => rename(backupPath, filePath)),
    );
    throw error;
  }
}

async function stageTextFile(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const staged = `${filePath}.${process.pid}.stage`;
  await writeFile(staged, contents, "utf8");
  return { target: filePath, staged };
}

function escapeActionText(value) {
  return [...String(value)]
    .map((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint <= 31 || codePoint === 127 ? " " : character;
    })
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_{[\]}()#+.!|~-])/g, "\\$1");
}

export async function writeHistoricalChangesReport(report, reportPath) {
  if (!reportPath) return;
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export async function writeCalendarNotificationsReport(report, reportPath) {
  if (!reportPath) return;
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export async function writeActionSummary(
  warnings,
  eventCount,
  historicalReport,
  summaryPath = process.env.GITHUB_STEP_SUMMARY,
  operationalCounts = {},
) {
  if (!summaryPath) return;
  const historicalChanges = historicalReport?.historicalChanges ?? [];
  const galleryChanges = historicalReport?.galleryChanges ?? [];
  const lines = [
    "## Calendar synchronization",
    "",
    `Published events: ${eventCount}`,
    `Operational warnings: ${warnings.length}`,
    `Historical events requiring confirmation: ${historicalChanges.length}`,
    `Gallery states requiring attention: ${galleryChanges.length}`,
    `Events in preparation: ${operationalCounts.preparation ?? 0}`,
    `Archived events: ${operationalCounts.archived ?? 0}`,
    `Event types inferred from titles: ${operationalCounts.inferredTypes ?? 0}`,
    `Galleries imported this run: ${operationalCounts.importedGalleries ?? 0}`,
    `Frozen galleries: ${operationalCounts.frozenGalleries ?? 0}`,
    `Drive changes detected: ${operationalCounts.driveChanges ?? 0}`,
    `English translations valid: ${operationalCounts.validTranslations ?? 0}`,
    `English translations missing: ${operationalCounts.missingTranslations ?? 0}`,
    `English translations stale: ${operationalCounts.staleTranslations ?? 0}`,
    "",
    "### Operational warnings",
    "",
    ...(warnings.length
      ? warnings.map((warning) => `- ${escapeActionText(warning)}`)
      : ["None."]),
    "",
    "### Historical changes requiring confirmation",
    "",
    ...(historicalChanges.length
      ? historicalChanges.flatMap((event) => [
          `#### ${escapeActionText(event.publicIdentity.title)} (${escapeActionText(event.publicIdentity.date)})`,
          "",
          `Internal identity: \`${escapeActionText(event.sourceId)}\``,
          `Public identity: \`${escapeActionText(event.publicIdentity.slug)}\``,
          "",
          ...event.differences.map(
            (difference) =>
              `- ${escapeActionText(difference.field)}: ${escapeActionText(difference.type)}`,
          ),
          "",
        ])
      : ["None."]),
    "",
    "### Gallery states requiring attention",
    "",
    ...(galleryChanges.length
      ? galleryChanges.map(
          (change) =>
            `- ${escapeActionText(change.slug)}: ${escapeActionText(change.status)} (${escapeActionText(change.reason)})`,
        )
      : ["None."]),
    "",
  ];
  await appendFile(summaryPath, lines.join("\n"), "utf8");
}

export async function writeCalendarNotificationsSummary(
  notificationReport,
  summaryPath = process.env.GITHUB_STEP_SUMMARY,
) {
  if (!summaryPath) return;
  const notifications = notificationReport?.notifications ?? [];
  const lines = [
    "## Calendar actionable notifications",
    "",
    `Notifications: ${notifications.length}`,
    "",
    ...(notifications.length
      ? notifications.flatMap((notification) => [
          `### ${escapeActionText(notification.kind)}`,
          `Identity: ${escapeActionText(notification.identity?.slug ?? "not applicable")}`,
          `Temporality: ${escapeActionText(notification.temporality)}`,
          `Cause: ${escapeActionText(notification.cause)}`,
          `Required action: ${escapeActionText(notification.actionRequired)}`,
          `Execution: ${escapeActionText(notification.execution?.origin ?? "unknown")} run ${escapeActionText(notification.execution?.runId ?? "not available")} (attempt ${escapeActionText(notification.execution?.attempt ?? "not available")}, trigger ${escapeActionText(notification.execution?.trigger ?? "not available")})`,
          `Before (redacted): ${escapeActionText(JSON.stringify(notification.before))}`,
          `After (redacted): ${escapeActionText(JSON.stringify(notification.after))}`,
          `Notification fingerprint: \`${escapeActionText(notification.id)}\``,
          "",
        ])
      : ["None.", ""]),
  ];
  await appendFile(summaryPath, lines.join("\n"), "utf8");
}

export async function synchronizeCalendar({
  source,
  outputPath = defaultOutputPath,
  registryPath = defaultRegistryPath,
  now = new Date(),
  galleryOptions,
} = {}) {
  if (!source) {
    throw new Error(
      "Missing CALENDAR_ICS_URL. Add it as a GitHub Actions secret or pass an ICS URL/file path as the first argument.",
    );
  }

  const icsText = await readCalendarSource(source);
  const warnings = [];
  const parsed = parseVEvents(icsText)
    .map((properties) => parseCalendarEvent(properties, warnings))
    .filter(Boolean);
  const previousRegistry = await readRegistry(registryPath);
  assertSafeCalendarInput(previousRegistry, parsed);
  const currentBySourceId = new Map(
    parsed.map((event) => [event.sourceId, event]),
  );
  const historicalReport = redactReportSecrets(
    detectHistoricalChanges(previousRegistry, parsed, now),
    [source, process.env.CALENDAR_ICS_URL],
  );
  historicalReport.galleryChanges = [];
  let registry = mergeRegistry(previousRegistry, parsed, now);

  const galleryEvents = registry.events
    .filter((event) => {
      const lastEventDate =
        event.endDate && !event.startTime && !event.endTime
          ? addCalendarDays(event.endDate, -1)
          : (event.endDate ?? event.date);
      return (
        calculateGalleryCheckAt(lastEventDate, event.timeZone).getTime() <=
        now.getTime()
      );
    })
    .map((event) => ({
      slug: event.slug,
      title: event.title,
      date: event.date,
      albumUrl: getPrivateAlbumUrl(currentBySourceId.get(event.sourceId)),
    }));
  let galleryResult;
  if (galleryEvents.length || galleryOptions?.force) {
    galleryResult = await synchronizeEventGalleries({
      events: galleryEvents,
      ...galleryOptions,
      deferPublish: true,
    });
    warnings.push(...galleryResult.warnings);
    historicalReport.galleryChanges = galleryResult.alarms;
  }

  const notificationReport = createCalendarNotifications(registry);
  const notificationReportPath = process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH;
  if (notificationReportPath) {
    await writeCalendarNotificationsReport(
      notificationReport,
      notificationReportPath,
    );
    registry = recordCalendarNotifications(registry, notificationReport);
  }

  let calendarPublication;
  try {
    calendarPublication = await Promise.all([
      stageTextFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`),
      stageTextFile(outputPath, serializeCalendarEvents(registry.events)),
    ]);
  } catch (error) {
    await Promise.all(
      (galleryResult?.publication ?? []).map(({ staged }) =>
        rm(staged, { recursive: true, force: true }),
      ),
    );
    throw error;
  }
  await replaceTransaction([
    ...(galleryResult?.publication ?? []),
    ...calendarPublication,
  ]);
  await writeHistoricalChangesReport(
    historicalReport,
    process.env.HISTORICAL_CHANGES_REPORT_PATH,
  );
  return {
    registry,
    galleryResult,
    warnings,
    historicalReport,
    notificationReport,
  };
}

async function main() {
  const source = process.env.CALENDAR_ICS_URL ?? process.argv[2];
  const result = await synchronizeCalendar({
    source,
    outputPath: process.env.CALENDAR_OUTPUT_PATH ?? defaultOutputPath,
    registryPath: process.env.CALENDAR_REGISTRY_PATH ?? defaultRegistryPath,
  });
  console.log(
    `Synced ${result.registry.events.length} event(s) with ${result.warnings.length} warning(s).`,
  );
  const translationCounts = getTranslationPublicationCounts(
    result.registry.events,
  );
  const pendingTranslations =
    translationCounts.missing + translationCounts.stale;
  const actionWarnings = [...result.warnings];
  if (pendingTranslations) {
    actionWarnings.push(
      `${pendingTranslations} English translation(s) require editorial review (${translationCounts.missing} missing, ${translationCounts.stale} stale).`,
    );
    console.log(
      `::warning title=English translations pending::${pendingTranslations} event translation(s) require editorial review (${translationCounts.missing} missing, ${translationCounts.stale} stale).`,
    );
  }
  if (result.historicalReport.historicalChanges.length) {
    console.log(
      `::warning title=Historical calendar changes::${result.historicalReport.historicalChanges.length} historical event(s) require confirmation.`,
    );
  }
  await writeCalendarNotificationsSummary(result.notificationReport);
  await writeActionSummary(
    actionWarnings,
    result.registry.events.length,
    result.historicalReport,
    process.env.GITHUB_STEP_SUMMARY,
    {
      preparation: result.registry.events.filter((event) => !event.historical)
        .length,
      archived: result.registry.events.filter((event) => event.historical)
        .length,
      inferredTypes: result.registry.events.length,
      importedGalleries: result.galleryResult?.importedCount ?? 0,
      frozenGalleries: Object.keys(result.galleryResult?.state.galleries ?? {})
        .length,
      driveChanges: result.historicalReport.galleryChanges.filter(
        (change) => change.status === "galeria_congelada_cambio_detectado",
      ).length,
      validTranslations: translationCounts.valid,
      missingTranslations: translationCounts.missing,
      staleTranslations: translationCounts.stale,
    },
  );
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch(async (error) => {
    const notificationReport = createCalendarFailureNotification(error);
    await writeCalendarNotificationsReport(
      notificationReport,
      process.env.CALENDAR_NOTIFICATIONS_REPORT_PATH,
    );
    await writeCalendarNotificationsSummary(notificationReport);
    console.error(error);
    process.exitCode = 1;
  });
}
