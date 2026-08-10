import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  calculateArchiveEligibleAt,
  getArchiveEligibleAt,
  isArchiveEligible,
} from "../src/app/utils/eventArchive.js";
import { synchronizeEventGalleries } from "./sync-event-galleries.mjs";

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
  ["seminario", /(?:^|\s)seminarios?(?:$|\s)/],
];
const googleDriveFolderUrl = /^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+(?:[/?#].*)?$/;
const embeddedGoogleDriveFolderUrl = /https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]+(?:[/?#][^\s]*)?/g;
const albumUrlSymbol = Symbol("privateAlbumUrl");

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
    throw new Error("Invalid iCalendar feed: VCALENDAR boundaries are missing.");
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
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
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
      Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes),
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

function createLocalDate(date, time = "00:00") {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
  const publicLines = separatorIndex === -1 ? lines : lines.slice(0, separatorIndex);

  const metadata = new Map();
  for (const line of separatorIndex === -1 ? [] : lines.slice(separatorIndex + 1)) {
    if (!line.trim()) continue;
    const match = /^([A-Z_]+)\s*:\s*(.+)$/.exec(line.trim());
    if (!match || !["TIPO_EVENTO", "ALBUM_FOTOS"].includes(match[1])) {
      throw new Error(`Invalid technical metadata for ${title}: ${line.trim()}`);
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
    return matches.reduce((text, match) => text.replace(match, ""), line).trimEnd();
  });

  return {
    publicDescription: sanitizedPublicLines.join("\n").trim() || undefined,
    albumUrl,
  };
}

function inferEventType(title, warnings) {
  const normalizedTitle = slugify(title).replace(/-/g, " ");
  const inferred = inferredEventTypes.find(([, pattern]) => pattern.test(normalizedTitle));
  if (inferred) return inferred[0];
  warnings.push(`${title} has no controlled event type; using evento.`);
  return "evento";
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
    warnings.push(`Draft omitted: ${rawTitle.slice(draftPrefix.length).trim() || "(untitled)"}`);
    return undefined;
  }
  if (properties.has("RRULE")) {
    warnings.push(`Recurring event omitted: ${rawTitle || "(untitled)"}. Create individual events instead.`);
    return undefined;
  }
  if (properties.get("STATUS")?.value === "CANCELLED") {
    warnings.push(`Cancelled event omitted: ${rawTitle || "(untitled)"}`);
    return undefined;
  }

  const uid = properties.get("UID")?.value;
  const start = parseIcsDate(properties.get("DTSTART"));
  if (!uid || !start) {
    warnings.push(`Event omitted because UID or DTSTART is missing: ${rawTitle || "(untitled)"}`);
    return undefined;
  }

  const title = rawTitle || "Actividad sin título";
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

  if (!rawTitle) warnings.push(`Published with placeholder title on ${start.date}.`);
  if (!start.isDateOnly && start.time) event.startTime = start.time;
  if (end) {
    if (start.isDateOnly && end.isDateOnly) {
      const defaultEnd = toIsoDate(addDays(createLocalDate(start.date), 1));
      if (end.date !== defaultEnd) event.endDate = end.date;
    } else {
      if (end.date !== start.date) event.endDate = end.date;
      if (end.time) event.endTime = end.time;
    }
  }

  const lastEventDate =
    start.isDateOnly && end?.isDateOnly
      ? toIsoDate(addDays(createLocalDate(end.date), -1))
      : end?.date ?? start.date;
  event.archiveEligibleAt = calculateArchiveEligibleAt(
    lastEventDate,
    defaultTimeZone,
  ).toISOString();

  const optionalProperties = {
    location: properties.get("LOCATION")?.value,
    summary: description.publicDescription,
    eventType: inferEventType(title, warnings),
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
    Object.defineProperty(event, albumUrlSymbol, { value: description.albumUrl });
  }

  const missing = [
    !event.location && "ubicación",
    !event.summary && "descripción",
  ].filter(Boolean);
  if (missing.length) {
    warnings.push(`${title} (${start.date}) published without ${missing.join(" y ")}.`);
  }
  return event;
}

function assertUniqueCurrentSlugs(events) {
  const ownerBySlug = new Map();
  for (const event of events) {
    for (const slug of [event.slug, ...(event.aliases ?? [])]) {
      const previousOwner = ownerBySlug.get(slug);
      if (previousOwner) {
        const label = slug === event.slug
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

export function mergeRegistry(
  previousRegistry,
  currentEvents,
  now = new Date(),
) {
  assertUniqueCurrentSlugs(currentEvents);
  const previousBySourceId = new Map(
    (previousRegistry.events ?? []).map((event) => [event.sourceId, event]),
  );
  const reconciledCurrentEvents = currentEvents.map((currentEvent) => {
    const previousEvent = previousBySourceId.get(currentEvent.sourceId);
    const aliases = previousEvent?.aliases;
    const wasHistorical =
      previousEvent?.historical === true ||
      (previousEvent ? isArchiveEligible(previousEvent, now) : false);
    const becomesHistorical =
      new Date(currentEvent.archiveEligibleAt).getTime() <= now.getTime();

    if (wasHistorical) {
      return {
        ...currentEvent,
        sourceId: previousEvent.sourceId,
        slug: previousEvent.slug,
        title: previousEvent.title,
        date: previousEvent.date,
        archiveEligibleAt: getArchiveEligibleAt(previousEvent).toISOString(),
        historical: true,
        ...(aliases?.length ? { aliases } : {}),
      };
    }

    return {
      ...currentEvent,
      ...(becomesHistorical ? { historical: true } : {}),
      ...(aliases?.length ? { aliases } : {}),
    };
  });
  const currentSourceIds = new Set(reconciledCurrentEvents.map((event) => event.sourceId));
  const retainedHistoricalEvents = (previousRegistry.events ?? []).filter(
    (event) =>
      !currentSourceIds.has(event.sourceId) &&
      (event.historical === true || isArchiveEligible(event, now)),
  );
  const merged = [...reconciledCurrentEvents, ...retainedHistoricalEvents];
  assertUniqueCurrentSlugs(merged);
  merged.sort(
    (a, b) =>
      createLocalDate(a.date, a.startTime).getTime() -
      createLocalDate(b.date, b.startTime).getTime(),
  );
  return { version: 3, events: merged };
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
  ].filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length));
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
${events.map(serializeCalendarEvent).join(",\n")}
];
`;
}

async function readCalendarSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Calendar request failed: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
  return readFile(path.resolve(repoRoot, source), "utf8");
}

async function readRegistry(registryPath) {
  try {
    const registry = JSON.parse(await readFile(registryPath, "utf8"));
    if (![2, 3].includes(registry.version) || !Array.isArray(registry.events)) {
      throw new Error("Unsupported calendar event registry.");
    }
    return registry;
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 3, events: [] };
    throw error;
  }
}

async function writeAtomically(files) {
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

async function writeActionSummary(warnings, eventCount) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const lines = [
    "## Calendar synchronization",
    "",
    `Published events: ${eventCount}`,
    `Warnings: ${warnings.length}`,
    "",
    ...warnings.map((warning) => `- ⚠️ ${warning}`),
    "",
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
  const currentBySourceId = new Map(parsed.map((event) => [event.sourceId, event]));
  const previousRegistry = await readRegistry(registryPath);
  const registry = mergeRegistry(previousRegistry, parsed, now);

  const galleryEvents = registry.events
    .filter((event) => event.historical === true)
    .map((event) => ({
      slug: event.slug,
      title: event.title,
      albumUrl: getPrivateAlbumUrl(currentBySourceId.get(event.sourceId)),
    }));
  let galleryResult;
  if (galleryEvents.some((event) => event.albumUrl) || galleryOptions?.force) {
    galleryResult = await synchronizeEventGalleries({
      events: galleryEvents,
      ...galleryOptions,
    });
    warnings.push(...galleryResult.warnings);
  }

  await writeAtomically([
    [registryPath, `${JSON.stringify(registry, null, 2)}\n`],
    [outputPath, serializeCalendarEvents(registry.events)],
  ]);
  await writeActionSummary(warnings, registry.events.length);

  return { registry, galleryResult, warnings };
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
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
