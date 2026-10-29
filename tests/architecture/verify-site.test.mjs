import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import path from "node:path";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";

import {
  formatVerificationFailure,
  captureWorkspaceFingerprint,
  retainCorrections,
  runVerification,
  verificationSteps,
} from "../../scripts/verify-site.mjs";

test("CI corrections restore new binary files, modifications and deletions with the verified fingerprint", async (t) => {
  const root = await temporaryDirectory(t, "verification-patch-");
  const git = (...args) => execFileSync("git", args, { cwd: root });
  git("init");
  git("config", "user.name", "CI test");
  git("config", "user.email", "ci@example.test");
  git("config", "core.autocrlf", "false");
  writeFileSync(path.join(root, "manifest.json"), "old\n");
  writeFileSync(path.join(root, "obsolete.webp"), Buffer.from([0, 1, 2]));
  git("add", ".");
  git("commit", "-m", "fixture");
  writeFileSync(path.join(root, "manifest.json"), "new\n");
  unlinkSync(path.join(root, "obsolete.webp"));
  writeFileSync(path.join(root, "new.webp"), Buffer.from([0, 255, 128, 0]));
  const verified = captureWorkspaceFingerprint(root);
  const indexBefore = git("diff", "--cached", "--binary");
  const action = readFileSync(".github/actions/verify-site/action.yml", "utf8");
  assert.match(action, /node scripts\/verify-site\.mjs --retain-corrections/);
  const reports = await temporaryDirectory(t, "corrections-report-");
  retainCorrections(root, reports);
  const patch = readFileSync(path.join(reports, "corrections.patch"));
  assert.deepEqual(git("diff", "--cached", "--binary"), indexBefore);
  assert.equal(captureWorkspaceFingerprint(root), verified);
  git("reset", "--hard", "HEAD");
  unlinkSync(path.join(root, "new.webp"));
  execFileSync("git", ["apply", "--binary", "-"], { cwd: root, input: patch });
  assert.equal(captureWorkspaceFingerprint(root), verified);
});

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
