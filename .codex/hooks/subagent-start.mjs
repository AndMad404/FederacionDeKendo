import { isDirectExecution, readHookInput, writeHookJson } from "./shared.mjs";

const ROLE_GUIDANCE = [
  {
    pattern: /map|cartograf|evidence/i,
    guidance:
      "Map verified facts and sources of truth. Do not evaluate quality or propose implementation.",
  },
  {
    pattern: /architect|arquitect/i,
    guidance:
      "Review boundaries and responsibilities. Separate verified facts, findings, and owner decisions; do not edit.",
  },
  {
    pattern: /quality|calidad|ci/i,
    guidance:
      "Evaluate mechanical gates and reproducible evidence. Identify gaps without duplicating existing tests.",
  },
  {
    pattern: /seo/i,
    guidance:
      "Advise only on the named SEO concern and preserve owner-controlled indexing and public-copy decisions.",
  },
  {
    pattern: /ux|access|a11y/i,
    guidance:
      "Advise only on the approved UX or accessibility scope. Do not authorize visual changes or baseline updates.",
  },
  {
    pattern: /decision|decision|governance|gobernanza/i,
    guidance:
      "Synthesize decisions, evidence, owner, risk, and approval status. Do not convert advice into an approved decision.",
  },
];

export function handleSubagentStart(input) {
  const role = String(input.agent_type || "");
  const matched = ROLE_GUIDANCE.find(({ pattern }) => pattern.test(role));
  const guidance =
    matched?.guidance ||
    "Keep the delegated scope exact, report evidence and exclusions, and leave non-derivable decisions to the owner.";

  return {
    hookSpecificOutput: {
      hookEventName: "SubagentStart",
      additionalContext: `${guidance} End with Alcance/Scope, Evidencia/Evidence, Excluido/Excluded, and Decisiones/Decisions.`,
    },
  };
}

if (isDirectExecution(import.meta.url)) {
  try {
    writeHookJson(handleSubagentStart(await readHookInput()));
  } catch (error) {
    writeHookJson({
      continue: true,
      systemMessage: `SubagentStart hook failed open: ${error.message}`,
    });
  }
}
