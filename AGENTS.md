# FederacionDeKendo Agent Guide

This repository is the official website for a kendo federation.

Stack:
- React 18
- TypeScript
- Tailwind CSS 4
- Vite

## Core Rules

- Use the current application plus owner-approved measurements, screenshots, and rendered results as the visual baseline.
- Read the relevant files before making claims or edits.
- Keep work scoped to the user's requested file, route, concern, or task.
- When the user does not know the relevant files, routes, or tests, read
  `.agents/project-map.md` and discover the smallest evidence-based scope.
  Do not inspect every route by default. Summarize the discovered scope before
  editing when the request is investigative or materially ambiguous.
- Prefer existing project patterns over new abstractions.
- Do not refactor unrelated code while implementing a narrow change.
- Do not validate a narrow visual change on top of unrelated visual worktree
  changes. First isolate the authorized patch or stop and ask how the existing
  changes should be preserved.
- Do not implement any visual change without explicit owner approval. This
  includes spacing, dimensions, alignment, typography, colors, filters,
  visibility, responsive presentation, and shared visual tokens.
- Treat every unexpected visual-regression difference as blocking. An intended
  difference in one region does not authorize or explain differences elsewhere.
- Separate verified repo facts from suggestions or future ideas.
- Treat legal, SEO metadata, and public copy constraints from the user as hard requirements.
- When creating a commit, follow the message convention in `CONTRIBUTING.md`.
- Use ASCII in repo instructions unless a file already requires non-ASCII text.

## Task Modes

Use the smallest mode that fits the user's request.

- Review mode: read `.agents/review-contract.md` before reviewing code.
- Implementation mode: read `.agents/implementation-contract.md` before editing code.
- Verification mode: read `.agents/verification.md` before deciding which checks to run.
- Prompting examples: use `.agents/prompt-recipes.md` when the user wants help asking Codex for work.

If a request mixes review and implementation, review first, then ask or infer which findings should be applied.

## Phased Roadmap Execution

- Execute an approved roadmap one independently verifiable phase at a time.
  Do not combine parser, data pipeline, UI, visual, SEO, or documentation phases
  merely because they belong to the same feature.
- Start each phase from its canonical roadmap or backlog entry instead of
  repeating the full project history in the task prompt.
- Read only the documentation routed by
  `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md` plus the
  source files required by the current phase. Do not preload later-phase
  context.
- Before showing a generated roadmap-phase prompt, run the compactness check
  below. If any rejected pattern remains, regenerate it; do not show a prompt
  that merely explains or excuses the duplication.

### Roadmap-Phase Prompt Compactness Check

A generated prompt is invalid unless it retains, in brief form:

1. the exact phase and objective;
2. that previous phases are closed and not to be reaudited;
3. the minimum-context selector;
4. critical invariants that cannot change;
5. relevant scope limits;
6. preservation of unrelated worktree changes;
7. verification through `.agents/verification.md`;
8. the required final report; and
9. the current no-commit-unless-requested policy.

Persistent instructions supply the detail behind these controls and must not be
reconstructed in the prompt. Compacting removes redundancy and history, not
operational controls. If an applicable control is absent, regenerate the prompt.

Reject and regenerate a prompt if it contains any of these:

- an instruction to read a complete roadmap or a complete canonical document;
- named scripts, workflows, test files, or source-file lists selected by
  `docs/index.md` or `.agents/project-map.md`;
- Cloudflare, CI, rollback, secrets, or sensitive-data rules not newly changed
  by the phase;
- historical follow-ups or expanded closed-phase protections beyond the brief
  no-reaudit statement;
- named verification commands or gates selected by `.agents/verification.md`;
- headings or equivalent sections for `Alcance autorizado`, `Fuera de alcance`,
  or `Criterio de salida`.

Use the short `Implement One Roadmap Phase` recipe as the canonical prompt
shape. Apart from its fixed operational controls, variable text may contain
only the phase pointer, functional delta, critical invariant, and relevant
limit. If a generated prompt is substantially longer than that delta plus the
required compact controls, reject and regenerate it before showing it. It must
delegate all other context and checks to their canonical sources.

### Final Mandatory Phase-Prompt Gate

Before delivering any phase-execution prompt, validate the final text. Reject,
compact, and revalidate it if it:

1. says to read a complete document without a direct dependency on it;
2. enumerates files when a documentation map can select the context;
3. states any restriction more than once;
4. carries non-blocking history, including Cloudflare-CI, rollback, or closed
   follow-ups;
5. names broad checks that `.agents/verification.md` selects;
6. repeats instructions about commits, secrets, private URLs, or transactional
   preservation;
7. reaudits or redesigns a closed phase without a direct blocking dependency;
8. reconstructs prior architecture rather than describing the current delta;
9. copies context already available from a persistent source of truth; or
10. names an invariant that the current phase cannot actually violate.

Compare the result with the canonical compact recipe. Remove every instruction
that does not change what the agent must do, must not do, must verify, or must
report. Do not deliver a prompt until it passes this gate.

### Human Decision Ownership and Approval

Treat a missing decision as a human block when answers would materially change
architecture, permissions, external services, credentials, persistence,
security, operational policy, notification channels, business decisions, or a
contract. Advance only to that point, report the block and minimal alternative,
then wait for owner approval. Resolve ambiguity from source-of-truth documents,
code, and maps without asking the owner. Before finalizing a prompt, ask one
concise owner question only when the missing requirement is not derivable and
would materially change the implementation or reserve a decision to the owner.

### Executable Prompt Governance

Classify each phase-prompt instruction explicitly as one of: verifiable
invariant, human decision, scope limit, verification, or final report. Do not
use one category to imply another.

Critical instructions must state an observable condition or a clear human
escalation point. Prefer a condition such as "the same revision and cause do
not create a second notification" over an untestable quality preference.

Run two separate pre-delivery gates: compactness and executability. The latter
fails if a critical rule lacks an observable behavior or a clear human
escalation path. Regenerate the prompt until both gates pass.
- Use a fresh task when the primary responsibility changes, such as moving
  from tests to synchronization, images, filters, or UI. Keep the current task
  for direct fixes to the phase being implemented.
- During implementation, run the narrowest reproducing or directed check
  first. Run broader typecheck, build, E2E, or visual gates once the directed
  checks pass and the phase is ready for final verification.
- Keep each completed phase suitable for an atomic commit and independent
  review. Do not create a commit unless the user requests it.
- Resolve blocking CI or test regressions before starting dependent structural
  or visual phases.
- Do not use parallel agents for sequential phases that share files or depend
  on each other's output. Parallel work is appropriate only for genuinely
  independent investigation or review.

## Documentation Scope

- Extended project documentation is stored outside this runtime repository at
  `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/` in the owner's
  local workspace.
- Start documentation work with
  `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md`. Use its
  routing table to select the smallest relevant document set; do not read the
  full documentation tree by default.
- For architecture, ADR, backlog, calendar-operation, or historical-document
  work, read the relevant file from that location when it is available.
- Never make application code, build scripts, tests, deployment, or workflows
  depend on the private documentation repository.
- If a future document becomes an input required by runtime or automation, keep
  that required input in this repository.
- Keep `.codex/review-state.md` limited to technical findings about this public
  project.

## Project-Specific Context

- `src/app/App.tsx` is the route shell for `/`, `/calendario`, `/galeria`, and `/afiliados`.
- At the reference desktop viewport (1366x768), bounded routes must keep the
  navbar, main content, and footer within the visible viewport. Neither the
  document nor the route's primary section may require vertical scrolling.
  Lists with variable content must use a bounded presentation such as
  pagination, filtering, or another explicit navigation pattern instead of
  adding desktop scroll. Event-detail routes (`/eventos/<slug>/` and
  `/en/events/<slug>/`) are the explicit exception: their descriptions and
  optional historical galleries use normal document scrolling so all
  editorial content remains visible and reachable. This rule does not prohibit
  the documented mobile, tablet, or landscape scrolling behavior.
- `src/app/config/seo-data.json` is the central source for route titles, descriptions, SEO text, locale/language, and organization metadata.
- `src/app/config/seo.ts` and `scripts/generate-route-html.mjs` emit runtime and generated metadata from the SEO config.
- `pnpm run build` also runs `postbuild`, generating route HTML under `dist/`.
- If `pnpm` is not available directly in Windows PowerShell, use `corepack pnpm` with the same arguments.
- For SEO/head changes, verify both source files and generated `dist` HTML.
- For gallery or image work, inspect `src/app/data/gallery.ts`, gallery components, and responsive image outputs together.

## Default Done Criteria

Unless the user explicitly narrows the task to analysis only:

- Explain the change briefly.
- Run the relevant verification commands from `.agents/verification.md` when feasible.
- Report any command that could not be run.
- Do not claim production behavior is fixed from local files alone when the user is reporting deployed behavior.
