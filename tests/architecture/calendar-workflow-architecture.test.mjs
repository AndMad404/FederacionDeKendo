import assert from "node:assert/strict";
import test from "node:test";

import {
  actionSteps,
  loadYamlDocument,
  workflowSteps,
} from "../helpers/load-yaml-document.mjs";

function stepIndex(steps, predicate, description) {
  const index = steps.findIndex(predicate);
  assert.notEqual(index, -1, `Missing ${description}`);
  return index;
}

test("Phase 6: writer workflows run their directed test and shared gate before committing", async () => {
  const cases = [
    [
      ".github/workflows/sync-calendar.yml",
      "pnpm run test:sync-directed",
      "Commit calendar changes",
    ],
    [
      ".github/workflows/apply-calendar-editorial-decision.yml",
      "pnpm run test:sync-directed",
      "Commit recorded decision",
    ],
    [
      ".github/workflows/correct-calendar-history-range.yml",
      "tests/data/calendar-history-correction.test.mjs",
      "Commit approved historical range",
    ],
  ];

  for (const [file, directedTest, commitName] of cases) {
    const steps = workflowSteps(await loadYamlDocument(file));
    const directed = stepIndex(
      steps,
      (step) => step.run?.includes(directedTest),
      `${file}: directed test`,
    );
    const gate = stepIndex(
      steps,
      (step) => step.uses === "./.github/actions/verify-site",
      `${file}: shared gate`,
    );
    const commit = stepIndex(
      steps,
      (step) => step.name === commitName,
      `${file}: commit`,
    );
    assert.ok(directed < gate, `${file}: directed test must precede gate`);
    assert.ok(gate < commit, `${file}: gate must precede commit`);
  }
});

test("Calendar synchronization only commits staged content changes", async () => {
  const steps = workflowSteps(
    await loadYamlDocument(".github/workflows/sync-calendar.yml"),
  );
  const commit = steps.find((step) => step.name === "Commit calendar changes");
  assert.ok(commit?.run, "missing calendar commit script");
  const stage = commit.run.indexOf('git add -A -- "${sync_paths[@]}"');
  const diff = commit.run.indexOf("git diff --cached --quiet");
  const write = commit.run.indexOf(
    'git commit -m "chore: sync calendar events"',
  );
  assert.ok(stage >= 0 && stage < diff && diff < write);
});

test("Phase 6: the shared gate and human CI coverage remain complete", async () => {
  const action = await loadYamlDocument(
    ".github/actions/verify-site/action.yml",
  );
  const commands = actionSteps(action)
    .map((step) => step.run)
    .filter(Boolean);
  assert.equal(commands.length, 1);
  assert.match(commands[0], /pnpm run verify:site/);
  assert.match(commands[0], /inputs\.unit-script/);

  const { verificationSteps } = await import("../../scripts/verify-site.mjs");
  assert.deepEqual(verificationSteps(), [
    ["pnpm", "run", "format:line-endings:check"],
    ["pnpm", "run", "lint"],
    ["pnpm", "run", "format:check"],
    ["git", "diff", "--check"],
    ["git", "diff", "--cached", "--check"],
    ["pnpm", "run", "typecheck"],
    ["pnpm", "run", "build"],
    ["pnpm", "run", "test:unit"],
    ["pnpm", "run", "test:generated"],
    ["pnpm", "exec", "playwright", "install", "--with-deps", "chromium"],
    ["pnpm", "exec", "playwright", "test", "tests/data"],
    ["pnpm", "run", "test:behavior"],
    ["pnpm", "run", "test:design"],
    ["pnpm", "run", "format:check"],
  ]);
  assert.throws(
    () => verificationSteps("arbitrary-command"),
    /Unsupported unit script/,
  );

  const ci = await loadYamlDocument(".github/workflows/ci.yml");
  assert.ok(Object.hasOwn(ci.on ?? {}, "push"));
  assert.ok(Object.hasOwn(ci.on ?? {}, "pull_request"));
  const jobs = Object.values(ci.jobs ?? {});
  assert.ok(
    jobs.some((job) => job.if === "github.actor != 'github-actions[bot]'"),
  );
  assert.ok(
    jobs.some((job) =>
      job.steps?.some((step) => step.uses === "./.github/actions/verify-site"),
    ),
  );
});

test("Phase 6: historical correction downloads the artifact produced by synchronization", async () => {
  const syncSteps = workflowSteps(
    await loadYamlDocument(".github/workflows/sync-calendar.yml"),
  );
  const correctionSteps = workflowSteps(
    await loadYamlDocument(
      ".github/workflows/correct-calendar-history-range.yml",
    ),
  );
  const artifactName = "calendar-notification-reports";
  const upload = syncSteps.find(
    (step) => step.uses === "actions/upload-artifact@v5",
  );
  const download = correctionSteps.find(
    (step) => step.uses === "actions/download-artifact@v5",
  );
  assert.equal(upload?.with?.name, artifactName);
  assert.equal(download?.with?.name, artifactName);
  assert.match(upload?.with?.path ?? "", /calendar-historical-changes\.json/);
  assert.ok(
    correctionSteps.some((step) =>
      step.run?.includes("--report calendar-historical-changes.json"),
    ),
  );
});
