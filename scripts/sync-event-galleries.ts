import type {
  CalendarError,
  Publication,
  DriveFile,
  GalleryState,
  GalleryOptions,
  GalleryResult,
} from "./calendar-sync-types.ts";

import { DriveQuotaError, MAX_DRIVE_IMAGE_BYTES } from "./calendar-drive.ts";
import type { EventGallery } from "../src/app/data/eventGalleries";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRIVE_FOLDER =
  /^https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)(?:[/?#].*)?$/;
const INPUT_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);
const MAX_BYTES = MAX_DRIVE_IMAGE_BYTES;
const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;
const MAX_LONG_EDGE = 3840;
const MAX_PIXELS = 3840 * 2160;
const WIDTHS = [480, 960, 1600];
const SIZES = "(max-width: 640px) 100vw, 960px";
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export const EVENT_GALLERY_LIMITS = Object.freeze({
  maxBytes: MAX_BYTES,
  minWidth: MIN_WIDTH,
  minHeight: MIN_HEIGHT,
  maxLongEdge: MAX_LONG_EDGE,
  maxPixels: MAX_PIXELS,
  inputFormats: [...INPUT_FORMATS],
  outputFormats: ["webp"],
});

export function getDriveFolderId(albumUrl: string | undefined) {
  return DRIVE_FOLDER.exec(albumUrl ?? "")?.[1];
}

function digest(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

async function readJson(filePath: string, fallback: GalleryState) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (caught) {
    const error = caught as CalendarError;

    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

export function extractDriveFiles(html: string): DriveFile[] {
  const match = /window\['_DRIVE_ivd'\]\s*=\s*'((?:\\.|[^'])+)'/.exec(html);
  if (!match) throw new Error("Google Drive folder is not publicly readable.");
  const serialized = match[1]
    .replace(/\\x([\dA-Fa-f]{2})/g, "\\u00$1")
    .replace(/"/g, '\\"');
  const decoded = JSON.parse(`"${serialized}"`);
  const rows = JSON.parse(decoded);
  const files: DriveFile[] = [];
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (
      typeof value[0] === "string" &&
      typeof value[2] === "string" &&
      value[3]?.startsWith?.("image/")
    ) {
      files.push({ id: value[0], name: value[2] });
      return;
    }
    for (const child of value) visit(child);
  };
  visit(rows);
  return files;
}

async function listPublicDriveFolder(
  albumUrl: string,
  fetchImpl: typeof fetch = fetch,
) {
  const folderId = getDriveFolderId(albumUrl);
  if (!folderId)
    throw new Error("Only Google Drive public folder URLs are accepted.");
  const response = await fetchImpl(
    `https://drive.google.com/drive/folders/${folderId}`,
  );
  if (!response.ok)
    throw new Error("Google Drive folder is not publicly readable.");
  return extractDriveFiles(await response.text());
}

export async function downloadDriveFile(
  file: DriveFile,
  fetchImpl: typeof fetch = fetch,
  authenticated = false,
) {
  const response = await fetchImpl(
    authenticated
      ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`
      : `https://drive.usercontent.google.com/download?id=${encodeURIComponent(file.id)}&export=download&confirm=t`,
  );
  if (!response.ok) throw new Error(`Download failed for ${file.name}.`);
  const oversized = () => new Error(`${file.name}: file exceeds 20 MB.`);
  const length = Number(response.headers.get("content-length"));
  if (length > MAX_BYTES) {
    await response.body?.cancel();
    throw oversized();
  }
  if (!response.body) throw new Error(`Download failed for ${file.name}.`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) throw oversized();
      chunks.push(value);
    }
    return Buffer.concat(chunks, total);
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

async function inspectImage(buffer: Buffer, name: string) {
  if (buffer.length > MAX_BYTES)
    throw new Error(`${name}: file exceeds 20 MB.`);
  let metadata;
  try {
    metadata = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_PIXELS,
    }).metadata();
  } catch {
    throw new Error(`${name}: invalid image content or dimensions.`);
  }
  if (!INPUT_FORMATS.has(metadata.format))
    throw new Error(`${name}: unsupported real MIME.`);
  const rotated = [5, 6, 7, 8].includes(metadata.orientation ?? 0);
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  if (
    !width ||
    !height ||
    Math.max(width, height) < MIN_WIDTH ||
    Math.min(width, height) < MIN_HEIGHT
  ) {
    throw new Error(`${name}: image is smaller than 480 x 320.`);
  }
  if (Math.max(width, height) > MAX_LONG_EDGE || width * height > MAX_PIXELS) {
    throw new Error(`${name}: image exceeds orientation-independent 4K.`);
  }
  const pixels = await sharp(buffer).rotate().removeAlpha().raw().toBuffer();
  return { width, height, pixelHash: digest(pixels) };
}

async function createVariants(
  buffer: Buffer,
  eventDirectory: string,
  baseName: string,
  width: number,
) {
  const formats = [];
  for (const format of ["webp"]) {
    const fileName = `${baseName}-${width}.${format}`;
    const outputPath = path.join(eventDirectory, fileName);
    let pipeline = sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true });
    pipeline = pipeline.webp({ quality: 55, effort: 6 });
    const info = await pipeline.toFile(outputPath);
    formats.push({ format, fileName, width: info.width, height: info.height });
  }
  return formats;
}

export function serializeManifest(galleries: Record<string, EventGallery>) {
  return (
    `// Auto-generated by the event gallery pipeline. Do not edit manually.\n` +
    `interface EventGalleryImage {\n  order: number;\n  kind?: "flyer";\n  originalName?: string;\n  alt: string;\n  width: number;\n  height: number;\n  src: string;\n  srcSet: { webp: string };\n  sizes: string;\n}\n\n` +
    `export interface EventGallery { fingerprint: string; driveOrdered?: boolean; images: EventGalleryImage[]; thumbnail?: EventGalleryImage; posterSource?: { label: string; url: string } }\n\n` +
    `export const EVENT_GALLERIES: Record<string, EventGallery> = ${JSON.stringify(galleries, null, 2)};\n`
  );
}

export async function replaceTransaction(entries: Publication[]) {
  const backups = [];
  const published = [];
  try {
    for (const { target, staged } of entries) {
      const backup = `${target}.${process.pid}.backup`;
      try {
        await rename(target, backup);
        backups.push({ target, backup });
      } catch (caught) {
        const error = caught as CalendarError;

        if (error?.code !== "ENOENT") throw error;
      }
      await rename(staged, target);
      published.push(target);
    }
    await Promise.all(
      backups.map(({ backup }) => rm(backup, { recursive: true, force: true })),
    );
  } catch (caught) {
    const error = caught as CalendarError;

    await Promise.all(
      entries.map(({ staged }) => rm(staged, { recursive: true, force: true })),
    );
    await Promise.all(
      published.map((target) => rm(target, { recursive: true, force: true })),
    );
    await Promise.all(
      backups.map(({ target, backup }) => rename(backup, target)),
    );
    throw error;
  }
}

export async function synchronizeEventGalleries({
  events,
  manifestPath = path.join(ROOT, "src/app/data/eventGalleries.ts"),
  statePath = path.join(ROOT, "src/app/data/eventGalleryState.json"),
  imagesRoot = path.join(ROOT, "public/images/events"),
  listFolder = listPublicDriveFolder,
  downloadFile = downloadDriveFile,
  deferPublish = false,
}: GalleryOptions = {}): Promise<GalleryResult> {
  const warnings = [];
  const alarms = [];
  const previousState = await readJson(statePath, {
    version: 2,
    galleries: {},
    checks: {},
  });
  let previousGalleries: Record<string, EventGallery> = {};
  try {
    const source = await readFile(manifestPath, "utf8");
    const json = /EVENT_GALLERIES[^=]*=\s*(\{[\s\S]*\});\s*$/.exec(source)?.[1];
    if (json) previousGalleries = JSON.parse(json);
  } catch (caught) {
    const error = caught as CalendarError;

    if (error?.code !== "ENOENT") throw error;
  }
  const nextState = structuredClone(previousState);
  nextState.version = 2;
  nextState.galleries ??= {};
  nextState.checks ??= {};
  const nextGalleries = structuredClone(previousGalleries);
  let hasGalleryChange = false;
  let hasStateChange = false;
  let importedCount = 0;
  const stage = `${imagesRoot}.${process.pid}.stage`;
  const stateStage = `${statePath}.${process.pid}.stage`;
  const manifestStage = `${manifestPath}.${process.pid}.stage`;
  let inputStage: string | undefined;
  let handedOff = false;
  try {
    await rm(stage, { recursive: true, force: true });
    await mkdir(path.dirname(stage), { recursive: true });
    inputStage = await mkdtemp(
      path.join(path.dirname(stage), ".gallery-inputs-"),
    );
    try {
      await cp(imagesRoot, stage, { recursive: true });
    } catch (caught) {
      const error = caught as CalendarError;

      if (error?.code === "ENOENT") await mkdir(stage, { recursive: true });
      else throw error;
    }

    for (const event of events ?? []) {
      const lookupSlug = previousGalleries[event.slug]
        ? event.slug
        : (event.drive?.previousSlug ?? event.slug);
      const stateFrozen = previousState.galleries?.[lookupSlug];
      const manifestFrozen = previousGalleries[lookupSlug];
      const drive = event.drive;
      if (
        stateFrozen &&
        manifestFrozen &&
        stateFrozen.fingerprint !== manifestFrozen.fingerprint
      ) {
        warnings.push(
          `${event.slug}: gallery state is inconsistent; published gallery preserved.`,
        );
        alarms.push({
          slug: event.slug,
          status: "galeria_congelada_cambio_detectado",
          reason: "estado_incompatible",
        });
        continue;
      }
      const frozen = stateFrozen ?? manifestFrozen;
      if (frozen && !drive) continue;
      const galleryCheckPhase = event.galleryCheckPhase ?? "final";
      const previousCheckPhase = previousState.checks?.[event.slug]?.phase;
      const phaseRank: Record<string, number> = { first: 1, final: 2 };
      if (
        (phaseRank[previousCheckPhase ?? ""] ?? 0) >=
          (phaseRank[galleryCheckPhase] ?? 0) &&
        !event.albumUrl &&
        !event.localFiles?.length
      ) {
        continue;
      }
      if (!drive && previousCheckPhase !== galleryCheckPhase) {
        nextState.checks[event.slug] = { phase: galleryCheckPhase };
        hasStateChange = true;
      }
      if (!event.albumUrl && !event.localFiles?.length) {
        alarms.push({
          slug: event.slug,
          status: frozen
            ? "galeria_congelada_cambio_detectado"
            : "album_aun_no_publicado",
          reason: frozen ? "album_retirado" : "album_ausente",
        });
        continue;
      }
      if (!event.localFiles?.length && !getDriveFolderId(event.albumUrl)) {
        warnings.push(`${event.slug}: invalid Google Drive folder URL.`);
        alarms.push({
          slug: event.slug,
          status: frozen
            ? "galeria_congelada_cambio_detectado"
            : "album_aun_no_publicado",
          reason: "album_invalido",
        });
        continue;
      }
      try {
        if (event.posterSource) {
          const original = new URL(event.posterSource.url);
          if (original.protocol !== "https:") {
            throw new Error("Invalid poster source.");
          }
        }
        const files = event.localFiles?.length
          ? event.localFiles.map((file) => ({
              id: file.path,
              name: file.name,
            }))
          : await listFolder(event.albumUrl!);
        if (!drive) files.sort((a, b) => collator.compare(a.name, b.name));
        const recordedFlyerKey = stateFrozen?.flyerKey;
        const retainedFlyer =
          manifestFrozen?.images.find((image) => image.kind === "flyer") ??
          (manifestFrozen?.posterSource ? manifestFrozen.images[0] : undefined);
        const flyerKey =
          recordedFlyerKey ??
          (!drive?.past && !retainedFlyer && files[0]
            ? digest(files[0].id)
            : undefined);
        if (drive && files.length === 0) {
          if (stateFrozen?.hadDriveImages)
            alarms.push({
              slug: event.slug,
              status: "galeria_conservada",
              reason: "carpeta_vacia",
              folderName: drive.folderName,
            });
          continue;
        }
        const valid = [];
        let invalidFile = false;
        const seen = new Set();
        for (const file of files) {
          const flyer = Boolean(drive && flyerKey === digest(file.id));
          if (drive && ((!drive.past && !flyer) || (flyer && retainedFlyer)))
            continue;
          let buffer: Buffer;
          try {
            buffer = event.localFiles?.length
              ? await readFile(file.id)
              : await downloadFile(file);
          } catch (error) {
            if (drive || error instanceof DriveQuotaError) throw error;
            invalidFile = true;
            warnings.push(`${event.slug}: ${(error as Error).message}`);
            continue;
          }
          try {
            const inspected = await inspectImage(buffer, file.name);
            if (seen.has(inspected.pixelHash)) {
              warnings.push(`${event.slug}: duplicate ignored.`);
              continue;
            }
            seen.add(inspected.pixelHash);
            const inputPath = path.join(inputStage, String(valid.length));
            await writeFile(inputPath, buffer);
            valid.push({ file, inputPath, flyer, ...inspected });
          } catch (caught) {
            const error = caught as CalendarError;

            invalidFile = true;
            warnings.push(`${event.slug}: ${error.message}`);
          }
        }
        if (
          (!drive &&
            (valid.length === 0 || (invalidFile && valid.length < 5))) ||
          (drive &&
            ((invalidFile && Boolean(manifestFrozen?.driveOrdered)) ||
              (valid.length === 0 && (invalidFile || !retainedFlyer))))
        ) {
          warnings.push(
            `${event.slug}: partial or invalid import; previous gallery preserved.`,
          );
          alarms.push({
            slug: event.slug,
            status: frozen
              ? "galeria_congelada_cambio_detectado"
              : "album_aun_no_publicado",
            reason: "importacion_invalida",
            ...(drive ? { folderName: drive.folderName } : {}),
          });
          continue;
        }
        const selected = drive
          ? [
              ...valid.filter((item) => !item.flyer),
              ...valid.filter((item) => item.flyer),
            ]
          : valid;
        const fingerprint = digest(
          selected
            .filter((item) => !item.flyer)
            .map((item) => `${item.file.name}:${item.pixelHash}`)
            .concat(
              drive
                ? [
                    flyerKey ?? retainedFlyer?.src ?? "",
                    event.title,
                    event.date,
                    event.slug,
                  ]
                : [],
            )
            .join("\n"),
        );
        if (
          drive &&
          manifestFrozen?.fingerprint === fingerprint &&
          lookupSlug === event.slug
        )
          continue;
        if (frozen && !drive) {
          if (!stateFrozen) {
            nextState.galleries[event.slug] = {
              fingerprint: frozen.fingerprint,
            };
            hasGalleryChange = true;
            hasStateChange = true;
          }
          if (frozen.fingerprint !== fingerprint) {
            warnings.push(
              `${event.slug}: Drive changed; frozen gallery preserved.`,
            );
            alarms.push({
              slug: event.slug,
              status: "galeria_congelada_cambio_detectado",
              reason: "album_modificado",
            });
          }
          continue;
        }
        const eventDirectory = path.join(stage, event.slug);
        const renderDirectory = await mkdtemp(path.join(inputStage, "render-"));
        const images = [];
        for (const [index, item] of selected.entries()) {
          const buffer = await readFile(item.inputPath);
          const baseName = drive
            ? `drive-${fingerprint.slice(0, 12)}-${index + 1}`
            : `photo-${index + 1}`;
          const widths = WIDTHS.filter((width) => width <= item.width);
          if (!widths.includes(item.width) && item.width < WIDTHS.at(-1)!)
            widths.push(item.width);
          const variants = [];
          for (const width of widths)
            variants.push(
              ...(await createVariants(
                buffer,
                renderDirectory,
                baseName,
                width,
              )),
            );
          const byFormat = Object.groupBy(
            variants,
            (variant) => variant.format,
          );
          const largest = variants.toSorted((a, b) => b.width - a.width)[0];
          const publicBase = `/images/events/${event.slug}/`;
          images.push({
            order: index + 1,
            ...(item.flyer
              ? { kind: "flyer" as const, originalName: item.file.name }
              : {}),
            alt: event.posterSource
              ? event.posterSource.label
              : `Federaciones de Asociaciones de Kendo - ${event.title} ${event.date}`,
            width: largest.width,
            height: largest.height,
            src: `${publicBase}${baseName}-${largest.width}.webp`,
            srcSet: Object.fromEntries(
              Object.entries(byFormat).map(([format, values]) => [
                format,
                values!
                  .map(
                    (value) => `${publicBase}${value.fileName} ${value.width}w`,
                  )
                  .join(", "),
              ]),
            ) as { webp: string },
            sizes: SIZES,
          });
        }
        if (drive && retainedFlyer) {
          images.push({
            ...retainedFlyer,
            kind: "flyer" as const,
            order: images.length + 1,
          });
        }
        if (drive) {
          await mkdir(eventDirectory, { recursive: true });
          await cp(eventDirectory, renderDirectory, {
            recursive: true,
            force: false,
          });
          const previousAssets = await readdir(renderDirectory);
          await Promise.all(
            previousAssets
              .filter(
                (name) =>
                  /^drive-[a-f0-9]{12}-\d+-\d+\.webp$/.test(name) &&
                  !name.startsWith(`drive-${fingerprint.slice(0, 12)}-`) &&
                  !retainedFlyer?.srcSet.webp.includes(
                    `/images/events/${event.slug}/${name} `,
                  ),
              )
              .map((name) => rm(path.join(renderDirectory, name))),
          );
        }
        await replaceTransaction([
          { target: eventDirectory, staged: renderDirectory },
        ]);
        const posterSource =
          event.posterSource ??
          (retainedFlyer ? manifestFrozen?.posterSource : undefined);
        nextGalleries[event.slug] = {
          fingerprint,
          images,
          ...(drive ? { driveOrdered: true } : {}),
          ...(drive &&
          images.length === 1 &&
          retainedFlyer &&
          manifestFrozen?.thumbnail
            ? { thumbnail: manifestFrozen.thumbnail }
            : {}),
          ...(posterSource ? { posterSource } : {}),
        };
        nextState.galleries[event.slug] = {
          fingerprint,
          ...(drive ? { flyerKey, hadDriveImages: true } : {}),
        };
        hasGalleryChange = true;
        hasStateChange = true;
        importedCount += 1;
      } catch (error) {
        if (error instanceof DriveQuotaError) throw error;
        warnings.push(
          `${event.slug}: gallery access or download failed; previous gallery preserved.`,
        );
        alarms.push({
          slug: event.slug,
          status: frozen
            ? "galeria_congelada_cambio_detectado"
            : "album_aun_no_publicado",
          reason: drive
            ? (error as Error).message
            : "acceso_o_descarga_fallida",
          ...(drive ? { folderName: drive.folderName } : {}),
        });
      }
    }

    if (!hasGalleryChange && !hasStateChange) {
      await rm(stage, { recursive: true, force: true });
      return {
        galleries: nextGalleries,
        state: nextState,
        warnings,
        alarms,
        importedCount,
      };
    }

    await mkdir(path.dirname(stateStage), { recursive: true });
    await writeFile(stateStage, `${JSON.stringify(nextState, null, 2)}\n`);
    const publication = [{ target: statePath, staged: stateStage }];
    if (hasGalleryChange) {
      await mkdir(path.dirname(manifestStage), { recursive: true });
      await writeFile(manifestStage, serializeManifest(nextGalleries));
      publication.unshift(
        { target: imagesRoot, staged: stage },
        { target: manifestPath, staged: manifestStage },
      );
    } else {
      await rm(stage, { recursive: true, force: true });
    }
    await rm(inputStage, { recursive: true, force: true });
    inputStage = undefined;
    if (!deferPublish) await replaceTransaction(publication);
    handedOff = deferPublish;
    return {
      galleries: nextGalleries,
      state: nextState,
      warnings,
      alarms,
      publication,
      importedCount,
    };
  } finally {
    await Promise.all(
      [
        ...(inputStage ? [inputStage] : []),
        ...(!handedOff ? [stage, stateStage, manifestStage] : []),
      ].map((staged) => rm(staged, { recursive: true, force: true })),
    );
  }
}
