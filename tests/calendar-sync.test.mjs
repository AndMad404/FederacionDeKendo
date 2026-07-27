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

test("parses UID as a non-reversible stable hash and handles all-day ranges", async () => {
  const properties = parseVEvents(await readFile(fixturePath, "utf8"));
  const warnings = [];
  const events = properties
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.equal(events.length, 3);
  assert.match(events[0].sourceId, /^[a-f0-9]{24}$/);
  assert.notEqual(events[0].sourceId, "exam-1@example.test");
  assert.equal(events[0].slug, "2026-08-08-examen-nacional");
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

test("preserves aliases when a title or date changes", () => {
  const previous = {
    version: 1,
    events: [
      {
        sourceId: "same-source",
        slug: "2026-08-08-examen",
        aliases: ["examen-2026-08-08"],
        title: "Examen",
        date: "2026-08-08",
      },
    ],
  };
  const current = [
    {
      sourceId: "same-source",
      slug: "2026-08-15-examen-nacional",
      aliases: [],
      title: "Examen nacional",
      date: "2026-08-15",
    },
  ];

  const merged = mergeRegistry(previous, current, new Date("2026-07-01"));
  assert.deepEqual(merged.events[0].aliases, [
    "2026-08-08-examen",
    "examen-2026-08-08",
  ]);
});

test("removes missing future events and preserves missing historical events", () => {
  const previous = {
    version: 1,
    events: [
      {
        sourceId: "past",
        slug: "2025-01-01-past",
        aliases: [],
        title: "Past",
        date: "2025-01-01",
      },
      {
        sourceId: "future",
        slug: "2027-01-01-future",
        aliases: [],
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

test("resolves equal date/title slugs without losing either event", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const sourcePath = path.join(tempDirectory, "collision.ics");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  await writeFile(
    sourcePath,
    `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:first@example.test
DTSTART;VALUE=DATE:20260808
SUMMARY:Examen
END:VEVENT
BEGIN:VEVENT
UID:second@example.test
DTSTART;VALUE=DATE:20260808
SUMMARY:Examen
END:VEVENT
END:VCALENDAR`,
  );

  try {
    const result = await synchronizeCalendar({
      source: sourcePath,
      outputPath,
      registryPath,
      now: new Date("2026-07-01"),
    });
    assert.equal(new Set(result.registry.events.map((event) => event.slug)).size, 2);
    assert.equal(result.warnings.some((warning) => warning.includes("collision")), true);
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
  await writeFile(registryPath, '{"version":1,"events":[]}');

  try {
    await assert.rejects(
      synchronizeCalendar({ source: sourcePath, outputPath, registryPath }),
      /Invalid iCalendar feed/,
    );
    assert.equal(await readFile(outputPath, "utf8"), "previous output");
    assert.equal(
      await readFile(registryPath, "utf8"),
      '{"version":1,"events":[]}',
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
