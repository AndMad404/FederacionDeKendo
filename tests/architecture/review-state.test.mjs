import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseReviewStateMarkdown,
  serializeReviewStateMarkdown,
  updateReviewStateAtomically,
  validateReviewState,
} from "../../.codex/review-state.mjs";

import { reviewStateMarkdown as canonical } from "../fixtures/review-state.mjs";

function copyState() {
  return structuredClone(parseReviewStateMarkdown(canonical));
}

test("canonical parser rejects malformed, duplicate-key, and missing-field JSON", () => {
  assert.throws(
    () =>
      parseReviewStateMarkdown(
        canonical.replace('"schemaVersion": 4', '"schemaVersion":'),
      ),
    /JSON parse failed/,
  );
  assert.throws(
    () =>
      parseReviewStateMarkdown(
        canonical.replace(
          '"schemaVersion": 4',
          '"schemaVersion": 4,\r\n  "schemaVersion": 4',
        ),
      ),
    /not canonically serialized/,
  );
  const missing = copyState();
  delete missing.coverageNote;
  assert.throws(() => serializeReviewStateMarkdown(missing), /coverageNote/);
});

test("schema rejects duplicate active and resolved record identities", () => {
  const duplicateOpen = copyState();
  duplicateOpen.openFindings.push(
    structuredClone(duplicateOpen.openFindings[0]),
  );
  assert.throws(() => validateReviewState(duplicateOpen), /openFindings.id/);

  const duplicateResolved = copyState();
  duplicateResolved.resolvedIndex.push(
    structuredClone(duplicateResolved.resolvedIndex[0]),
  );
  assert.throws(
    () => validateReviewState(duplicateResolved),
    /resolvedIndex.recordKey/,
  );
});

test("schema requires explicit declarations for historical and reopened collisions", () => {
  const undeclaredHistorical = copyState();
  undeclaredHistorical.idConflicts = undeclaredHistorical.idConflicts.filter(
    (entry) => entry.sourceId !== "EXAMPLE-DUPLICATE",
  );
  assert.throws(
    () => validateReviewState(undeclaredHistorical),
    /duplicate resolved id EXAMPLE-DUPLICATE/,
  );

  const undeclaredReopen = copyState();
  undeclaredReopen.idConflicts = undeclaredReopen.idConflicts.filter(
    (entry) => entry.sourceId !== "EXAMPLE-REOPENED",
  );
  assert.throws(
    () => validateReviewState(undeclaredReopen),
    /open and resolved id EXAMPLE-REOPENED/,
  );
});

test("atomic updater leaves invalid state byte-for-byte unchanged", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "review-state-invalid-"));
  const statePath = path.join(root, "review-state.md");
  try {
    const invalid = canonical.replace(
      '"schemaVersion": 4',
      '"schemaVersion": 4,\r\n  "schemaVersion": 4',
    );
    writeFileSync(statePath, invalid, "utf8");
    assert.throws(() =>
      updateReviewStateAtomically(statePath, (state) => state),
    );
    assert.equal(readFileSync(statePath, "utf8"), invalid);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
