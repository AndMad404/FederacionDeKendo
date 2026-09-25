import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const SELF = "tests/architecture/repository-policy.test.mjs";

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

const MAX_TRACKED_FILE_BYTES = 5 * 1024 * 1024;
const LARGE_FILE_EXCEPTIONS = new Map([
  [
    "public/images/gallery/kendo-gallery-03.jpg",
    "legacy source asset; removal requires an explicit archival decision",
  ],
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

async function collectCssFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        return collectCssFiles(entryPath);
      }

      return extname(entry.name).toLowerCase() === ".css" ? [entryPath] : [];
    }),
  );

  return files.flat();
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
      if (content.includes(marker)) {
        matches.push(`${file}: ${marker}`);
      }
    }
  }

  assert.deepEqual(matches, []);
});

test("new tracked files stay below the repository size limit", () => {
  const files = trackedFiles();
  const oversized = files
    .filter(
      (file) => statSync(path.join(ROOT, file)).size > MAX_TRACKED_FILE_BYTES,
    )
    .filter((file) => !LARGE_FILE_EXCEPTIONS.has(file))
    .sort();
  const staleExceptions = [...LARGE_FILE_EXCEPTIONS.keys()]
    .filter(
      (file) =>
        !files.includes(file) ||
        statSync(path.join(ROOT, file)).size <= MAX_TRACKED_FILE_BYTES,
    )
    .sort();

  assert.deepEqual(
    { oversized, staleExceptions },
    {
      oversized: [],
      staleExceptions: [],
    },
  );
});

test("source CSS does not use important declarations", async () => {
  const sourceDirectory = resolve(process.cwd(), "src");
  const cssFiles = await collectCssFiles(sourceDirectory);
  const violations = [];

  for (const filePath of cssFiles) {
    const source = await readFile(filePath, "utf8");

    if (/!\s*important\b/i.test(source)) {
      violations.push(filePath);
    }
  }

  assert.deepEqual(violations, []);
});
