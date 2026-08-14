import { applyEditorialDecisionToFiles } from "./sync-calendar-events.mjs";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function main() {
  const registry = await applyEditorialDecisionToFiles({
    registryPath: process.env.CALENDAR_REGISTRY_PATH,
    outputPath: process.env.CALENDAR_OUTPUT_PATH,
    decision: {
      sourceId: required("CALENDAR_DECISION_SOURCE_ID"),
      revisionId: required("CALENDAR_DECISION_REVISION_ID"),
      evidenceFingerprint: required("CALENDAR_DECISION_EVIDENCE_FINGERPRINT"),
      action: required("CALENDAR_DECISION_ACTION"),
      decisionRecordId: required("CALENDAR_DECISION_RECORD_ID"),
      actorRole: required("CALENDAR_DECISION_ACTOR_ROLE"),
      decidedAt: required("CALENDAR_DECISION_DECIDED_AT"),
      ...(process.env.CALENDAR_DECISION_REASON ? { reason: process.env.CALENDAR_DECISION_REASON } : {}),
    },
  });
  console.log(`Applied recorded editorial decision to ${registry.events.length} event(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
