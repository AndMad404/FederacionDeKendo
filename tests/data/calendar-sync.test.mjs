import {
  temporaryDirectory,
  temporaryPaths,
  snapshotFiles,
  expectFilesUnchanged,
} from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { createIcs } from "../helpers/calendar-fixtures.mjs";

import {
  createCalendarFailureNotification,
  getCalendarNotificationWarnings,
  synchronizeCalendar,
} from "../../scripts/sync-calendar-events.ts";
import {
  createCalendarDrive,
  MAX_DRIVE_IMAGE_BYTES,
} from "../../scripts/calendar-drive.ts";
import { formatCalendarNotificationEmail } from "../../scripts/write-calendar-notification-email.mjs";

const driveQuotaFixture = {
  userUnitsPerMinute: 325_000,
  projectUnitsPerMinute: 1_000_000,
  projectBytesPerDay: 2 ** 40,
  timeZone: "America/Los_Angeles",
  units: { metadata: 5, list: 100, write: 50, download: 200 },
};

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

test("publishes Calendar after a Drive timeout and recovers the folder across a title change", async (t) => {
  const directory = await temporaryDirectory(t, "fak-drive-");
  const source = path.join(directory, "calendar.ics");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const registryPath = path.join(directory, "registry.json");
  const mimeType = "application/vnd.google-apps.folder";
  let folder;
  let creates = 0;
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    if (url.hostname === "oauth2.googleapis.com")
      return Response.json({ access_token: "test" });
    if (options.method === "POST") {
      creates++;
      const record = JSON.parse(options.body);
      assert.deepEqual(record.parents, ["exams"]);
      folder = { ...record, id: "private-folder-id" };
      throw new Error("connection dropped after creation");
    }
    if (url.pathname.endsWith("/root"))
      return Response.json({ id: "root", mimeType });
    if (url.pathname.endsWith("/private-folder-id"))
      return Response.json(folder);
    const query = url.searchParams.get("q");
    if (query.includes("appProperties"))
      return Response.json({ files: folder ? [folder] : [] });
    if (query.includes("'Examenes'"))
      return Response.json({ files: [{ id: "exams", mimeType }] });
    return Response.json({ files: [] });
  };
  const sync = async (title) => {
    await writeFile(source, createIcs([{ uid: "drive@example.test", title }]));
    return synchronizeCalendar({
      source,
      outputPath,
      registryPath,
      now: new Date("2026-07-01"),
      drive: createCalendarDrive(
        {
          rootId: "root",
          clientId: "client",
          clientSecret: "secret",
          refreshToken: "refresh",
          quota: driveQuotaFixture,
        },
        fetchImpl,
      ),
      galleryOptions: temporaryPaths(directory, {
        manifestPath: "galleries.ts",
        statePath: "gallery-state.json",
        imagesRoot: "images",
      }),
    });
  };
  const first = await sync("Examen original");
  assert.match(await readFile(outputPath, "utf8"), /Examen original/);
  assert.match(
    getCalendarNotificationWarnings(first.notificationReport).join("\n"),
    /::error.*2026-08-08 - Examen original/,
  );
  const email = formatCalendarNotificationEmail(
    first.notificationReport,
    "from@example.test",
    "to@example.test",
  );
  assert.match(email, /Carpeta de Drive: 2026-08-08 - Examen original/);

  const retried = await sync("Examen corregido");
  assert.equal(creates, 1);
  assert.match(await readFile(outputPath, "utf8"), /Examen corregido/);
  assert.equal(
    retried.notificationReport.notifications[0].kind,
    "carpeta_drive_vinculada",
  );
  assert.equal(retried.registry.events[0].driveGallery, "linked");
  assert.ok(!(await readFile(registryPath, "utf8")).includes(folder.id));
  assert.ok(!JSON.stringify(retried.notificationReport).includes(folder.id));
  assert.deepEqual(
    (await sync("Examen corregido")).notificationReport.notifications,
    [],
  );
});

test("missing and invalid Drive quota configuration fail before authorizing", () => {
  const config = {
    rootId: "root",
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "token",
  };
  let network = 0;
  for (const quota of [
    undefined,
    { ...driveQuotaFixture, timeZone: "Invalid/Zone" },
    {
      ...driveQuotaFixture,
      units: { ...driveQuotaFixture.units, list: 0 },
    },
  ]) {
    assert.throws(
      () =>
        createCalendarDrive({ ...config, quota }, async () => {
          network++;
          return Response.json({});
        }),
      (error) =>
        createCalendarFailureNotification(error).notifications[0].kind ===
        "cuota_drive_bloqueada",
    );
  }
  assert.equal(network, 0);
});

test("the minute budget prevents network requests and reports project and user caps", async () => {
  const config = {
    rootId: "root",
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "token",
  };
  for (const scope of ["usuario", "proyecto"]) {
    let requests = 0;
    const drive = createCalendarDrive(
      {
        ...config,
        quota: {
          ...driveQuotaFixture,
          userUnitsPerMinute: scope === "usuario" ? 104 : 105,
          projectUnitsPerMinute: scope === "proyecto" ? 104 : 105,
        },
      },
      async (input) => {
        if (new URL(input).hostname === "oauth2.googleapis.com")
          return Response.json({ access_token: "test" });
        requests++;
        return Response.json({ id: "root" });
      },
    );
    await assert.rejects(drive.findFolder("event"), (error) => {
      const report = createCalendarFailureNotification(error);
      assert.equal(report.notifications[0].kind, "cuota_drive_bloqueada");
      assert.match(
        report.notifications[0].cause,
        new RegExp(scope + ".*105.*104"),
      );
      assert.match(getCalendarNotificationWarnings(report)[0], /^::error /);
      return true;
    });
    assert.equal(requests, 1);
  }
});

test("a persisted daily reservation stops the next run before media and preserves Calendar output", async (t) => {
  const directory = await temporaryDirectory(t, "fak-drive-quota-");
  const source = path.join(directory, "calendar.ics");
  const outputPath = path.join(directory, "calendarEvents.ts");
  const registryPath = path.join(directory, "registry.json");
  const config = {
    rootId: "root",
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "refresh",
    quota: driveQuotaFixture,
  };
  const limits = {
    userUnitsPerMinute: 325_000,
    projectUnitsPerMinute: 1_000_000,
    projectBytesPerDay: MAX_DRIVE_IMAGE_BYTES + 1,
  };
  let budget;
  let downloads = 0;
  const mimeType = "application/vnd.google-apps.folder";
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    if (url.hostname === "oauth2.googleapis.com")
      return Response.json({ access_token: "test" });
    if (url.hostname === "driveactivity.googleapis.com") {
      return Response.json({
        activities: [
          {
            timestamp: "2026-06-01T00:00:00Z",
            targets: [{ driveItem: { name: "items/photo" } }],
            actions: [{ detail: { create: { upload: {} } } }],
          },
        ],
      });
    }
    if (url.pathname.endsWith("/root")) {
      if (options.method === "PATCH")
        budget = JSON.parse(options.body).appProperties.calendarDownloadBudget;
      return Response.json({
        id: "root",
        mimeType,
        appProperties: { calendarDownloadBudget: budget },
      });
    }
    if (url.pathname.endsWith("/folder"))
      return Response.json({
        id: "folder",
        mimeType,
        name: "Carpeta de prueba",
      });
    if (url.searchParams.get("alt") === "media") {
      assert.equal(
        options.headers.get("Range"),
        "bytes=0-" + MAX_DRIVE_IMAGE_BYTES,
      );
      downloads++;
      return new Response(null, { status: 200 });
    }
    const query = url.searchParams.get("q");
    return Response.json({
      files: query.includes("appProperties")
        ? [{ id: "folder", mimeType, name: "Carpeta de prueba" }]
        : [{ id: "photo", name: "foto.jpg" }],
    });
  };
  const options = {
    source,
    outputPath,
    registryPath,
    now: new Date("2026-07-01"),
    galleryOptions: temporaryPaths(directory, {
      manifestPath: "galleries.ts",
      statePath: "gallery-state.json",
      imagesRoot: "images",
    }),
  };
  await writeFile(
    source,
    createIcs([{ uid: "daily@example.test", title: "Examen original" }]),
  );
  await synchronizeCalendar(options);
  const published = await snapshotFiles([outputPath, registryPath]);
  const drive = createCalendarDrive(
    { ...config, quota: { ...driveQuotaFixture, ...limits } },
    fetchImpl,
  );
  await drive.fetchMedia(
    "https://www.googleapis.com/drive/v3/files/photo?alt=media",
  );
  assert.equal(downloads, 1);
  assert.equal(Object.values(JSON.parse(budget))[0], limits.projectBytesPerDay);

  await writeFile(
    source,
    createIcs([{ uid: "daily@example.test", title: "Examen corregido" }]),
  );
  await assert.rejects(
    synchronizeCalendar({
      ...options,
      drive: createCalendarDrive(
        { ...config, quota: { ...driveQuotaFixture, ...limits } },
        fetchImpl,
      ),
    }),
    (error) => {
      const report = createCalendarFailureNotification(error);
      assert.equal(report.notifications[0].kind, "cuota_drive_bloqueada");
      const email = formatCalendarNotificationEmail(
        report,
        "from@example.test",
        "to@example.test",
      );
      assert.match(email, /superaría el límite diario/);
      assert.match(email, /no publicó cambios/);
      return true;
    },
  );
  assert.equal(downloads, 1);
  await expectFilesUnchanged(published);
});

test("HTTP 429 and Drive HTTP 403 quota responses produce a blocking notice", async () => {
  const config = {
    rootId: "root",
    clientId: "client",
    clientSecret: "secret",
    refreshToken: "refresh",
    quota: driveQuotaFixture,
  };
  for (const [status, reason] of [
    [429, undefined],
    [403, "userRateLimitExceeded"],
  ]) {
    const drive = createCalendarDrive(config, async (input) =>
      new URL(input).hostname === "oauth2.googleapis.com"
        ? Response.json({ access_token: "test" })
        : Response.json({ error: { errors: [{ reason }] } }, { status }),
    );
    await assert.rejects(drive.findFolder("event"), (error) => {
      const report = createCalendarFailureNotification(error);
      assert.equal(report.notifications[0].kind, "cuota_drive_bloqueada");
      assert.equal(report.notifications[0].after.codigoHttp, status);
      return true;
    });
  }
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

test("a blocked publication email identifies absent events and rejected Calendar fields", async (t) => {
  const tempDirectory = await temporaryDirectory(t, "fak-calendar-");
  const events = [
    { uid: "exam@example.test", title: "Examen", date: "20260808" },
    { uid: "seminar@example.test", title: "Seminario", date: "20260809" },
    { uid: "practice@example.test", title: "Practica", date: "20260810" },
    { uid: "tournament@example.test", title: "Torneo", date: "20260811" },
  ];
  const { outputPath, registryPath } = await runSynchronization({
    tempDirectory,
    name: "published",
    events,
  });
  const source = path.join(tempDirectory, "incomplete.ics");
  const feed = createIcs([
    ...events.slice(0, 3),
    { uid: "", title: "https://example.test/private-feed", date: "invalid" },
    { uid: "", title: "Entrenamiento", date: "20260812" },
  ]).replace("DTSTART;VALUE=DATE:20260810\n", "");
  await writeFile(source, feed);
  const before = await snapshotFiles([outputPath, registryPath]);
  await assert.rejects(
    synchronizeCalendar({ source, outputPath, registryPath }),
    (error) => {
      const report = createCalendarFailureNotification(error);
      assert.equal(report.notifications[0].kind, "desaparicion_masiva");
      const email = formatCalendarNotificationEmail(
        report,
        "alerts@example.test",
        "owner@example.test",
      );
      assert.match(
        email,
        /Subject: .*Publicacion detenida por datos faltantes/,
      );
      assert.match(email, /Practica — 2026-08-10 \(practica\)/);
      assert.match(email, /Torneo — 2026-08-11 \(torneo\)/);
      assert.match(
        email,
        /Practica - 2026-08-10 \(última fecha publicada\) - DTSTART \(fecha de inicio ausente\)/,
      );
      assert.match(email, /Entrenamiento - 2026-08-12 - UID/);
      assert.match(
        email,
        /fecha no disponible - UID \(identificador ausente\), DTSTART \(fecha de inicio invalida\)/,
      );
      assert.doesNotMatch(email, /private-feed|practice@example\.test/);
      return true;
    },
  );
  await expectFilesUnchanged(before);
});

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

test("cleans deferred gallery stages and a successful registry stage when calendar staging fails", async (t) => {
  const directory = await temporaryDirectory(t, "fak-calendar-stage-");
  const source = path.join(directory, "input.ics");
  const registryPath = path.join(directory, "registry.json");
  const blocker = path.join(directory, "not-a-directory");
  await writeFile(
    source,
    createIcs([{ uid: "stage@example.test", title: "Examen" }]),
  );
  await writeFile(blocker, "block");
  await writeFile(
    path.join(directory, "photo.jpg"),
    await sharp({
      create: { width: 640, height: 480, channels: 3, background: "red" },
    })
      .jpeg()
      .toBuffer(),
  );
  await assert.rejects(
    synchronizeCalendar({
      source,
      registryPath,
      outputPath: path.join(blocker, "events.ts"),
      now: new Date("2026-07-01"),
      galleryOptions: {
        force: true,
        events: [
          {
            slug: "gallery",
            title: "Gallery",
            localFiles: [
              { name: "1.jpg", path: path.join(directory, "photo.jpg") },
            ],
          },
        ],
        manifestPath: path.join(directory, "gallery.ts"),
        statePath: path.join(directory, "gallery-state.json"),
        imagesRoot: path.join(directory, "images"),
        downloadFile: async () => {
          throw new Error("Unexpected download");
        },
      },
    }),
    (error) => {
      // Cleanup must preserve the original staging error, not replace it with rm.
      assert.equal(error.syscall, "mkdir");
      assert.equal(error.path, blocker);
      return true;
    },
  );
  assert.deepEqual((await readdir(directory)).sort(), [
    "input.ics",
    "not-a-directory",
    "photo.jpg",
  ]);
});
