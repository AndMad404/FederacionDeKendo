import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CALENDAR_EVENTS } from "../src/app/data/calendarEvents";
import { EVENT_GALLERIES } from "../src/app/data/eventGalleries";
import {
  adaptCoverEvent,
  assertCoverGenerationReady,
  type CoverEvent,
} from "./event-cover-model";
import coverApproval from "../src/app/config/eventCoverApproval.json";
import { extractCoverSvgLayers, styleCoverBackground } from "./event-cover-svg";

const root = fileURLToPath(new URL("../", import.meta.url));
const templateDir = path.join(root, "templates/event-covers/v1");
type Format = "calendar" | "archive";
type Layout = {
  source?: string;
  width: number;
  height: number;
  variants: number[];
  logo: number[];
  logoInset?: number;
  flagCircle?: number[];
  figure: number[];
};
type ImageVariant = {
  src: string;
  width: number;
  height: number;
  srcSet: { webp: string };
};
type Manifest = {
  templateVersion: string;
  events: Record<
    string,
    { fingerprint: string } & Partial<Record<Format, ImageVariant>>
  >;
};
const sha = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

async function writeChanged(file: string, contents: Buffer | string) {
  const previous = await readFile(file).catch(() => null);
  if (previous?.equals(Buffer.from(contents))) return;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, contents);
}

export async function generateEventCovers({
  samples = false,
  reviewCalendarEventId,
}: { samples?: boolean; reviewCalendarEventId?: string } = {}) {
  if (samples && reviewCalendarEventId)
    throw new Error(
      "Choose single calendar review or bulk samples, never both",
    );
  const reviewEvent = reviewCalendarEventId
    ? CALENDAR_EVENTS.find((event) => event.id === reviewCalendarEventId)
    : undefined;
  if (
    reviewCalendarEventId &&
    (!reviewEvent ||
      EVENT_GALLERIES[reviewCalendarEventId]?.thumbnail ||
      EVENT_GALLERIES[reviewCalendarEventId]?.images[0])
  )
    throw new Error(
      "Single calendar review requires a real event without existing artwork",
    );
  // This guard must precede Sharp loading, output writes and sample generation.
  if (!reviewEvent) assertCoverGenerationReady(coverApproval);
  const { default: sharp } = await import("sharp");
  const templateBytes = await readFile(path.join(templateDir, "template.json"));
  const template = JSON.parse(templateBytes.toString()) as {
    version: string;
    logo: string;
    source: string;
    flagOpacity: number;
    colors: { paper: string };
    formats: Record<Format, Layout>;
  };
  const logo = await readFile(path.resolve(templateDir, template.logo));
  const source = await readFile(path.resolve(templateDir, template.source));
  const formatSources = new Map<Format, Buffer>();
  for (const format of ["calendar", "archive"] as Format[]) {
    const file = template.formats[format].source;
    formatSources.set(
      format,
      file ? await readFile(path.resolve(templateDir, file)) : source,
    );
  }
  const templateHash = sha(
    Buffer.concat([
      templateBytes,
      logo,
      source,
      ...formatSources.values(),
      await readFile(fileURLToPath(import.meta.url)),
      await readFile(new URL("./event-cover-model.ts", import.meta.url)),
      await readFile(new URL("./event-cover-svg.ts", import.meta.url)),
    ]),
  );
  const outputRoot = path.join(
    root,
    reviewEvent
      ? ".cache/event-cover-review"
      : samples
        ? ".cache/event-cover-samples"
        : "public/images/event-covers",
  );
  const manifestPath = path.join(root, "src/app/data/eventCovers.json");
  await mkdir(outputRoot, { recursive: true });
  const previous: Manifest | null =
    samples || reviewEvent
      ? null
      : await readFile(manifestPath, "utf8")
          .then(JSON.parse)
          .catch(() => null);
  const manifest: Manifest = { templateVersion: template.version, events: {} };
  const events: CoverEvent[] = reviewEvent
    ? [adaptCoverEvent(reviewEvent)]
    : samples
      ? [adaptCoverEvent({ id: "muestra" })]
      : CALENDAR_EVENTS.filter(
          (event) =>
            !(
              EVENT_GALLERIES[event.id]?.thumbnail ??
              EVENT_GALLERIES[event.id]?.images[0]
            ),
        ).map(adaptCoverEvent);
  if (new Set(events.map((event) => event.id)).size !== events.length)
    throw new Error("Duplicate cover event id");
  const rendered = new Map<string, Manifest["events"][string]>();
  for (const event of events) {
    const fingerprint = sha(
      JSON.stringify({
        templateHash,
        approval: coverApproval.formats,
        sharp: sharp.versions,
      }),
    );
    const shared = rendered.get(fingerprint);
    if (shared && !samples && !reviewEvent) {
      manifest.events[event.id] = shared;
      continue;
    }
    const cached = previous?.events[event.id];
    if (cached?.fingerprint === fingerprint) {
      const files = Object.values({
        calendar: cached.calendar,
        archive: cached.archive,
      })
        .filter((image): image is ImageVariant => Boolean(image))
        .flatMap((image) =>
          Object.values(image.srcSet).flatMap((set) =>
            set
              .split(", ")
              .map((entry) => path.join(root, "public", entry.split(" ")[0])),
          ),
        );
      if (
        (
          await Promise.all(
            files.map((file) =>
              readFile(file)
                .then(() => true)
                .catch(() => false),
            ),
          )
        ).every(Boolean)
      ) {
        manifest.events[event.id] = cached;
        rendered.set(fingerprint, cached);
        continue;
      }
    }
    const result: Partial<Record<Format, ImageVariant>> = {};
    for (const format of (reviewEvent
      ? ["calendar"]
      : (["calendar", "archive"] as Format[]).filter(
          (format) => coverApproval.formats[format] === "approved",
        )) as Format[]) {
      const layout = template.formats[format];
      const formatLayers = extractCoverSvgLayers(
        formatSources.get(format)!.toString("utf8"),
      );
      const figure = Buffer.from(formatLayers.illustration);
      const background = Buffer.from(
        styleCoverBackground(
          formatLayers.background,
          template.colors.paper,
          template.flagOpacity,
        ),
      );
      const [lx, ly, ls] = layout.logo;
      const inset = layout.logoInset ?? 0.14;
      const circle = layout.flagCircle;
      const [fx, fy, fw, fh] = layout.figure;
      const dataUri = (mime: string, bytes: Buffer) =>
        `data:${mime};base64,${bytes.toString("base64")}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
${circle ? `<defs><clipPath id="flag-circle"><circle cx="${circle[0]}" cy="${circle[1]}" r="${circle[2]}"/></clipPath></defs>` : ""}
<rect width="100%" height="100%" fill="${template.colors.paper}"/>
<image href="${dataUri("image/svg+xml", background)}" width="${layout.width}" height="${layout.height}" preserveAspectRatio="none" ${circle ? 'clip-path="url(#flag-circle)"' : ""}/>
<circle cx="${lx + ls / 2}" cy="${ly + ls / 2}" r="${ls / 2 + 8}" fill="${template.colors.paper}"/>
<image href="${dataUri("image/png", logo)}" x="${lx + ls * inset}" y="${ly + ls * inset}" width="${ls * (1 - inset * 2)}" height="${ls * (1 - inset * 2)}" preserveAspectRatio="xMidYMid meet" style="mix-blend-mode:multiply"/>
<image href="${dataUri("image/svg+xml", figure)}" x="${fx}" y="${fy}" width="${fw}" height="${fh}"/>
</svg>`;
      // Explicit single-review path: one PNG, no variants or production writes.
      if (reviewEvent) {
        const reviewPath = path.join(outputRoot, `${event.id}-calendar.png`);
        await writeChanged(
          reviewPath,
          await sharp(Buffer.from(svg)).png().toBuffer(),
        );
        console.log(`Single calendar review: ${reviewPath}`);
        return manifest;
      }
      if (samples)
        await writeChanged(
          path.join(outputRoot, `${event.id}-${format}.svg`),
          svg,
        );
      const sets: Record<"webp", string[]> = { webp: [] };
      for (const width of layout.variants) {
        for (const extension of ["webp"] as const) {
          const folder = "shared";
          const filename = `${folder}/kendo-costa-rica-${fingerprint.slice(0, 16)}-${format}-${width}.${extension}`;
          const pipeline = sharp(Buffer.from(svg)).resize(width);
          const bytes = await pipeline.webp({ quality: 86 }).toBuffer();
          await writeChanged(path.join(outputRoot, filename), bytes);
          sets[extension].push(`/images/event-covers/${filename} ${width}w`);
        }
      }
      if (samples)
        await writeChanged(
          path.join(outputRoot, `${event.id}-${format}.png`),
          await sharp(Buffer.from(svg)).png().toBuffer(),
        );
      result[format] = {
        src: sets.webp.at(-1)!.split(" ")[0],
        width: layout.width,
        height: layout.height,
        srcSet: { webp: sets.webp.join(", ") },
      };
    }
    manifest.events[event.id] = { fingerprint, ...result };
    rendered.set(fingerprint, manifest.events[event.id]);
  }
  if (!samples) {
    await writeChanged(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    // Only remove obsolete files inside the generator-owned output directory.
    const keep = new Set(
      Object.values(manifest.events).flatMap((entry) =>
        Object.values({ calendar: entry.calendar, archive: entry.archive })
          .filter((image): image is ImageVariant => Boolean(image))
          .flatMap((image) =>
            Object.values(image.srcSet).flatMap((set) =>
              set
                .split(", ")
                .map((candidate) =>
                  candidate.split(" ")[0].replace("/images/event-covers/", ""),
                ),
            ),
          ),
      ),
    );
    for (const file of await readdir(outputRoot, {
      recursive: true,
      withFileTypes: true,
    })) {
      const absolute = path.join(file.parentPath, file.name);
      if (
        file.isFile() &&
        !keep.has(path.relative(outputRoot, absolute).replaceAll("\\", "/"))
      )
        await rm(absolute);
    }
  }
  console.log(
    `Event covers: ${events.length} events, ${template.version}${samples ? " (samples)" : ""}`,
  );
  return manifest;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  const reviewIndex = process.argv.indexOf("--review-calendar");
  if (reviewIndex !== -1 && !process.argv[reviewIndex + 1])
    throw new Error("--review-calendar requires an event id");
  generateEventCovers({
    samples: process.argv.includes("--samples"),
    reviewCalendarEventId:
      reviewIndex === -1 ? undefined : process.argv[reviewIndex + 1],
  }).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
