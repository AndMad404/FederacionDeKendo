import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import { mergeRegistry } from "../scripts/sync-calendar-events.mjs";
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

function merge(previousEvent, currentEvents = [changedCalendarEvent]) {
  return mergeRegistry(
    { version: 3, events: [structuredClone(previousEvent)] },
    structuredClone(currentEvents),
    new Date("2026-03-01T00:00:00.000Z"),
  );
}

function reportsField(result, field) {
  const reports = [result.differences, result.warnings, result.reports]
    .filter(Array.isArray)
    .flat();
  return reports.some((report) => JSON.stringify(report).includes(field));
}

function assertFrozenAndReported(result, expected, fields) {
  const [actual] = result.events;
  const violations = [];
  for (const field of fields) {
    try {
      assert.deepEqual(actual[field], expected[field]);
    } catch {
      violations.push(`${field} mutated`);
    }
    if (!reportsField(result, field)) violations.push(`${field} difference missing`);
  }
  assert.deepEqual(violations, []);
}

test("inventories every field persisted in the registry and public event model", () => {
  assert.deepEqual(REGISTRY_EVENT_FIELDS, [
    "sourceId", "slug", "aliases", "archiveEligibleAt", "historical", "title",
    "date", "endDate", "startTime", "endTime", "location", "summary",
    "eventType", "organizer", "infoUrl", "timeZone",
  ]);
  assert.deepEqual(PUBLIC_EVENT_FIELDS, [
    "id", "aliases", "archiveEligibleAt", "title", "date", "endDate",
    "startTime", "endTime", "location", "summary", "eventType", "organizer",
    "infoUrl", "timeZone",
  ]);
});

const historicalChangeCases = [
  ["title", ["title"]],
  ["date", ["date", "endDate", "archiveEligibleAt"]],
  ["times", ["startTime", "endTime"]],
  ["location", ["location"]],
  ["description", ["summary"]],
  ["type", ["eventType"]],
  ["organizer", ["organizer"]],
  ["information URL", ["infoUrl"]],
  ["time zone", ["timeZone"]],
  ["identity and aliases", ["slug", "aliases"]],
];

for (const [label, fields] of historicalChangeCases) {
  test(`Given a historical event, When Calendar changes ${label}, Then the snapshot stays frozen and the difference is reported`, () => {
    const current = { ...historicalSnapshot };
    for (const field of fields) current[field] = changedCalendarEvent[field];
    const result = merge(historicalSnapshot, [current]);
    assertFrozenAndReported(result, historicalSnapshot, fields);
  });
}

test("Given a historical event, When it disappears from the feed, Then its complete snapshot remains and disappearance is reported", () => {
  const result = merge(historicalSnapshot, []);
  const [actual] = result.events;
  const violations = [];
  try {
    assert.deepEqual(actual, historicalSnapshot);
  } catch {
    violations.push("historical snapshot mutated");
  }
  if (![result.differences, result.warnings, result.reports]
    .filter(Array.isArray).flat().some((report) => /missing|removed|disappear/i.test(JSON.stringify(report)))) {
    violations.push("disappearance report missing");
  }
  assert.deepEqual(violations, []);
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

test("Given a frozen gallery, When Drive changes, Then the gallery stays intact and a reproducible warning is emitted", async () => {
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
    assert.deepEqual(changed.warnings, [`${event.slug}: Drive changed; frozen gallery preserved.`]);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});
