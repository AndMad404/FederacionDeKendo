import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createCanonicalSlug,
  mergeRegistry,
  parseCalendarEvent,
  parseVEvents,
  synchronizeCalendar,
} from "../scripts/sync-calendar-events.mjs";

const fixturePath = new URL("./fixtures/calendar-events.ics", import.meta.url);

function createIcs(events) {
  return [
    "BEGIN:VCALENDAR",
    ...events.flatMap(({ uid, date = "20260808", title = "Examen" }) => [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${title}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\n");
}

async function runSynchronization({
  tempDirectory,
  name,
  events,
  registryPath = path.join(tempDirectory, `${name}-registry.json`),
}) {
  const sourcePath = path.join(tempDirectory, `${name}.ics`);
  const outputPath = path.join(tempDirectory, `${name}-calendarEvents.ts`);
  await writeFile(sourcePath, createIcs(events));
  const result = await synchronizeCalendar({
    source: sourcePath,
    outputPath,
    registryPath,
    now: new Date("2026-07-01"),
  });
  return { ...result, outputPath, registryPath };
}

test("creates the same opaque 24-character sourceId for the same UID", async () => {
  const [properties] = parseVEvents(await readFile(fixturePath, "utf8"));
  const first = parseCalendarEvent(properties);
  const second = parseCalendarEvent(properties);

  assert.equal(first.sourceId, second.sourceId);
  assert.equal(first.sourceId, "aac691754e9f35832d4dfec4");
  assert.match(first.sourceId, /^[a-f0-9]{24}$/);
  assert.equal(first.sourceId.includes("exam-1@example.test"), false);
});

test("stores the exclusive DTEND for all-day ranges", async () => {
  const properties = parseVEvents(await readFile(fixturePath, "utf8"));
  const events = properties
    .map((event) => parseCalendarEvent(event))
    .filter(Boolean);

  assert.equal(events[1].date, "2026-09-11");
  assert.equal(events[1].endDate, "2026-09-13");
});

test("omits drafts and recurring events and warns about incomplete content", async () => {
  const warnings = [];
  const events = parseVEvents(await readFile(fixturePath, "utf8"))
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.equal(events.some((event) => event.title.includes("BORRADOR")), false);
  assert.equal(events.some((event) => event.title === "Entrenamiento semanal"), false);
  assert.equal(events.some((event) => event.title === "Actividad sin detalles"), true);
  assert.equal(warnings.some((warning) => warning.includes("Draft omitted")), true);
  assert.equal(warnings.some((warning) => warning.includes("Recurring event omitted")), true);
  assert.equal(warnings.some((warning) => warning.includes("ubicación")), true);
});

test("uses the current canonical slug when the title changes", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "same-source",
        slug: "2026-08-08-examen",
        title: "Examen",
        date: "2026-08-08",
      },
    ],
  };
  const current = [
    {
      sourceId: "same-source",
      slug: "2026-08-08-examen-nacional",
      title: "Examen nacional",
      date: "2026-08-08",
    },
  ];

  const [event] = mergeRegistry(previous, current, new Date("2026-07-01")).events;
  assert.equal(event.slug, "2026-08-08-examen-nacional");
});

test("uses the current canonical slug when the date changes", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "same-source",
        slug: "2026-08-08-examen",
        title: "Examen",
        date: "2026-08-08",
      },
    ],
  };
  const current = [
    {
      sourceId: "same-source",
      slug: "2026-08-15-examen",
      title: "Examen",
      date: "2026-08-15",
    },
  ];

  const [event] = mergeRegistry(previous, current, new Date("2026-07-01")).events;
  assert.equal(event.slug, "2026-08-15-examen");
});

test("removes missing future events and preserves missing historical events", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "past",
        slug: "2025-01-01-past",
        title: "Past",
        date: "2025-01-01",
      },
      {
        sourceId: "future",
        slug: "2027-01-01-future",
        title: "Future",
        date: "2027-01-01",
      },
    ],
  };

  const merged = mergeRegistry(previous, [], new Date("2026-07-01"));
  assert.deepEqual(merged.events.map((event) => event.sourceId), ["past"]);
});

test("canonical slug starts with the date and normalizes accents", () => {
  assert.equal(
    createCanonicalSlug("Torneo de América", "2026-10-10"),
    "2026-10-10-torneo-de-america",
  );
});

test("keeps sourceId in the registry and out of the public event URL", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));

  try {
    const result = await runSynchronization({
      tempDirectory,
      name: "internal-identity",
      events: [{ uid: "first@example.test", title: "Examen de kyu" }],
    });
    const [event] = result.registry.events;
    const generatedOutput = await readFile(result.outputPath, "utf8");

    assert.equal(event.sourceId, "3f2eb91b31105691fbf84f65");
    assert.equal(event.slug, "2026-08-08-examen-de-kyu");
    assert.equal(event.slug.includes(event.sourceId.slice(0, 8)), false);
    assert.equal(generatedOutput.includes(event.sourceId), false);
    assert.match(generatedOutput, /id: "2026-08-08-examen-de-kyu"/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("a duplicate date and title aborts before either destination is published", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const sourcePath = path.join(tempDirectory, "collision.ics");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  const previousRegistry = '{"version":2,"events":[]}';
  await writeFile(
    sourcePath,
    createIcs([
      { uid: "first@example.test" },
      { uid: "second@example.test" },
    ]),
  );
  await writeFile(outputPath, "previous output");
  await writeFile(registryPath, previousRegistry);

  try {
    await assert.rejects(
      synchronizeCalendar({
        source: sourcePath,
        outputPath,
        registryPath,
        now: new Date("2026-07-01"),
      }),
      /Duplicate calendar canonical slug: 2026-08-08-examen/,
    );
    assert.equal(await readFile(outputPath, "utf8"), "previous output");
    assert.equal(await readFile(registryPath, "utf8"), previousRegistry);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("an invalid feed leaves the last published files untouched", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const sourcePath = path.join(tempDirectory, "invalid.ics");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  await writeFile(sourcePath, "not a calendar");
  await writeFile(outputPath, "previous output");
  await writeFile(registryPath, '{"version":2,"events":[]}');

  try {
    await assert.rejects(
      synchronizeCalendar({ source: sourcePath, outputPath, registryPath }),
      /Invalid iCalendar feed/,
    );
    assert.equal(await readFile(outputPath, "utf8"), "previous output");
    assert.equal(
      await readFile(registryPath, "utf8"),
      '{"version":2,"events":[]}',
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
