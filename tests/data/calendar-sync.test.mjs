import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  assertSafeCalendarInput,
  createCanonicalSlug,
  getPrivateAlbumUrl,
  MASS_DISAPPEARANCE_MINIMUM,
  MASS_DISAPPEARANCE_RATIO,
  mergeRegistry,
  parseCalendarEvent,
  parseVEvents,
  synchronizeCalendar,
} from "../../scripts/sync-calendar-events.mjs";
import {
  calculateArchiveEligibleAt,
  calculateGalleryCheckAt,
  calculateGalleryDeadlineAt,
  calculatePublicPastAt,
} from "../../src/app/utils/eventArchive.js";
import {
  addCalendarDays,
  getCalendarDateTimeSortKey,
} from "../../src/app/utils/calendarDate.js";

const fixturePath = new URL("../fixtures/calendar-events.ics", import.meta.url);
const phase2FixturePath = new URL(
  "../fixtures/calendar-events-phase-2.ics",
  import.meta.url,
);
const invalidPhase2FixturePath = new URL(
  "../fixtures/calendar-events-phase-2-invalid.ics",
  import.meta.url,
);

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

test("calendar date helpers cross month and year boundaries independently of the runner zone", () => {
  assert.equal(addCalendarDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addCalendarDays("2026-01-01", -1), "2025-12-31");
  assert.ok(
    getCalendarDateTimeSortKey("2026-08-08", "09:00") <
      getCalendarDateTimeSortKey("2026-08-08", "10:00"),
  );
});

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

test("omits drafts and recurring events while allowing optional content to be absent", async () => {
  const warnings = [];
  const events = parseVEvents(await readFile(fixturePath, "utf8"))
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.equal(
    events.some((event) => event.title.includes("BORRADOR")),
    false,
  );
  assert.equal(
    events.some((event) => event.title === "Entrenamiento semanal"),
    false,
  );
  assert.equal(
    events.some((event) => event.title === "Actividad sin detalles"),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("Draft omitted")),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("Recurring event omitted")),
    true,
  );
  assert.equal(
    warnings.some((warning) =>
      /location|description|gallery|ubicación|descripción/i.test(warning),
    ),
    false,
  );
});

test("omits an event and warns when title or date is missing", () => {
  const warnings = [];
  const events = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:missing-title@example.test",
      "DTSTART;VALUE=DATE:20260808",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:missing-date@example.test",
      "SUMMARY:Evento sin fecha",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  )
    .map((event) => parseCalendarEvent(event, warnings))
    .filter(Boolean);

  assert.deepEqual(events, []);
  assert.equal(
    warnings.some((warning) => warning.includes("title")),
    true,
  );
  assert.equal(
    warnings.some((warning) => warning.includes("date")),
    true,
  );
});

test("accepts matching Drive album links with different query parameters", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:album@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      'DESCRIPTION:Resultados.\\n<a href="https://drive.google.com/drive/folders/same-folder?usp=drive_link" class="pastedDriveLink-0">Álbum</a>\\n---\\nALBUM_FOTOS: https://drive.google.com/drive/folders/same-folder',
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  const event = parseCalendarEvent(properties);

  assert.equal(
    getPrivateAlbumUrl(event),
    "https://drive.google.com/drive/folders/same-folder?usp=drive_link",
  );
  assert.equal(event.summary, "Resultados.");
});

test("normalizes pasted HTML in public event descriptions", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:pasted-html@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      'DESCRIPTION:- Categoría con Bogu y sin Bogu<br>- Categoría por equipos<br><br><a href=" class="pastedDriveLink-0">',
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  const event = parseCalendarEvent(properties);

  assert.equal(
    event.summary,
    "- Categoría con Bogu y sin Bogu\n- Categoría por equipos",
  );
});

test("rejects different Drive album folders", () => {
  const [properties] = parseVEvents(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:albums@example.test",
      "DTSTART;VALUE=DATE:20260822",
      "SUMMARY:3er Torneo",
      "DESCRIPTION:https://drive.google.com/drive/folders/first-folder\\nhttps://drive.google.com/drive/folders/second-folder",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
  );

  assert.throws(() => parseCalendarEvent(properties), /Multiple album URLs/);
});

test("Given a pending event, When its title changes, Then its identity remains editable", () => {
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

  const [event] = mergeRegistry(
    previous,
    current,
    new Date("2026-07-01"),
  ).events;
  assert.equal(event.slug, "2026-08-08-examen-nacional");
  assert.equal(event.title, "Examen nacional");
});

test("Given a historical event, When Calendar changes its date and title, Then its identity stays frozen", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "same-source",
        slug: "2026-08-08-examen",
        title: "Examen",
        date: "2026-08-08",
        archiveEligibleAt: "2026-08-10T06:00:00.000Z",
        historical: true,
        aliases: ["2026-08-01-examen-anterior"],
      },
    ],
  };
  const current = [
    {
      sourceId: "same-source",
      slug: "2026-08-15-examen-nacional",
      title: "Examen nacional",
      date: "2026-08-15",
      archiveEligibleAt: "2026-08-17T06:00:00.000Z",
    },
  ];

  const [event] = mergeRegistry(
    previous,
    current,
    new Date("2026-08-20T00:00:00Z"),
  ).events;
  assert.equal(event.slug, "2026-08-08-examen");
  assert.equal(event.title, "Examen");
  assert.equal(event.date, "2026-08-08");
  assert.equal(event.archiveEligibleAt, "2026-08-10T06:00:00.000Z");
  assert.deepEqual(event.aliases, ["2026-08-01-examen-anterior"]);
});

test("Given a version 2 historical event, When the registry migrates, Then its existing identity is frozen", () => {
  const previous = {
    version: 2,
    events: [
      {
        sourceId: "legacy-source",
        slug: "2025-12-31-examen",
        title: "Examen original",
        date: "2025-12-31",
      },
    ],
  };
  const current = [
    {
      sourceId: "legacy-source",
      slug: "2026-01-10-examen-corregido",
      title: "Examen corregido",
      date: "2026-01-10",
      archiveEligibleAt: "2026-01-13T06:00:00.000Z",
    },
  ];

  const [event] = mergeRegistry(
    previous,
    current,
    new Date("2026-02-01T00:00:00Z"),
  ).events;
  assert.equal(event.slug, "2025-12-31-examen");
  assert.equal(event.title, "Examen original");
  assert.equal(event.date, "2025-12-31");
  assert.equal(event.archiveEligibleAt, "2026-01-02T06:00:00.000Z");
  assert.equal(event.historical, true);
});

test("Given an event at month end, When the 48-hour calendar checkpoint arrives, Then it is eligible", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-01-31").toISOString(),
    "2026-02-02T06:00:00.000Z",
  );
});

test("separates public expiry, the first gallery check, and the final 48-hour deadline", () => {
  assert.equal(
    calculatePublicPastAt("2026-08-22").toISOString(),
    "2026-08-23T06:00:00.000Z",
  );
  assert.equal(
    calculateGalleryCheckAt("2026-08-22").toISOString(),
    "2026-08-23T06:00:00.000Z",
  );
  assert.equal(
    calculateGalleryDeadlineAt("2026-08-22").toISOString(),
    "2026-08-24T06:00:00.000Z",
  );
  assert.equal(
    calculateArchiveEligibleAt("2026-08-22").toISOString(),
    "2026-08-24T06:00:00.000Z",
  );
});

test("Given an event at year end, When the 48-hour calendar checkpoint arrives, Then eligibility crosses the year", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-12-31").toISOString(),
    "2027-01-02T06:00:00.000Z",
  );
});

test("Given foreign daylight-saving dates, When eligibility is calculated, Then Costa Rica midnight stays stable", () => {
  assert.equal(
    calculateArchiveEligibleAt("2026-03-08").toISOString(),
    "2026-03-10T06:00:00.000Z",
  );
  assert.equal(
    calculateArchiveEligibleAt("2026-11-01").toISOString(),
    "2026-11-03T06:00:00.000Z",
  );
});

test("Given timed and all-day events, When parsed, Then eligibility uses the last local event day instead of its ending hour", () => {
  const timed = parseCalendarEvent(
    parseVEvents(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:timed@example.test",
        "DTSTART;TZID=America/Costa_Rica:20260808T130000",
        "DTEND;TZID=America/Costa_Rica:20260808T150000",
        "SUMMARY:Timed",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    )[0],
  );
  const allDay = parseCalendarEvent(
    parseVEvents(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:all-day@example.test",
        "DTSTART;VALUE=DATE:20260808",
        "DTEND;VALUE=DATE:20260809",
        "SUMMARY:All day",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    )[0],
  );

  assert.equal(timed.archiveEligibleAt, "2026-08-10T06:00:00.000Z");
  assert.equal(allDay.archiveEligibleAt, "2026-08-10T06:00:00.000Z");
});

test("keeps missing events published as pending revisions until a human decision", () => {
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
      {
        sourceId: "present-past",
        slug: "2025-02-01-present-past",
        title: "Present past",
        date: "2025-02-01",
      },
    ],
  };

  const merged = mergeRegistry(
    previous,
    [previous.events[2]],
    new Date("2026-07-01"),
  );
  assert.deepEqual(
    merged.events.map((event) => event.sourceId),
    ["past", "present-past", "future"],
  );
  assert.equal(merged.events[0].editorialState, "pendiente");
  assert.equal(merged.events[2].editorialState, "pendiente");
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
    createIcs([{ uid: "first@example.test" }, { uid: "second@example.test" }]),
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

test("an empty or wholly omitted feed leaves the last published artifacts untouched", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const sourcePath = path.join(tempDirectory, "empty.ics");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  const previousOutput = "previous output";
  const previousRegistry = '{"version":4,"events":[]}';
  await writeFile(sourcePath, "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
  await writeFile(outputPath, previousOutput);
  await writeFile(registryPath, previousRegistry);

  try {
    await assert.rejects(
      synchronizeCalendar({ source: sourcePath, outputPath, registryPath }),
      /contains no valid events/i,
    );
    assert.equal(await readFile(outputPath, "utf8"), previousOutput);
    assert.equal(await readFile(registryPath, "utf8"), previousRegistry);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("the measured mass-disappearance threshold blocks publication while one absence remains pending", () => {
  const previous = {
    version: 4,
    events: Array.from({ length: 4 }, (_, index) => ({
      sourceId: `source-${index}`,
      slug: `2026-08-0${index + 1}-event`,
      title: `Event ${index}`,
      date: `2026-08-0${index + 1}`,
      editorialState: "publicado",
    })),
  };
  const current = previous.events.slice(0, 2);

  assert.throws(
    () => assertSafeCalendarInput(previous, current),
    new RegExp(`2 of 4.*threshold 2`, "i"),
  );
  assert.doesNotThrow(() =>
    assertSafeCalendarInput(previous, previous.events.slice(0, 3)),
  );
  assert.equal(MASS_DISAPPEARANCE_MINIMUM, 2);
  assert.equal(MASS_DISAPPEARANCE_RATIO, 0.5);
});

test("a duplicate source identity is rejected before registry or public output can change", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const sourcePath = path.join(tempDirectory, "duplicate-source.ics");
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  await writeFile(
    sourcePath,
    createIcs([
      { uid: "same@example.test", title: "First" },
      { uid: "same@example.test", title: "Second" },
    ]),
  );
  await writeFile(outputPath, "previous output");
  await writeFile(registryPath, '{"version":4,"events":[]}');

  try {
    await assert.rejects(
      synchronizeCalendar({ source: sourcePath, outputPath, registryPath }),
      /Duplicate calendar source identity/,
    );
    assert.equal(await readFile(outputPath, "utf8"), "previous output");
    assert.equal(
      await readFile(registryPath, "utf8"),
      '{"version":4,"events":[]}',
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("phase 2 normalizes public descriptions and event types without publishing album URLs", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  const galleryManifestPath = path.join(tempDirectory, "eventGalleries.ts");
  const galleryStatePath = path.join(tempDirectory, "eventGalleryState.json");
  const galleryImagesRoot = path.join(tempDirectory, "event-images");

  try {
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
      result.galleryResult.state.galleries["2026-08-08-examen-en-preparacion"]
        .fingerprint,
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
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("invalid technical metadata preserves both previously published artifacts", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "fak-calendar-"));
  const outputPath = path.join(tempDirectory, "calendarEvents.ts");
  const registryPath = path.join(tempDirectory, "registry.json");
  const previousOutput = "previous output";
  const previousRegistry = '{"version":3,"events":[]}';
  await writeFile(outputPath, previousOutput);
  await writeFile(registryPath, previousRegistry);

  try {
    await assert.rejects(
      synchronizeCalendar({
        source: fileURLToPath(invalidPhase2FixturePath),
        outputPath,
        registryPath,
      }),
      /Invalid ALBUM_FOTOS/,
    );
    assert.equal(await readFile(outputPath, "utf8"), previousOutput);
    assert.equal(await readFile(registryPath, "utf8"), previousRegistry);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
