# Prompt Recipes

Use these prompts as starting points for Codex work in this repo.

The owner also maintains a companion visual reference,
`Guia_rapida_ahorro_tokens_Codex.docx`. It is a memory aid, not an
authoritative project input. Do not load it unless the user asks. When the
scope-discovery recipes below change materially, flag the visual reference for
manual synchronization.

## Discover Scope Without Editing

```text
Investigate [problem].
Use .agents/project-map.md to discover the related routes, files, components,
and tests. Summarize the scope in a maximum of 10 lines. Do not edit yet.
Do not review every route unless you find a shared dependency that justifies
it; if you expand the scope, explain why.
```

## Implement The Discovered Scope

```text
Implement only the scope identified for [problem].
Do not explore additional improvements or refactor outside scope.
Run the targeted test first, then only the final verification that applies
per .agents/verification.md.
```

## Discover And Implement When Unambiguous

```text
Fix [problem].
First use .agents/project-map.md to identify the minimal scope. If the cause
and the change are unambiguous, implement without expanding scope and run
only the related tests. If there is more than one material interpretation,
summarize the options in a maximum of 10 lines and wait for my decision.
```

## Review One File

```text
Review only [file].
Use .agents/review-contract.md.
Do not assume uninspected code.
Return findings by severity and recommend the next file.
```

## Plan A Change

```text
I want to change [goal].
Before editing, read the relevant files and give me a brief plan.
Separate verified facts from suggestions.
Do not propose refactors outside scope.
```

## Implement A Specific Finding

```text
Apply only the finding [level/title].
Use .agents/implementation-contract.md.
Keep the change minimal.
Do not touch unrelated files.
At the end, run the relevant checks from .agents/verification.md.
```

## Implement One Roadmap Phase

```text
Phase [number], [title/direct link]: [exact goal].
Previous phases are closed; do not re-audit them.

Minimal context: start from the linked section; if that is not enough, use
`docs/index.md` and the applicable documentation map to select only the
indispensable reference.

Delta: [verifiable functional result of this phase].
Critical invariants: [observable condition that must not change].
Human decision: [blocker and minimal alternative requiring approval; or
"none"].

Limits: [exclusion or relevant boundary of this phase; do not create a commit
unless requested]. Preserve unrelated worktree changes. Select verifications
via `.agents/verification.md`.

Final report: delta applied, verifications run, and applicable gates skipped
with reason; blockers.
```

## Implement One Calendar-Resilience Phase

Use the canonical `Implement One Roadmap Phase` recipe. Its direct phase link
points to the relevant section of `calendar-resilience-roadmap.md`; do not add
calendar-specific preamble, file lists, gates, or historical contracts.

### Roadmap prompt gate

Before delivery, reject and regenerate a phase prompt unless every instruction
is an observable invariant, human decision, scope limit, verification route, or
final-report requirement. Keep the exact phase, delta, applicable invariant,
relevant limit, preservation of unrelated changes, verification selector, final
report, and no-commit policy.

Remove complete-document requests, routed file or command lists, duplicated
restrictions, closed-phase history, unrelated operational detail, and context
already owned by a contract. Ask one owner question only when a non-derivable
decision materially changes the implementation.

## SEO Change

```text
Change [title/description/metadata] for [route].
Start with src/app/config/seo-data.json.
Verify runtime and generated HTML.
Do not change visible copy or legal data outside scope.
```

## Responsive Bug

```text
Fix the responsive issue in [route/component].
Validate mobile, tablet, and desktop.
Do not redesign the entire section.
Keep touch targets >=44px.
```

## Final Self-Review

```text
Review your own diff.
Look for regressions in TS, React, Tailwind, A11Y, SEO, PERF, and RESPONSIVE.
Do not make new changes unless you find a clear bug.
Report remaining risks.
```
