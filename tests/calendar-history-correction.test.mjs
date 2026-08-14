import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applyHistoricalCorrection,
  fingerprintHistoricalProposal,
  fingerprintHistoricalSnapshot,
} from "../scripts/correct-calendar-history.mjs";
import {
  applyHistoricalCorrectionsByDateRange,
  parseCliArguments,
} from "../scripts/correct-calendar-history-range.mjs";
import {
  detectHistoricalChanges,
  mergeRegistry,
  serializeCalendarEvents,
} from "../scripts/sync-calendar-events.mjs";

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

async function fixture(report = createReport()) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c3-"));
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

test("C3 accepts one field and preserves every unselected field and event", async () => {
  const files = await fixture();
  try {
    await run(files, ["title"]);
    const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
    assert.deepEqual(registry.events[0], {
      ...published,
      title: proposed.title,
    });
    assert.deepEqual(registry.events[1], files.other);
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("C3 accepts multiple fields in canonical order and updates both artifacts coherently", async () => {
  const files = await fixture();
  try {
    const result = await run(files, ["summary", "title", "location"]);
    assert.deepEqual(result.acceptedFields, ["title", "location", "summary"]);
    const registry = JSON.parse(await readFile(files.registryPath, "utf8"));
    assert.equal(
      await readFile(files.outputPath, "utf8"),
      serializeCalendarEvents(registry.events),
    );
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("F3: a v4 correction preserves evidence fields and the registry version", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("range correction accepts every reported field for historical events inside its inclusive dates", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("range correction rejects an empty or reversed range without changing published files", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("range correction validates every selected proposal before writing any event", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("range workflow requires an approved report run and an inclusive date range", async () => {
  const workflow = await readFile(
    path.resolve(".github/workflows/correct-calendar-history-range.yml"),
    "utf8",
  );
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /report_run_id:/);
  assert.match(workflow, /from:/);
  assert.match(workflow, /to:/);
  assert.match(workflow, /actions\/download-artifact@v5/);
  assert.match(workflow, /correct:calendar-history-range/);
  assert.doesNotMatch(workflow, /correct:calendar-history-range -- --report/);
  assert.doesNotMatch(workflow, /issues:\s*write/);
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

test("range correction accepts the synchronization artifact with gallery alarms without applying them", async () => {
  const report = createReport();
  report.galleryChanges = [
    {
      slug: published.slug,
      status: "galeria_congelada_cambio_detectado",
      reason: "album_modificado",
    },
  ];
  const files = await fixture(report);
  try {
    const results = await applyHistoricalCorrectionsByDateRange({
      registryPath: files.registryPath,
      outputPath: files.outputPath,
      reportPath: files.reportPath,
      from: published.date,
      to: published.date,
    });
    assert.equal(results.length, 1);
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("C3 preserves the old slug as an alias", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

for (const [name, overrides, fields = ["title"]] of [
  ["stale published fingerprint", { publishedFingerprint: "0".repeat(64) }],
  ["stale proposal fingerprint", { proposalFingerprint: "1".repeat(64) }],
  ["unknown field", {}, ["unknown"]],
  ["unreported field", {}, ["endTime"]],
]) {
  test(`C3 rejects ${name} without changing either file byte for byte`, async () => {
    const files = await fixture();
    try {
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
    } finally {
      await rm(files.directory, { recursive: true, force: true });
    }
  });
}

test("C3 rejects disappeared_del_feed and emits no private values", async () => {
  const report = {
    ...detectHistoricalChanges(
      { version: 3, events: [published] },
      [],
      new Date("2026-03-01T00:00:00.000Z"),
    ),
    galleryChanges: [],
  };
  const files = await fixture(report);
  try {
    const serialized = JSON.stringify(report);
    assert.doesNotMatch(
      serialized,
      /drive\.google\.com|ALBUM_FOTOS|CALENDAR_ICS_URL/,
    );
    await assert.rejects(run(files, ["feed"]));
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
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

test("later synchronization still reports differences not accepted", async () => {
  const files = await fixture();
  try {
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
  } finally {
    await rm(files.directory, { recursive: true, force: true });
  }
});

test("an individual disappearance becomes pending, remains retained, and stays public", () => {
  const second = {
    ...published,
    sourceId: "present",
    slug: "2026-02-01-present",
    aliases: undefined,
  };
  const merged = mergeRegistry(
    { version: 3, events: [published, second] },
    [{ ...second, historical: undefined }],
    new Date("2026-03-01"),
  );
  assert.equal(
    merged.events.find(({ sourceId }) => sourceId === published.sourceId)
      .editorialState,
    "pendiente",
  );
  assert.match(
    serializeCalendarEvents(merged.events),
    new RegExp(published.slug),
  );
});

test("disappearance of every historical event aborts before producing a registry", () => {
  assert.throws(
    () =>
      mergeRegistry(
        { version: 3, events: [published] },
        [],
        new Date("2026-03-01"),
      ),
    /all historical events disappeared/i,
  );
});
