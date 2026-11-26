import {
  temporaryDirectory,
  temporaryPaths,
  snapshotFiles,
  expectFilesUnchanged,
} from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  EVENT_GALLERY_LIMITS,
  downloadDriveFile,
  replaceTransaction,
  extractDriveFiles,
  getDriveFolderId,
  serializeManifest,
  synchronizeEventGalleries,
} from "../../scripts/sync-event-galleries.ts";

async function image(color, width = 640, height = 480, format = "jpeg") {
  const pipeline = sharp({
    create: { width, height, channels: 3, background: color },
  });
  return pipeline[format]().toBuffer();
}

async function fixture(t, files) {
  const directory = await temporaryDirectory(t, "fak-gallery-");

  const options = {
    ...temporaryPaths(directory, {
      manifestPath: "eventGalleries.ts",
      statePath: "eventGalleryState.json",
      imagesRoot: "images",
    }),
    listFolder: async () => files,
    downloadFile: async (file) => file.buffer,
  };
  return { directory, options };
}

async function run(
  options,
  albumUrl = "https://drive.google.com/drive/folders/publicAlbum",
) {
  return synchronizeEventGalleries({
    ...options,
    events: [
      {
        slug: "2026-01-01-evento",
        title: "Evento",
        date: "2026-01-01",
        albumUrl,
      },
    ],
  });
}

test("keeps the flyer through archival and reflects only complete Drive inventories", async (t) => {
  const files = [];
  const { options } = await fixture(t, files);
  const slug = "evento-drive";
  const folderName = "2026-08-08 - Evento Drive";
  const event = {
    slug,
    title: "Evento Drive",
    date: "2026-08-08",
    albumUrl: "https://drive.google.com/drive/folders/album",
    drive: { past: false, folderName },
  };
  const sync = () => synchronizeEventGalleries({ ...options, events: [event] });
  assert.deepEqual((await sync()).alarms, []);
  files.push({
    name: "Afiche externo.jpg",
    id: "flyer",
    buffer: await image("white"),
  });
  const flyer = (await sync()).galleries[slug].images[0];
  assert.equal(flyer.kind, "flyer");
  assert.equal(flyer.originalName, "Afiche externo.jpg");
  assert.match(
    flyer.src,
    /kendo-costa-rica-evento-drive-2026-afiche-[a-f0-9]{12}-640\.webp$/,
  );
  assert.equal((await sync()).publication, undefined);

  event.drive.past = true;
  files.push(
    { name: "Zulu.jpg", id: "first", buffer: await image("red", 500, 650) },
    { name: "Alpha.jpg", id: "second", buffer: await image("blue") },
  );
  const album = (await sync()).galleries[slug];
  assert.deepEqual(
    album.images.map(({ kind }) => kind),
    [undefined, undefined, "flyer"],
  );
  assert.ok(album.images[0].width > album.images[0].height);
  assert.equal(album.images[2].src, flyer.src);
  assert.match(
    album.images[0].src,
    /kendo-costa-rica-evento-drive-2026-foto-01-[a-f0-9]{12}-640\.webp$/,
  );
  const galleryDirectory = path.join(options.imagesRoot, slug);
  files.splice(2, 1);
  assert.equal((await sync()).galleries[slug].images.length, 2);
  const publishedAssets = await readdir(galleryDirectory);
  assert.ok(publishedAssets.includes(path.basename(flyer.src)));
  assert.ok(!publishedAssets.includes(path.basename(album.images[0].src)));

  const published = (await sync()).galleries[slug];
  files[1].buffer = undefined;
  assert.deepEqual((await sync()).galleries[slug], published);
  files.length = 0;
  const empty = await sync();
  assert.deepEqual(empty.galleries[slug], published);
  assert.equal(empty.alarms[0].folderName, folderName);
  files.push({
    name: "Recuperada.jpg",
    id: "recovered",
    buffer: await image("green"),
  });
  assert.equal((await sync()).galleries[slug].images[1].src, flyer.src);
  assert.equal((await sync()).publication, undefined);
});

test("reorders a published Drive album by natural filename without dropping photos", async (t) => {
  const ten = {
    name: "10.jpeg",
    id: "ten",
    buffer: await image("red", 500, 650),
  };
  const two = { name: "2.jpeg", id: "two", buffer: await image("blue") };
  const files = [ten, two];
  const { options } = await fixture(t, files);
  const event = {
    slug: "album-numerado",
    title: "Álbum numerado",
    date: "2026-08-08",
    albumUrl: "https://drive.google.com/drive/folders/album",
    drive: { past: true, folderName: "Álbum numerado" },
  };
  const sync = () => synchronizeEventGalleries({ ...options, events: [event] });
  const { galleries, state } = await sync();
  const album = galleries[event.slug];
  const photoShapes = (gallery) =>
    gallery.images.map(({ width, height }) => [width, height]);
  assert.deepEqual(photoShapes(album), [
    [640, 480],
    [500, 650],
  ]);

  // Seed the previously published result in Drive incorporation order.
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const legacyPhotos = await Promise.all(
    files.map(async ({ name, buffer }) => {
      const pixels = await sharp(buffer)
        .rotate()
        .removeAlpha()
        .raw()
        .toBuffer();
      return `${name}:${hash(pixels)}`;
    }),
  );
  const legacyFingerprint = hash(
    [...legacyPhotos, "", event.title, event.date, event.slug].join("\n"),
  );
  const legacyAlbum = {
    ...album,
    fingerprint: legacyFingerprint,
    images: album.images.toReversed().map((entry, index) => ({
      ...entry,
      order: index + 1,
    })),
  };
  state.galleries[event.slug].fingerprint = legacyFingerprint;
  await writeFile(
    options.manifestPath,
    serializeManifest({ [event.slug]: legacyAlbum }),
  );
  await writeFile(options.statePath, JSON.stringify(state));

  files.push({ name: "3.jpeg", id: "invalid", buffer: Buffer.from("invalid") });
  const migrated = await sync();
  assert.equal(migrated.importedCount, 1);
  assert.deepEqual(
    photoShapes(migrated.galleries[event.slug]),
    photoShapes(album),
  );
  assert.match(migrated.warnings.join("\n"), /3\.jpeg: invalid image/);
  assert.equal((await sync()).importedCount, 0);

  files.splice(0, 1);
  const incomplete = await sync();
  assert.deepEqual(
    incomplete.galleries[event.slug],
    migrated.galleries[event.slug],
  );
  assert.equal(incomplete.alarms[0]?.reason, "importacion_invalida");
});

test("uses approved input formats and a 10 MiB download limit", () => {
  assert.deepEqual(EVENT_GALLERY_LIMITS.inputFormats, [
    "jpeg",
    "png",
    "webp",
    "avif",
  ]);
  assert.equal(EVENT_GALLERY_LIMITS.maxBytes, 10 * 1024 * 1024);
  assert.equal(getDriveFolderId("https://example.test/folder"), undefined);
});

test("resizes a 12 megapixel original and keeps small images at their original size", async (t) => {
  const large = await image("red", 4032, 3024);
  assert.ok(large.length < EVENT_GALLERY_LIMITS.maxBytes);
  const { options } = await fixture(t, [
    { name: "large.jpg", id: "large", buffer: large },
    { name: "small.jpg", id: "small", buffer: await image("blue", 320, 240) },
  ]);

  const result = await run(options);
  assert.deepEqual(result.warnings, []);
  const { images } = result.galleries["2026-01-01-evento"];
  assert.deepEqual(
    images.map(({ width, height }) => [width, height]),
    [
      [1600, 1200],
      [320, 240],
    ],
  );
});

test("imports local official material through the same variants pipeline and freezes it", async (t) => {
  const { directory, options } = await fixture(t, []);
  const input = path.join(directory, "flyer.png");
  await writeFile(input, await image("white", 640, 800, "png"));
  const posterSource = {
    label: "Official flyer",
    url: "https://example.test/official-flyer/",
  };
  const events = [
    {
      slug: "external-event",
      title: "External event",
      date: "2026-01-01",
      localFiles: [{ name: "page-1.png", path: input }],
      posterSource,
    },
  ];
  const first = await synchronizeEventGalleries({ ...options, events });
  assert.equal(first.importedCount, 1);
  assert.deepEqual(
    first.galleries["external-event"].posterSource,
    posterSource,
  );
  assert.ok(
    first.galleries["external-event"].images[0].srcSet.webp.includes(".webp"),
  );
  first.galleries["external-event"].thumbnail = {
    ...first.galleries["external-event"].images[0],
    alt: "Independent archive preview",
  };
  await writeFile(options.manifestPath, serializeManifest(first.galleries));
  await writeFile(input, await image("red", 640, 800, "png"));
  const second = await synchronizeEventGalleries({ ...options, events });
  assert.equal(second.importedCount, 0);
  assert.deepEqual(second.galleries, first.galleries);
  assert.equal(second.galleries["external-event"].images.length, 1);
  assert.equal(
    second.galleries["external-event"].thumbnail.alt,
    "Independent archive preview",
  );
});

test("rejects unsafe poster source links without publishing a gallery", async (t) => {
  const { directory, options } = await fixture(t, []);
  const input = path.join(directory, "flyer.png");
  await writeFile(input, await image("white", 640, 800, "png"));
  const result = await synchronizeEventGalleries({
    ...options,
    events: [
      {
        slug: "external-event",
        title: "Event",
        date: "2026-01-01",
        localFiles: [{ name: "page-1.png", path: input }],
        posterSource: {
          label: "Source",
          url: "javascript:alert(1)",
        },
      },
    ],
  });
  assert.equal(result.importedCount, 0);
  assert.equal(result.galleries["external-event"], undefined);
  assert.ok(
    result.alarms.some(({ reason }) => reason === "acceso_o_descarga_fallida"),
  );
});

test("reads public Drive folder indexes encoded with hexadecimal JavaScript escapes", () => {
  const rows = [[["image-id", null, "photo.jpg", "image/jpeg"]]];
  const encoded = [...JSON.stringify(rows)]
    .map(
      (character) =>
        `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
    )
    .join("");

  assert.deepEqual(extractDriveFiles(`window['_DRIVE_ivd'] = '${encoded}'`), [
    { id: "image-id", name: "photo.jpg" },
  ]);
});

test("accepts the minimum dimensions independently of orientation", async (t) => {
  const context = await fixture(t, [
    {
      name: "portrait.jpg",
      id: "portrait",
      buffer: await image("red", 320, 480),
    },
  ]);
  const result = await run(context.options);
  assert.equal(result.galleries["2026-01-01-evento"].images.length, 1);
});

test("valid public album freezes all naturally ordered sanitized responsive images", async (t) => {
  const names = [
    "photo10.jpg",
    "photo2.jpg",
    "photo1.jpg",
    "photo5.jpg",
    "photo4.jpg",
    "photo3.jpg",
  ];
  const colors = ["red", "green", "blue", "yellow", "cyan", "magenta"];
  const files = await Promise.all(
    names.map(async (name, index) => ({
      name,
      id: `private-${index}`,
      buffer: await image(colors[index]),
    })),
  );
  const context = await fixture(t, files);
  const result = await run(context.options);
  assert.equal(result.galleries["2026-01-01-evento"].images.length, 6);
  assert.equal(
    result.warnings.some((warning) => warning.includes("additional files")),
    false,
  );
  const manifest = await readFile(context.options.manifestPath, "utf8");
  assert.match(
    manifest,
    /kendo-costa-rica-2026-01-01-evento-foto-01-[a-f0-9]{12}-480\.webp 480w/,
  );
  assert.match(
    manifest,
    /Federaciones de Asociaciones de Kendo - Evento 2026-01-01/,
  );
  assert.equal(/drive\.google|publicAlbum|private-/.test(manifest), false);
  const firstPath = path.join(
    context.options.imagesRoot,
    "2026-01-01-evento",
    `kendo-costa-rica-2026-01-01-evento-foto-01-${result.galleries["2026-01-01-evento"].fingerprint.slice(0, 12)}-480.webp`,
  );
  const firstBuffer = await readFile(firstPath);
  const stats = await sharp(firstBuffer).stats();
  assert.ok(stats.channels[2].mean > stats.channels[0].mean); // photo1.jpg is blue.
  assert.deepEqual((await sharp(firstBuffer).metadata()).exif, undefined);
});

test("published galleries retain their manifest, state, and image without Drive reads", async (t) => {
  const files = [{ name: "1.jpg", id: "one", buffer: await image("red") }];
  const context = await fixture(t, files);
  const slug = "2026-01-01-evento";
  const event = { slug, title: "Evento" };
  const first = await run(context.options);
  const fingerprint = first.galleries[slug].fingerprint;
  const imagePath = path.join(
    context.options.imagesRoot,
    slug,
    `kendo-costa-rica-${slug}-foto-01-${fingerprint.slice(0, 12)}-480.webp`,
  );
  const before = await snapshotFiles([
    context.options.manifestPath,
    context.options.statePath,
    imagePath,
  ]);
  const unexpectedRead = async () => {
    throw new Error("A published gallery must not read Drive");
  };
  const cases = [
    ["album absent", [event]],
    ["invalid URL", [{ ...event, albumUrl: "https://example.test/folder" }]],
    [
      "inaccessible source",
      [
        {
          ...event,
          albumUrl: "https://drive.google.com/drive/folders/publicAlbum",
        },
      ],
    ],
    [
      "later contents differ",
      [
        {
          ...event,
          albumUrl: "https://drive.google.com/drive/folders/changedAlbum",
        },
      ],
    ],
  ];
  for (const [name, events] of cases) {
    await t.test(name, async () => {
      const result = await synchronizeEventGalleries({
        ...context.options,
        events,
        listFolder: unexpectedRead,
        downloadFile: unexpectedRead,
      });
      assert.equal(result.galleries[slug].fingerprint, fingerprint);
      assert.deepEqual(result.warnings, []);
      assert.deepEqual(result.alarms, []);
      await expectFilesUnchanged(before);
    });
  }
});

test("renames existing variants to the public format without fetching or reimporting", async (t) => {
  const slug = "2026-01-01-evento";
  const { options } = await fixture(t, [
    { name: "evento.jpg", id: "one", buffer: await image("red") },
  ]);
  const first = await run(options);
  const gallery = first.galleries[slug];
  const variants = gallery.images[0].srcSet.webp.split(", ");
  const directory = path.join(options.imagesRoot, slug);
  const existingNames = [];
  for (const variant of variants) {
    const [url, width] = variant.split(" ");
    const original = path.basename(url);
    const otherName = `evento-${width.slice(0, -1)}.webp`;
    existingNames.push(otherName);
    await rename(
      path.join(directory, original),
      path.join(directory, otherName),
    );
    gallery.images[0].srcSet.webp = gallery.images[0].srcSet.webp.replace(
      original,
      otherName,
    );
    gallery.images[0].src = gallery.images[0].src.replace(original, otherName);
  }
  await writeFile(options.manifestPath, serializeManifest(first.galleries));
  const unexpectedRead = () => assert.fail("A rename should not fetch Drive");
  const sync = () =>
    run({
      ...options,
      listFolder: unexpectedRead,
      downloadFile: unexpectedRead,
    });
  const migrated = await sync();
  assert.deepEqual(migrated.warnings, []);
  assert.equal(migrated.importedCount, 0);
  assert.equal(migrated.galleries[slug].fingerprint, gallery.fingerprint);
  assert.match(
    migrated.galleries[slug].images[0].src,
    /kendo-costa-rica-2026-01-01-evento-foto-01-[a-f0-9]{12}-640\.webp$/,
  );
  const published = await readdir(directory);
  for (const name of existingNames) assert.ok(!published.includes(name));
  for (const variant of variants)
    assert.ok(published.includes(path.basename(variant.split(" ")[0])));
  assert.equal((await sync()).publication, undefined);
});

test("deduplicates identical images during first publication", async (t) => {
  const duplicateBuffer = await image("blue");
  const context = await fixture(t, [
    { name: "1.jpg", id: "one", buffer: duplicateBuffer },
    { name: "2.jpg", id: "two", buffer: duplicateBuffer },
  ]);
  const result = await run(context.options);
  assert.equal(result.galleries["2026-01-01-evento"].images.length, 1);
  assert.equal(
    result.warnings.some((warning) => warning.includes("duplicate ignored")),
    true,
  );
});

test("reports an unpublished album without inventing a frozen gallery", async (t) => {
  const context = await fixture(t, []);
  const result = await synchronizeEventGalleries({
    ...context.options,
    events: [{ slug: "2026-01-01-evento", title: "Evento" }],
  });
  assert.deepEqual(result.alarms, [
    {
      slug: "2026-01-01-evento",
      status: "album_aun_no_publicado",
      reason: "album_ausente",
    },
  ]);
  await assert.rejects(stat(context.options.manifestPath), /ENOENT/);
  assert.deepEqual(result.state.checks["2026-01-01-evento"], {
    phase: "final",
  });
});

test("checks an absent gallery once at 24 hours and once at the 48-hour deadline", async (t) => {
  const context = await fixture(t, []);
  const event = {
    slug: "2026-01-01-evento",
    title: "Evento",
    galleryCheckPhase: "first",
  };
  for (const phase of ["first", "final"]) {
    const events = [{ ...event, galleryCheckPhase: phase }];
    const result = await synchronizeEventGalleries({
      ...context.options,
      events,
    });
    assert.equal(result.alarms.length, 1);
    assert.deepEqual(result.state.checks[event.slug], { phase });
    const repeated = await synchronizeEventGalleries({
      ...context.options,
      events,
    });
    assert.deepEqual(repeated.alarms, []);
  }
});

test("imports content uploaded between the 24-hour check and the 48-hour deadline", async (t) => {
  const files = [{ name: "1.jpg", id: "one", buffer: await image("red") }];
  const context = await fixture(t, files);
  const event = { slug: "2026-01-01-evento", title: "Evento" };
  await synchronizeEventGalleries({
    ...context.options,
    events: [{ ...event, galleryCheckPhase: "first" }],
  });

  const final = await synchronizeEventGalleries({
    ...context.options,
    events: [
      {
        ...event,
        galleryCheckPhase: "final",
        albumUrl: "https://drive.google.com/drive/folders/publicAlbum",
      },
    ],
    listFolder: async () => files,
    downloadFile: async (file) => file.buffer,
  });

  assert.equal(final.importedCount, 1);
  assert.equal(final.galleries[event.slug].images.length, 1);
  assert.deepEqual(final.state.checks[event.slug], { phase: "final" });
});

test("imports an album added after the final absent-gallery check", async (t) => {
  const files = [{ name: "1.jpg", id: "one", buffer: await image("red") }];
  const context = await fixture(t, files);
  const event = { slug: "2026-01-01-evento", title: "Evento" };
  await synchronizeEventGalleries({
    ...context.options,
    events: [{ ...event, galleryCheckPhase: "final" }],
  });

  const imported = await synchronizeEventGalleries({
    ...context.options,
    events: [
      {
        ...event,
        galleryCheckPhase: "final",
        albumUrl: "https://drive.google.com/drive/folders/publicAlbum",
      },
    ],
    listFolder: async () => files,
    downloadFile: async (file) => file.buffer,
  });

  assert.equal(imported.importedCount, 1);
  assert.equal(imported.galleries[event.slug].images.length, 1);
});

test("rejects oversized Content-Length without reading the download", async () => {
  let cancelled = false;
  let reads = 0;
  const body = new ReadableStream(
    {
      pull() {
        reads += 1;
      },
      cancel() {
        cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  await assert.rejects(
    downloadDriveFile(
      { id: "x", name: "large.jpg" },
      async () =>
        new Response(body, {
          headers: {
            "content-length": String(EVENT_GALLERY_LIMITS.maxBytes + 1),
          },
        }),
    ),
    /exceeds 10 MiB/,
  );
  assert.equal(reads, 0);
  assert.equal(cancelled, true);
});

for (const declaredLength of [undefined, "1"]) {
  test(`cancels an oversized stream with Content-Length ${declaredLength ?? "absent"}`, async () => {
    let reads = 0;
    let cancelled = false;
    const body = new ReadableStream(
      {
        pull(controller) {
          reads += 1;
          controller.enqueue(new Uint8Array(1024 * 1024));
        },
        cancel() {
          cancelled = true;
        },
      },
      { highWaterMark: 0 },
    );
    const headers = declaredLength ? { "content-length": declaredLength } : {};
    await assert.rejects(
      downloadDriveFile(
        { id: "x", name: "large.jpg" },
        async () => new Response(body, { headers }),
      ),
      /exceeds 10 MiB/,
    );
    assert.equal(reads, 11);
    assert.equal(cancelled, true);
  });
}

test("accepts a stream at exactly the download limit", async () => {
  let remaining = 10;
  const body = new ReadableStream(
    {
      pull(controller) {
        if (remaining-- > 0) controller.enqueue(new Uint8Array(1024 * 1024));
        else controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  const result = await downloadDriveFile(
    { id: "x", name: "limit.jpg" },
    async () => new Response(body),
  );
  assert.equal(result.length, EVENT_GALLERY_LIMITS.maxBytes);
});

test("cleans staged galleries and originals when manifest staging fails", async (t) => {
  const context = await fixture(t, [
    { id: "one", name: "one.jpg", buffer: await image("red") },
  ]);
  const blocker = path.join(context.directory, "not-a-directory");
  await writeFile(blocker, "block");
  await assert.rejects(
    run({
      ...context.options,
      manifestPath: path.join(blocker, "manifest.ts"),
    }),
  );
  assert.deepEqual((await readdir(context.directory)).sort(), [
    "not-a-directory",
  ]);
});

test("cleans an unused image stage without changing its source", async (t) => {
  const context = await fixture(t, []);
  await writeFile(context.options.imagesRoot, "original");
  await synchronizeEventGalleries({ ...context.options, events: [] });
  assert.deepEqual(await readdir(context.directory), ["images"]);
  assert.equal(await readFile(context.options.imagesRoot, "utf8"), "original");
});

test("spools originals separately and hands off only publishable stages", async (t) => {
  const context = await fixture(t, [
    { id: "one", name: "1.jpg", buffer: await image("red") },
    { id: "two", name: "2.jpg", buffer: await image("blue") },
  ]);
  let checkedSpool = false;
  const result = await run({
    ...context.options,
    deferPublish: true,
    downloadFile: async (file) => {
      if (file.id === "two") {
        const spool = (await readdir(context.directory)).find((name) =>
          name.startsWith(".gallery-inputs-"),
        );
        assert.ok(spool);
        assert.deepEqual(await readdir(path.join(context.directory, spool)), [
          "0",
        ]);
        checkedSpool = true;
      }
      return file.buffer;
    },
  });
  assert.equal(checkedSpool, true);
  assert.equal(
    (await readdir(context.directory)).some((name) =>
      name.startsWith(".gallery-inputs-"),
    ),
    false,
  );
  assert.equal(result.publication.length, 3);
  for (const { staged } of result.publication) await stat(staged);
  await replaceTransaction(result.publication);
  assert.deepEqual((await readdir(context.directory)).sort(), [
    "eventGalleries.ts",
    "eventGalleryState.json",
    "images",
  ]);
  assert.deepEqual(await readdir(context.options.imagesRoot), [
    "2026-01-01-evento",
  ]);
});
