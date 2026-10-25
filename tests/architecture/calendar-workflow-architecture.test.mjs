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

test("workflow expressions use contexts available before and after runner allocation", async () => {
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/sync-calendar.yml",
    ".github/workflows/correct-calendar-history-range.yml",
    ".github/workflows/apply-calendar-editorial-decision.yml",
  ]) {
    const workflow = await loadYamlDocument(file);
    for (const job of Object.values(workflow.jobs)) {
      assert.doesNotMatch(
        JSON.stringify(job.env ?? {}),
        /\$\{\{[^}]*\brunner\./,
        `${file}: job env cannot use the runner context`,
      );
      for (const step of job.steps) {
        assert.doesNotMatch(
          JSON.stringify(step.with ?? {}),
          /\$\{\{[^}]*\b(?:failure|success|always|cancelled)\s*\(/,
          `${file}: status functions belong in step conditions, not action inputs`,
        );
      }
    }
  }
});

test("shared project setup configures Node before enabling pnpm and disables premature caching", async () => {
  const action = await loadYamlDocument(
    ".github/actions/setup-project/action.yml",
  );
  assert.equal(action.runs.using, "composite");
  const steps = actionSteps(action);
  const node = stepIndex(
    steps,
    (step) => step.uses === "actions/setup-node@v5",
    "Node setup",
  );
  assert.equal(steps[node].with["node-version"], 22);
  assert.equal(steps[node].with["check-latest"], true);
  assert.equal(steps[node].with["package-manager-cache"], false);
  assert.equal(steps[node].with.cache, undefined);
  const corepack = stepIndex(
    steps,
    (step) => step.run === "corepack enable",
    "Corepack",
  );
  const install = stepIndex(
    steps,
    (step) => step.run === "pnpm install --frozen-lockfile",
    "dependency installation",
  );
  assert.ok(node < corepack && corepack < install);
  for (const step of steps.filter((step) => step.run)) {
    assert.equal(step.shell, "bash");
  }
});

test("all workflows use shared project setup after checkout and before project commands", async () => {
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/sync-calendar.yml",
    ".github/workflows/correct-calendar-history-range.yml",
    ".github/workflows/apply-calendar-editorial-decision.yml",
  ]) {
    const document = await loadYamlDocument(file);
    const steps = document.jobs.verify?.steps ?? workflowSteps(document);
    const setup = stepIndex(
      steps,
      (step) => step.uses === "./.github/actions/setup-project",
      `${file}: project setup`,
    );
    const checkout = stepIndex(
      steps,
      (step) => step.uses === "actions/checkout@v5",
      `${file}: checkout`,
    );
    assert.ok(checkout < setup, file);
    assert.equal(
      steps.filter((step) => step.uses === "./.github/actions/setup-project")
        .length,
      1,
      file,
    );
    assert.equal(
      steps.some((step) => step.uses?.startsWith("actions/setup-node@")),
      false,
      file,
    );
    for (const [index, step] of steps.entries()) {
      if (step.run) {
        assert.doesNotMatch(step.run, /corepack enable|pnpm install/, file);
        assert.ok(setup < index, `${file}: setup must precede commands`);
      }
    }
  }
});

test("writer workflows verify once before guarded publication and finalize afterwards", async () => {
  const cases = [
    [".github/workflows/sync-calendar.yml", "Commit calendar changes"],
    [
      ".github/workflows/apply-calendar-editorial-decision.yml",
      "Commit recorded decision",
    ],
    [
      ".github/workflows/correct-calendar-history-range.yml",
      "Commit approved historical range",
    ],
  ];

  for (const [file, commitName] of cases) {
    const steps = workflowSteps(await loadYamlDocument(file));
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
    assert.ok(gate < commit, `${file}: gate must precede commit`);
    assert.match(steps[commit].run, /node scripts\/publish-changes\.mjs/);
    const workflow = await loadYamlDocument(file);
    assert.equal(workflow.concurrency.group, "site-writer-${{ github.ref }}");
    assert.equal(workflow.concurrency["cancel-in-progress"], false);
    assert.equal(workflow.concurrency.queue, "max");
    assert.equal(
      steps.some((step) => step.run?.includes("test:sync-directed")),
      false,
    );
    assert.equal(steps[gate].with.mode, "calendar");
    assert.equal(steps[gate].id, "verification");
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
      steps[review].with["publication-failed"],
      "${{ steps.verification.outcome == 'failure' || steps.publication.outcome == 'failure' }}",
    );
    assert.equal(
      steps[review].with["failed-step"],
      "${{ steps.verification.outcome == 'failure' && 'site verification' || 'Git publication' }}",
    );
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
  assert.equal(send.run, "node scripts/send-calendar-notification-email.mjs");
  assert.equal(send.env.CALENDAR_GIT_SAVED, "${{ inputs.git-saved }}");
  assert.match(send.if, /always\(\)/);
  assert.ok(
    steps
      .filter((step) => step.uses === "actions/upload-artifact@v6")
      .every((step) => step.if.includes("always()")),
  );
  const designUpload = steps.find(
    (step) => step.with?.name === "calendar-design-review",
  );
  assert.match(designUpload.if, /steps.evidence.outputs.available == 'true'/);
  const evidence = steps.find((step) => step.id === "evidence");
  assert.match(evidence.run, /-d .*calendar-design-review/);
  assert.match(evidence.run, /-f .*publication.json/);
  const failure = steps.find(
    (step) => step.name === "Emit verification failure notification",
  );
  assert.equal(failure.env.CALENDAR_FAILED_STEP, "${{ inputs.failed-step }}");
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
  assert.ok(
    commands.some((command) => command.includes("pnpm run quality:fix")),
  );
  assert.ok(
    commands.some((command) => command.includes("pnpm run verify:site")),
  );
  assert.ok(
    actionSteps(action).some(
      (step) =>
        step.uses === "actions/upload-artifact@v6" &&
        step.if === "${{ always() }}",
    ),
  );

  const { verificationSteps } = await import("../../scripts/verify-site.mjs");
  for (const mode of ["full", "calendar"]) {
    assert.equal(
      verificationSteps(mode).filter((step) => step.includes("test:unit"))
        .length,
      1,
    );
    assert.equal(
      verificationSteps(mode).filter(
        (step) => step.includes("test") && step.includes("playwright"),
      ).length,
      1,
    );
  }
  assert.throws(
    () => verificationSteps("arbitrary-command"),
    /Unsupported verification mode/,
  );

  const ci = await loadYamlDocument(".github/workflows/ci.yml");
  assert.ok(Object.hasOwn(ci.on ?? {}, "push"));
  assert.ok(Object.hasOwn(ci.on ?? {}, "pull_request"));
  const jobs = Object.values(ci.jobs ?? {});
  assert.equal(ci.permissions.contents, "read");
  assert.equal(ci.concurrency.queue, "max");
  assert.equal(ci.concurrency["cancel-in-progress"], false);
  assert.equal(ci.jobs["publish-fixes"].permissions.contents, "write");
  assert.match(ci.jobs["publish-fixes"].if, /event_name == 'push'/);
  assert.equal(ci.jobs["publish-fixes"].needs, "verify");
  const publisher = ci.jobs["publish-fixes"];
  const download = publisher.steps.find(
    (step) => step.uses === "actions/download-artifact@v5",
  );
  const upload = publisher.steps.find(
    (step) => step.uses === "actions/upload-artifact@v6",
  );
  assert.equal(download.with.path, "${{ env.VERIFY_SITE_REPORT_DIR }}");
  assert.equal(
    upload.with.path,
    "${{ env.VERIFY_SITE_REPORT_DIR }}/publication.json",
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
  assert.match(commands, /publish-changes\.mjs history/);
  assert.doesNotMatch(commands, /correct:calendar-history-range -- --report/);
  assert.equal(workflow.permissions?.issues, undefined);
});
