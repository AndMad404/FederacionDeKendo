---
name: federacion-workflow
description: Execute focused implementation, review, SEO, responsive, or roadmap-phase work in the Federacion de Kendo website repository. Use when the request targets this repository and needs its scope-selection, contract, prompt-recipe, or verification workflow.
---

# Federacion Workflow

Use the repository's instructions as the source of truth; do not duplicate them here.

## Workflow

1. Read `AGENTS.md` and select the smallest task mode.
2. For an unclear request, use `.agents/project-map.md` and report the discovered scope before editing.
3. Read the contract for the selected mode before acting:
   - review: `.agents/review-contract.md`
   - implementation: `.agents/implementation-contract.md`
   - verification: `.agents/verification.md`
4. For a reusable owner prompt, select and adapt the smallest recipe in `.agents/prompt-recipes.md`.
5. Preserve unrelated worktree changes. Do not make visual changes without explicit owner approval.
6. Select the narrowest verification from `.agents/verification.md`. Always run `corepack pnpm run format:check` after edits to code or configuration.

## Specialized requests

- For SEO or generated route HTML, start from `src/app/config/seo-data.json` and verify generated output.
- For a roadmap phase, use the canonical compact recipe and apply its compactness and executability gates.
- Use a separate task or agent only when the responsibility is independent; keep sequential phases together.
