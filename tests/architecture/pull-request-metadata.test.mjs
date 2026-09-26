import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUIRED_SECTIONS,
  validatePullRequest,
  validatePullRequestEvent,
} from "../../scripts/validate-pull-request.mjs";

const completeBody = REQUIRED_SECTIONS.map(
  (heading) => `## ${heading}\n\nContenido verificable para ${heading}.`,
).join("\n\n");

test("accepts complete pull request metadata", () => {
  assert.deepEqual(
    validatePullRequest({
      title: "chore(review): document repository maintenance",
      body: completeBody,
    }),
    [],
  );
});

test("rejects an activity-only title and untouched placeholders", () => {
  const body = REQUIRED_SECTIONS.map(
    (heading) => `## ${heading}\n\n<!-- pendiente -->`,
  ).join("\n\n");
  const errors = validatePullRequest({ title: "Update files", body });

  assert.equal(errors.length, REQUIRED_SECTIONS.length + 1);
  assert.match(errors[0], /type\(scope\)/);
  assert.match(errors.at(-1), /conserva solo el marcador/);
});

test("rejects non-pull-request events", () => {
  assert.deepEqual(validatePullRequestEvent({}), [
    "El evento no contiene datos de un pull request.",
  ]);
});
