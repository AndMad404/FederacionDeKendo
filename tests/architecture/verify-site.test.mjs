import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  runVerification,
  verificationSteps,
} from "../../scripts/verify-site.mjs";

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

test("site verification avoids duplicate generated-output and format checks", () => {
  const commandNames = (unitScript) =>
    verificationSteps(unitScript).map((step) => step.join(" "));

  const defaultCommands = commandNames("test:unit");
  assert.equal(
    defaultCommands.filter((command) => command === "pnpm run test:generated")
      .length,
    0,
  );
  assert.equal(
    defaultCommands.filter((command) => command === "pnpm run format:check")
      .length,
    1,
  );

  for (const unitScript of [
    "test:unit:without-sync",
    "test:unit:without-history-correction",
  ]) {
    const commands = commandNames(unitScript);
    assert.equal(
      commands.filter((command) => command === "pnpm run test:generated")
        .length,
      1,
      `${unitScript} must run generated-output exactly once`,
    );
    assert.equal(
      commands.filter((command) => command === "pnpm run format:check").length,
      1,
      `${unitScript} must run format:check exactly once`,
    );
  }
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
