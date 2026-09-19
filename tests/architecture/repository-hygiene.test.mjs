import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SELF = "tests/architecture/repository-hygiene.test.mjs";
const FORBIDDEN_EXACT_PATHS = new Set(["AGENTS.md", "context-index.md"]);
const FORBIDDEN_PREFIXES = [
  ".agents/",
  ".codex/",
  "context-library/",
  "skills/federacion-workflow/",
];
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const PRIVATE_MARKERS = new Set([
  "DesarrolloAsistidoIA",
  "Prometheus",
  "federacion-workflow",
  "context-librarian",
  "indexation-librarian",
  "RTK Output",
]);

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function trackedFiles() {
  const result = spawnSync("git", ["ls-files", "--cached", "-z"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw result.error ?? new Error(result.stderr.trim());
  }
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map(normalize)
    .filter((file) => existsSync(path.join(ROOT, file)));
}

function isForbiddenPath(relativePath) {
  return (
    FORBIDDEN_EXACT_PATHS.has(relativePath) ||
    FORBIDDEN_PREFIXES.some((prefix) => relativePath.startsWith(prefix)) ||
    /(?:^|\/)prompt-recipes\.[^/]+$/i.test(relativePath) ||
    /(?:^|\/)review-(?:state|history)(?:-[^/]+)?\.[^/]+$/i.test(relativePath)
  );
}

test("repository contains no private assisted-development artifacts", () => {
  const forbidden = trackedFiles().filter(isForbiddenPath).sort();
  assert.deepEqual(forbidden, []);
});

test("repository files contain no private tooling identifiers", () => {
  const files = trackedFiles()
    .filter((file) => file !== SELF)
    .filter((file) =>
      TEXT_EXTENSIONS.has(path.posix.extname(file).toLowerCase()),
    );

  const matches = [];
  for (const file of files) {
    const content = readFileSync(path.join(ROOT, file), "utf8");
    for (const marker of PRIVATE_MARKERS) {
      if (content.includes(marker)) matches.push(`${file}: ${marker}`);
    }
  }
  assert.deepEqual(matches, []);
});
