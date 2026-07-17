# FederacionDeKendo Agent Guide

This repository is the official website for a kendo federation.

Stack:
- React 18
- TypeScript
- Tailwind CSS 4
- Vite
- Figma-originated UI

## Core Rules

- Read the relevant files before making claims or edits.
- Keep work scoped to the user's requested file, route, concern, or task.
- Prefer existing project patterns over new abstractions.
- Do not refactor unrelated code while implementing a narrow change.
- Separate verified repo facts from suggestions or future ideas.
- Treat legal, SEO metadata, and public copy constraints from the user as hard requirements.
- Use ASCII in repo instructions unless a file already requires non-ASCII text.

## Task Modes

Use the smallest mode that fits the user's request.

- Review mode: read `.agents/review-contract.md` before reviewing code.
- Implementation mode: read `.agents/implementation-contract.md` before editing code.
- Verification mode: read `.agents/verification.md` before deciding which checks to run.
- Prompting examples: use `.agents/prompt-recipes.md` when the user wants help asking Codex for work.

If a request mixes review and implementation, review first, then ask or infer which findings should be applied.

## Documentation Scope

- Extended project documentation is stored outside this runtime repository at
  `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/` in the owner's
  local workspace.
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
