import { readFile, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const MAX_BYTES = 100_000;
const targets = [
  {
    path: "public/images/social/kendo-social-card-20260812.jpg",
    format: "jpeg",
  },
  {
    path: "public/images/events/2026-08-08-examen/photo-2-1600.webp",
    format: "webp",
  },
];

for (const target of targets) {
  const initialSize = (await stat(target.path)).size;
  if (initialSize <= MAX_BYTES) continue;

  const source = sharp(await readFile(target.path));
  const sourceMetadata = await source.metadata();
  let optimized;
  let quality;

  for (quality = 82; quality >= 30; quality -= 2) {
    const output = source.clone();
    const candidate = await output[target.format]({
      quality,
      effort: 6,
      ...(target.format === "jpeg" ? { mozjpeg: true } : {}),
    }).toBuffer();
    if (candidate.length <= MAX_BYTES) {
      optimized = candidate;
      break;
    }
  }

  if (!optimized) {
    throw new Error(`${target.path} cannot be reduced below 100 KiB.`);
  }

  const optimizedMetadata = await sharp(optimized).metadata();
  if (
    optimizedMetadata.width !== sourceMetadata.width ||
    optimizedMetadata.height !== sourceMetadata.height
  ) {
    throw new Error(`${target.path} changed dimensions during optimization.`);
  }

  await writeFile(target.path, optimized);
  console.log(
    `${target.path}: ${initialSize} -> ${optimized.length} bytes (quality ${quality})`,
  );
}
