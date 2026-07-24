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
  ...[
    "kendo-gallery-01",
    "kendo-gallery-02",
    "kendo-gallery-03",
    "kendo-gallery-04",
    "kendo-gallery-05",
    "kendo-gallery-06",
    "kendo-gallery-07",
  ].map(
    (imageName) => ({
      input: `public/images/gallery/${imageName}.jpg`,
      quality: WEBP_QUALITY,
      outputs: [
        {
          file: `public/images/gallery/${imageName}.webp`,
          width: 1600,
        },
      ],
    }),
  ),
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
    aspectRatio: 1600 / 650,
    outputs: [
      "public/images/gallery/kendo-gallery-08-banner-480.webp",
      "public/images/gallery/kendo-gallery-08-banner-960.webp",
      "public/images/gallery/kendo-gallery-08-banner-1600.webp",
    ],
  },
  {
    input: "public/images/gallery/kendo-gallery-08.jpg",
    quality: WEBP_QUALITY,
    outputs: [
      "public/images/gallery/kendo-gallery-08-960.webp",
      "public/images/gallery/kendo-gallery-08-1600.webp",
    ],
  },
  {
    input: "public/images/hero/kendo-hero-formacion.jpg",
    quality: WEBP_QUALITY,
    outputs: [
      "public/images/hero/kendo-hero-formacion-480.webp",
      "public/images/hero/kendo-hero-formacion-960.webp",
      "public/images/hero/kendo-hero-formacion-1500.webp",
    ],
  },
  {
    input: "public/images/calendar/kendo-calendar.jpg",
    quality: WEBP_QUALITY,
    outputs: [
      "public/images/calendar/kendo-calendar-480.webp",
      "public/images/calendar/kendo-calendar-960.webp",
      "public/images/calendar/kendo-calendar-1600.webp",
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
    const outputFile = typeof output === "string" ? output : output.file;
    const width = typeof output === "string" ? widthFromFilename(output) : output.width;
    const extension = path.extname(outputFile);

    await mkdir(path.dirname(outputFile), { recursive: true });

    const image = sharp(job.input).rotate();
    const resized = job.aspectRatio
      ? image.resize({
          width,
          height: Math.round(width / job.aspectRatio),
          fit: "cover",
          position: "center",
        })
      : image.resize({
          width,
          withoutEnlargement: true,
        });

    const result =
      extension === ".avif"
        ? await resized
            .avif({ quality: job.avifQuality ?? WEBP_QUALITY, effort: 7 })
            .toFile(outputFile)
        : await resized
            .webp({ quality: job.quality ?? WEBP_QUALITY, effort: 6 })
            .toFile(outputFile);

    const { size } = await stat(outputFile);
    console.log(`${outputFile}: ${result.width}x${result.height}, ${size} bytes`);
  }
}
