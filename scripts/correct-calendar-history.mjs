import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  HISTORICAL_COMPARISON_FIELDS,
  fingerprintHistoricalProposal,
  fingerprintHistoricalSnapshot,
  normalizePublicDescription,
  serializeCalendarEvents,
  writeAtomically,
} from "./sync-calendar-events.mjs";

export { fingerprintHistoricalProposal, fingerprintHistoricalSnapshot };

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const defaultRegistryPath = path.join(
  repoRoot,
  "src",
  "app",
  "data",
  "calendarEventRegistry.json",
);
const defaultOutputPath = path.join(
  repoRoot,
  "src",
  "app",
  "data",
  "calendarEvents.ts",
);
const defaultReportPath = path.join(
  repoRoot,
  "calendar-historical-changes.json",
);
const fingerprintPattern = /^[a-f0-9]{64}$/;
const safeIdentifierPattern = /^[A-Za-z0-9_-]{1,128}$/;
const forbiddenPrivateText =
  /ALBUM_FOTOS|webcal:|https?:\/\/[^\s]*drive\.google\.com|https?:\/\/[^\s]*\.ics(?:[?#\s]|$)/i;

function containsControlCharacter(value, allowLineBreaks = false) {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      (codePoint <= 31 &&
        (!allowLineBreaks || ![10, 13].includes(codePoint))) ||
      codePoint === 127
    );
  });
}

function assertSafeReportValue(value, allowLineBreaks = false) {
  if (value === null) return;
  if (
    typeof value !== "string" ||
    containsControlCharacter(value, allowLineBreaks) ||
    forbiddenPrivateText.test(value)
  ) {
    throw new Error("Report contains an invalid or private value.");
  }
}

function assertFieldValue(field, value, type) {
  if (type === "eliminado") return;
  assertSafeReportValue(value, field === "summary");
  if (typeof value !== "string")
    throw new Error("Modified fields require a string proposed value.");
  if (field === "slug" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    throw new Error("Invalid proposed slug.");
  if (["date", "endDate"].includes(field) && !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Invalid proposed date.");
  if (["startTime", "endTime"].includes(field) && !/^\d{2}:\d{2}$/.test(value))
    throw new Error("Invalid proposed time.");
  if (
    field === "archiveEligibleAt" &&
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  )
    throw new Error("Invalid proposed archive checkpoint.");
  if (
    field === "eventType" &&
    !["torneo", "examen", "seminario", "evento"].includes(value)
  )
    throw new Error("Invalid proposed event type.");
  if (field === "infoUrl" && !/^https:\/\/[^\s]+$/.test(value))
    throw new Error("Invalid proposed information URL.");
}

function assertExactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object.`);
  if (
    JSON.stringify(Object.keys(value).sort()) !==
    JSON.stringify([...keys].sort())
  ) {
    throw new Error(`${label} has an invalid schema.`);
  }
}

function validateReport(report) {
  assertExactKeys(
    report,
    ["version", "historicalChanges", "galleryChanges"],
    "Report",
  );
  if (
    report.version !== 2 ||
    !Array.isArray(report.historicalChanges) ||
    !Array.isArray(report.galleryChanges)
  )
    throw new Error("Unsupported historical changes report.");
  for (const [index, change] of report.galleryChanges.entries()) {
    assertExactKeys(
      change,
      ["slug", "status", "reason"],
      `Gallery change ${index}`,
    );
    Object.values(change).forEach(assertSafeReportValue);
  }
  const seenSourceIds = new Set();
  for (const [index, change] of report.historicalChanges.entries()) {
    assertExactKeys(
      change,
      [
        "sourceId",
        "publicIdentity",
        "differences",
        "publishedFingerprint",
        "proposalFingerprint",
        "revisionId",
        "evidenceFingerprint",
      ],
      `Report change ${index}`,
    );
    if (
      !safeIdentifierPattern.test(change.sourceId) ||
      seenSourceIds.has(change.sourceId)
    )
      throw new Error("Report contains an invalid or ambiguous sourceId.");
    seenSourceIds.add(change.sourceId);
    if (
      !fingerprintPattern.test(change.revisionId) ||
      !fingerprintPattern.test(change.evidenceFingerprint)
    )
      throw new Error("Report contains an invalid evidence fingerprint.");
    assertExactKeys(
      change.publicIdentity,
      ["slug", "title", "date"],
      "Public identity",
    );
    Object.values(change.publicIdentity).forEach(assertSafeReportValue);
    if (!Array.isArray(change.differences) || change.differences.length === 0)
      throw new Error("Report change must contain differences.");
    if (
      !fingerprintPattern.test(change.publishedFingerprint) ||
      !fingerprintPattern.test(change.proposalFingerprint)
    )
      throw new Error("Report contains an invalid fingerprint.");
    const seenFields = new Set();
    for (const difference of change.differences) {
      assertExactKeys(
        difference,
        ["field", "published", "proposed", "type"],
        "Difference",
      );
      const validFeed =
        difference.field === "feed" &&
        difference.type === "desaparecido_del_feed";
      const validField =
        HISTORICAL_COMPARISON_FIELDS.includes(difference.field) &&
        ["modificado", "eliminado"].includes(difference.type);
      if ((!validFeed && !validField) || seenFields.has(difference.field))
        throw new Error("Report contains an unknown or ambiguous difference.");
      if (difference.type === "eliminado" && difference.proposed !== null)
        throw new Error("Removed fields must have a null proposed value.");
      assertSafeReportValue(
        difference.published,
        difference.field === "summary",
      );
      assertFieldValue(difference.field, difference.proposed, difference.type);
      seenFields.add(difference.field);
    }
    if (
      fingerprintHistoricalProposal(change.sourceId, change.differences) !==
      change.proposalFingerprint
    )
      throw new Error(
        "Proposal fingerprint does not match the report contents.",
      );
  }
}

function validateArguments({
  sourceId,
  publishedFingerprint,
  proposalFingerprint,
  fields,
}) {
  if (!safeIdentifierPattern.test(sourceId ?? ""))
    throw new Error("Invalid sourceId.");
  if (!fingerprintPattern.test(publishedFingerprint ?? ""))
    throw new Error("Invalid published fingerprint.");
  if (!fingerprintPattern.test(proposalFingerprint ?? ""))
    throw new Error("Invalid proposal fingerprint.");
  if (
    !Array.isArray(fields) ||
    fields.length === 0 ||
    fields.some((field) => typeof field !== "string")
  )
    throw new Error("At least one accepted field is required.");
  if (new Set(fields).size !== fields.length)
    throw new Error("Accepted fields must not repeat.");
}

function assertUniqueSlugs(events) {
  const owners = new Map();
  for (const event of events) {
    for (const slug of [event.slug, ...(event.aliases ?? [])]) {
      if (owners.has(slug))
        throw new Error(`Ambiguous public identity: ${slug}.`);
      owners.set(slug, event.sourceId);
    }
  }
}

export async function applyHistoricalCorrections({
  registryPath,
  outputPath,
  reportPath,
  corrections,
}) {
  if (!Array.isArray(corrections) || corrections.length === 0) {
    throw new Error("At least one historical correction is required.");
  }
  if (
    new Set(corrections.map(({ sourceId }) => sourceId)).size !==
    corrections.length
  ) {
    throw new Error("Historical corrections must not repeat an event.");
  }
  const [registryText, reportText] = await Promise.all([
    readFile(registryPath, "utf8"),
    readFile(reportPath, "utf8"),
  ]);
  const registry = JSON.parse(registryText);
  const report = JSON.parse(reportText);
  if (![3, 4].includes(registry.version) || !Array.isArray(registry.events))
    throw new Error("Unsupported calendar event registry.");
  validateReport(report);
  const reportBySourceId = new Map(
    report.historicalChanges.map((change) => [change.sourceId, change]),
  );
  const correctedBySourceId = new Map();
  const results = [];
  for (const correction of corrections) {
    const { sourceId, publishedFingerprint, proposalFingerprint, fields } =
      correction;
    validateArguments(correction);
    const matchingEvents = registry.events.filter(
      (candidate) => candidate.sourceId === sourceId,
    );
    const change = reportBySourceId.get(sourceId);
    if (matchingEvents.length !== 1 || !change)
      throw new Error("Event or proposal is missing or ambiguous.");
    const [event] = matchingEvents;
    if (event.historical !== true) throw new Error("Event is not historical.");
    const localPublishedFingerprint = fingerprintHistoricalSnapshot(event);
    if (
      localPublishedFingerprint !== publishedFingerprint ||
      change.publishedFingerprint !== localPublishedFingerprint
    )
      throw new Error("Published historical fingerprint is stale.");
    const localProposalFingerprint = fingerprintHistoricalProposal(
      sourceId,
      change.differences,
    );
    if (
      localProposalFingerprint !== proposalFingerprint ||
      change.proposalFingerprint !== localProposalFingerprint
    )
      throw new Error("Proposal fingerprint is stale.");
    if (change.differences.some(({ type }) => type === "desaparecido_del_feed"))
      throw new Error("A feed disappearance has no applicable field values.");
    const differenceByField = new Map(
      change.differences.map((difference) => [difference.field, difference]),
    );
    for (const field of fields) {
      if (!HISTORICAL_COMPARISON_FIELDS.includes(field))
        throw new Error(`Field is not allowed: ${field}.`);
      if (!differenceByField.has(field))
        throw new Error(`Field is not present in the report: ${field}.`);
    }
    const acceptedFields = HISTORICAL_COMPARISON_FIELDS.filter((field) =>
      fields.includes(field),
    );
    const corrected = structuredClone(event);
    for (const field of acceptedFields) {
      const difference = differenceByField.get(field);
      if (
        field === "slug" &&
        difference.type !== "eliminado" &&
        difference.proposed !== corrected.slug
      )
        corrected.aliases = [
          ...new Set([...(corrected.aliases ?? []), corrected.slug]),
        ];
      if (difference.type === "eliminado") delete corrected[field];
      else
        corrected[field] =
          field === "summary"
            ? normalizePublicDescription(difference.proposed)
            : difference.proposed;
    }
    correctedBySourceId.set(sourceId, corrected);
    results.push({
      sourceId,
      publishedFingerprint,
      proposalFingerprint,
      acceptedFields,
    });
  }
  const events = registry.events.map(
    (candidate) => correctedBySourceId.get(candidate.sourceId) ?? candidate,
  );
  assertUniqueSlugs(events);
  const correctedRegistry = { version: registry.version, events };
  await writeAtomically([
    [registryPath, `${JSON.stringify(correctedRegistry, null, 2)}\n`],
    [outputPath, serializeCalendarEvents(events)],
  ]);
  return results;
}

export async function applyHistoricalCorrection(options) {
  const [result] = await applyHistoricalCorrections({
    registryPath: options.registryPath,
    outputPath: options.outputPath,
    reportPath: options.reportPath,
    corrections: [options],
  });
  return result;
}

function parseCliArguments(args) {
  const allowed = new Set([
    "--report",
    "--source-id",
    "--published-fingerprint",
    "--proposal-fingerprint",
    "--fields",
  ]);
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!allowed.has(name) || value === undefined || parsed[name] !== undefined)
      throw new Error("Invalid or duplicate command arguments.");
    parsed[name] = value;
  }
  if (parsed["--report"] !== "calendar-historical-changes.json")
    throw new Error(
      "The report must be calendar-historical-changes.json at the repository root.",
    );
  return {
    sourceId: parsed["--source-id"],
    publishedFingerprint: parsed["--published-fingerprint"],
    proposalFingerprint: parsed["--proposal-fingerprint"],
    fields: parsed["--fields"]?.split(","),
  };
}

function safeAuditValue(value) {
  return [...String(value)]
    .map((character) => (containsControlCharacter(character) ? " " : character))
    .join("")
    .replace(/[^A-Za-z0-9_.-]/g, "_");
}

async function main() {
  const result = await applyHistoricalCorrection({
    registryPath: defaultRegistryPath,
    outputPath: defaultOutputPath,
    reportPath: defaultReportPath,
    ...parseCliArguments(process.argv.slice(2)),
  });
  console.log(
    `Historical correction applied: sourceId=${safeAuditValue(result.sourceId)} publishedFingerprint=${result.publishedFingerprint} proposalFingerprint=${result.proposalFingerprint} acceptedFields=${result.acceptedFields.join(",")}`,
  );
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectExecution)
  main().catch((error) => {
    console.error(
      `Historical correction rejected: ${safeAuditValue(error.message)}`,
    );
    process.exitCode = 1;
  });
