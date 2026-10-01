import {
  temporaryDirectory,
  temporaryPaths,
  snapshotFiles,
  expectFilesUnchanged,
} from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { createIcs } from "../helpers/calendar-fixtures.mjs";

import { synchronizeCalendar } from "../../scripts/sync-calendar-events.mjs";

const phase2FixturePath = new URL(
  "../fixtures/calendar-events-phase-2.ics",
  import.meta.url,
);
const invalidPhase2FixturePath = new URL(
  "../fixtures/calendar-events-phase-2-invalid.ics",
  import.meta.url,
);

async function runSynchronization({
  tempDirectory,
  name,
  events,
  registryPath = path.join(tempDirectory, `${name}-registry.json`),
}) {
  const { sourcePath, outputPath } = temporaryPaths(tempDirectory, {
    sourcePath: `${name}.ics`,
    outputPath: `${name}-calendarEvents.ts`,
  });
  await writeFile(sourcePath, createIcs(events));
  const result = await synchronizeCalendar({
    source: sourcePath,
    outputPath,
    registryPath,
    now: new Date("2026-07-01"),
  });
  return { ...result, outputPath, registryPath };
}

test("keeps sourceId in the registry and out of the public event URL", async (t) => {
  const tempDirectory = await temporaryDirectory(t, "fak-calendar-");

  const result = await runSynchronization({
    tempDirectory,
    name: "internal-identity",
    events: [{ uid: "first@example.test", title: "Examen de kyu" }],
  });
  const [event] = result.registry.events;
  const generatedOutput = await readFile(result.outputPath, "utf8");

  assert.equal(event.sourceId, "3f2eb91b31105691fbf84f65");
  assert.equal(event.slug, "examen-de-kyu");
  assert.equal(event.slug.includes(event.sourceId.slice(0, 8)), false);
  assert.equal(generatedOutput.includes(event.sourceId), false);
  assert.match(generatedOutput, /id: "examen-de-kyu"/);
});

const REJECTED_FEEDS = [
  {
    name: "a title-only URL collision across different dates aborts before publication",
    filename: "collision.ics",
    version: 2,
    feed: createIcs([
      { uid: "first@example.test", date: "20260808", title: "Examen" },
      { uid: "second@example.test", date: "20261031", title: "Examen" },
    ]),
    error: /Duplicate calendar canonical slug: examen/,
    now: new Date("2026-07-01"),
  },
  {
    name: "an invalid feed leaves the last published files untouched",
    filename: "invalid.ics",
    version: 2,
    feed: "not a calendar",
    error: /Invalid iCalendar feed/,
  },
  {
    name: "an empty or wholly omitted feed leaves the last published artifacts untouched",
    filename: "empty.ics",
    version: 4,
    feed: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
    error: /contains no valid events/i,
  },
  {
    name: "a duplicate source identity is rejected before registry or public output can change",
    filename: "duplicate-source.ics",
    version: 4,
    feed: createIcs([
      { uid: "same@example.test", title: "First" },
      { uid: "same@example.test", title: "Second" },
    ]),
    error: /Duplicate calendar source identity/,
  },
  {
    name: "invalid technical metadata preserves both previously published artifacts",
    version: 3,
    source: fileURLToPath(invalidPhase2FixturePath),
    error: /Invalid ALBUM_FOTOS/,
  },
];

for (const scenario of REJECTED_FEEDS) {
  test(scenario.name, async (t) => {
    const directory = await temporaryDirectory(t, "fak-calendar-");
    const { sourcePath, outputPath, registryPath } = temporaryPaths(directory, {
      sourcePath: scenario.filename ?? "unused.ics",
      outputPath: "calendarEvents.ts",
      registryPath: "registry.json",
    });
    if (scenario.feed !== undefined) await writeFile(sourcePath, scenario.feed);
    await writeFile(outputPath, "previous output");
    await writeFile(
      registryPath,
      JSON.stringify({ version: scenario.version, events: [] }),
    );
    const before = await snapshotFiles([outputPath, registryPath]);
    await assert.rejects(
      synchronizeCalendar({
        source: scenario.source ?? sourcePath,
        outputPath,
        registryPath,
        ...(scenario.now ? { now: scenario.now } : {}),
      }),
      scenario.error,
    );
    await expectFilesUnchanged(before);
  });
}

test("phase 2 normalizes public descriptions and event types without publishing album URLs", async (t) => {
  const tempDirectory = await temporaryDirectory(t, "fak-calendar-");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  const galleryManifestPath = path.join(tempDirectory, "eventGalleries.ts");
  const galleryStatePath = path.join(tempDirectory, "eventGalleryState.json");
  const galleryImagesRoot = path.join(tempDirectory, "event-images");

  const galleryImage = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  const result = await synchronizeCalendar({
    source: fileURLToPath(phase2FixturePath),
    outputPath,
    registryPath,
    now: new Date("2026-08-10T12:00:00Z"),
    galleryOptions: {
      manifestPath: galleryManifestPath,
      statePath: galleryStatePath,
      imagesRoot: galleryImagesRoot,
      listFolder: async () => [{ id: "private-file-id", name: "photo1.jpg" }],
      downloadFile: async () => galleryImage,
    },
  });
  const output = await readFile(outputPath, "utf8");
  const registry = await readFile(registryPath, "utf8");
  const galleryManifest = await readFile(galleryManifestPath, "utf8");
  const byTitle = new Map(
    result.registry.events.map((event) => [event.title, event]),
  );

  assert.equal(byTitle.get("Torneo futuro").historical, undefined);
  assert.equal(byTitle.get("Examen en preparación").historical, true);
  assert.match(
    result.galleryResult.state.galleries["examen-en-preparacion"].fingerprint,
    /^[a-f0-9]{64}$/,
  );
  assert.equal(byTitle.get("Seminario histórico").historical, true);
  assert.equal(
    byTitle.get("Encuentro actualizado").summary,
    "Descripción pública actualizada.",
  );
  assert.equal(byTitle.get("Torneo sin álbum").eventType, "torneo");
  assert.equal(byTitle.get("Exámenes con álbum").eventType, "examen");
  assert.equal(
    byTitle.get("Exámenes con álbum").summary,
    "Fotografías aprobadas.",
  );
  assert.equal(byTitle.get("Gasshuku técnico").eventType, "seminario");
  assert.equal(byTitle.get("Encuentro federativo").eventType, "seminario");
  assert.equal(
    result.warnings.some((warning) =>
      warning.includes("controlled event type"),
    ),
    false,
  );
  assert.equal(output.includes("TIPO_EVENTO"), false);
  assert.equal(output.includes("ALBUM_FOTOS"), false);
  assert.equal(output.includes("drive.google.com"), false);
  assert.equal(registry.includes("drive.google.com"), false);
  assert.equal(
    /drive\.google|phase2ValidAlbum|private-file-id/.test(galleryManifest),
    false,
  );
});
