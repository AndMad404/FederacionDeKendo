import path from "node:path";
import { pathToFileURL } from "node:url";

export function assertDateRange(from, to) {
  const isDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  };
  if (!isDate(from) || !isDate(to) || from > to)
    throw new Error(
      "Use an inclusive ISO date range with --from no later than --to.",
    );
}

export async function validateHistoricalRun(
  env = process.env,
  request = fetch,
) {
  assertDateRange(env.CALENDAR_FROM, env.CALENDAR_TO);
  const runId = env.CALENDAR_REPORT_RUN_ID;
  if (!/^[1-9]\d*$/.test(runId ?? ""))
    throw new Error("Invalid historical report run ID.");
  const repository = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? ""))
    throw new Error("Invalid repository.");
  const response = await request(
    `https://api.github.com/repos/${repository}/actions/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
    },
  );
  if (!response.ok)
    throw new Error(
      `Cannot validate historical report origin (${response.status}).`,
    );
  const run = await response.json();
  if (
    String(run.id) !== runId ||
    run.repository?.full_name !== repository ||
    run.head_repository?.full_name !== repository ||
    run.head_branch !== "main" ||
    run.path !== ".github/workflows/sync-calendar.yml" ||
    run.conclusion !== "success" ||
    !["schedule", "workflow_dispatch"].includes(run.event)
  )
    throw new Error(
      "Historical reports must come from a successful main calendar synchronization in this repository.",
    );
}

export function approvedReportPath(env = process.env) {
  return (
    env.CALENDAR_APPROVED_REPORT_PATH ?? "calendar-historical-changes.json"
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    await validateHistoricalRun();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
