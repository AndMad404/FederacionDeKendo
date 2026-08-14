import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

async function workflow(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function assertBefore(source, first, second) {
  assert.ok(source.indexOf(first) >= 0, `Missing ${first}`);
  assert.ok(source.indexOf(second) >= 0, `Missing ${second}`);
  assert.ok(
    source.indexOf(first) < source.indexOf(second),
    `${first} must precede ${second}`,
  );
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
      "tests/calendar-history-correction.test.mjs",
      "Commit approved historical range",
    ],
  ];

  for (const [file, directedTest, commit] of cases) {
    const source = await workflow(file);
    assertBefore(source, directedTest, "uses: ./.github/actions/verify-site");
    assertBefore(source, "uses: ./.github/actions/verify-site", commit);
  }
});

test("Phase 6: the shared gate and human CI coverage remain complete", async () => {
  const action = await workflow(".github/actions/verify-site/action.yml");
  for (const command of [
    "pnpm run typecheck",
    "pnpm run build",
    "pnpm run test:generated",
    "pnpm exec playwright install --with-deps chromium",
    "pnpm run test:e2e",
  ]) {
    assert.match(
      action,
      new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
  assert.match(action, /run: \$\{\{ inputs\.unit-command \}\}/);

  const ci = await workflow(".github/workflows/ci.yml");
  assert.match(ci, /push:/);
  assert.match(ci, /pull_request:/);
  assert.match(ci, /if: github\.actor != 'github-actions\[bot\]'/);
  assert.match(ci, /uses: \.\/\.github\/actions\/verify-site/);
});

test("Phase 6: historical correction downloads the artifact produced by synchronization", async () => {
  const sync = await workflow(".github/workflows/sync-calendar.yml");
  const correction = await workflow(
    ".github/workflows/correct-calendar-history-range.yml",
  );
  const artifactName = "calendar-notification-reports";

  assert.match(sync, new RegExp(`name: ${artifactName}`));
  assert.match(correction, new RegExp(`name: ${artifactName}`));
  assert.match(sync, /calendar-historical-changes\.json/);
  assert.match(correction, /--report calendar-historical-changes\.json/);
});
