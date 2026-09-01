import assert from "node:assert/strict";
import test from "node:test";

import { runVerification } from "../../scripts/verify-site.mjs";

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
