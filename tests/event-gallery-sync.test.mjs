import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import {
  EVENT_GALLERY_LIMITS,
  extractDriveFiles,
  getDriveFolderId,
  synchronizeEventGalleries,
} from "../scripts/sync-event-galleries.mjs";

async function image(color, width = 640, height = 480, format = "jpeg") {
  const pipeline = sharp({
    create: { width, height, channels: 3, background: color },
  });
  return pipeline[format]().toBuffer();
}

async function fixture(files) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "fak-gallery-"));
  const options = {
    manifestPath: path.join(directory, "eventGalleries.ts"),
    statePath: path.join(directory, "eventGalleryState.json"),
    imagesRoot: path.join(directory, "images"),
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

test("accepts the minimum dimensions independently of orientation", async () => {
  const context = await fixture([
    {
      name: "portrait.jpg",
      id: "portrait",
      buffer: await image("red", 320, 480),
    },
  ]);
  try {
    const result = await run(context.options);
    assert.equal(result.galleries["2026-01-01-evento"].images.length, 1);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("valid public album freezes five naturally ordered sanitized responsive images and warns about the sixth", async () => {
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
  const context = await fixture(files);
  try {
    const result = await run(context.options);
    assert.equal(result.galleries["2026-01-01-evento"].images.length, 5);
    assert.equal(
      result.warnings.some((warning) => warning.includes("additional files")),
      true,
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
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("does not inspect an already published gallery", async () => {
  const context = await fixture([
    { name: "1.jpg", id: "one", buffer: await image("red") },
  ]);
  try {
    await run(context.options);
    const before = await readFile(context.options.manifestPath, "utf8");
    const invalid = await run(context.options, "https://example.test/folder");
    assert.deepEqual(invalid.warnings, []);
    const inaccessible = await run({
      ...context.options,
      listFolder: async () => {
        throw new Error("not public");
      },
    });
    assert.deepEqual(inaccessible.warnings, []);
    assert.equal(await readFile(context.options.manifestPath, "utf8"), before);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("does not validate later Drive contents after a gallery is published", async () => {
  const initial = [{ name: "1.jpg", id: "one", buffer: await image("red") }];
  const context = await fixture(initial);
  try {
    await run(context.options);
    const before = await readFile(context.options.manifestPath, "utf8");
    const cases = [
      [{ name: "fake.jpg", id: "fake", buffer: Buffer.from("not an image") }],
      [
        {
          name: "small.jpg",
          id: "small",
          buffer: await image("red", 320, 240),
        },
      ],
      [
        {
          name: "large.jpg",
          id: "large",
          buffer: Buffer.alloc(EVENT_GALLERY_LIMITS.maxBytes + 1),
        },
      ],
      [
        {
          name: "oversize.jpg",
          id: "oversize",
          buffer: await image("red", 3841, 2160),
        },
      ],
      [
        { name: "ok.jpg", id: "ok", buffer: await image("green") },
        { name: "broken.jpg", id: "broken" },
      ],
    ];
    for (const files of cases) {
      const result = await run({
        ...context.options,
        listFolder: async () => files,
        downloadFile: async (file) => {
          if (!file.buffer) throw new Error("download interrupted");
          return file.buffer;
        },
      });
      assert.deepEqual(result.warnings, []);
      assert.equal(
        await readFile(context.options.manifestPath, "utf8"),
        before,
      );
    }
    const duplicateBuffer = await image("blue");
    const duplicates = await fixture([
      { name: "1.jpg", id: "one", buffer: duplicateBuffer },
      { name: "2.jpg", id: "two", buffer: duplicateBuffer },
    ]);
    try {
      const result = await run(duplicates.options);
      assert.equal(result.galleries["2026-01-01-evento"].images.length, 1);
      assert.equal(
        result.warnings.some((warning) =>
          warning.includes("duplicate ignored"),
        ),
        true,
      );
    } finally {
      await rm(duplicates.directory, { recursive: true, force: true });
    }
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("an existing gallery is preserved without later Drive checks", async () => {
  const files = [{ name: "1.jpg", id: "one", buffer: await image("red") }];
  const context = await fixture(files);
  try {
    const first = await run(context.options);
    const fingerprint = first.galleries["2026-01-01-evento"].fingerprint;
    const manifest = await readFile(context.options.manifestPath, "utf8");
    const absent = await synchronizeEventGalleries({
      ...context.options,
      events: [{ slug: "2026-01-01-evento", title: "Evento" }],
    });
    assert.equal(
      await readFile(context.options.manifestPath, "utf8"),
      manifest,
    );
    assert.deepEqual(absent.alarms, []);
    const changed = await run({
      ...context.options,
      listFolder: async () => [
        { name: "1.jpg", id: "changed", buffer: await image("blue") },
      ],
    });
    assert.equal(
      changed.galleries["2026-01-01-evento"].fingerprint,
      fingerprint,
    );
    assert.deepEqual(changed.warnings, []);
    assert.deepEqual(changed.alarms, []);
    await stat(
      path.join(
        context.options.imagesRoot,
        "2026-01-01-evento",
        "photo-1-480.webp",
      ),
    );
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});

test("reports an unpublished album without inventing a frozen gallery", async () => {
  const context = await fixture([]);
  try {
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
    await assert.rejects(stat(context.options.statePath), /ENOENT/);
  } finally {
    await rm(context.directory, { recursive: true, force: true });
  }
});
