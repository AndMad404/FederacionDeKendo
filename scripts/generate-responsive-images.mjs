import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WEBP_QUALITY = 72;
const THUMBNAIL_WEBP_QUALITY = 68;
const AFFILIATES_WEBP_QUALITY = 62;
const AFFILIATES_AVIF_QUALITY = 40;

const galleryImageNames = [
  "kendo-gallery-01",
  "kendo-gallery-02",
  "kendo-gallery-03",
  "kendo-gallery-04",
  "kendo-gallery-05",
  "kendo-gallery-06",
  "kendo-gallery-07",
  "kendo-gallery-08",
];

const jobs = [
  ...galleryImageNames.map((imageName) => ({
    input: `public/images/gallery/${imageName}.jpg`,
    quality: THUMBNAIL_WEBP_QUALITY,
    outputs: [
      `public/images/gallery/thumbs/${imageName}-160.webp`,
      `public/images/gallery/thumbs/${imageName}-320.webp`,
      `public/images/gallery/thumbs/${imageName}-480.webp`,
    ],
  })),
  {
    input: "public/images/gallery/kendo-gallery-08.jpg",
    quality: WEBP_QUALITY,
    outputs: [
      "public/images/gallery/kendo-gallery-08-960.webp",
      "public/images/gallery/kendo-gallery-08-1600.webp",
    ],
  },
  {
    input: "public/images/affiliates/kendo-affiliates.jpg",
    quality: AFFILIATES_WEBP_QUALITY,
    avifQuality: AFFILIATES_AVIF_QUALITY,
    outputs: [
      "public/images/affiliates/kendo-affiliates-768.avif",
      "public/images/affiliates/kendo-affiliates-1200.avif",
      "public/images/affiliates/kendo-affiliates-768.webp",
      "public/images/affiliates/kendo-affiliates-1200.webp",
    ],
  },
];

function widthFromFilename(file) {
  const match = file.match(/-(\d+)\.(webp|avif)$/);

  if (!match) {
    throw new Error(`Cannot infer width from ${file}`);
  }

  return Number(match[1]);
}

for (const job of jobs) {
  for (const output of job.outputs) {
    const width = widthFromFilename(output);
    const extension = path.extname(output);

    await mkdir(path.dirname(output), { recursive: true });

    const resized = sharp(job.input)
      .rotate()
      .resize({ width, withoutEnlargement: true });

    const result =
      extension === ".avif"
        ? await resized
            .avif({ quality: job.avifQuality ?? WEBP_QUALITY, effort: 7 })
            .toFile(output)
        : await resized
            .webp({ quality: job.quality ?? WEBP_QUALITY, effort: 6 })
            .toFile(output);

    const { size } = await stat(output);
    console.log(`${output}: ${result.width}x${result.height}, ${size} bytes`);
  }
}
