import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const calendarSource = process.env.CALENDAR_ICS_URL ?? process.argv[2];
const outputPath =
  process.env.CALENDAR_OUTPUT_PATH ??
  path.join(repoRoot, "src", "app", "data", "calendarEvents.ts");
const lookaheadMonths = parsePositiveInteger(
  process.env.CALENDAR_LOOKAHEAD_MONTHS,
  6,
);
const minimumFutureEvents = parsePositiveInteger(
  process.env.CALENDAR_MIN_FUTURE_EVENTS,
  12,
);
const defaultTimeZone = process.env.CALENDAR_TIME_ZONE ?? "America/Costa_Rica";

function parsePositiveInteger(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requireCalendarSource() {
  if (!calendarSource) {
    throw new Error(
      "Missing CALENDAR_ICS_URL. Add it as a GitHub Actions secret or pass an ICS URL/file path as the first argument.",
    );
  }
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

  if (colonIndex === -1) {
    return undefined;
  }

  const rawName = line.slice(0, colonIndex);
  const rawValue = line.slice(colonIndex + 1);
  const [name, ...rawParams] = rawName.split(";");
  const params = Object.fromEntries(
    rawParams.map((param) => {
      const equalsIndex = param.indexOf("=");

      if (equalsIndex === -1) {
        return [param.toUpperCase(), ""];
      }

      return [
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

function parseVEvents(icsText) {
  const events = [];
  let currentEventLines;

  for (const line of unfoldIcsLines(icsText)) {
    if (line === "BEGIN:VEVENT") {
      currentEventLines = [];
      continue;
    }

    if (line === "END:VEVENT" && currentEventLines) {
      events.push(currentEventLines);
      currentEventLines = undefined;
      continue;
    }

    if (currentEventLines) {
      currentEventLines.push(line);
    }
  }

  return events.map((eventLines) => {
    const properties = new Map();

    for (const line of eventLines) {
      const property = parseIcsProperty(line);

      if (!property || properties.has(property.name)) {
        continue;
      }

      properties.set(property.name, property);
    }

    return properties;
  });
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

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate({ year, month, day }) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatTime({ hours, minutes }) {
  return `${pad(hours)}:${pad(minutes)}`;
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
  if (!property) {
    return undefined;
  }

  const isDateOnly =
    property.params.VALUE === "DATE" || /^\d{8}$/.test(property.rawValue);

  if (isDateOnly) {
    return {
      date: formatDate(parseBasicDate(property.rawValue)),
      isDateOnly: true,
      timeZone: defaultTimeZone,
    };
  }

  if (/Z$/i.test(property.rawValue)) {
    const parts = parseBasicDateTime(property.rawValue);
    const utcDate = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes),
    );
    const localDateTime = formatDateTimeInZone(utcDate, defaultTimeZone);

    return {
      date: localDateTime.date,
      time: localDateTime.time,
      isDateOnly: false,
      timeZone: defaultTimeZone,
    };
  }

  const parts = parseBasicDateTime(property.rawValue);

  return {
    date: formatDate(parts),
    time: formatTime(parts),
    isDateOnly: false,
    timeZone: property.params.TZID ?? defaultTimeZone,
  };
}

function createDateAtStartOfDay(date) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function createDateTime(date, time = "00:00") {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);

  return nextDate;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getEventEndDateTime(event) {
  if (event.endDate) {
    return createDateAtStartOfDay(event.endDate);
  }

  if (event.endTime) {
    return createDateTime(event.date, event.endTime);
  }

  if (event.startTime) {
    const startDate = createDateTime(event.date, event.startTime);
    startDate.setHours(startDate.getHours() + 1);

    return startDate;
  }

  return addDays(createDateAtStartOfDay(event.date), 1);
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

function createEventId(title, date, usedIds) {
  const base = slugify(`${title}-${date}`) || "calendar-event";
  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);

  return id;
}

function getEventType(property) {
  if (!property) {
    return undefined;
  }

  const supportedTypes = new Map(
    [
      "Examen",
      "Torneo",
      "Seminario",
      "Entrenamiento especial",
      "Actividad federativa",
    ].map((type) => [
      type
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
      type,
    ]),
  );

  for (const category of property.value.split(",")) {
    const normalizedCategory = category
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const matchingType = supportedTypes.get(normalizedCategory);

    if (matchingType) {
      return matchingType;
    }
  }

  return undefined;
}

function getOrganizer(property) {
  if (!property) {
    return undefined;
  }

  const commonName = property.params.CN
    ? decodeIcsText(property.params.CN)
    : undefined;

  return commonName || property.value.replace(/^mailto:/i, "");
}

function parseCalendarEvent(properties, usedIds) {
  const status = properties.get("STATUS")?.value;

  if (status === "CANCELLED") {
    return undefined;
  }

  const title = properties.get("SUMMARY")?.value;
  const start = parseIcsDate(properties.get("DTSTART"));
  const end = parseIcsDate(properties.get("DTEND"));

  if (!title || !start) {
    return undefined;
  }

  const event = {
    id: createEventId(title, start.date, usedIds),
    title,
    date: start.date,
  };

  if (!start.isDateOnly && start.time) {
    event.startTime = start.time;
  }

  if (end) {
    if (start.isDateOnly && end.isDateOnly) {
      const singleDayExclusiveEndDate = toIsoDate(addDays(createDateAtStartOfDay(start.date), 1));

      if (end.date !== singleDayExclusiveEndDate) {
        event.endDate = end.date;
      }
    } else if (end.date === start.date && end.time) {
      event.endTime = end.time;
    }
  }

  const location = properties.get("LOCATION")?.value;
  const summary = properties.get("DESCRIPTION")?.value;
  const type = getEventType(properties.get("CATEGORIES"));
  const organizer = getOrganizer(properties.get("ORGANIZER"));
  const infoUrl = properties.get("URL")?.value;

  if (location) {
    event.location = location;
  }

  if (summary) {
    event.summary = summary;
  }

  if (type) {
    event.type = type;
  }

  if (organizer) {
    event.organizer = organizer;
  }

  if (infoUrl) {
    event.infoUrl = infoUrl;
  }

  event.timeZone = start.timeZone ?? defaultTimeZone;

  return event;
}

function selectFutureEvents(events) {
  const now = new Date();
  const lookaheadEnd = addMonths(now, lookaheadMonths);
  const futureEvents = events
    .filter((event) => getEventEndDateTime(event) >= now)
    .sort(
      (a, b) =>
        createDateTime(a.date, a.startTime).getTime() -
        createDateTime(b.date, b.startTime).getTime(),
    );

  const eventsInsideWindow = futureEvents.filter(
    (event) => createDateTime(event.date, event.startTime).getTime() <= lookaheadEnd.getTime(),
  );

  if (eventsInsideWindow.length >= minimumFutureEvents) {
    return eventsInsideWindow;
  }

  return futureEvents.slice(0, minimumFutureEvents);
}

function serializeProperty(name, value, isLast = false) {
  return `    ${name}: ${JSON.stringify(value)}${isLast ? "" : ","}`;
}

function serializeEvent(event) {
  const entries = [
    ["id", event.id],
    ["title", event.title],
    ["date", event.date],
    ["endDate", event.endDate],
    ["startTime", event.startTime],
    ["endTime", event.endTime],
    ["location", event.location],
    ["summary", event.summary],
    ["type", event.type],
    ["organizer", event.organizer],
    ["infoUrl", event.infoUrl],
    ["ctaLabel", event.ctaLabel],
    ["timeZone", event.timeZone],
  ].filter(([, value]) => value);

  return [
    "  {",
    ...entries.map(([name, value], index) =>
      serializeProperty(name, value, index === entries.length - 1),
    ),
    "  }",
  ].join("\n");
}

function serializeCalendarEvents(events) {
  const serializedEvents = events.map(serializeEvent).join(",\n");

  return `import type { CalendarEvent } from "../types";

// Auto-generated from Google Calendar. Do not edit manually.
export const CALENDAR_EVENTS: CalendarEvent[] = [
${serializedEvents}
];
`;
}

async function main() {
  requireCalendarSource();

  const icsText = await readCalendarSource(calendarSource);
  const usedIds = new Set();
  const events = selectFutureEvents(
    parseVEvents(icsText)
      .map((properties) => parseCalendarEvent(properties, usedIds))
      .filter(Boolean),
  );

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializeCalendarEvents(events), "utf8");

  console.log(`Synced ${events.length} calendar event(s) to ${path.relative(repoRoot, outputPath)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
