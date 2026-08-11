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
- Read only the documentation routed by `docs/index.md` plus the source files
  required by the current phase. Do not preload later-phase context.
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
- Start documentation work with `docs/index.md` in that private project. Use
  its routing table to select the smallest relevant document set; do not read
  the full documentation tree by default.
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
- At the reference desktop viewport (1366x768), every route must keep the
  navbar, main content, and footer within the visible viewport. Neither the
  document nor the route's primary section may require vertical scrolling.
  Lists with variable content must use a bounded presentation such as
  pagination, filtering, or another explicit navigation pattern instead of
  adding desktop scroll. This rule does not prohibit the documented mobile,
  tablet, or landscape scrolling behavior.
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
