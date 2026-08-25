import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  extractResolvedIndexFromSnapshot,
  parseReviewStateMarkdown,
} from "../../.codex/review-state.mjs";

const read = (path) => readFileSync(path, "utf8");
const gitNormalizedBytes = (path) =>
  Buffer.byteLength(read(path).replaceAll("\r\n", "\n"));

const BASELINE_COMMIT = "5531ee4f";
const STATIC_CONTEXT_SCENARIOS = [
  {
    name: "known implementation",
    files: [
      "AGENTS.md",
      ".agents/implementation-contract.md",
      ".agents/verification.md",
    ],
    baselineBytes: 24_609,
  },
  {
    name: "technical review",
    files: [
      "AGENTS.md",
      ".agents/review-contract.md",
      ".codex/review-state.md",
      ".agents/verification.md",
    ],
    baselineBytes: 288_306,
    maximumBytes: 50_000,
  },
  {
    name: "roadmap prompt",
    files: ["AGENTS.md", ".agents/prompt-recipes.md"],
    baselineBytes: 16_939,
  },
];

const CRITICAL_CONTROLS = {
  "CTRL-SCOPE":
    "Preserve unrelated worktree changes. Do not refactor outside the requested concern or create a commit unless requested.",
  "CTRL-OWNER":
    "Prefer current project patterns. Do not add a methodology, tool, dependency, or abstraction without evidence and owner approval.",
  "CTRL-PUBLIC-SEO":
    "Treat legal constraints, public copy, SEO metadata, and owner decisions as hard requirements. Do not add a speculative public page for SEO.",
  "CTRL-VISUAL":
    "Do not implement visual changes without explicit owner approval. Use the current application plus approved measurements, screenshots, and renders as the baseline; isolate unrelated visual changes and block on every unexpected visual difference.",
  "CTRL-PHASE":
    "Do not parallelize phases that share files, outputs, or sequential dependencies.",
  "CTRL-FORMAT":
    "After editing code or configuration, `corepack pnpm run format:check` must pass; CRLF is required. Report skipped or unavailable checks.",
  "CTRL-DEPLOY":
    "Do not claim a deployed problem is fixed from local files alone.",
};

function readCriticalControls(markdown) {
  const controls = {};
  const pattern = /^- \[(CTRL-[A-Z-]+)\] ([\s\S]*?)(?=\n- |\n\n|(?![\s\S]))/gm;
  for (const match of markdown.matchAll(pattern)) {
    assert.equal(controls[match[1]], undefined, `duplicate ${match[1]}`);
    controls[match[1]] = match[2].replace(/\s+/g, " ").trim();
  }
  return controls;
}

function assertCriticalControls(markdown) {
  assert.deepEqual(readCriticalControls(markdown), CRITICAL_CONTROLS);
}

test("persistent agent context stays within the approved compact budgets", () => {
  assert.ok(gitNormalizedBytes("AGENTS.md") <= 6000);
  assert.ok(gitNormalizedBytes(".agents/review-contract.md") <= 5000);
  assert.ok(gitNormalizedBytes(".codex/review-state.md") <= 32 * 1024);
});

test("static context packages remain below raw-byte baselines", () => {
  for (const scenario of STATIC_CONTEXT_SCENARIOS) {
    const currentBytes = scenario.files.reduce(
      (total, path) => total + gitNormalizedBytes(path),
      0,
    );
    assert.ok(
      currentBytes < scenario.baselineBytes,
      `${scenario.name}: ${currentBytes} must stay below ${scenario.baselineBytes} raw bytes from ${BASELINE_COMMIT}`,
    );
    if (scenario.maximumBytes) {
      assert.ok(
        currentBytes <= scenario.maximumBytes,
        `${scenario.name}: ${currentBytes} exceeds ${scenario.maximumBytes}`,
      );
    }
  }
});

test("critical supervision controls retain exact approved semantics", () => {
  const agents = read("AGENTS.md");
  assertCriticalControls(agents);
  assert.throws(() =>
    assertCriticalControls(
      agents.replace(
        "Do not implement visual changes",
        "Implement visual changes",
      ),
    ),
  );
});

test("active review state is canonical and indexes every explicit resolution", () => {
  const state = parseReviewStateMarkdown(read(".codex/review-state.md"));
  const snapshotPath = ".codex/review-history-2026-08-23.md";
  const expectedIndex = extractResolvedIndexFromSnapshot(
    read(snapshotPath),
    snapshotPath,
    "2026-08-23",
  );
  assert.equal(state.schemaVersion, 4);
  assert.equal(
    new Set(state.openFindings.map((entry) => entry.id)).size,
    state.openFindings.length,
  );
  assert.equal(
    new Set(state.resolvedIndex.map((entry) => entry.recordKey)).size,
    state.resolvedIndex.length,
  );
  assert.deepEqual(state.resolvedIndex, expectedIndex);
  for (const conflict of state.idConflicts) {
    assert.ok(conflict.sourceId);
    assert.ok(conflict.rule);
  }
});

test("pre-compaction review snapshot remains immutable", () => {
  const snapshot = readFileSync(".codex/review-history-2026-08-23.md");
  const hash = createHash("sha256")
    .update(snapshot)
    .digest("hex")
    .toUpperCase();
  assert.equal(
    hash,
    "2F0A88F8E96A89AFCCC752DB0CF762891411A5F41F21DFB4C7B259A91A964EE2",
  );
  assert.match(read(".codex/review-history.md"), new RegExp(hash));
});
