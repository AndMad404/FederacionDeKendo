import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applyHistoricalCorrections } from "./correct-calendar-history.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultRegistryPath = path.join(repoRoot, "src", "app", "data", "calendarEventRegistry.json");
const defaultOutputPath = path.join(repoRoot, "src", "app", "data", "calendarEvents.ts");
const defaultReportPath = path.join(repoRoot, "calendar-historical-changes.json");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function assertDateRange(from, to) {
  if (!datePattern.test(from ?? "") || !datePattern.test(to ?? "") || from > to) {
    throw new Error("Use an inclusive ISO date range with --from no later than --to.");
  }
}

export async function applyHistoricalCorrectionsByDateRange({
  registryPath = defaultRegistryPath,
  outputPath = defaultOutputPath,
  reportPath = defaultReportPath,
  from,
  to,
}) {
  assertDateRange(from, to);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const changes = report.historicalChanges?.filter(
    ({ publicIdentity }) => publicIdentity?.date >= from && publicIdentity?.date <= to,
  );
  if (!changes?.length) throw new Error("No historical changes are available in the selected date range.");
  return applyHistoricalCorrections({
    registryPath,
    outputPath,
    reportPath,
    corrections: changes.map((change) => ({
      sourceId: change.sourceId,
      publishedFingerprint: change.publishedFingerprint,
      proposalFingerprint: change.proposalFingerprint,
      fields: change.differences.map(({ field }) => field),
    })),
  });
}

function parseCliArguments(args) {
  const allowed = new Set(["--report", "--from", "--to"]);
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!allowed.has(name) || value === undefined || parsed[name] !== undefined) throw new Error("Invalid or duplicate command arguments.");
    parsed[name] = value;
  }
  if (parsed["--report"] !== "calendar-historical-changes.json") throw new Error("The report must be calendar-historical-changes.json at the repository root.");
  return { from: parsed["--from"], to: parsed["--to"] };
}

async function main() {
  const results = await applyHistoricalCorrectionsByDateRange(parseCliArguments(process.argv.slice(2)));
  console.log(`Historical range correction applied: ${results.length} event(s).`);
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectExecution) main().catch((error) => { console.error(`Historical range correction rejected: ${error.message}`); process.exitCode = 1; });
