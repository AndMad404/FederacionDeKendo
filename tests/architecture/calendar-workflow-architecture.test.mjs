import assert from "node:assert/strict";
import test from "node:test";
import {
  actionSteps,
  loadYamlDocument,
} from "../helpers/load-yaml-document.mjs";
import { validateHistoricalRun } from "../../scripts/calendar-workflow-inputs.mjs";

const workflow = (name) => loadYamlDocument(`.github/workflows/${name}.yml`);
const action = (name) => loadYamlDocument(`.github/actions/${name}/action.yml`);
const uses = (steps, name) =>
  steps.find((step) => step.uses?.startsWith(`${name}@`));

test("workflows restrict writes, credentials and executable inputs and pin external actions", async () => {
  for (const name of ["ci", "sync-calendar"]) {
    const document = await workflow(name);
    assert.equal(document.permissions.contents, "read", name);
    assert.match(document.concurrency.group, /site-writer-/);
    assert.equal(document.concurrency["cancel-in-progress"], false);
    for (const [id, job] of Object.entries(document.jobs)) {
      assert.equal(
        job.permissions?.contents ?? document.permissions.contents,
        ["publish", "publish-fixes"].includes(id) ? "write" : "read",
      );
      assert.equal(
        job["timeout-minutes"],
        id.startsWith("publish") ? 10 : id === "finalize" ? 30 : 60,
      );
      assert.doesNotMatch(JSON.stringify(job.env ?? {}), /secrets\.|runner\./);
      assert.equal(
        uses(job.steps, "actions/checkout").with["persist-credentials"],
        false,
      );
      for (const step of job.steps) {
        if (step.uses && !step.uses.startsWith("./"))
          assert.match(step.uses, /^[\w/-]+@[a-f0-9]{40}$/);
        if (step.run) assert.doesNotMatch(step.run, /\$\{\{\s*inputs\./);
      }
      if (id.startsWith("publish")) {
        assert.match(job.if, /refs\/heads\/main/);
        assert.doesNotMatch(
          JSON.stringify(job.steps),
          /pnpm|npm |setup-project/,
        );
      }
    }
  }
  for (const name of ["setup-project", "verify-site", "calendar-design-review"])
    for (const step of actionSteps(await action(name)))
      if (step.uses) assert.match(step.uses, /^[\w/-]+@[a-f0-9]{40}$/);
  const bot = await loadYamlDocument(".github/dependabot.yml");
  assert.equal(bot.updates[0]["package-ecosystem"], "github-actions");
  assert.equal(bot.updates[0].schedule.interval, "weekly");
});

test("calendar publication requires verified evidence from this attempt", async () => {
  const { prepare, publish, finalize } = (await workflow("sync-calendar")).jobs;
  assert.equal(publish.needs, "prepare");
  assert.match(publish.if, /needs.prepare.result == 'success'/);
  assert.equal(
    prepare.steps.find((step) => step.id === "verification").with.mode,
    "calendar",
  );
  assert.match(
    prepare.steps.find((step) => step.id === "handoff").env.CALENDAR_PREPARED,
    /steps.verification.outcome == 'success'/,
  );
  const download = uses(publish.steps, "actions/download-artifact");
  const upload = uses(prepare.steps, "actions/upload-artifact");
  assert.equal(download.with.name, upload.with.name);
  assert.match(download.with.name, /github.run_attempt/);
  assert.match(download.with.path, /runner.temp/);
  assert.equal(download.with["run-id"], undefined);
  assert.match(uses(publish.steps, "actions/checkout").with.ref, /github.sha/);
  assert.equal(
    publish.steps.find((step) => step.id === "publication").run,
    "node scripts/calendar-handoff.mjs publish",
  );
  assert.deepEqual(finalize.needs, ["prepare", "publish"]);
  assert.match(finalize.if, /always\(\)/);
  assert.equal(
    finalize.steps.find((step) => step.id === "restore").run,
    "node scripts/calendar-handoff.mjs restore",
  );
  const review = finalize.steps.find(
    (step) => step.uses === "./.github/actions/calendar-design-review",
  );
  assert.match(
    review.with["git-saved"],
    /needs.publish.outputs.git-saved == 'true'/,
  );
  assert.match(
    review.with["publication-failed"],
    /needs.prepare.result.*needs.publish.result/,
  );
});

test("CI verifies pull requests but publishes corrections only after verification on main pushes", async () => {
  const ci = await workflow("ci");
  assert.ok(
    Object.hasOwn(ci.on, "push") && Object.hasOwn(ci.on, "pull_request"),
  );
  assert.ok(
    ci.jobs.verify.steps.some(
      (step) => step.uses === "./.github/actions/verify-site",
    ),
  );
  const publish = ci.jobs["publish-fixes"];
  assert.equal(publish.needs, "verify");
  assert.match(publish.if, /event_name == 'push'/);
  assert.ok(
    publish.steps.some(
      (step) => step.run === "node scripts/calendar-handoff.mjs site",
    ),
  );
});

test("design failures cannot undo publication and SMTP credentials are scoped to delivery", async () => {
  const steps = actionSteps(await action("calendar-design-review"));
  assert.equal(
    steps.find((step) => step.id === "review")["continue-on-error"],
    true,
  );
  const delivery = steps.find((step) => step.id === "delivery");
  assert.match(delivery.if, /always\(\)/);
  assert.match(delivery.env.CALENDAR_GIT_SAVED, /inputs.git-saved/);
  for (const step of steps) {
    if (step.env?.CALENDAR_ALERT_SMTP_APP_PASSWORD)
      assert.equal(step.id, "delivery");
    assert.doesNotMatch(
      step.run ?? "",
      /git (?:reset|revert|checkout|push|commit)/,
    );
  }
  assert.ok(
    steps.some(
      (step) =>
        step.with?.name === "calendar-notification-reports" &&
        step.if.includes("always()"),
    ),
  );
});

test("historical report validation requires a successful main calendar run from this repository", async () => {
  const env = {
    CALENDAR_FROM: "2026-01-01",
    CALENDAR_TO: "2026-03-01",
    CALENDAR_REPORT_RUN_ID: "123",
    GITHUB_REPOSITORY: "owner/site",
  };
  const run = {
    id: 123,
    repository: { full_name: "owner/site" },
    head_repository: { full_name: "owner/site" },
    head_branch: "main",
    path: ".github/workflows/sync-calendar.yml",
    conclusion: "success",
    event: "schedule",
  };
  const request = (value) => async () => ({
    ok: true,
    json: async () => value,
  });
  await validateHistoricalRun(env, request(run));
  for (const change of [
    { id: 999 },
    { path: ".github/workflows/ci.yml" },
    { head_branch: "feature" },
    { conclusion: "failure" },
    { head_repository: { full_name: "fork/site" } },
    { event: "pull_request" },
  ])
    await assert.rejects(
      validateHistoricalRun(env, request({ ...run, ...change })),
      /Historical reports/,
    );
});
