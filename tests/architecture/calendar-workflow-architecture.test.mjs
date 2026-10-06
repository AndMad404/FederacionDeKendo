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
    assert.equal(steps[gate].with.mode, "calendar");
    assert.equal(steps[commit].id, "publication");
    assert.equal(
      steps[commit].if,
      undefined,
      "design cannot condition publication",
    );
    const review = stepIndex(
      steps,
      (step) => step.uses === "./.github/actions/calendar-design-review",
      `${file}: post-publication review`,
    );
    assert.ok(
      commit < review,
      `${file}: review and notification must follow push`,
    );
    assert.equal(steps[review].if, "${{ always() }}");
    assert.equal(
      steps[review].with["git-saved"],
      "${{ steps.publication.outcome == 'success' }}",
    );
    assert.match(
      steps[review].with.recipient,
      /secrets.CALENDAR_ALERT_RECIPIENT/,
    );
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

test("post-publication design review, fallback, delivery and artifacts remain independent of Git publication", async () => {
  const steps = actionSteps(
    await loadYamlDocument(".github/actions/calendar-design-review/action.yml"),
  );
  const review = steps.find((step) => step.id === "review");
  assert.equal(review.continueOnError ?? review["continue-on-error"], true);
  assert.match(review.if, /inputs.git-saved == 'true'/);
  const fallback = steps.find(
    (step) => step.name === "Report incomplete design review",
  );
  assert.equal(fallback.env.CALENDAR_LAYOUT_FORCE_INCOMPLETE, "true");
  assert.match(fallback.if, /steps.review.outcome == 'failure'/);
  const send = steps.find((step) => step.id === "delivery");
  assert.match(send.run, /smtp.gmail.com:465/);
  assert.match(send.if, /always\(\)/);
  assert.ok(
    steps
      .filter((step) => step.uses === "actions/upload-artifact@v6")
      .every((step) => step.if === "${{ always() }}"),
  );
  assert.doesNotMatch(
    steps.map((step) => step.run ?? "").join("\n"),
    /git (?:reset|revert|checkout|push|commit)/,
  );
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
    ["pnpm", "exec", "playwright", "install", "--with-deps", "chromium"],
    ["pnpm", "exec", "playwright", "test", "tests/data"],
    ["pnpm", "run", "test:behavior"],
    ["pnpm", "run", "test:design"],
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
  const syncWorkflow = await loadYamlDocument(
    ".github/workflows/sync-calendar.yml",
  );
  const syncSteps = workflowSteps(syncWorkflow);
  const correctionSteps = workflowSteps(
    await loadYamlDocument(
      ".github/workflows/correct-calendar-history-range.yml",
    ),
  );
  const artifactName = "calendar-notification-reports";
  assert.ok(
    syncSteps.some(
      (step) => step.uses === "./.github/actions/calendar-design-review",
    ),
  );
  const reviewAction = await loadYamlDocument(
    ".github/actions/calendar-design-review/action.yml",
  );
  const upload = actionSteps(reviewAction).find(
    (step) => step.uses === "actions/upload-artifact@v6",
    // Evidence has a separate artifact from the historical correction report.
  );
  const download = correctionSteps.find(
    (step) => step.uses === "actions/download-artifact@v5",
  );
  const reportUpload = actionSteps(reviewAction).find(
    (step) => step.with?.name === artifactName,
  );
  assert.ok(upload);
  assert.equal(reportUpload?.with?.name, artifactName);
  assert.equal(download?.with?.name, artifactName);
  assert.match(
    reportUpload?.with?.path ?? "",
    /calendar-historical-changes\.json/,
  );
  assert.equal(syncWorkflow.permissions?.issues, undefined);
  assert.equal(
    syncSteps.some((step) => step.run?.match(/exit\s+1/)),
    false,
  );
  assert.ok(
    correctionSteps.some((step) =>
      step.run?.includes("--report calendar-historical-changes.json"),
    ),
  );
});

test("range workflow requires an approved report run and an inclusive date range", async () => {
  const workflow = await loadYamlDocument(
    ".github/workflows/correct-calendar-history-range.yml",
  );
  const inputs = workflow.on?.workflow_dispatch?.inputs;
  assert.ok(inputs?.report_run_id);
  assert.ok(inputs?.from);
  assert.ok(inputs?.to);
  const steps = workflowSteps(workflow);
  const commands = steps
    .map((step) => step.run)
    .filter(Boolean)
    .join("\n");
  assert.match(commands, /correct:calendar-history-range/);
  assert.match(commands, /sync:approved-historical-galleries/);
  assert.match(
    commands,
    /rm -f calendar-historical-changes\.json calendar-notifications\.json/,
  );
  assert.ok(
    Object.values(workflow.jobs ?? {}).some((job) => job.env?.CALENDAR_ICS_URL),
    "workflow must provide CALENDAR_ICS_URL",
  );
  assert.match(commands, /eventGalleries\.ts/);
  assert.match(commands, /eventGalleryState\.json/);
  assert.doesNotMatch(commands, /correct:calendar-history-range -- --report/);
  assert.equal(workflow.permissions?.issues, undefined);
});
