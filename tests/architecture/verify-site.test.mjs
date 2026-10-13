import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";

import {
  formatVerificationFailure,
  runVerification,
  verificationSteps,
} from "../../scripts/verify-site.mjs";

test("site verification owns checks previously delegated to local Git hooks", async () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(packageJson.scripts.prepare, undefined);
  assert.equal(packageJson.scripts["setup:git-hooks"], undefined);
  assert.equal(existsSync(".githooks/pre-commit"), false);
  assert.equal(existsSync("scripts/setup-git-hooks.mjs"), false);
});

test("both gate modes build before one complete Node suite and one browser invocation", () => {
  for (const mode of ["full", "calendar"]) {
    const commands = verificationSteps(mode).map((step) => step.join(" "));
    assert.equal(
      commands.filter((command) => command === "pnpm run test:unit").length,
      1,
    );
    assert.equal(
      commands.filter((command) =>
        command.startsWith("pnpm exec playwright test "),
      ).length,
      1,
    );
    assert.equal(
      commands.filter((command) => command === "pnpm run quality:check").length,
      1,
    );
    assert.ok(
      commands.indexOf("pnpm run build") <
        commands.indexOf("pnpm run test:unit"),
    );
  }
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.check, "pnpm run verify:site");
  assert.equal(pkg.scripts["test:unit:without-sync"], undefined);
  assert.equal(pkg.scripts["test:unit:without-history-correction"], undefined);
  assert.match(
    pkg.scripts["test:unit"],
    /tests\/architecture\/\*\.test\.mjs tests\/data\/\*\.test\.mjs/,
  );
});

test("site verification rejects results when the workspace changes", async (t) => {
  const directory = await temporaryDirectory(t, "verification-changed-");
  const fingerprints = ["before", "after"];
  assert.throws(
    () =>
      runVerification({
        root: process.cwd(),
        directory,
        captureFingerprint: () => fingerprints.shift(),
        executeStep: () => {},
      }),
    /Verification changed the workspace/,
  );
  assert.equal(
    JSON.parse(readFileSync(`${directory}/verification.json`, "utf8")).status,
    "invalid",
  );
});

test("site verification preserves a failed step when the workspace is stable", async (t) => {
  const directory = await temporaryDirectory(t, "verification-failed-");
  assert.throws(
    () =>
      runVerification({
        root: process.cwd(),
        directory,
        captureFingerprint: () => "stable",
        executeStep: () => {
          throw new Error("directed failure");
        },
      }),
    /directed failure/,
  );
  const report = JSON.parse(
    readFileSync(`${directory}/verification.json`, "utf8"),
  );
  assert.equal(report.status, "failed");
  assert.equal(report.steps[0].message, "directed failure");
});

test("site verification formats a failed phase for the GitHub job summary", () => {
  const summary = formatVerificationFailure(
    ["pnpm", "run", "quality:check"],
    new Error("pnpm run quality:check failed with exit code 1"),
  );

  assert.match(summary, /\*\*Fase que fallo:\*\* Calidad/);
  assert.match(summary, /`pnpm run quality:check`/);
  assert.match(summary, /exit code 1/);
});
