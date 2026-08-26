import { isDirectExecution, readHookInput, writeHookJson } from "./shared.mjs";

const SENSITIVE_PATTERNS = [
  { label: "git commit", pattern: /\bgit\s+commit\b/i },
  { label: "git push", pattern: /\bgit\s+push\b/i },
  { label: "hard reset", pattern: /\bgit\s+reset\s+--hard\b/i },
  {
    label: "recursive deletion",
    pattern: /\brm\s+-[^\r\n]*r[^\r\n]*f|\bRemove-Item\b[^\r\n]*\b-Recurse\b/i,
  },
  { label: "visual snapshot update", pattern: /--update-snapshots/i },
  { label: "workflow change", pattern: /\.github[\\/]workflows/i },
  {
    label: "indexing policy change",
    pattern: /SITE_INDEXING_ENABLED|EVENT_INDEXING_ENABLED/i,
  },
];

export function evaluateToolUse(input, { enforce = false } = {}) {
  const command = String(input.tool_input?.command || "");
  const matches = SENSITIVE_PATTERNS.filter(({ pattern }) =>
    pattern.test(command),
  ).map(({ label }) => label);
  if (matches.length === 0) return {};

  const reason =
    `Project-sensitive operation detected (${matches.join(", ")}). ` +
    "Confirm explicit owner authorization and exact targets before proceeding.";
  if (enforce) {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    };
  }
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: reason,
    },
  };
}

if (isDirectExecution(import.meta.url)) {
  try {
    const input = await readHookInput();
    writeHookJson(
      evaluateToolUse(input, { enforce: process.argv.includes("--enforce") }),
    );
  } catch (error) {
    writeHookJson({
      systemMessage: `PreToolUse hook failed open: ${error.message}`,
    });
  }
}
