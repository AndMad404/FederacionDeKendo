import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { runVerification } from "../../scripts/verify-site.mjs";

test("site verification owns checks previously delegated to local Git hooks", async () => {
  const { verificationSteps } = await import("../../scripts/verify-site.mjs");
  const steps = verificationSteps().map((step) => step.join(" "));
  assert.ok(steps.includes("pnpm run format:line-endings:check"));
  assert.ok(steps.includes("git diff --check"));
  assert.ok(steps.includes("git diff --cached --check"));

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(packageJson.scripts.prepare, undefined);
  assert.equal(packageJson.scripts["setup:git-hooks"], undefined);
  assert.equal(existsSync(".githooks/pre-commit"), false);
  assert.equal(existsSync("scripts/setup-git-hooks.mjs"), false);
});

test("site verification rejects results when the workspace changes", () => {
  const fingerprints = ["before", "after"];
  assert.throws(
    () =>
      runVerification({
        root: process.cwd(),
        unitScript: "test:unit",
        captureFingerprint: () => fingerprints.shift(),
        executeStep: () => {},
      }),
    /Verification changed the workspace/,
  );
});

test("site verification preserves a failed step when the workspace is stable", () => {
  assert.throws(
    () =>
      runVerification({
        root: process.cwd(),
        unitScript: "test:unit",
        captureFingerprint: () => "stable",
        executeStep: () => {
          throw new Error("directed failure");
        },
      }),
    /directed failure/,
  );
});
