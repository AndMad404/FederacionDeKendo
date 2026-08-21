import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function yamlString(value) {
  const sanitized = Array.from(String(value), (character) =>
    character.charCodeAt(0) <= 31 ? " " : character,
  ).join("");
  return JSON.stringify(sanitized);
}

export function recordHookFailure(root, failure) {
  const reviewStatePath = path.join(root, ".codex", "review-state.md");
  if (!existsSync(reviewStatePath)) return false;

  const current = readFileSync(reviewStatePath, "utf8");
  const fenceIndex = current.lastIndexOf("\n```");
  if (fenceIndex < 0) return false;

  const timestamp = new Date().toISOString();
  const key = `hook_gate_failure_${timestamp.replace(/[-:.TZ]/g, "")}`;
  const entry = [
    "",
    `${key}:`,
    `  recorded_at: ${yamlString(timestamp)}`,
    `  session_id: ${yamlString(failure.sessionId)}`,
    `  event: ${yamlString(failure.event)}`,
    "  status: needs_human_review",
    `  problem: ${yamlString(failure.problem)}`,
    `  evidence: ${yamlString(failure.evidence.slice(0, 1600))}`,
  ].join("\n");
  const dated = current.replace(
    /^last_updated: .*$/m,
    `last_updated: ${timestamp.slice(0, 10)}`,
  );
  const datedFenceIndex = dated.lastIndexOf("\n```");
  const next = `${dated.slice(0, datedFenceIndex)}${entry}${dated.slice(datedFenceIndex)}`;
  const temporaryPath = `${reviewStatePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, next, "utf8");
  renameSync(temporaryPath, reviewStatePath);
  return true;
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
