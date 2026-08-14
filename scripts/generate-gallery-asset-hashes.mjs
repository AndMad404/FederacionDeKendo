import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const galleryAssetPaths = [
  "/images/gallery/kendo-gallery-01.webp",
  "/images/gallery/kendo-gallery-02.webp",
  "/images/gallery/kendo-gallery-03.webp",
  "/images/gallery/kendo-gallery-04.webp",
  "/images/gallery/kendo-gallery-05.webp",
  "/images/gallery/kendo-gallery-06.webp",
  "/images/gallery/kendo-gallery-07.webp",
  "/images/gallery/kendo-gallery-08-1600.webp",
  "/images/gallery/kendo-gallery-08-960.webp",
  ...Array.from({ length: 8 }, (_, index) => {
    const imageNumber = String(index + 1).padStart(2, "0");
    return [160, 320, 480].map(
      (width) =>
        `/images/gallery/thumbs/kendo-gallery-${imageNumber}-${width}.webp`,
    );
  }).flat(),
];

const hashes = Object.fromEntries(
  await Promise.all(
    galleryAssetPaths.map(async (assetPath) => {
      const contents = await readFile(path.join("public", assetPath));
      return [
        assetPath,
        createHash("sha256").update(contents).digest("hex").slice(0, 12),
      ];
    }),
  ),
);

const ogImagePath = "/images/gallery/kendo-gallery-01.jpg";
const ogImageHash = createHash("sha256")
  .update(await readFile(path.join("public", ogImagePath)))
  .digest("hex")
  .slice(0, 12);

await writeFile(
  "src/app/data/gallery-asset-hashes.json",
  `${JSON.stringify(hashes, null, 2)}\n`,
);

const seoDataPath = "src/app/config/seo-data.json";
const seoData = await readFile(seoDataPath, "utf8");
const replaceGalleryPreloadVersions = (content) =>
  content
    .replaceAll(
      /\/images\/gallery\/kendo-gallery-01\.jpg\?v=[a-z0-9-]+/g,
      `${ogImagePath}?v=${ogImageHash}`,
    )
    .replaceAll(
      /\/images\/gallery\/kendo-gallery-01\.webp\?v=[a-z0-9-]+/g,
      `/images/gallery/kendo-gallery-01.webp?v=${hashes["/images/gallery/kendo-gallery-01.webp"]}`,
    )
    .replaceAll(
      /\/images\/gallery\/thumbs\/kendo-gallery-01-480\.webp\?v=[a-z0-9-]+/g,
      `/images/gallery/thumbs/kendo-gallery-01-480.webp?v=${hashes["/images/gallery/thumbs/kendo-gallery-01-480.webp"]}`,
    );
const updatedSeoData = replaceGalleryPreloadVersions(seoData);

await writeFile(seoDataPath, updatedSeoData);

const headersPath = "public/_headers";
await writeFile(
  headersPath,
  replaceGalleryPreloadVersions(await readFile(headersPath, "utf8")),
);
