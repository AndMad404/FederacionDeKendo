import {
  findRepositoryRoot,
  isDirectExecution,
  readHookInput,
  recordHookFailure,
  writeHookJson,
} from "./shared.mjs";

const REQUIRED_SECTIONS = [
  { label: "scope", pattern: /\b(scope|alcance)\b/i },
  { label: "evidence", pattern: /\b(evidence|evidencia)\b/i },
  { label: "excluded", pattern: /\b(excluded|excluido|exclusiones)\b/i },
  { label: "decisions", pattern: /\b(decisions?|decisiones?)\b/i },
];

export function evaluateSubagentReport(input, { enforce = false } = {}) {
  const report = String(input.last_assistant_message || "");
  const missing = REQUIRED_SECTIONS.filter(
    ({ pattern }) => !pattern.test(report),
  ).map(({ label }) => label);

  if (missing.length === 0) return { continue: true };

  const reason = `Subagent report is missing: ${missing.join(", ")}.`;
  if (!enforce) {
    return {
      continue: true,
      systemMessage: `${reason} Advisory mode did not continue the subagent.`,
    };
  }
  if (!input.stop_hook_active) return { decision: "block", reason };

  return {
    continue: true,
    systemMessage: `${reason} The single continuation was already used; human review is required.`,
    recordFailure: reason,
  };
}

if (isDirectExecution(import.meta.url)) {
  try {
    const input = await readHookInput();
    const enforce = process.argv.includes("--enforce");
    const result = evaluateSubagentReport(input, { enforce });
    if (result.recordFailure) {
      const root = findRepositoryRoot(input.cwd || process.cwd());
      const recorded = recordHookFailure(root, {
        sessionId: input.session_id,
        event: "SubagentStop",
        problem: "Subagent report remained incomplete after one continuation.",
        evidence: result.recordFailure,
      });
      if (!recorded) {
        result.systemMessage = `${result.systemMessage} The active review state could not record this failure and was left unchanged.`;
      }
      delete result.recordFailure;
    }
    writeHookJson(result);
  } catch (error) {
    writeHookJson({
      continue: true,
      systemMessage: `SubagentStop hook failed open: ${error.message}`,
    });
  }
}
