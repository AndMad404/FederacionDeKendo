import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { updateReviewStateAtomically } from "../review-state.mjs";

const RELEVANT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const RELEVANT_FILENAMES = new Set([
  ".prettierignore",
  ".prettierrc",
  ".prettierrc.json",
  "package.json",
  "pnpm-lock.yaml",
]);

export async function readHookInput() {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  if (!input.trim()) return {};
  return JSON.parse(input);
}

export function writeHookJson(output) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

export function findRepositoryRoot(cwd) {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
}

function isRelevantFile(file) {
  const normalized = file.replaceAll("\\", "/");
  const basename = path.posix.basename(normalized);
  return (
    RELEVANT_FILENAMES.has(basename) ||
    RELEVANT_EXTENSIONS.has(path.posix.extname(normalized).toLowerCase())
  );
}

function listFiles(root, args) {
  const output = execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  return output.split("\0").filter(Boolean);
}

export function captureRelevantFingerprint(root) {
  const files = [
    ...listFiles(root, ["ls-files", "-z"]),
    ...listFiles(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]
    .filter(isRelevantFile)
    .sort();
  const hash = createHash("sha256");

  for (const file of files) {
    const absolutePath = path.join(root, file);
    if (!existsSync(absolutePath)) continue;
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(absolutePath));
    hash.update("\0");
  }

  return hash.digest("hex");
}

export function getWorktreeSummary(root) {
  return execFileSync("git", ["status", "--short"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function safeSessionId(sessionId) {
  return String(sessionId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getSessionStatePath(sessionId) {
  return path.join(
    os.tmpdir(),
    "codex-federacion-hooks",
    `${safeSessionId(sessionId)}.json`,
  );
}

export async function saveSessionState(sessionId, state) {
  const statePath = getSessionStatePath(sessionId);
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function loadSessionState(sessionId) {
  try {
    return JSON.parse(await readFile(getSessionStatePath(sessionId), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function commandName(command) {
  if (process.platform === "win32" && command === "corepack") {
    return `${command}.cmd`;
  }
  return command;
}

function runCommand(command, args, cwd) {
  const result = spawnSync(commandName(command), args, {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: 150_000,
  });
  return {
    command: [command, ...args].join(" "),
    ok: result.status === 0 && !result.error,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

export function runCompletionChecks(root) {
  return [
    runCommand("corepack", ["pnpm", "run", "format:check"], root),
    runCommand("git", ["diff", "--check"], root),
    runCommand("git", ["diff", "--cached", "--check"], root),
  ];
}

export function recordHookFailure(root, failure) {
  const reviewStatePath = path.join(root, ".codex", "review-state.md");
  if (!existsSync(reviewStatePath)) return false;
  try {
    const timestamp = new Date().toISOString();
    updateReviewStateAtomically(reviewStatePath, (state) => {
      const baseId = `HOOK-${timestamp.replace(/\D/g, "")}`;
      let id = baseId;
      let suffix = 2;
      while (state.hookFailures.some((entry) => entry.id === id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      state.hookFailures.push({
        id,
        recordedAt: timestamp,
        sessionId: String(failure.sessionId || "unknown").slice(0, 200),
        event: String(failure.event || "unknown").slice(0, 64),
        status: "needs_human_review",
        problem: String(failure.problem || "Hook quality gate failed.").slice(
          0,
          400,
        ),
        evidence: String(failure.evidence || "No evidence recorded.").slice(
          0,
          800,
        ),
      });
    });
    return true;
  } catch {
    return false;
  }
}

export function formatCheckFailures(checks) {
  return checks
    .filter((check) => !check.ok)
    .map((check) => `${check.command}: ${check.output || "exit non-zero"}`)
    .join("\n")
    .slice(0, 1600);
}

export function isDirectExecution(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === path.resolve(fileURLToPath(moduleUrl));
}
