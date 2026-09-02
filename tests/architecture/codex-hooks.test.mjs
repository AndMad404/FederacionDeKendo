import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { evaluateStop } from "../../.codex/hooks/stop-quality-gate.mjs";
import { recordHookFailure } from "../../.codex/hooks/shared.mjs";
import {
  recordFailure as recordSupervisionFailure,
  runCompletionChecks as runSupervisionChecks,
} from "../../.codex/supervision.mjs";
import {
  parseReviewStateMarkdown,
  serializeReviewStateMarkdown,
} from "../../.codex/review-state.mjs";

test("hooks.json delegates the lifecycle to global supervision", () => {
  const config = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
  assert.deepEqual(config.hooks, {});
  assert.equal(typeof runSupervisionChecks, "function");
  assert.equal(typeof recordSupervisionFailure, "function");
});

test("second failures stay in compact active review state", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "codex-hook-review-"));
  try {
    mkdirSync(path.join(root, ".codex"));
    const fixture = parseReviewStateMarkdown(
      readFileSync(".codex/review-state.md", "utf8"),
    );
    fixture.hookFailures = [];
    writeFileSync(
      path.join(root, ".codex", "review-state.md"),
      serializeReviewStateMarkdown(fixture),
    );
    assert.equal(
      recordHookFailure(root, {
        sessionId: "session",
        event: "Stop",
        problem: "Gate failed twice.",
        evidence: "x".repeat(2000),
      }),
      true,
    );
    const state = parseReviewStateMarkdown(
      readFileSync(path.join(root, ".codex", "review-state.md"), "utf8"),
    );
    assert.equal(state.hookFailures.length, 1);
    assert.match(state.hookFailures[0].id, /^HOOK-/);
    assert.equal(state.hookFailures[0].status, "needs_human_review");
    assert.equal(state.hookFailures[0].evidence.length, 800);
    assert.equal(state.historyIndex, ".codex/review-history.md");
    assert.ok(
      Buffer.byteLength(
        readFileSync(
          path.join(root, ".codex", "review-state.md"),
          "utf8",
        ).replaceAll("\r\n", "\n"),
      ) <=
        32 * 1024,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("hook failure recording rejects invalid state without modifying it", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "codex-hook-invalid-"));
  try {
    mkdirSync(path.join(root, ".codex"));
    const statePath = path.join(root, ".codex", "review-state.md");
    const invalid = "# Technical Review State\r\n\r\n```json\r\n{}\r\n```\r\n";
    writeFileSync(statePath, invalid, "utf8");
    assert.equal(
      recordHookFailure(root, {
        sessionId: "session",
        event: "Stop",
        problem: "Gate failed twice.",
        evidence: "lint failed",
      }),
      false,
    );
    assert.equal(readFileSync(statePath, "utf8"), invalid);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("Stop blocks once and then records a human-review failure", async () => {
  const dependencies = {
    root: "C:/repo",
    state: { fingerprint: "before" },
    captureFingerprint: () => "after",
    runChecks: () => [
      {
        command: "project quality gate",
        ok: false,
        output: "Quality check failed",
      },
    ],
  };
  const first = await evaluateStop(
    { session_id: "session", stop_hook_active: false },
    dependencies,
  );
  assert.equal(first.output.decision, "block");
  assert.equal(first.failure, undefined);

  const second = await evaluateStop(
    { session_id: "session", stop_hook_active: true },
    dependencies,
  );
  assert.equal(second.output.continue, true);
  assert.equal(second.output.decision, undefined);
  assert.equal(second.failure.event, "Stop");
});

test("Stop skips checks when relevant files did not change", async () => {
  let ranChecks = false;
  const result = await evaluateStop(
    { session_id: "session", stop_hook_active: false },
    {
      root: "C:/repo",
      state: { fingerprint: "same" },
      captureFingerprint: () => "same",
      runChecks: () => {
        ranChecks = true;
        return [];
      },
    },
  );
  assert.equal(result.output.continue, true);
  assert.equal(ranChecks, false);
});
