import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { synchronizeEventGalleries } from "./sync-event-galleries.mjs";
import {
  getPrivateAlbumUrl,
  parseCalendarEvent,
  parseVEvents,
  readCalendarSource,
} from "./sync-calendar-events.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const defaultReportPath = path.join(
  repoRoot,
  "calendar-historical-changes.json",
);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertDateRange(from, to) {
  if (
    !datePattern.test(from ?? "") ||
    !datePattern.test(to ?? "") ||
    from > to
  ) {
    throw new Error(
      "Use an inclusive ISO date range with --from no later than --to.",
    );
  }
}

export async function synchronizeApprovedHistoricalGalleries({
  source,
  reportPath = defaultReportPath,
  from,
  to,
  galleryOptions,
} = {}) {
  if (!source) throw new Error("Missing CALENDAR_ICS_URL.");
  assertDateRange(from, to);

  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const approvedChanges = (report.historicalChanges ?? []).filter(
    ({ publicIdentity }) =>
      publicIdentity?.date >= from && publicIdentity.date <= to,
  );
  if (!approvedChanges.length) {
    throw new Error(
      "No approved historical events are available in the range.",
    );
  }

  const currentBySourceId = new Map(
    parseVEvents(await readCalendarSource(source))
      .map((properties) => parseCalendarEvent(properties))
      .filter(Boolean)
      .map((event) => [event.sourceId, event]),
  );
  const events = approvedChanges.map(({ sourceId, publicIdentity }) => {
    const current = currentBySourceId.get(sourceId);
    const albumUrl = getPrivateAlbumUrl(current);
    if (!current || !albumUrl) {
      throw new Error(
        `Approved historical event ${publicIdentity.slug} has no Google Drive album.`,
      );
    }
    return {
      slug: publicIdentity.slug,
      title: current.title,
      date: publicIdentity.date,
      albumUrl,
      galleryCheckPhase: "final",
    };
  });

  const result = await synchronizeEventGalleries({ events, ...galleryOptions });
  for (const warning of result.warnings) console.warn(warning);

  const missing = events.filter(({ slug }) => !result.galleries[slug]);
  if (missing.length) {
    const reasons = new Map(
      result.alarms.map(({ slug, reason }) => [slug, reason]),
    );
    throw new Error(
      `Approved historical galleries were not imported: ${missing
        .map(({ slug }) => `${slug} (${reasons.get(slug) ?? "unknown_reason"})`)
        .join(", ")}.`,
    );
  }

  return result;
}

function parseCliArguments(args) {
  if (args[0] === "--") args = args.slice(1);
  const allowed = new Set(["--report", "--from", "--to"]);
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!allowed.has(name) || value === undefined || parsed[name] !== undefined)
      throw new Error("Invalid or duplicate command arguments.");
    parsed[name] = value;
  }
  if (parsed["--report"] !== "calendar-historical-changes.json") {
    throw new Error(
      "The report must be calendar-historical-changes.json at the repository root.",
    );
  }
  return { from: parsed["--from"], to: parsed["--to"] };
}

async function main() {
  const result = await synchronizeApprovedHistoricalGalleries({
    source: process.env.CALENDAR_ICS_URL,
    ...parseCliArguments(process.argv.slice(2)),
  });
  console.log(
    `Approved historical galleries imported: ${result.importedCount}.`,
  );
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectExecution)
  main().catch((error) => {
    console.error(
      `Approved historical gallery sync rejected: ${error.message}`,
    );
    process.exitCode = 1;
  });
