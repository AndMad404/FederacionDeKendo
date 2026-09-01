import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import {
  captureRelevantFingerprint,
  recordHookFailure,
  saveSessionState,
} from "../../.codex/hooks/shared.mjs";
import {
  parseReviewStateMarkdown,
  serializeReviewStateMarkdown,
} from "../../.codex/review-state.mjs";

function runHook(script, input, args = []) {
  const result = spawnSync(
    process.execPath,
    [`.codex/hooks/${script}`, ...args],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      input: JSON.stringify(input),
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

function runWindowsHook(command, input) {
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: JSON.stringify(input),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

test("hooks.json keeps only the Federacion baseline and quality gate", () => {
  const config = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
  assert.deepEqual(Object.keys(config.hooks).sort(), ["SessionStart", "Stop"]);
  for (const groups of Object.values(config.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks) {
        assert.equal(hook.type, "command");
        assert.match(hook.commandWindows, /^C:\\Progra~1\\nodejs\\node\.exe /);
        assert.match(hook.commandWindows, /\.codex\\hooks\\/);
        assert.doesNotMatch(hook.commandWindows, /powershell/i);
      }
    }
  }
  assert.doesNotMatch(config.hooks.Stop[0].hooks[0].command, /--advisory/);

  const prettierIgnore = readFileSync(".prettierignore", "utf8");
  assert.match(prettierIgnore, /^!\.codex\/hooks\.json$/m);
  assert.match(prettierIgnore, /^!\.codex\/hooks\/\*\*$/m);
});

test(
  "minimal Windows command handlers execute without a nested PowerShell",
  {
    skip:
      process.platform !== "win32" ? "Solo Windows: requiere cmd.exe" : false,
  },
  () => {
    const config = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
    const sessionId = `minimal-windows-${process.pid}`;
    const startOutput = runWindowsHook(
      config.hooks.SessionStart[0].hooks[0].commandWindows,
      {
        cwd: process.cwd(),
        hook_event_name: "SessionStart",
        session_id: sessionId,
      },
    );
    assert.equal(startOutput.hookSpecificOutput.hookEventName, "SessionStart");
    const stopOutput = runWindowsHook(
      config.hooks.Stop[0].hooks[0].commandWindows,
      {
        cwd: process.cwd(),
        hook_event_name: "Stop",
        session_id: sessionId,
        stop_hook_active: false,
      },
    );
    assert.equal(typeof stopOutput, "object");
  },
);

test("Stop command handler emits valid JSON only", async () => {
  const stopSessionId = "json-contract-stop";
  await saveSessionState(stopSessionId, {
    fingerprint: captureRelevantFingerprint(process.cwd()),
    root: process.cwd(),
  });
  const stopOutput = runHook("stop-quality-gate.mjs", {
    cwd: process.cwd(),
    hook_event_name: "Stop",
    session_id: stopSessionId,
    stop_hook_active: true,
  });
  assert.equal(typeof stopOutput, "object");
  assert.equal(stopOutput.decision, undefined);
});

test("line-ending check detects CRLF without mutating it and the formatter repairs it", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "line-ending-check-"));
  const fixturePath = path.join(root, "fixture.txt");
  const script = path.resolve("scripts/normalize-line-endings.mjs");
  try {
    spawnSync("git", ["init", "--quiet"], { cwd: root });
    writeFileSync(path.join(root, ".gitattributes"), "* text eol=lf\n");
    writeFileSync(fixturePath, "first\nsecond\n");
    spawnSync("git", ["add", "."], { cwd: root });
    writeFileSync(fixturePath, "first\r\nsecond\r\n");

    const check = spawnSync(process.execPath, [script, "--check"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(check.status, 1);
    assert.match(check.stderr, /fixture\.txt/);
    assert.equal(readFileSync(fixturePath, "utf8"), "first\r\nsecond\r\n");

    const format = spawnSync(process.execPath, [script], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(format.status, 0, format.stderr);
    assert.equal(readFileSync(fixturePath, "utf8"), "first\nsecond\n");
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
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
        evidence: "format:check failed",
      }),
      false,
    );
    assert.equal(readFileSync(statePath, "utf8"), invalid);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("hook context limits stay below the persistent-context budget", () => {
  const config = JSON.parse(readFileSync(".codex/hooks.json", "utf8"));
  assert.ok(
    config.hooks.SessionStart[0].hooks[0].additionalContextLimit <= 400,
  );
});

test("Stop blocks once and then records a human-review failure", async () => {
  const dependencies = {
    root: "C:/repo",
    state: { fingerprint: "before" },
    captureFingerprint: () => "after",
    runChecks: () => [
      {
        command: "corepack pnpm run format:check",
        ok: false,
        output: "Formatting failed",
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
