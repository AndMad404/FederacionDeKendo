import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "local", "image-originals");
const MANIFEST_PATH = path.join(ROOT, "local", "gallery-manifest.ts");
const GALLERY_DATA_PATH = path.join(ROOT, "src", "app", "data", "gallery.ts");
const OUTPUT_DIR = path.join(ROOT, "public", "images", "gallery");
const THUMB_DIR = path.join(OUTPUT_DIR, "thumbs");
const HERO_DIR = path.join(ROOT, "public", "images", "hero");
const AFFILIATES_DIR = path.join(ROOT, "public", "images", "affiliates");

const MAIN_LONG_EDGE = 1600;
const THUMB_LONG_EDGE = 480;
const BANNER_WIDTH = 1920;
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 82;
const SUPPORTED_EXTENSIONS = new Set([
  ".avif",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".webp",
]);

const ROUTES = new Map([
  ["afiliados banner", { kind: "banner", outputDir: AFFILIATES_DIR, outputName: "kendo-affiliates" }],
  ["hero banner", { kind: "banner", outputDir: HERO_DIR, outputName: "kendo-hero" }],
  ["kendo gallery 1", { kind: "gallery", outputName: "kendo-gallery-01" }],
  ["kendo gallery 2", { kind: "gallery", outputName: "kendo-gallery-02" }],
  ["kendo gallery 3", { kind: "gallery", outputName: "kendo-gallery-03" }],
  ["kendo gallery 4", { kind: "gallery", outputName: "kendo-gallery-04" }],
  ["kendo gallery 5", { kind: "gallery", outputName: "kendo-gallery-05" }],
  ["kendo gallery 6", { kind: "gallery", outputName: "kendo-gallery-06" }],
  ["kendo gallery 7", { kind: "gallery", outputName: "kendo-gallery-07" }],
  ["kendo gallery 8", { kind: "gallery", outputName: "kendo-gallery-08" }],
]);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileHash(filePath) {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function routeKey(value) {
  return slugify(value).replace(/-/g, " ");
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resizeByLongEdge(image, width, height, longEdge) {
  if (!width || !height) {
    return image.resize({ width: longEdge, height: longEdge, fit: "inside", withoutEnlargement: true });
  }

  return width >= height
    ? image.resize({ width: longEdge, withoutEnlargement: true })
    : image.resize({ height: longEdge, withoutEnlargement: true });
}

async function writeSharpFile(image, outputPath) {
  const tempPath = `${outputPath}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;

  try {
    await image.toFile(tempPath);

    if (await pathExists(outputPath)) {
      const [tempHash, outputHash] = await Promise.all([
        fileHash(tempPath),
        fileHash(outputPath),
      ]);

      if (tempHash === outputHash) {
        await fs.rm(tempPath, { force: true });
        return;
      }
    }

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        await fs.rm(outputPath, { force: true });
        await fs.rename(tempPath, outputPath);
        return;
      } catch (error) {
        if (!["EBUSY", "EPERM"].includes(error.code) || attempt === 10) {
          throw error;
        }

        await sleep(250);
      }
    }
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    if (["EBUSY", "EPERM"].includes(error.code)) {
      throw new Error(
        `Could not replace ${path.relative(ROOT, outputPath)} because Windows reports it is busy. Close browser tabs, image previews, or dev servers using that file and run the script again.`,
      );
    }

    throw error;
  }
}

async function readExistingGallery() {
  if (!(await pathExists(GALLERY_DATA_PATH))) {
    return { byFile: new Map(), order: [], maxId: 0 };
  }

  const source = await fs.readFile(GALLERY_DATA_PATH, "utf8");
  const blocks = source.match(/\{\s*id:[\s\S]*?\n\s*\}/g) ?? [];
  const byFile = new Map();
  const order = [];
  let maxId = 0;

  for (const block of blocks) {
    const id = Number(block.match(/id:\s*(\d+)/)?.[1] ?? 0);
    const src = block.match(/src:\s*"\/images\/gallery\/([^"]+)"/)?.[1];
    const title = block.match(/title:\s*"([^"]*)"/)?.[1];
    const tag = block.match(/tag:\s*"([^"]*)"/)?.[1];
    const likes = Number(block.match(/likes:\s*(\d+)/)?.[1] ?? 0);
    const objectPosition = block.match(/objectPosition:\s*"([^"]*)"/)?.[1];
    const date = block.match(/date:\s*"([^"]*)"/)?.[1];

    if (id > maxId) maxId = id;
    if (src) {
      byFile.set(src, { id, title, tag, likes, objectPosition, date });
      order.push(src);
    }
  }

  return { byFile, order, maxId };
}

async function getInputFiles() {
  await fs.mkdir(INPUT_DIR, { recursive: true });
  const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function getImageRoute(inputFile) {
  const key = routeKey(path.basename(inputFile, path.extname(inputFile)));
  return ROUTES.get(key);
}

function createGalleryEntry({ fileName, mainMeta, thumbMeta, existing, id }) {
  const title = existing?.title ?? titleFromSlug(path.basename(fileName, ".webp"));
  const tag = existing?.tag ?? "TODO";
  const likes = existing?.likes ?? 0;
  const objectPosition = existing?.objectPosition;

  const lines = [
    "  {",
    `    id: ${existing?.id ?? id},`,
    `    src: "/images/gallery/${fileName}",`,
    `    srcSet: "/images/gallery/thumbs/${path.basename(fileName, ".webp")}-${THUMB_LONG_EDGE}.webp ${THUMB_LONG_EDGE}w, /images/gallery/${fileName} ${mainMeta.width}w",`,
    '    sizes: "100vw",',
    `    width: ${mainMeta.width},`,
    `    height: ${mainMeta.height},`,
    `    thumbnailSrc: "/images/gallery/thumbs/${path.basename(fileName, ".webp")}-${THUMB_LONG_EDGE}.webp",`,
    `    thumbnailWidth: ${thumbMeta.width},`,
    `    thumbnailHeight: ${thumbMeta.height},`,
  ];

  if (objectPosition) {
    lines.push(`    objectPosition: "${objectPosition}",`);
  }

  lines.push(
    `    title: "${title}",`,
    `    tag: "${tag}",`,
    `    likes: ${likes},`,
  );

  if (existing?.date) {
    lines.push(`    date: "${existing.date}",`);
  }

  lines.push("  },");

  return lines.join("\n");
}

async function writeGalleryData(entriesByFile, existingOrder) {
  const usedFiles = new Set();
  const orderedEntries = [];

  for (const fileName of existingOrder) {
    const entry = entriesByFile.get(fileName);
    if (entry) {
      orderedEntries.push(entry);
      usedFiles.add(fileName);
    }
  }

  for (const [fileName, entry] of entriesByFile) {
    if (!usedFiles.has(fileName)) {
      orderedEntries.push(entry);
    }
  }

  if (orderedEntries.length === 0) return;

  const source = [
    'import type { GalleryImage } from "../types";',
    "",
    "export const GALLERY_IMAGES: GalleryImage[] = [",
    orderedEntries.join("\n"),
    "];",
    "",
  ].join("\n");

  await fs.writeFile(GALLERY_DATA_PATH, source, "utf8");
  console.log(`Updated ${path.relative(ROOT, GALLERY_DATA_PATH)}`);
}

async function main() {
  const inputFiles = await getInputFiles();
  if (inputFiles.length === 0) {
    console.log(`No source images found in ${path.relative(ROOT, INPUT_DIR)}.`);
    console.log("Add .jpg, .png, .webp, .avif, .tif, or .tiff files and run the script again.");
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
  await fs.mkdir(HERO_DIR, { recursive: true });
  await fs.mkdir(AFFILIATES_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });

  const { byFile, order, maxId } = await readExistingGallery();
  let nextId = maxId + 1;
  const entries = [];
  const entriesByFile = new Map();

  for (const inputFile of inputFiles) {
    const inputPath = path.join(INPUT_DIR, inputFile);
    const route = getImageRoute(inputFile);

    if (!route) {
      console.log(`Skipped ${inputFile}: filename does not match an official image name.`);
      continue;
    }

    if (route.kind === "banner") {
      const webpPath = path.join(route.outputDir, `${route.outputName}.webp`);
      const jpgPath = path.join(route.outputDir, `${route.outputName}.jpg`);

      const webpImage = sharp(inputPath)
        .resize({ width: BANNER_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY });
      await writeSharpFile(webpImage, webpPath);

      const jpgImage = sharp(inputPath)
        .resize({ width: BANNER_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
      await writeSharpFile(jpgImage, jpgPath);

      console.log(`Processed ${inputFile} -> ${path.relative(ROOT, webpPath)}`);
      console.log(`Processed ${inputFile} -> ${path.relative(ROOT, jpgPath)}`);
      continue;
    }

    const outputFile = `${route.outputName}.webp`;
    const thumbFile = `${route.outputName}-${THUMB_LONG_EDGE}.webp`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);
    const thumbPath = path.join(THUMB_DIR, thumbFile);

    const metadata = await sharp(inputPath).metadata();
    const mainImage = resizeByLongEdge(sharp(inputPath), metadata.width, metadata.height, MAIN_LONG_EDGE);
    const thumbImage = resizeByLongEdge(sharp(inputPath), metadata.width, metadata.height, THUMB_LONG_EDGE);

    await writeSharpFile(mainImage.webp({ quality: WEBP_QUALITY }), outputPath);
    await writeSharpFile(thumbImage.webp({ quality: WEBP_QUALITY }), thumbPath);

    const mainMeta = await sharp(outputPath).metadata();
    const thumbMeta = await sharp(thumbPath).metadata();
    const existing = byFile.get(outputFile);
    const id = existing?.id ?? nextId++;

    const entry = createGalleryEntry({ fileName: outputFile, mainMeta, thumbMeta, existing, id });
    entries.push(entry);
    entriesByFile.set(outputFile, entry);

    console.log(`Processed ${inputFile} -> ${path.relative(ROOT, outputPath)}`);
    console.log(`Processed ${inputFile} -> ${path.relative(ROOT, thumbPath)}`);
  }

  const manifest = [
    "// Generated by pnpm images:gallery.",
    "// This file is local-only and ignored by git.",
    "// src/app/data/gallery.ts is updated automatically.",
    "",
    "export const GENERATED_GALLERY_IMAGES = [",
    entries.join("\n"),
    "];",
    "",
  ].join("\n");

  await fs.writeFile(MANIFEST_PATH, manifest, "utf8");
  console.log(`Wrote ${path.relative(ROOT, MANIFEST_PATH)}`);
  await writeGalleryData(entriesByFile, order);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
