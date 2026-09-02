---
name: federacion-workflow
description: Execute focused implementation, review, CI diagnosis, SEO, responsive, or roadmap-phase work in the Federacion de Kendo website repository. Use when the request targets this repository and needs its scope-selection, contract, prompt-recipe, or verification workflow.
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
6. Select the narrowest verification from `.agents/verification.md`. Run `corepack pnpm run format` and `corepack pnpm run lint:fix` after edits to code or configuration; the repository completion hook also applies both automatically. Resolve every ESLint finding that cannot be fixed safely.

## CI and line endings

When a GitHub Actions, formatting, hook, or line-ending failure is reported:

1. Read the failing step's complete output and reproduce that exact command before changing configuration.
2. Use `git ls-files --eol` to distinguish index and worktree endings. The repository-wide canonical format is LF; do not add path-specific CRLF exceptions.
3. Run `corepack pnpm run format`; it normalizes tracked line endings to LF before applying Prettier. Use `corepack pnpm run format:check` only when reproducing the non-mutating project or CI gate. Do not suppress Git warnings or ignore end-of-line differences to hide an unresolved mismatch.
4. If a canonical document or immutable snapshot is byte-sensitive, update its serializer first. Recalculate its hash and references only with explicit owner authorization, then verify the content is still canonically serialized.
5. Distinguish application failures from environment failures. Retry a required build with the necessary sandbox permission when local file access caused the failure; do not present that retry as a code fix.
6. On Windows, verify hooks using their actual Node launcher. A `.cmd` shim may require `cmd.exe`; a manually successful PowerShell command does not prove the hook process can launch it.
7. Before completion, require `git diff --check`, `git diff --cached --check`, no `i/crlf` or `w/crlf` entries from `git ls-files --eol`, and every applicable gate from `.agents/verification.md`.

## Specialized requests

- For SEO or generated route HTML, start from `src/app/config/seo-data.json` and verify generated output.
- For a roadmap phase, use the canonical compact recipe and apply its compactness and executability gates.
- Use a separate task or agent only when the responsibility is independent; keep sequential phases together.
