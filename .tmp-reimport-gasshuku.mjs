import fs from "node:fs/promises";
import path from "node:path";
import { synchronizeEventGalleries } from "./scripts/sync-event-galleries.mjs";

const slug = "2026-09-12-gasshuku-monteverde";

const manifestPath = "src/app/data/eventGalleries.ts";
const statePath = "src/app/data/eventGalleryState.json";
const galleryDirectory = `public/images/events/${slug}`;
const backupDirectory = `.tmp-gallery-backup-${slug}`;

const albumUrl =
  "https://drive.google.com/drive/folders/1mcnZgnkLAvz8jzT9QhBqnLWNkwwNG3BR?usp=drive_link";

const originalManifest = await fs.readFile(manifestPath, "utf8");
const originalState = await fs.readFile(statePath, "utf8");

let hadGalleryDirectory = false;

try {
  //
  // Backup físico de la galería actual.
  //
  await fs.rm(backupDirectory, { recursive: true, force: true });

  try {
    await fs.cp(galleryDirectory, backupDirectory, {
      recursive: true,
    });
    hadGalleryDirectory = true;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  //
  // 1. Descongelar SOLO el Gasshuku.
  //
  const state = JSON.parse(originalState);

  if (!state.galleries?.[slug]) {
    throw new Error(`No existe estado congelado para ${slug}.`);
  }

  console.log(`Fingerprint anterior: ${state.galleries[slug].fingerprint}`);

  delete state.galleries[slug];

  if (state.checks) {
    delete state.checks[slug];
  }

  await fs.writeFile(
    statePath,
    `${JSON.stringify(state, null, 2)}\n`,
    "utf8",
  );

  //
  // 2. Quitar SOLO la galería antigua del manifest.
  //
  const marker =
    "export const EVENT_GALLERIES: Record<string, EventGallery> = ";

  const markerIndex = originalManifest.indexOf(marker);

  if (markerIndex < 0) {
    throw new Error("No se encontró EVENT_GALLERIES.");
  }

  const prefix = originalManifest.slice(
    0,
    markerIndex + marker.length,
  );

  let jsonText = originalManifest
    .slice(markerIndex + marker.length)
    .trim();

  if (jsonText.endsWith(";")) {
    jsonText = jsonText.slice(0, -1);
  }

  const galleries = JSON.parse(jsonText);

  const oldImageCount = galleries[slug]?.images?.length ?? 0;

  if (!galleries[slug]) {
    throw new Error(`No existe galería publicada para ${slug}.`);
  }

  console.log(`Imágenes anteriores: ${oldImageCount}`);

  delete galleries[slug];

  await fs.writeFile(
    manifestPath,
    `${prefix}${JSON.stringify(galleries, null, 2)};\n`,
    "utf8",
  );

  //
  // 3. Reimportar TODO el álbum.
  //
  const result = await synchronizeEventGalleries({
    events: [
      {
        slug,
        title: "Gasshuku Monteverde",
        date: "2026-09-12",
        albumUrl,
        galleryCheckPhase: "final",
      },
    ],
  });

  const gallery = result.galleries[slug];
  const imageCount = gallery?.images?.length ?? 0;

  if (result.importedCount !== 1) {
    throw new Error(
      `Se esperaba importedCount=1, recibido=${result.importedCount}.`,
    );
  }

  if (imageCount <= 5) {
    throw new Error(
      `Solo se importaron ${imageCount} imágenes; se esperaban más de 5.`,
    );
  }

  //
  // 4. Verificar archivos físicos.
  //
  const generated = await fs.readdir(galleryDirectory);

  const avifCount = generated.filter((file) =>
    file.endsWith(".avif"),
  ).length;

  const webpCount = generated.filter((file) =>
    file.endsWith(".webp"),
  ).length;

  console.log("");
  console.log("============================================================");
  console.log("GASSHUKU REIMPORT: PASS");
  console.log("============================================================");
  console.log(`Imágenes manifest: ${imageCount}`);
  console.log(`Archivos WebP: ${webpCount}`);
  console.log(`Archivos AVIF: ${avifCount}`);
  console.log(`Archivos derivados totales: ${generated.length}`);
  console.log(`Fingerprint nuevo: ${gallery.fingerprint}`);

  if (result.warnings.length) {
    console.log("");
    console.log("Warnings:");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  } else {
    console.log("Warnings: 0");
  }

  await fs.rm(backupDirectory, {
    recursive: true,
    force: true,
  });
} catch (error) {
  console.error("");
  console.error("============================================================");
  console.error("GASSHUKU REIMPORT: FAILED");
  console.error("Restaurando estado anterior...");
  console.error("============================================================");

  await fs.writeFile(manifestPath, originalManifest, "utf8");
  await fs.writeFile(statePath, originalState, "utf8");

  await fs.rm(galleryDirectory, {
    recursive: true,
    force: true,
  });

  if (hadGalleryDirectory) {
    await fs.mkdir(path.dirname(galleryDirectory), {
      recursive: true,
    });

    await fs.cp(backupDirectory, galleryDirectory, {
      recursive: true,
    });
  }

  await fs.rm(backupDirectory, {
    recursive: true,
    force: true,
  });

  throw error;
}