import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { publishChanges } from "../../scripts/publish-changes.mjs";
import { temporaryDirectory } from "../helpers/temporary-directory.mjs";

async function fixture(
  t,
  {
    changed = ["example.js"],
    remote = "base",
    fingerprint = "verified",
    status = "passed",
    qualityStatus = "corrected",
  } = {},
) {
  const directory = await temporaryDirectory(t, "site-publication-");
  await writeFile(
    path.join(directory, "verification.json"),
    JSON.stringify({ schemaVersion: 1, status, fingerprint: "verified" }),
  );
  await writeFile(
    path.join(directory, "quality-fix.json"),
    JSON.stringify({
      schemaVersion: 1,
      mode: "fix",
      status: qualityStatus,
      fixedFiles: ["example.js"],
    }),
  );
  const calls = [];
  return {
    calls,
    directory,
    options: {
      directory,
      summaryPath: null,
      expectedSha: "base",
      ref: "refs/heads/main",
      captureFingerprint: () => fingerprint,
      git: (args) => {
        calls.push(args);
        if (args[0] === "diff") return changed.join("\0");
        if (args[0] === "ls-files") return "";
        if (args[0] === "rev-parse")
          return calls.some((call) => call[0] === "commit") ? "saved" : "base";
        if (args[0] === "ls-remote") return `${remote}\trefs/heads/main`;
        return "";
      },
    },
  };
}

test("publication saves the verified corrections once and distinguishes Git from deployment", async (t) => {
  const f = await fixture(t);
  const result = publishChanges(f.options);
  assert.equal(result.status, "git-saved");
  assert.equal(result.sha, "saved");
  assert.equal(result.deployment, "not-confirmed");
  assert.equal(f.calls.filter((args) => args[0] === "commit").length, 1);
  assert.deepEqual(
    f.calls.find((args) => args[0] === "push"),
    ["push", "origin", "HEAD:refs/heads/main"],
  );
  assert.equal(
    JSON.parse(await readFile(path.join(f.directory, "publication.json")))
      .status,
    result.status,
  );
});

test("publication without changes performs no write or remote request", async (t) => {
  const f = await fixture(t, { changed: [] });
  assert.equal(publishChanges(f.options).status, "unchanged");
  assert.ok(
    f.calls.every(
      (args) =>
        !["ls-remote", "add", "config", "commit", "push"].includes(args[0]),
    ),
  );
});

test("publication rejects stale branches, unverified changes, failed checks and unapproved paths before writing", async (t) => {
  for (const [input, options, message] of [
    [{ remote: "newer" }, {}, /advanced/],
    [{ fingerprint: "changed" }, {}, /differs from the verified/],
    [{ status: "failed" }, {}, /successful quality/],
    [{ qualityStatus: "failed" }, {}, /successful quality/],
    [{ changed: ["unapproved.js"] }, {}, /approved publication paths/],
    [{}, { ref: "refs/pull/1/merge" }, /production branch/],
    [{}, { expectedSha: "different" }, /workflow revision/],
  ]) {
    const f = await fixture(t, input);
    assert.throws(() => publishChanges({ ...f.options, ...options }), message);
    assert.ok(
      f.calls.every(
        (args) => !["add", "config", "commit", "push"].includes(args[0]),
      ),
    );
  }
});
