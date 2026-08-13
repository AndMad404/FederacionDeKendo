import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  HISTORICAL_COMPARISON_FIELDS,
  detectHistoricalChanges,
  mergeRegistry,
  serializeCalendarEvents,
  synchronizeCalendar,
  writeActionSummary,
} from "../scripts/sync-calendar-events.mjs";
import { synchronizeEventGalleries } from "../scripts/sync-event-galleries.mjs";

const PUBLIC_EVENT_FIELDS = [
  "id",
  "aliases",
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

const REGISTRY_EVENT_FIELDS = [
  "sourceId",
  "slug",
  "aliases",
  "archiveEligibleAt",
  "historical",
  "inactive",
  ...PUBLIC_EVENT_FIELDS.filter((field) => !["id", "aliases", "archiveEligibleAt"].includes(field)),
];

const historicalSnapshot = {
  sourceId: "stable-source",
  slug: "2026-01-10-seminario",
  aliases: ["2026-01-10-seminario-anterior"],
  archiveEligibleAt: "2026-01-13T06:00:00.000Z",
  historical: true,
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

const changedCalendarEvent = {
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

const REMOVED_HISTORICAL_FIELDS = [
  "endDate",
  "endTime",
  "location",
  "summary",
  "organizer",
  "infoUrl",
];

function merge(previousEvent, currentEvents = [changedCalendarEvent]) {
  return mergeRegistry(
    { version: 3, events: [structuredClone(previousEvent)] },
    structuredClone(currentEvents),
    new Date("2026-03-01T00:00:00.000Z"),
  );
}

test("inventories every field persisted in the registry and public event model", () => {
  assert.deepEqual(REGISTRY_EVENT_FIELDS, [
    "sourceId", "slug", "aliases", "archiveEligibleAt", "historical", "inactive", "title",
    "date", "endDate", "startTime", "endTime", "location", "summary",
    "eventType", "organizer", "infoUrl", "timeZone",
  ]);
  assert.deepEqual(PUBLIC_EVENT_FIELDS, [
    "id", "aliases", "archiveEligibleAt", "title", "date", "endDate",
    "startTime", "endTime", "location", "summary", "eventType", "organizer",
    "infoUrl", "timeZone",
  ]);
});

test("Given one historical event disappears, When another remains in the feed, Then the missing snapshot is retained but inactive", () => {
  const present = { ...historicalSnapshot, sourceId: "present-source", slug: "2026-01-11-present", aliases: undefined };
  const result = mergeRegistry(
    { version: 3, events: [historicalSnapshot, present] },
    [{ ...present, historical: undefined }],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(
    result.events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId),
    { ...historicalSnapshot, inactive: true },
  );
  assert.equal(serializeCalendarEvents(result.events).includes(historicalSnapshot.slug), false);
});

test("Given a future event, When Calendar changes every persisted editorial field, Then the changes remain editable", () => {
  const previous = { ...historicalSnapshot, historical: false, archiveEligibleAt: "2026-04-13T06:00:00.000Z" };
  const current = { ...changedCalendarEvent, archiveEligibleAt: "2026-04-23T06:00:00.000Z" };
  const result = mergeRegistry(
    { version: 3, events: [previous] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(result.events[0], { ...current, aliases: previous.aliases });
});

test("Given an event reaches archiveEligibleAt, When it synchronizes, Then its complete normalized event is captured once", () => {
  const current = {
    ...changedCalendarEvent,
    archiveEligibleAt: "2026-02-23T06:00:00.000Z",
  };
  const first = mergeRegistry(
    { version: 3, events: [] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(first.events, [{ ...current, historical: true }]);
  assert.deepEqual(
    mergeRegistry(
      first,
      [{ ...current, summary: "Cambio posterior" }],
      new Date("2026-03-02T00:00:00.000Z"),
    ),
    first,
  );
});

test("Given a historical event, When Calendar changes every persisted field, Then its registry and generated TypeScript remain intact", () => {
  const generatedBefore = serializeCalendarEvents([historicalSnapshot]);
  const result = merge(historicalSnapshot);

  assert.deepEqual(result.events, [historicalSnapshot]);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("Given a historical event, When Calendar removes persisted fields, Then its registry and generated TypeScript remain intact", () => {
  const current = { ...changedCalendarEvent };
  for (const field of REMOVED_HISTORICAL_FIELDS) delete current[field];

  const generatedBefore = serializeCalendarEvents([historicalSnapshot]);
  const result = merge(historicalSnapshot, [current]);

  assert.deepEqual(result.events, [historicalSnapshot]);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("C2: report deterministic field changes without mutating the historical snapshot", () => {
  const registryBefore = JSON.stringify({ version: 3, events: [historicalSnapshot] });
  const report = detectHistoricalChanges(
    JSON.parse(registryBefore),
    [structuredClone(changedCalendarEvent)],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(report.historicalChanges[0].differences.map(({ field }) => field),
    HISTORICAL_COMPARISON_FIELDS.filter(
      (field) => JSON.stringify(historicalSnapshot[field]) !== JSON.stringify(changedCalendarEvent[field]),
    ));
  assert.equal(report.historicalChanges[0].differences.every(({ type }) => type === "modificado"), true);
  assert.equal(JSON.stringify({ version: 3, events: [historicalSnapshot] }), registryBefore);
});

test("C2: report deterministic field removals without mutating the historical snapshot", () => {
  const current = { ...historicalSnapshot };
  delete current.historical;
  for (const field of REMOVED_HISTORICAL_FIELDS) delete current[field];
  const report = detectHistoricalChanges(
    { version: 3, events: [structuredClone(historicalSnapshot)] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(report.historicalChanges[0].differences, REMOVED_HISTORICAL_FIELDS.map((field) => ({
    field,
    published: historicalSnapshot[field],
    proposed: null,
    type: "eliminado",
  })));
});

test("C2: report feed disappearance with stable identity and deterministic event order", () => {
  const second = { ...historicalSnapshot, sourceId: "a-source", slug: "2026-01-09-examen", title: "Examen" };
  const report = detectHistoricalChanges(
    { version: 3, events: [historicalSnapshot, second] },
    [],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(report.historicalChanges.map(({ sourceId }) => sourceId), ["a-source", "stable-source"]);
  assert.deepEqual(report.historicalChanges[0].differences, [{
    field: "feed", published: "presente", proposed: "ausente", type: "desaparecido_del_feed",
  }]);
});

test("C2: keep operational warnings separate and neutralize Calendar markup in the Actions summary", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c2-summary-"));
  const summaryPath = path.join(directory, "summary.md");
  try {
    await writeActionSummary(
      ["<details>warning\n::error::injected"],
      1,
      detectHistoricalChanges(
        { version: 3, events: [historicalSnapshot] },
        [{ ...historicalSnapshot, historical: undefined, title: "Changed <script>" }],
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("C2: synchronization writes a private-safe report without changing frozen published bytes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c2-sync-"));
  const sourcePath = path.join(directory, "calendar.ics");
  const registryPath = path.join(directory, "registry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const privateDriveUrl = "https://drive.google.com/drive/folders/private-folder";
  const sourceId = createHash("sha256").update("stable-source-uid").digest("hex").slice(0, 24);
  const frozenEvent = { ...historicalSnapshot, sourceId };
  const registry = { version: 3, events: [frozenEvent] };
  const generated = serializeCalendarEvents(registry.events);
  try {
    await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    await writeFile(outputPath, generated);
    await writeFile(sourcePath, [
      "BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:stable-source-uid",
      "DTSTART;VALUE=DATE:20260110", "SUMMARY:Changed event",
      `DESCRIPTION:Public text\\n---\\nALBUM_FOTOS: ${privateDriveUrl}`,
      `URL:${sourcePath}`,
      "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n"));
    const beforeRegistry = await readFile(registryPath, "utf8");
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
    assert.equal(await readFile(registryPath, "utf8"), beforeRegistry);
    assert.equal(await readFile(outputPath, "utf8"), beforeOutput);
    assert.doesNotMatch(serializedReport, /drive\.google\.com|ALBUM_FOTOS|private-folder/);
    assert.equal(serializedReport.includes(sourcePath), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("C2: workflow uploads the structured report without issue permissions or failure gates", async () => {
  const workflow = await readFile(path.resolve(".github/workflows/sync-calendar.yml"), "utf8");
  assert.match(workflow, /actions\/upload-artifact@v5/);
  assert.match(workflow, /calendar-historical-changes\.json/);
  assert.doesNotMatch(workflow, /issues:\s*write|exit\s+1/);
});

async function galleryFixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c0-gallery-"));
  const image = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "red" },
  }).jpeg().toBuffer();
  return {
    directory,
    image,
    options: {
      manifestPath: path.join(directory, "eventGalleries.ts"),
      statePath: path.join(directory, "eventGalleryState.json"),
      imagesRoot: path.join(directory, "images"),
    },
  };
}

test("Given no album, When galleries synchronize, Then no gallery is invented and no warning is required", async () => {
  const context = await galleryFixture();
  try {
    const result = await synchronizeEventGalleries({
      ...context.options,
      events: [{ slug: historicalSnapshot.slug, title: historicalSnapshot.title }],
    });
    assert.deepEqual(result.galleries, {});
    assert.deepEqual(result.warnings, []);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("Given the first valid album, When galleries synchronize, Then it is published once", async () => {
  const context = await galleryFixture();
  try {
    const result = await synchronizeEventGalleries({
      ...context.options,
      events: [{ ...historicalSnapshot, albumUrl: "https://drive.google.com/drive/folders/approved" }],
      listFolder: async () => [{ id: "one", name: "1.jpg" }],
      downloadFile: async () => context.image,
    });
    assert.equal(result.galleries[historicalSnapshot.slug].images.length, 1);
    assert.equal(result.state.galleries[historicalSnapshot.slug].fingerprint.length, 64);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("Given a frozen gallery, When Drive changes, Then the site does not inspect it again", async () => {
  const context = await galleryFixture();
  const event = { ...historicalSnapshot, albumUrl: "https://drive.google.com/drive/folders/approved" };
  try {
    const first = await synchronizeEventGalleries({
      ...context.options,
      events: [event],
      listFolder: async () => [{ id: "one", name: "1.jpg" }],
      downloadFile: async () => context.image,
    });
    const manifest = await readFile(context.options.manifestPath, "utf8");
    const changedImage = await sharp({
      create: { width: 640, height: 480, channels: 3, background: "blue" },
    }).jpeg().toBuffer();
    const changed = await synchronizeEventGalleries({
      ...context.options,
      events: [event],
      listFolder: async () => [{ id: "two", name: "2.jpg" }],
      downloadFile: async () => changedImage,
    });
    assert.equal(await readFile(context.options.manifestPath, "utf8"), manifest);
    assert.equal(changed.galleries[event.slug].fingerprint, first.galleries[event.slug].fingerprint);
    assert.deepEqual(changed.warnings, []);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("C4: Calendar and a first gallery publication leave no mixed artifacts when staging calendar output fails", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c4-atomic-"));
  const sourcePath = path.join(directory, "calendar.ics");
  const blockedParent = path.join(directory, "blocked");
  const galleryOptions = {
    manifestPath: path.join(directory, "eventGalleries.ts"),
    statePath: path.join(directory, "eventGalleryState.json"),
    imagesRoot: path.join(directory, "images"),
    listFolder: async () => [{ id: "private-id", name: "1.jpg" }],
  };
  try {
    await writeFile(blockedParent, "not a directory");
    await writeFile(sourcePath, [
      "BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:c4@example.test",
      "DTSTART;VALUE=DATE:20260110", "SUMMARY:C4 event",
      "DESCRIPTION:Public text\\n---\\nALBUM_FOTOS: https://drive.google.com/drive/folders/approved",
      "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n"));
    galleryOptions.downloadFile = async () => sharp({
      create: { width: 640, height: 480, channels: 3, background: "red" },
    }).jpeg().toBuffer();
    await assert.rejects(synchronizeCalendar({
      source: sourcePath,
      registryPath: path.join(directory, "registry.json"),
      outputPath: path.join(blockedParent, "calendarEvents.ts"),
      now: new Date("2026-03-01T00:00:00.000Z"),
      galleryOptions,
    }));
    await assert.rejects(stat(galleryOptions.manifestPath), /ENOENT/);
    await assert.rejects(stat(galleryOptions.statePath), /ENOENT/);
    await assert.rejects(stat(galleryOptions.imagesRoot), /ENOENT/);
    await assert.rejects(stat(path.join(directory, "registry.json")), /ENOENT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
