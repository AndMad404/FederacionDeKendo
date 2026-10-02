import {
  temporaryDirectory,
  temporaryPaths,
  snapshotFiles,
  expectFilesUnchanged,
} from "../helpers/temporary-directory.mjs";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  EVENT_GALLERY_LIMITS,
  extractDriveFiles,
  getDriveFolderId,
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

test("uses approved input and 4K limits", () => {
  assert.deepEqual(EVENT_GALLERY_LIMITS.inputFormats, [
    "jpeg",
    "png",
    "webp",
    "avif",
  ]);
  assert.equal(EVENT_GALLERY_LIMITS.maxBytes, 20 * 1024 * 1024);
  assert.equal(EVENT_GALLERY_LIMITS.maxLongEdge, 3840);
  assert.equal(EVENT_GALLERY_LIMITS.maxPixels, 3840 * 2160);
  assert.equal(getDriveFolderId("https://example.test/folder"), undefined);
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
  assert.match(manifest, /photo-1-480\.webp 480w/);
  assert.match(manifest, /photo-1-480\.avif 480w/);
  assert.match(
    manifest,
    /Federaciones de Asociaciones de Kendo - Evento 2026-01-01/,
  );
  assert.equal(/drive\.google|publicAlbum|private-/.test(manifest), false);
  const firstPath = path.join(
    context.options.imagesRoot,
    "2026-01-01-evento",
    "photo-1-480.webp",
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
  const imagePath = path.join(
    context.options.imagesRoot,
    slug,
    "photo-1-480.webp",
  );
  const first = await run(context.options);
  const fingerprint = first.galleries[slug].fingerprint;
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
