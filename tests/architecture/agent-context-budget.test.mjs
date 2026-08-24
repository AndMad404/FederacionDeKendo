import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const bytes = (path) => Buffer.byteLength(read(path));

test("persistent agent context stays within the approved compact budgets", () => {
  assert.ok(bytes("AGENTS.md") <= 6000);
  assert.ok(bytes(".agents/review-contract.md") <= 5000);
  assert.ok(bytes(".codex/review-state.md") <= 16000);
});

test("three representative task packages remain below their 2026-08-23 baselines", () => {
  const scenarios = [
    {
      name: "known implementation",
      current: bytes("AGENTS.md") + bytes(".agents/implementation-contract.md"),
      baseline: 13502 + 5055,
    },
    {
      name: "technical review",
      current:
        bytes("AGENTS.md") +
        bytes(".agents/review-contract.md") +
        bytes(".codex/review-state.md"),
      baseline: 13502 + 9643 + 263438,
    },
    {
      name: "roadmap prompt",
      current: bytes("AGENTS.md") + bytes(".agents/prompt-recipes.md"),
      baseline: 13502 + 3795,
    },
  ];

  for (const scenario of scenarios) {
    assert.ok(
      scenario.current < scenario.baseline,
      `${scenario.name}: ${scenario.current} must stay below ${scenario.baseline}`,
    );
  }
});

test("compaction retains critical supervision controls", () => {
  const agents = read("AGENTS.md");
  for (const required of [
    "owner approval",
    "Preserve unrelated worktree changes",
    "Do not implement visual changes",
    "Do not add a speculative public page",
    "Do not parallelize phases",
    "format:check",
    "deployed problem",
  ]) {
    assert.match(agents, new RegExp(required));
  }
});

test("active review state excludes historical review sessions", () => {
  const state = read(".codex/review-state.md");
  assert.match(state, /^schema_version: 3$/m);
  assert.match(state, /^history_index: \.codex\/review-history\.md$/m);
  assert.match(state, /^open_findings:$/m);
  assert.match(state, /^pending_reviews:$/m);
  assert.doesNotMatch(
    state,
    /^(?:latest_|previous_|prior_|resolved_findings:|stale_coverage_notices:)/m,
  );
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
