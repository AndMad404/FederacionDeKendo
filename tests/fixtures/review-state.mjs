import { serializeReviewStateMarkdown } from "../../.codex/review-state.mjs";

// Synthetic records exercise collisions without publishing project history.
export function createReviewStateFixture() {
  const resolved = (recordKey, id) => ({
    recordKey,
    id,
    target: "example.js",
    summary: "Synthetic resolution.",
    resolutionRef: "fixture",
    historyFile: ".codex/review-history.md",
  });
  return {
    schemaVersion: 4,
    lastUpdated: "2026-01-01",
    contract: ".agents/review-contract.md",
    historyIndex: ".codex/review-history.md",
    historySnapshots: [],
    stateRules: ["Synthetic test data only."],
    coverage: [],
    coverageNote: "No actual project coverage.",
    idConflicts: [
      {
        sourceId: "EXAMPLE-DUPLICATE",
        status: "historical_duplicate_resolved_records",
        targets: ["example.js"],
        recordKeys: ["EXAMPLE-1", "EXAMPLE-2"],
        rule: "Preserve both synthetic records.",
      },
      {
        sourceId: "EXAMPLE-REOPENED",
        status: "reopened_after_historical_resolution",
        targets: ["example.js"],
        recordKeys: ["EXAMPLE-3"],
        rule: "The synthetic finding was reopened.",
      },
    ],
    openFindings: [
      {
        id: "EXAMPLE-REOPENED",
        level: "SMELL",
        axis: "ARCH",
        status: "open",
        target: "example.js",
        summary: "Synthetic open finding.",
      },
    ],
    resolvedIndex: [
      resolved("EXAMPLE-1", "EXAMPLE-DUPLICATE"),
      resolved("EXAMPLE-2", "EXAMPLE-DUPLICATE"),
      resolved("EXAMPLE-3", "EXAMPLE-REOPENED"),
    ],
    pendingReviews: [],
    hookFailures: [],
  };
}

export const reviewStateMarkdown = serializeReviewStateMarkdown(
  createReviewStateFixture(),
);
