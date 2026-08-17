import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const gallerySource = await readFile("src/app/data/gallery.ts", "utf8");
const assetHashes = JSON.parse(
  await readFile("src/app/data/gallery-asset-hashes.json", "utf8"),
);
const seoData = await readFile("src/app/config/seo-data.json", "utf8");
const headers = await readFile("public/_headers", "utf8");

test("every gallery image has complete English copy", () => {
  const sourceImages = gallerySource
    .split("const ENGLISH_GALLERY_COPY")[0]
    .match(/^ {4}id: (\d+),$/gm)
    .map((match) => Number(match.match(/\d+/)[0]));
  const translatedImages = [...gallerySource.matchAll(/^ {2}(\d+): \{/gm)].map(
    ([, id]) => Number(id),
  );

  assert.deepEqual(translatedImages.sort(), sourceImages.sort());
});

test("gallery asset versions match the current file contents", async () => {
  for (const [assetPath, hash] of Object.entries(assetHashes)) {
    const contents = await readFile(path.join("public", assetPath));
    const expectedHash = createHash("sha256")
      .update(contents)
      .digest("hex")
      .slice(0, 12);

    assert.equal(hash, expectedHash, assetPath);
  }
});

test("gallery SEO image and preload use the current WebP asset", () => {
  const seo = JSON.parse(seoData);
  const galleryImage = `/images/gallery/kendo-gallery-01.webp?v=${assetHashes["/images/gallery/kendo-gallery-01.webp"]}`;

  for (const route of ["/galeria/", "/en/gallery/"]) {
    assert.equal(seo.routes[route].image, galleryImage);
    assert.equal(seo.routes[route].imageType, "image/webp");
    assert.equal(seo.routes[route].preloadImage.href, galleryImage);
  }

  assert.match(
    seoData,
    new RegExp(
      `/images/gallery/kendo-gallery-01\\.webp\\?v=${assetHashes["/images/gallery/kendo-gallery-01.webp"]}`,
    ),
  );
  assert.match(
    seoData,
    new RegExp(
      `/images/gallery/thumbs/kendo-gallery-01-480\\.webp\\?v=${assetHashes["/images/gallery/thumbs/kendo-gallery-01-480.webp"]}`,
    ),
  );
  assert.match(
    headers,
    new RegExp(
      `/images/gallery/kendo-gallery-01\\.webp\\?v=${assetHashes["/images/gallery/kendo-gallery-01.webp"]}`,
    ),
  );
});
