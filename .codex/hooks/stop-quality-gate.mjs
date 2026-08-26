import {
  captureRelevantFingerprint,
  findRepositoryRoot,
  formatCheckFailures,
  getWorktreeSummary,
  isDirectExecution,
  loadSessionState,
  readHookInput,
  recordHookFailure,
  runCompletionChecks,
  writeHookJson,
} from "./shared.mjs";

export async function evaluateStop(input, dependencies = {}) {
  const root =
    dependencies.root || findRepositoryRoot(input.cwd || process.cwd());
  const state =
    dependencies.state === undefined
      ? await loadSessionState(input.session_id)
      : dependencies.state;
  const fingerprint = (
    dependencies.captureFingerprint || captureRelevantFingerprint
  )(root);
  const changed = state
    ? state.fingerprint !== fingerprint
    : Boolean((dependencies.getWorktreeSummary || getWorktreeSummary)(root));

  if (!changed) return { output: { continue: true }, root };

  const checks = (dependencies.runChecks || runCompletionChecks)(root);
  const failures = formatCheckFailures(checks);
  if (!failures) return { output: { continue: true }, root };

  const reason =
    "Completion quality gate failed. Correct the reported formatting or diff errors, rerun the checks, and then finish the task.\n" +
    failures;
  if (!input.stop_hook_active) {
    return { output: { decision: "block", reason }, root };
  }

  return {
    failure: {
      sessionId: input.session_id,
      event: "Stop",
      problem: "Completion quality gate still failed after one continuation.",
      evidence: failures,
    },
    output: {
      continue: true,
      systemMessage:
        "Completion quality gate still fails after the single automatic continuation. The failure was recorded for human review.",
    },
    root,
  };
}

if (isDirectExecution(import.meta.url)) {
  try {
    const input = await readHookInput();
    const result = await evaluateStop(input);
    if (result.failure && !recordHookFailure(result.root, result.failure)) {
      result.output.systemMessage =
        "Completion quality gate still fails and the active review state could not record it. The state was left unchanged; human review is required.";
    }
    writeHookJson(result.output);
  } catch (error) {
    writeHookJson({
      continue: true,
      systemMessage: `Stop quality hook failed open: ${error.message}`,
    });
  }
}
