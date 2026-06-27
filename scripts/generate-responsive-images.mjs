import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WEBP_QUALITY = 72;

const jobs = [
  {
    input: "public/images/gallery/kendo-gallery-08.jpg",
    outputs: [
      "public/images/gallery/thumbs/kendo-gallery-08-480.webp",
      "public/images/gallery/kendo-gallery-08-960.webp",
      "public/images/gallery/kendo-gallery-08-1600.webp",
    ],
  },
  {
    input: "public/images/affiliates/kendo-affiliates.jpg",
    outputs: [
      "public/images/affiliates/kendo-affiliates-768.webp",
      "public/images/affiliates/kendo-affiliates-1200.webp",
    ],
  },
];

function widthFromFilename(file) {
  const match = file.match(/-(\d+)\.webp$/);

  if (!match) {
    throw new Error(`Cannot infer width from ${file}`);
  }

  return Number(match[1]);
}

for (const job of jobs) {
  for (const output of job.outputs) {
    const width = widthFromFilename(output);

    await mkdir(path.dirname(output), { recursive: true });

    const result = await sharp(job.input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(output);

    const { size } = await stat(output);
    console.log(`${output}: ${result.width}x${result.height}, ${size} bytes`);
  }
}
