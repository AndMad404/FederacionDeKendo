import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  HISTORICAL_COMPARISON_FIELDS,
  detectHistoricalChanges,
  getTranslationPublicationCounts,
  serializeCalendarEvents,
  synchronizeCalendar,
  writeActionSummary,
} from "../../scripts/sync-calendar-events.ts";
import {
  REMOVED_HISTORICAL_FIELDS,
  makeHistoricalEvent,
  makeChangedCalendarEvent,
} from "../helpers/event-history-fixtures.mjs";

test("C2: report deterministic field changes without mutating the historical snapshot", () => {
  const registryBefore = JSON.stringify({
    version: 3,
    events: [makeHistoricalEvent()],
  });
  const report = detectHistoricalChanges(
    JSON.parse(registryBefore),
    [structuredClone(makeChangedCalendarEvent())],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(
    report.historicalChanges[0].differences.map(({ field }) => field),
    HISTORICAL_COMPARISON_FIELDS.filter(
      (field) =>
        JSON.stringify(makeHistoricalEvent()[field]) !==
        JSON.stringify(makeChangedCalendarEvent()[field]),
    ),
  );
  assert.equal(
    report.historicalChanges[0].differences.every(
      ({ type }) => type === "modificado",
    ),
    true,
  );
  assert.equal(
    JSON.stringify({ version: 3, events: [makeHistoricalEvent()] }),
    registryBefore,
  );
});

test("C2: report deterministic field removals without mutating the historical snapshot", () => {
  const current = { ...makeHistoricalEvent() };
  delete current.historical;
  for (const field of REMOVED_HISTORICAL_FIELDS) delete current[field];
  const report = detectHistoricalChanges(
    { version: 3, events: [structuredClone(makeHistoricalEvent())] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(
    report.historicalChanges[0].differences,
    REMOVED_HISTORICAL_FIELDS.map((field) => ({
      field,
      published: makeHistoricalEvent()[field],
      proposed: null,
      type: "eliminado",
    })),
  );
});

test("C2: report feed disappearance with stable identity and deterministic event order", () => {
  const second = {
    ...makeHistoricalEvent(),
    sourceId: "a-source",
    slug: "2026-01-09-examen",
    title: "Examen",
  };
  const report = detectHistoricalChanges(
    { version: 3, events: [makeHistoricalEvent(), second] },
    [],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(
    report.historicalChanges.map(({ sourceId }) => sourceId),
    ["a-source", "stable-source"],
  );
  assert.deepEqual(report.historicalChanges[0].differences, [
    {
      field: "feed",
      published: "presente",
      proposed: "ausente",
      type: "desaparecido_del_feed",
    },
  ]);
});

test("C2: keep operational warnings separate and neutralize Calendar markup in the Actions summary", async (t) => {
  const directory = await temporaryDirectory(t, "fak-c2-summary-");

  const summaryPath = path.join(directory, "summary.md");
  await writeActionSummary(
    ["<details>warning\n::error::injected"],
    1,
    detectHistoricalChanges(
      { version: 3, events: [makeHistoricalEvent()] },
      [
        {
          ...makeHistoricalEvent(),
          historical: undefined,
          title: "Changed <script>",
        },
      ],
      new Date("2026-03-01T00:00:00.000Z"),
    ),
    summaryPath,
  );
  const summary = await readFile(summaryPath, "utf8");
  assert.match(summary, /### Operational warnings/);
  assert.match(summary, /Events in preparation: 0/);
  assert.match(summary, /Archived events: 0/);
  assert.match(summary, /Event types inferred from titles: 0/);
  assert.match(summary, /Galleries imported this run: 0/);
  assert.match(summary, /Frozen galleries: 0/);
  assert.match(summary, /Drive changes detected: 0/);
  assert.match(summary, /### Historical changes requiring confirmation/);
  assert.doesNotMatch(summary, /<details>|<script>|\n::error::/);
});

test("SEO phase 5: classifies English translation publication without blocking Spanish events", async () => {
  const events = [
    { id: "valid", title: "Examen", summary: "Public summary" },
    { id: "missing", title: "Torneo", summary: undefined },
    { id: "stale", title: "Seminario actualizado", summary: undefined },
  ];
  const translations = {
    valid: {
      source: { title: "Examen", summary: "Public summary" },
      translation: { title: "Examination", summary: "Public summary" },
    },
    stale: {
      source: { title: "Seminario", summary: undefined },
      translation: { title: "Seminar", summary: undefined },
    },
  };

  assert.deepEqual(getTranslationPublicationCounts(events, translations), {
    valid: 1,
    missing: 1,
    stale: 1,
  });
  assert.equal(events.length, 3);
});

test("SEO phase 5: reports pending English translations without an alarm", async (t) => {
  const directory = await temporaryDirectory(t, "fak-seo-summary-");

  const summaryPath = path.join(directory, "summary.md");
  await writeActionSummary(
    [],
    3,
    { historicalChanges: [], galleryChanges: [] },
    summaryPath,
    { validTranslations: 1, missingTranslations: 1, staleTranslations: 1 },
  );
  const summary = await readFile(summaryPath, "utf8");
  assert.match(summary, /Operational warnings: 0/);
  assert.match(summary, /English translations valid: 1/);
  assert.match(summary, /English translations missing: 1/);
  assert.match(summary, /English translations stale: 1/);
  assert.doesNotMatch(summary, /require editorial review/);
});

test("C2: synchronization writes a private-safe report while retaining frozen published output", async (t) => {
  const directory = await temporaryDirectory(t, "fak-c2-sync-");

  const sourcePath = path.join(directory, "calendar.ics");
  const registryPath = path.join(directory, "registry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const privateDriveUrl =
    "https://drive.google.com/drive/folders/private-folder";
  const sourceId = createHash("sha256")
    .update("stable-source-uid")
    .digest("hex")
    .slice(0, 24);
  const frozenEvent = { ...makeHistoricalEvent(), sourceId };
  const registry = { version: 4, events: [frozenEvent] };
  const generated = serializeCalendarEvents(registry.events);
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  await writeFile(outputPath, generated);
  await writeFile(
    sourcePath,
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:stable-source-uid",
      "DTSTART;VALUE=DATE:20260110",
      "SUMMARY:Changed event",
      `DESCRIPTION:Public text\\n---\\nALBUM_FOTOS: ${privateDriveUrl}`,
      `URL:${sourcePath}`,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
  const beforeOutput = await readFile(outputPath, "utf8");
  const result = await synchronizeCalendar({
    source: sourcePath,
    registryPath,
    outputPath,
    now: new Date("2026-03-01T00:00:00.000Z"),
    galleryOptions: {
      manifestPath: path.join(directory, "eventGalleries.ts"),
      statePath: path.join(directory, "eventGalleryState.json"),
      imagesRoot: path.join(directory, "images"),
      listFolder: async () => [],
    },
  });
  const serializedReport = JSON.stringify(result.historicalReport);
  assert.equal(result.registry.events[0].editorialState, "pendiente");
  assert.equal(await readFile(outputPath, "utf8"), beforeOutput);
  assert.doesNotMatch(
    serializedReport,
    /drive\.google\.com|ALBUM_FOTOS|private-folder/,
  );
  assert.equal(serializedReport.includes(sourcePath), false);
});
