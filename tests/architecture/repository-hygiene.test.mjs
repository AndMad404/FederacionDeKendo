import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SELF = "tests/architecture/repository-hygiene.test.mjs";
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".cache",
  ".codex-remote-attachments",
  ".pnpm-store",
  ".vite",
  "coverage",
  "dist",
  "dist-ssr",
  "node_modules",
  "playwright-report",
  "test-results",
  "tmp",
  "vitest-report",
]);
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
const PRIVATE_MARKERS = [
  "DesarrolloAsistidoIA",
  "Prometheus",
  "federacion-workflow",
  "context-librarian",
  "indexation-librarian",
  "RTK Output",
];

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function walk(relativeDirectory = "") {
  const entries = readdirSync(path.join(ROOT, relativeDirectory), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name))
        files.push(...walk(relativePath));
      continue;
    }
    if (entry.isFile()) files.push(normalize(relativePath));
  }
  return files;
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
  const forbidden = walk().filter(isForbiddenPath).sort();
  assert.deepEqual(forbidden, []);
});

test("repository files contain no private tooling identifiers", () => {
  const files = walk()
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
