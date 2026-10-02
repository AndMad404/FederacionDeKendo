import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  applyHistoricalCorrection,
  fingerprintHistoricalProposal,
  fingerprintHistoricalSnapshot,
} from "../../scripts/correct-calendar-history.ts";
import {
  applyHistoricalCorrectionsByDateRange,
  parseCliArguments,
} from "../../scripts/correct-calendar-history-range.mjs";
import { synchronizeApprovedHistoricalGalleries } from "../../scripts/sync-approved-historical-galleries.mjs";
import {
  detectHistoricalChanges,
  serializeCalendarEvents,
} from "../../scripts/sync-calendar-events.ts";

const published = {
  sourceId: "stable-source",
  slug: "2026-01-10-seminario",
  aliases: ["2026-01-10-anterior"],
  archiveEligibleAt: "2026-01-12T06:00:00.000Z",
  historical: true,
  title: "Seminario",
  date: "2026-01-10",
  startTime: "09:00",
  location: "San Jose",
  summary: "Original",
  eventType: "seminario",
  timeZone: "America/Costa_Rica",
};
const proposed = {
  ...published,
  slug: "2026-01-10-seminario-corregido",
  title: "Seminario corregido",
  location: "Cartago",
  summary: "Actualizada",
};

function createReport(current = proposed) {
  return {
    ...detectHistoricalChanges(
      { version: 3, events: [structuredClone(published)] },
      [{ ...current, historical: undefined, aliases: undefined }],
      new Date("2026-03-01T00:00:00.000Z"),
    ),
    galleryChanges: [],
  };
}

async function fixture(t, report = createReport()) {
  const directory = await temporaryDirectory(t, "fak-c3-");
  const registryPath = path.join(directory, "calendarEventRegistry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const reportPath = path.join(directory, "calendar-historical-changes.json");
  const other = {
    ...published,
    sourceId: "other-source",
    slug: "2025-01-01-other",
    title: "Other",
  };
  delete other.aliases;
  const registry = { version: 3, events: [published, other] };
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  await writeFile(outputPath, serializeCalendarEvents(registry.events));
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { directory, registryPath, outputPath, reportPath, registry, other };
}

async function run(files, fields, overrides = {}) {
  const change = JSON.parse(await readFile(files.reportPath, "utf8"))
    .historicalChanges[0];
  return applyHistoricalCorrection({
    registryPath: files.registryPath,
    outputPath: files.outputPath,
    reportPath: files.reportPath,
    sourceId: published.sourceId,
    publishedFingerprint: fingerprintHistoricalSnapshot(published),
    proposalFingerprint: change.proposalFingerprint,
    fields,
    ...overrides,
  });
}

test("C3 accepts one field and preserves every unselected field and event", async (t) => {
  const files = await fixture(t);

  await run(files, ["title"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.deepEqual(registry.events[0], {
    ...published,
    title: proposed.title,
  });
  assert.deepEqual(registry.events[1], files.other);
});

test("C3 accepts multiple fields in canonical order and updates both artifacts coherently", async (t) => {
  const files = await fixture(t);

  const result = await run(files, ["summary", "title", "location"]);
  assert.deepEqual(result.acceptedFields, ["title", "location", "summary"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.equal(
    await readFile(files.outputPath, "utf8"),
    serializeCalendarEvents(registry.events),
  );
});

test("C3 accepts a multi-line approved summary while keeping private values blocked", async (t) => {
  const files = await fixture(
    t,
    createReport({ ...proposed, summary: "Primera línea\nSegunda línea" }),
  );

  await run(files, ["summary"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.equal(registry.events[0].summary, "Primera línea\nSegunda línea");
});

test("C3 normalizes approved calendar HTML before publishing a summary", async (t) => {
  const files = await fixture(
    t,
    createReport({
      ...proposed,
      summary:
        '- Categoría con Bogu<br>- Categoría por equipos<br><br><a href=" class="pastedDriveLink-0">',
    }),
  );

  await run(files, ["summary"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.equal(
    registry.events[0].summary,
    "- Categoría con Bogu\n- Categoría por equipos",
  );
});

test("F3: a v4 correction preserves evidence fields and the registry version", async (t) => {
  const files = await fixture(t);

  const v4 = {
    version: 4,
    events: [
      {
        ...published,
        editorialState: "publicado",
        editorialDecision: {
          revisionId: "a".repeat(64),
          action: "reject_deletion",
          decidedAt: "2026-03-01T00:00:00.000Z",
          evidenceFingerprint: "b".repeat(64),
        },
      },
      files.other,
    ],
  };
  await writeFile(files.registryPath, `${JSON.stringify(v4, null, 2)}\n`);
  await run(files, ["title"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.equal(registry.version, 4);
  assert.deepEqual(
    registry.events[0].editorialDecision,
    v4.events[0].editorialDecision,
  );
});

test("range correction accepts every reported field for historical events inside its inclusive dates", async (t) => {
  const files = await fixture(t);

  const results = await applyHistoricalCorrectionsByDateRange({
    registryPath: files.registryPath,
    outputPath: files.outputPath,
    reportPath: files.reportPath,
    from: "2026-01-10",
    to: "2026-01-10",
  });
  assert.equal(results.length, 1);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  assert.deepEqual(registry.events[0], {
    ...proposed,
    aliases: ["2026-01-10-anterior", published.slug],
  });
  assert.deepEqual(registry.events[1], files.other);
});

test("range correction rejects an empty or reversed range without changing published files", async (t) => {
  const files = await fixture(t);

  const before = await Promise.all([
    readFile(files.registryPath),
    readFile(files.outputPath),
  ]);
  await assert.rejects(
    applyHistoricalCorrectionsByDateRange({
      registryPath: files.registryPath,
      outputPath: files.outputPath,
      reportPath: files.reportPath,
      from: "2026-01-11",
      to: "2026-01-10",
    }),
  );
  await assert.rejects(
    applyHistoricalCorrectionsByDateRange({
      registryPath: files.registryPath,
      outputPath: files.outputPath,
      reportPath: files.reportPath,
      from: "2026-02-01",
      to: "2026-02-02",
    }),
  );
  const after = await Promise.all([
    readFile(files.registryPath),
    readFile(files.outputPath),
  ]);
  assert.deepEqual(after, before);
});

test("range correction validates every selected proposal before writing any event", async (t) => {
  const files = await fixture(t);

  const secondProposal = { ...files.other, title: "Other corrected" };
  const report = {
    ...detectHistoricalChanges(
      { version: 3, events: [published, files.other] },
      [
        { ...proposed, historical: undefined, aliases: undefined },
        { ...secondProposal, historical: undefined },
      ],
      new Date("2026-03-01T00:00:00.000Z"),
    ),
    galleryChanges: [],
  };
  report.historicalChanges.find(
    ({ sourceId }) => sourceId === files.other.sourceId,
  ).proposalFingerprint = "0".repeat(64);
  await writeFile(files.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const before = await Promise.all([
    readFile(files.registryPath),
    readFile(files.outputPath),
  ]);
  await assert.rejects(
    applyHistoricalCorrectionsByDateRange({
      registryPath: files.registryPath,
      outputPath: files.outputPath,
      reportPath: files.reportPath,
      from: "2025-01-01",
      to: "2026-01-10",
    }),
  );
  const after = await Promise.all([
    readFile(files.registryPath),
    readFile(files.outputPath),
  ]);
  assert.deepEqual(after, before);
});

test("approved historical gallery sync rejects a selected album that imports no images", async (t) => {
  const files = await fixture(t);
  const sourcePath = path.join(files.directory, "calendar.ics");
  const report = JSON.parse(await readFile(files.reportPath, "utf8"));
  report.historicalChanges[0].sourceId = createHash("sha256")
    .update("stable-source")
    .digest("hex")
    .slice(0, 24);
  await writeFile(files.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(
    sourcePath,
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:stable-source",
      "DTSTART;VALUE=DATE:20260110",
      "SUMMARY:Seminario corregido",
      "DESCRIPTION:Texto actualizado\\nhttps://drive.google.com/drive/folders/approved-album",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:other-source",
      "DTSTART;VALUE=DATE:20250101",
      "SUMMARY:Otro",
      "DESCRIPTION:https://drive.google.com/drive/folders/other-album",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );
  let requestedAlbum;

  await assert.rejects(
    synchronizeApprovedHistoricalGalleries({
      source: sourcePath,
      reportPath: files.reportPath,
      from: published.date,
      to: published.date,
      galleryOptions: {
        manifestPath: path.join(files.directory, "eventGalleries.ts"),
        statePath: path.join(files.directory, "eventGalleryState.json"),
        imagesRoot: path.join(files.directory, "event-images"),
        listFolder: async (albumUrl) => {
          requestedAlbum = albumUrl;
          return [];
        },
        downloadFile: async () => Buffer.alloc(0),
      },
    }),
    /Approved historical galleries were not imported.*importacion_invalida/,
  );
  assert.equal(
    requestedAlbum,
    "https://drive.google.com/drive/folders/approved-album",
  );
});

test("range CLI accepts pnpm arguments with or without a literal separator", () => {
  const expected = { from: "2026-05-02", to: "2026-08-08" };
  const args = [
    "--report",
    "calendar-historical-changes.json",
    "--from",
    expected.from,
    "--to",
    expected.to,
  ];
  assert.deepEqual(parseCliArguments(args), expected);
  assert.deepEqual(parseCliArguments(["--", ...args]), expected);
});

test("range correction accepts the synchronization artifact with gallery alarms without applying them", async (t) => {
  const report = createReport();
  report.galleryChanges = [
    {
      slug: published.slug,
      status: "galeria_congelada_cambio_detectado",
      reason: "album_modificado",
    },
  ];
  const files = await fixture(t, report);

  const results = await applyHistoricalCorrectionsByDateRange({
    registryPath: files.registryPath,
    outputPath: files.outputPath,
    reportPath: files.reportPath,
    from: published.date,
    to: published.date,
  });
  assert.equal(results.length, 1);
});

test("C3 preserves the old slug as an alias", async (t) => {
  const files = await fixture(t);

  await run(files, ["slug"]);
  const event = JSON.parse(await readFile(files.registryPath, "utf8"))
    .events[0];
  assert.equal(event.slug, proposed.slug);
  assert.deepEqual(event.aliases, ["2026-01-10-anterior", published.slug]);
  const generated = await readFile(files.outputPath, "utf8");
  assert.match(
    generated,
    new RegExp(`aliases: \\["2026-01-10-anterior","${published.slug}"\\]`),
  );
});

for (const [name, overrides, fields = ["title"]] of [
  ["stale published fingerprint", { publishedFingerprint: "0".repeat(64) }],
  ["stale proposal fingerprint", { proposalFingerprint: "1".repeat(64) }],
  ["unknown field", {}, ["unknown"]],
  ["unreported field", {}, ["endTime"]],
]) {
  test(`C3 rejects ${name} without changing either file byte for byte`, async (t) => {
    const files = await fixture(t);

    const before = await Promise.all([
      readFile(files.registryPath),
      readFile(files.outputPath),
    ]);
    await assert.rejects(run(files, fields, overrides));
    const after = await Promise.all([
      readFile(files.registryPath),
      readFile(files.outputPath),
    ]);
    assert.deepEqual(after, before);
  });
}

test("C3 rejects disappeared_del_feed and emits no private values", async (t) => {
  const report = {
    ...detectHistoricalChanges(
      { version: 3, events: [published] },
      [],
      new Date("2026-03-01T00:00:00.000Z"),
    ),
    galleryChanges: [],
  };
  const files = await fixture(t, report);

  const serialized = JSON.stringify(report);
  assert.doesNotMatch(
    serialized,
    /drive\.google\.com|ALBUM_FOTOS|CALENDAR_ICS_URL/,
  );
  await assert.rejects(run(files, ["feed"]));
});

test("fingerprints ignore JSON property order", () => {
  const reversed = Object.fromEntries(Object.entries(published).reverse());
  assert.equal(
    fingerprintHistoricalSnapshot(reversed),
    fingerprintHistoricalSnapshot(published),
  );
  const report = createReport().historicalChanges[0];
  assert.equal(
    fingerprintHistoricalProposal(
      report.sourceId,
      [...report.differences].reverse(),
    ),
    report.proposalFingerprint,
  );
});

test("later synchronization still reports differences not accepted", async (t) => {
  const files = await fixture(t);

  await run(files, ["title"]);
  const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
  const report = detectHistoricalChanges(
    registry,
    [{ ...proposed, historical: undefined }],
    new Date("2026-03-02"),
  );
  const remaining = report.historicalChanges.find(
    ({ sourceId }) => sourceId === published.sourceId,
  );
  assert.deepEqual(
    remaining.differences.map(({ field }) => field),
    ["slug", "location", "summary"],
  );
});
