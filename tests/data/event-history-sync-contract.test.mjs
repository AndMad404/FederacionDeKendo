import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  HISTORICAL_COMPARISON_FIELDS,
  applyEditorialDecision,
  applyEditorialDecisionToFiles,
  createCalendarFailureNotification,
  createCalendarNotifications,
  recordCalendarNotifications,
  detectHistoricalChanges,
  getTranslationPublicationCounts,
  decidePendingDeletion,
  mergeRegistry,
  serializeCalendarEvents,
  synchronizeCalendar,
  writeActionSummary,
  writeCalendarNotificationsSummary,
} from "../../scripts/sync-calendar-events.mjs";
import { synchronizeEventGalleries } from "../../scripts/sync-event-galleries.mjs";
import { formatCalendarNotificationEmail } from "../../scripts/write-calendar-notification-email.mjs";

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
  "editorialState",
  "pendingRevision",
  "editorialDecision",
  ...PUBLIC_EVENT_FIELDS.filter(
    (field) => !["id", "aliases", "archiveEligibleAt"].includes(field),
  ),
];

const historicalSnapshot = {
  sourceId: "stable-source",
  slug: "2026-01-10-seminario",
  aliases: ["2026-01-10-seminario-anterior"],
  archiveEligibleAt: "2026-01-13T06:00:00.000Z",
  historical: true,
  editorialState: "publicado",
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
    "sourceId",
    "slug",
    "aliases",
    "archiveEligibleAt",
    "historical",
    "editorialState",
    "pendingRevision",
    "editorialDecision",
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
  ]);
  assert.deepEqual(PUBLIC_EVENT_FIELDS, [
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
  ]);
});

test("Given one historical event disappears, When another remains in the feed, Then the missing snapshot remains public and pending", () => {
  const present = {
    ...historicalSnapshot,
    sourceId: "present-source",
    slug: "2026-01-11-present",
    aliases: undefined,
  };
  const result = mergeRegistry(
    { version: 3, events: [historicalSnapshot, present] },
    [{ ...present, historical: undefined }],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(
    result.events.find(
      ({ sourceId }) => sourceId === historicalSnapshot.sourceId,
    ),
    {
      ...historicalSnapshot,
      editorialState: "pendiente",
      pendingRevision: result.events.find(
        ({ sourceId }) => sourceId === historicalSnapshot.sourceId,
      ).pendingRevision,
    },
  );
  assert.equal(
    serializeCalendarEvents(result.events).includes(historicalSnapshot.slug),
    true,
  );
});

test("Given a future event, When Calendar changes every persisted editorial field, Then the changes remain editable", () => {
  const previous = {
    ...historicalSnapshot,
    historical: false,
    archiveEligibleAt: "2026-04-13T06:00:00.000Z",
  };
  const current = {
    ...changedCalendarEvent,
    archiveEligibleAt: "2026-04-23T06:00:00.000Z",
  };
  const result = mergeRegistry(
    { version: 3, events: [previous] },
    [current],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  assert.deepEqual(result.events[0], {
    ...current,
    aliases: previous.aliases,
    editorialState: "publicado",
  });
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

  assert.deepEqual(first.events, [
    { ...current, historical: true, editorialState: "publicado" },
  ]);
  const changed = mergeRegistry(
    first,
    [{ ...current, summary: "Cambio posterior" }],
    new Date("2026-03-02T00:00:00.000Z"),
  );
  assert.equal(changed.events[0].editorialState, "pendiente");
  assert.equal(changed.events[0].summary, current.summary);
});

test("Given a historical event, When Calendar changes every persisted field, Then its registry and generated TypeScript remain intact", () => {
  const generatedBefore = serializeCalendarEvents([historicalSnapshot]);
  const result = merge(historicalSnapshot);

  assert.equal(result.events[0].editorialState, "pendiente");
  assert.equal(result.events[0].title, historicalSnapshot.title);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("Given a historical event, When Calendar removes persisted fields, Then its registry and generated TypeScript remain intact", () => {
  const current = { ...changedCalendarEvent };
  for (const field of REMOVED_HISTORICAL_FIELDS) delete current[field];

  const generatedBefore = serializeCalendarEvents([historicalSnapshot]);
  const result = merge(historicalSnapshot, [current]);

  assert.equal(result.events[0].editorialState, "pendiente");
  assert.equal(result.events[0].title, historicalSnapshot.title);
  assert.equal(serializeCalendarEvents(result.events), generatedBefore);
});

test("F1: approvals, rejections, stale decisions, reappearances, and removed records have explicit transitions", () => {
  const missing = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId);
  assert.equal(missing.editorialState, "pendiente");
  assert.equal(serializeCalendarEvents([missing]).includes(missing.slug), true);

  const rejected = decidePendingDeletion(missing, {
    action: "reject_deletion",
    revisionId: missing.pendingRevision.id,
  });
  assert.equal(rejected.editorialState, "publicado");
  assert.equal(rejected.pendingRevision, undefined);

  assert.throws(
    () =>
      decidePendingDeletion(missing, {
        action: "approve_deletion",
        revisionId: "obsolete",
      }),
    /stale/,
  );
  const removed = decidePendingDeletion(missing, {
    action: "approve_deletion",
    revisionId: missing.pendingRevision.id,
  });
  assert.equal(removed.editorialState, "eliminado");
  assert.equal(
    serializeCalendarEvents([removed]).includes(removed.slug),
    false,
  );
  assert.equal(removed.pendingRevision.id, missing.pendingRevision.id);

  const reappeared = mergeRegistry(
    { version: 4, events: [missing] },
    [{ ...historicalSnapshot }],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events[0];
  assert.equal(reappeared.editorialState, "publicado");
  assert.equal(reappeared.pendingRevision, undefined);
  assert.throws(
    () =>
      mergeRegistry({ version: 4, events: [] }, [
        historicalSnapshot,
        { ...historicalSnapshot },
      ]),
    /Duplicate calendar canonical slug/,
  );
});

test("F3: pending revisions retain deterministic, redacted evidence across observations", () => {
  const changed = {
    ...historicalSnapshot,
    title: "Propuesta con enlace privado",
    infoUrl: "https://drive.google.com/drive/folders/private-folder",
    summary:
      "Fuente privada https://calendar.example.test/private.ics?token=secret",
  };
  const firstAt = new Date("2026-03-01T00:00:00.000Z");
  const first = mergeRegistry(
    { version: 4, events: [historicalSnapshot] },
    [changed],
    firstAt,
  ).events[0];
  const second = mergeRegistry(
    { version: 4, events: [first] },
    [changed],
    new Date("2026-03-02T00:00:00.000Z"),
  ).events[0];

  assert.equal(
    first.pendingRevision.evidence.sourceId,
    historicalSnapshot.sourceId,
  );
  assert.equal(
    first.pendingRevision.evidence.firstDetectedAt,
    "2026-03-01T00:00:00.000Z",
  );
  assert.equal(
    second.pendingRevision.evidence.firstDetectedAt,
    first.pendingRevision.evidence.firstDetectedAt,
  );
  assert.equal(
    second.pendingRevision.evidence.lastObservedAt,
    "2026-03-02T00:00:00.000Z",
  );
  assert.equal(
    first.pendingRevision.evidence.fingerprint,
    second.pendingRevision.evidence.fingerprint,
  );
  assert.equal(
    first.pendingRevision.evidence.lastReceived.infoUrl,
    "[redacted]",
  );
  assert.doesNotMatch(
    JSON.stringify(second.pendingRevision.evidence),
    /drive\.google\.com|private-folder|private\.ics|token=secret/,
  );
});

test("F3: a deletion decision retains the linked pending evidence", () => {
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId);
  const removed = decidePendingDeletion(pending, {
    action: "approve_deletion",
    revisionId: pending.pendingRevision.id,
    decidedAt: "2026-03-03T00:00:00.000Z",
    reason: "Retirado por Presidencia",
  });
  assert.equal(
    removed.editorialDecision.revisionId,
    pending.pendingRevision.id,
  );
  assert.equal(
    removed.editorialDecision.evidenceFingerprint,
    pending.pendingRevision.evidence.fingerprint,
  );
  assert.equal(removed.editorialDecision.decidedAt, "2026-03-03T00:00:00.000Z");
  assert.equal(
    serializeCalendarEvents([removed]).includes(removed.slug),
    false,
  );
});

test("F5: only a recorded decision for the current revision and evidence can change publication", () => {
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId);
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "reject_deletion",
    decisionRecordId: "presidencia-2026-03-03-01",
    actorRole: "presidencia",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };
  const updated = applyEditorialDecision(
    { version: 4, events: [pending] },
    decision,
  );
  assert.equal(updated.events[0].editorialState, "publicado");
  assert.equal(
    updated.events[0].editorialDecision.decisionRecordId,
    decision.decisionRecordId,
  );
  assert.equal(
    updated.events[0].editorialDecision.evidenceFingerprint,
    decision.evidenceFingerprint,
  );
  assert.equal(
    serializeCalendarEvents(updated.events).includes(pending.slug),
    true,
  );

  assert.throws(
    () =>
      applyEditorialDecision(
        { version: 4, events: [pending] },
        { ...decision, evidenceFingerprint: "stale" },
      ),
    /stale/,
  );
  assert.throws(
    () =>
      applyEditorialDecision(
        { version: 4, events: [pending] },
        { ...decision, decisionRecordId: "" },
      ),
    /record identifier/,
  );
});

test("F5: a future deletion is reserved for Presidencia and preserves its revision evidence", () => {
  const future = {
    ...historicalSnapshot,
    historical: false,
    date: "2027-01-10",
    archiveEligibleAt: "2027-01-13T06:00:00.000Z",
  };
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        future,
        {
          ...future,
          sourceId: "present-source",
          slug: "2027-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...future,
        sourceId: "present-source",
        slug: "2027-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === future.sourceId);
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "approve_deletion",
    decisionRecordId: "presidencia-2026-03-03-02",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };
  assert.throws(
    () =>
      applyEditorialDecision(
        { version: 4, events: [pending] },
        { ...decision, actorRole: "delegado" },
      ),
    /Only Presidencia/,
  );
  const updated = applyEditorialDecision(
    { version: 4, events: [pending] },
    { ...decision, actorRole: "presidencia" },
  );
  assert.equal(updated.events[0].editorialState, "eliminado");
  assert.equal(
    updated.events[0].pendingRevision.evidence.fingerprint,
    decision.evidenceFingerprint,
  );
  assert.equal(
    serializeCalendarEvents(updated.events).includes(pending.slug),
    false,
  );
});

test("F5: a stale file-backed decision leaves the persisted registry and published output untouched", async () => {
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId);
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-f5-decision-"));
  const registryPath = path.join(directory, "calendarEventRegistry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const beforeRegistry = `${JSON.stringify({ version: 4, events: [pending] }, null, 2)}\n`;
  const beforeOutput = serializeCalendarEvents([pending]);
  await writeFile(registryPath, beforeRegistry);
  await writeFile(outputPath, beforeOutput);
  const decision = {
    sourceId: pending.sourceId,
    revisionId: pending.pendingRevision.id,
    evidenceFingerprint: pending.pendingRevision.evidence.fingerprint,
    action: "reject_deletion",
    decisionRecordId: "presidencia-2026-03-03-03",
    actorRole: "presidencia",
    decidedAt: "2026-03-03T00:00:00.000Z",
  };

  try {
    await assert.rejects(
      applyEditorialDecisionToFiles({
        registryPath,
        outputPath,
        decision: { ...decision, evidenceFingerprint: "stale" },
      }),
      /stale/,
    );
    assert.equal(await readFile(registryPath, "utf8"), beforeRegistry);
    assert.equal(await readFile(outputPath, "utf8"), beforeOutput);

    await applyEditorialDecisionToFiles({ registryPath, outputPath, decision });
    assert.equal(
      JSON.parse(await readFile(registryPath, "utf8")).events[0].editorialState,
      "publicado",
    );
    assert.equal(
      (await readFile(outputPath, "utf8")).includes(pending.slug),
      true,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("C2: report deterministic field changes without mutating the historical snapshot", () => {
  const registryBefore = JSON.stringify({
    version: 3,
    events: [historicalSnapshot],
  });
  const report = detectHistoricalChanges(
    JSON.parse(registryBefore),
    [structuredClone(changedCalendarEvent)],
    new Date("2026-03-01T00:00:00.000Z"),
  );

  assert.deepEqual(
    report.historicalChanges[0].differences.map(({ field }) => field),
    HISTORICAL_COMPARISON_FIELDS.filter(
      (field) =>
        JSON.stringify(historicalSnapshot[field]) !==
        JSON.stringify(changedCalendarEvent[field]),
    ),
  );
  assert.equal(
    report.historicalChanges[0].differences.every(
      ({ type }) => type === "modificado",
    ),
    true,
  );
  assert.equal(
    JSON.stringify({ version: 3, events: [historicalSnapshot] }),
    registryBefore,
  );
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

  assert.deepEqual(
    report.historicalChanges[0].differences,
    REMOVED_HISTORICAL_FIELDS.map((field) => ({
      field,
      published: historicalSnapshot[field],
      proposed: null,
      type: "eliminado",
    })),
  );
});

test("C2: report feed disappearance with stable identity and deterministic event order", () => {
  const second = {
    ...historicalSnapshot,
    sourceId: "a-source",
    slug: "2026-01-09-examen",
    title: "Examen",
  };
  const report = detectHistoricalChanges(
    { version: 3, events: [historicalSnapshot, second] },
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

test("C2: keep operational warnings separate and neutralize Calendar markup in the Actions summary", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c2-summary-"));
  const summaryPath = path.join(directory, "summary.md");
  try {
    await writeActionSummary(
      ["<details>warning\n::error::injected"],
      1,
      detectHistoricalChanges(
        { version: 3, events: [historicalSnapshot] },
        [
          {
            ...historicalSnapshot,
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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

test("SEO phase 5: reports pending English translations without an alarm", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-seo-summary-"));
  const summaryPath = path.join(directory, "summary.md");
  try {
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("C2: synchronization writes a private-safe report while retaining frozen published output", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c2-sync-"));
  const sourcePath = path.join(directory, "calendar.ics");
  const registryPath = path.join(directory, "registry.json");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const privateDriveUrl =
    "https://drive.google.com/drive/folders/private-folder";
  const sourceId = createHash("sha256")
    .update("stable-source-uid")
    .digest("hex")
    .slice(0, 24);
  const frozenEvent = { ...historicalSnapshot, sourceId };
  const registry = { version: 4, events: [frozenEvent] };
  const generated = serializeCalendarEvents(registry.events);
  try {
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("C2: workflow uploads the structured report without issue permissions or failure gates", async () => {
  const workflow = await readFile(
    path.resolve(".github/workflows/sync-calendar.yml"),
    "utf8",
  );
  assert.match(workflow, /actions\/upload-artifact@v5/);
  assert.match(workflow, /calendar-historical-changes\.json/);
  assert.doesNotMatch(workflow, /issues:\s*write|exit\s+1/);
});

test("F4: pending revisions emit one redacted actionable notification per evidence fingerprint", () => {
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  ).events.find(({ sourceId }) => sourceId === historicalSnapshot.sourceId);
  pending.pendingRevision.evidence.published.infoUrl =
    "https://drive.google.com/drive/folders/private-folder";
  const execution = {
    origin: "github_actions",
    runId: "123",
    attempt: "2",
    trigger: "schedule",
  };
  const report = createCalendarNotifications(
    { version: 4, events: [pending, structuredClone(pending)] },
    execution,
  );

  assert.equal(report.version, 1);
  assert.equal(report.notifications.length, 1);
  const [notification] = report.notifications;
  assert.equal(notification.kind, "revision_pendiente");
  assert.equal(notification.temporality, "historico");
  assert.equal(
    notification.fingerprints.revisionId,
    pending.pendingRevision.id,
  );
  assert.equal(
    notification.fingerprints.evidenceFingerprint,
    pending.pendingRevision.evidence.fingerprint,
  );
  assert.deepEqual(notification.execution, execution);
  assert.match(notification.actionRequired, /Revisar/);
  assert.doesNotMatch(
    JSON.stringify(notification),
    /drive\.google\.com|private-folder/,
  );
});

test("F4: an emitted pending revision is not notified again until its evidence changes", () => {
  const pending = mergeRegistry(
    {
      version: 4,
      events: [
        historicalSnapshot,
        {
          ...historicalSnapshot,
          sourceId: "present-source",
          slug: "2026-01-11-present",
          aliases: undefined,
        },
      ],
    },
    [
      {
        ...historicalSnapshot,
        sourceId: "present-source",
        slug: "2026-01-11-present",
        aliases: undefined,
      },
    ],
    new Date("2026-03-01T00:00:00.000Z"),
  );
  const firstReport = createCalendarNotifications(pending);
  const recorded = recordCalendarNotifications(pending, firstReport);

  assert.equal(firstReport.notifications.length, 1);
  assert.equal(createCalendarNotifications(recorded).notifications.length, 0);

  const revised = structuredClone(recorded);
  revised.events.find(
    ({ sourceId }) => sourceId === historicalSnapshot.sourceId,
  ).pendingRevision.evidence.fingerprint = "new-evidence-fingerprint";
  assert.equal(createCalendarNotifications(revised).notifications.length, 1);
});

test("F4: source, parser, mass-disappearance, and verification failures have safe actionable notifications", async () => {
  const cases = [
    [new Error("Calendar request failed: 403 Forbidden"), "fuente_inaccesible"],
    [
      new Error("Invalid iCalendar feed: VCALENDAR boundaries are missing."),
      "parser_o_fuente_invalida",
    ],
    [
      new Error(
        "Mass calendar disappearance detected: 2 of 4 published events are absent (threshold 2); no files were changed.",
      ),
      "desaparicion_masiva",
    ],
    [new Error("Verification failed: typecheck."), "verificacion_fallida"],
  ];
  for (const [error, kind] of cases) {
    const report = createCalendarFailureNotification(error);
    assert.equal(report.notifications.length, 1);
    assert.equal(report.notifications[0].kind, kind);
    assert.match(report.notifications[0].actionRequired, /Revisar|Corregir/);
  }

  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-f4-summary-"));
  try {
    const summaryPath = path.join(directory, "summary.md");
    const failure = createCalendarFailureNotification(
      new Error(
        "Calendar request failed: https://calendar.example.test/private.ics?token=secret",
      ),
      {
        origin: "github_actions",
        runId: "456",
        attempt: "1",
        trigger: "workflow_dispatch",
      },
    );
    await writeCalendarNotificationsSummary(failure, summaryPath);
    const summary = await readFile(summaryPath, "utf8");
    assert.doesNotMatch(summary, /private\.ics|token=secret/);
    assert.match(summary, /run 456/);
    assert.match(summary, /Before \(redacted\): null/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("F4: the approved email delivery body contains only the redacted structured notification", () => {
  const report = createCalendarFailureNotification(
    new Error(
      "Calendar request failed: https://calendar.example.test/private.ics?token=secret",
    ),
  );
  const email = formatCalendarNotificationEmail(
    report,
    "alerts@example.test",
    "andresgmr1@gmail.com",
  );

  assert.match(email, /To: andresgmr1@gmail\.com/);
  assert.match(email, /Accion requerida:/);
  assert.doesNotMatch(email, /private\.ics|token=secret/);
  assert.equal(
    formatCalendarNotificationEmail(
      { version: 1, notifications: [] },
      "alerts@example.test",
      "andresgmr1@gmail.com",
    ),
    null,
  );
});

async function galleryFixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-c0-gallery-"));
  const image = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
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
      events: [
        { slug: historicalSnapshot.slug, title: historicalSnapshot.title },
      ],
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
      events: [
        {
          ...historicalSnapshot,
          albumUrl: "https://drive.google.com/drive/folders/approved",
        },
      ],
      listFolder: async () => [{ id: "one", name: "1.jpg" }],
      downloadFile: async () => context.image,
    });
    assert.equal(result.galleries[historicalSnapshot.slug].images.length, 1);
    assert.equal(
      result.state.galleries[historicalSnapshot.slug].fingerprint.length,
      64,
    );
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("Given a frozen gallery, When Drive changes, Then the site does not inspect it again", async () => {
  const context = await galleryFixture();
  const event = {
    ...historicalSnapshot,
    albumUrl: "https://drive.google.com/drive/folders/approved",
  };
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
    })
      .jpeg()
      .toBuffer();
    const changed = await synchronizeEventGalleries({
      ...context.options,
      events: [event],
      listFolder: async () => [{ id: "two", name: "2.jpg" }],
      downloadFile: async () => changedImage,
    });
    assert.equal(
      await readFile(context.options.manifestPath, "utf8"),
      manifest,
    );
    assert.equal(
      changed.galleries[event.slug].fingerprint,
      first.galleries[event.slug].fingerprint,
    );
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
    await writeFile(
      sourcePath,
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:c4@example.test",
        "DTSTART;VALUE=DATE:20260110",
        "SUMMARY:C4 event",
        "DESCRIPTION:Public text\\n---\\nALBUM_FOTOS: https://drive.google.com/drive/folders/approved",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
    galleryOptions.downloadFile = async () =>
      sharp({
        create: { width: 640, height: 480, channels: 3, background: "red" },
      })
        .jpeg()
        .toBuffer();
    await assert.rejects(
      synchronizeCalendar({
        source: sourcePath,
        registryPath: path.join(directory, "registry.json"),
        outputPath: path.join(blockedParent, "calendarEvents.ts"),
        now: new Date("2026-03-01T00:00:00.000Z"),
        galleryOptions,
      }),
    );
    await assert.rejects(stat(galleryOptions.manifestPath), /ENOENT/);
    await assert.rejects(stat(galleryOptions.statePath), /ENOENT/);
    await assert.rejects(stat(galleryOptions.imagesRoot), /ENOENT/);
    await assert.rejects(stat(path.join(directory, "registry.json")), /ENOENT/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
