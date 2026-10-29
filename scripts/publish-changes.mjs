import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  captureWorkspaceFingerprint,
  reportDirectory,
} from "./verify-site.mjs";

const DATA = [
  "src/app/data/calendarEvents.ts",
  "src/app/data/calendarEventRegistry.json",
  "src/app/data/eventCovers.json",
  "public/images/event-covers/",
];
const OPERATIONS = {
  site: {
    paths: ["src/app/data/eventCovers.json", "public/images/event-covers/"],
    message: "chore: apply automatic code quality fixes",
  },
  calendar: {
    paths: [
      ...DATA,
      "src/app/data/eventGalleries.ts",
      "src/app/data/eventGalleryState.json",
      "public/images/events/",
    ],
    message: "chore: sync calendar events",
  },
  history: {
    paths: [
      ...DATA,
      "src/app/data/eventGalleries.ts",
      "src/app/data/eventGalleryState.json",
      "public/images/events/",
    ],
    message: "chore: correct historical calendar range",
  },
  decision: {
    paths: DATA,
    message: "chore: apply calendar editorial decision",
  },
};

export function publishChanges({
  root = process.cwd(),
  kind = "site",
  branch = "main",
  directory = reportDirectory(root),
  expectedSha = process.env.GITHUB_SHA,
  ref = process.env.GITHUB_REF,
  captureFingerprint = captureWorkspaceFingerprint,
  summaryPath = process.env.GITHUB_STEP_SUMMARY,
  readCoverApproval = () =>
    JSON.parse(
      readFileSync(
        path.join(root, "src/app/config/eventCoverApproval.json"),
        "utf8",
      ),
    ),
  git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }),
} = {}) {
  const operation = OPERATIONS[kind];
  if (!operation) throw new Error(`Unknown publication: ${kind}`);
  const coverApproval = readCoverApproval();
  const coversApproved = coverApproval.status === "approved";
  const verification = JSON.parse(
    readFileSync(path.join(directory, "verification.json"), "utf8"),
  );
  const quality = JSON.parse(
    readFileSync(path.join(directory, "quality-fix.json"), "utf8"),
  );
  if (
    verification.schemaVersion !== 1 ||
    verification.status !== "passed" ||
    quality.schemaVersion !== 1 ||
    quality.mode !== "fix" ||
    !["clean", "corrected"].includes(quality.status) ||
    !Array.isArray(quality.fixedFiles)
  )
    throw new Error(
      "Publication requires successful quality and verification reports.",
    );
  if (verification.fingerprint !== captureFingerprint(root))
    throw new Error(
      "Workspace differs from the verified source; rerun the gate.",
    );
  if (ref && ref !== `refs/heads/${branch}`)
    throw new Error("Publication is restricted to the production branch.");
  const allowed = [...operation.paths, ...quality.fixedFiles];
  const candidates = [
    ...git(["diff", "--name-only", "HEAD", "-z"]).split("\0"),
    ...git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"),
  ].filter(Boolean);
  const deferredFiles = coversApproved
    ? candidates.filter(
        (file) =>
          file.startsWith("public/images/event-covers/") &&
          coverApproval.formats &&
          !Object.entries(coverApproval.formats).some(
            ([format, status]) =>
              status === "approved" &&
              path.basename(file).includes(`-${format}-`),
          ),
      )
    : candidates.filter(
        (file) =>
          file === "src/app/data/eventCovers.json" ||
          file.startsWith("public/images/event-covers/"),
      );
  const changed = candidates.filter((file) => !deferredFiles.includes(file));
  if (
    changed.some(
      (file) =>
        !allowed.some((target) =>
          target.endsWith("/") ? file.startsWith(target) : file === target,
        ),
    )
  )
    throw new Error("Changes outside the approved publication paths.");
  let sha = git(["rev-parse", "HEAD"]).trim();
  if (expectedSha && expectedSha !== sha)
    throw new Error("Checkout differs from the workflow revision.");
  if (changed.length) {
    const remote = git(["ls-remote", "origin", `refs/heads/${branch}`])
      .trim()
      .split(/\s+/)[0];
    if (remote !== sha)
      throw new Error(
        "Production branch advanced; rerun on the current revision. No changes were pushed.",
      );
    git(["add", "-A", "--", ...changed]);
    git(["config", "user.name", "github-actions[bot]"]);
    git([
      "config",
      "user.email",
      "41898282+github-actions[bot]@users.noreply.github.com",
    ]);
    git(["commit", "-m", operation.message, "--only", "--", ...changed]);
    git(["push", "origin", `HEAD:refs/heads/${branch}`]);
    sha = git(["rev-parse", "HEAD"]).trim();
  }
  const report = {
    schemaVersion: 1,
    status: changed.length ? "git-saved" : "unchanged",
    sha,
    files: changed,
    deferredFiles,
    deployment: "not-confirmed",
  };
  writeFileSync(
    path.join(directory, "publication.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (summaryPath)
    appendFileSync(
      summaryPath,
      `\nGit: ${report.status}; commit ${sha}. Cloudflare: no confirmado.\n`,
    );
  return report;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(publishChanges({ kind: process.argv[2] ?? "site" }));
  } catch (error) {
    const directory = reportDirectory();
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, "publication.json"),
      JSON.stringify(
        {
          schemaVersion: 1,
          status: "failed",
          message: error.message,
          deployment: "not-confirmed",
        },
        null,
        2,
      ) + "\n",
    );
    console.error(error.message);
    process.exitCode = 1;
  }
}
