import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import path from "node:path";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";
import {
  createHandoff,
  validateHandoff,
  restoreHandoff,
} from "../../scripts/calendar-handoff.mjs";

import {
  formatVerificationFailure,
  captureWorkspaceFingerprint,
  retainCorrections,
  runVerification,
  verificationSteps,
} from "../../scripts/verify-site.mjs";

test("verified handoffs preserve source, binaries, build and notifications across jobs", async (t) => {
  const root = await temporaryDirectory(t, "verified-source-");
  const temporary = await temporaryDirectory(t, "verified-handoff-");
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const put = (file, contents) => {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  git("init");
  git("config", "user.name", "CI test");
  git("config", "user.email", "ci@example.test");
  git("config", "core.autocrlf", "false");
  for (const [file, contents] of Object.entries({
    ".gitignore": "dist/\n",
    "manifest.json": "old\n",
    "obsolete.webp": Buffer.from([0, 1, 255]),
  }))
    put(path.join(root, file), contents);
  git("add", ".");
  git("commit", "-m", "fixture");
  put(path.join(root, "manifest.json"), "new\n");
  unlinkSync(path.join(root, "obsolete.webp"));
  put(path.join(root, "new.webp"), Buffer.from([0, 255, 128, 0]));
  put(path.join(root, "dist/index.html"), "verified HTML");
  const env = {
    GITHUB_SHA: git("rev-parse", "HEAD"),
    GITHUB_REPOSITORY: "owner/site",
    GITHUB_RUN_ID: "123",
    GITHUB_RUN_ATTEMPT: "1",
  };
  const options = {
    root,
    temporary,
    env,
    kind: "calendar",
    directory: path.join(temporary, "bundle"),
    reports: path.join(temporary, "evidence"),
  };
  const verified = captureWorkspaceFingerprint(root);
  const indexBefore = git("diff", "--cached", "--binary");
  retainCorrections(root, options.reports);
  assert.equal(git("diff", "--cached", "--binary"), indexBefore);
  put(
    path.join(options.reports, "verification.json"),
    JSON.stringify({
      schemaVersion: 1,
      sha: env.GITHUB_SHA,
      status: "passed",
      fingerprint: verified,
    }),
  );
  put(
    path.join(options.reports, "quality-fix.json"),
    JSON.stringify({
      schemaVersion: 1,
      sha: env.GITHUB_SHA,
      mode: "fix",
      status: "clean",
      fixedFiles: [],
    }),
  );
  const notifications = path.join(temporary, "calendar-notifications.json");
  put(notifications, '{"version":1,"notifications":[]}');
  createHandoff({ ...options, ready: true });
  for (const [key, value] of [
    ["GITHUB_SHA", "a".repeat(40)],
    ["GITHUB_RUN_ID", "999"],
    ["GITHUB_RUN_ATTEMPT", "2"],
    ["GITHUB_REPOSITORY", "other/site"],
  ])
    assert.throws(
      () => validateHandoff({ ...options, env: { ...env, [key]: value } }),
      /origin/,
    );
  const html = path.join(options.directory, "build/index.html");
  writeFileSync(html, "tampered");
  assert.throws(() => validateHandoff(options), /checksum/);
  unlinkSync(html);
  assert.throws(() => validateHandoff(options), /missing/);
  writeFileSync(html, "verified HTML");
  const failed = { ...options, directory: path.join(temporary, "failed") };
  createHandoff({ ...failed, ready: false });
  assert.throws(
    () => validateHandoff({ ...failed, requireReady: true }),
    /not ready/,
  );
  git("reset", "--hard", "HEAD");
  unlinkSync(path.join(root, "new.webp"));
  unlinkSync(path.join(root, "dist/index.html"));
  unlinkSync(notifications);
  restoreHandoff(options);
  assert.equal(captureWorkspaceFingerprint(root), verified);
  assert.equal(
    readFileSync(path.join(root, "dist/index.html"), "utf8"),
    "verified HTML",
  );
  assert.ok(existsSync(notifications));
});

test("site verification owns checks previously delegated to local Git hooks", async () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(packageJson.scripts.prepare, undefined);
  assert.equal(packageJson.scripts["setup:git-hooks"], undefined);
  assert.equal(existsSync(".githooks/pre-commit"), false);
  assert.equal(existsSync("scripts/setup-git-hooks.mjs"), false);
});

test("both gate modes build before one complete Node suite and one browser invocation", () => {
  assert.throws(
    () => verificationSteps("arbitrary-command"),
    /Unsupported verification mode/,
  );
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

for (const failures of [2, 3]) {
  test(
    "Chromium installation " +
      (failures === 2
        ? "recovers after retries"
        : "stops before browser tests when retries are exhausted"),
    async (t) => {
      for (const mode of ["full", "calendar"]) {
        const directory = await temporaryDirectory(t, "verification-retry-");
        const waits = [];
        let installations = 0;
        let browserRuns = 0;
        const verify = () =>
          runVerification({
            root: process.cwd(),
            mode,
            directory,
            captureFingerprint: () => "stable",
            wait: (milliseconds) => waits.push(milliseconds),
            executeStep: (_root, command) => {
              if (command.includes("install") && ++installations <= failures)
                throw Object.assign(new Error("installation failed"), {
                  exitCode: 1,
                });
              if (command.includes("test")) browserRuns++;
            },
          });
        if (failures === 2) verify();
        else assert.throws(verify, /installation failed/);
        const report = JSON.parse(
          readFileSync(path.join(directory, "verification.json"), "utf8"),
        );
        assert.equal(report.status, failures === 2 ? "passed" : "failed");
        assert.equal(installations, 3);
        assert.equal(browserRuns, failures === 2 ? 1 : 0);
        assert.deepEqual(waits, [30_000, 30_000]);
        const installation = report.steps.find((step) =>
          step.command.includes("install"),
        );
        assert.equal(installation.attempts, 3);
        if (failures === 3) assert.equal(installation.exitCode, 1);
      }
    },
  );
}
