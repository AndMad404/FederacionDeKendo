# FederacionDeKendo Agent Guide

Official federation website: React 18, TypeScript, Tailwind CSS 4, and Vite.

## Core Rules

- Read relevant sources before claiming or editing; separate verified facts from
  suggestions.
- For documentary, methodological, continuity, or otherwise unroutable work,
  start at `context-index.md`. Use `$context-librarian` only to discover or read
  minimal canonical context and `$indexation-librarian` to change indexes or
  profiles. Go directly to a known technical contract.
- Keep scope minimal. Use `.agents/project-map.md` only when the target is not
  known, and expand only when evidence identifies a shared dependency.
- [CTRL-SCOPE] Preserve unrelated worktree changes. Do not refactor outside the
  requested concern or create a commit unless requested.
- [CTRL-OWNER] Prefer current project patterns. Do not add a methodology, tool,
  dependency, or abstraction without evidence and owner approval.
- Use current primary sources for external technical claims.
- [CTRL-PUBLIC-SEO] Treat legal constraints, public copy, SEO metadata, and
  owner decisions as hard requirements. Do not add a speculative public page
  for SEO.
- Never use CSS or Tailwind `!important`. Keep responsive styles mobile-first
  and preserve 44 px targets on touch-capable and hybrid devices.
- [CTRL-VISUAL] Do not implement visual changes without explicit owner
  approval. Use the current application plus approved measurements,
  screenshots, and renders as the baseline; isolate unrelated visual changes
  and block on every unexpected visual difference.
- Runtime, tests, builds, workflows, and public operations must never depend on
  private documentation in `../DesarrolloAsistidoIA/`.
- Use ASCII in repository instructions unless the file requires otherwise.

## Task Router

Load only the contract for the active responsibility:

- Review: `.agents/review-contract.md`
- Implementation: `.agents/implementation-contract.md`
- Verification selection: `.agents/verification.md`
- Prompt generation: `.agents/prompt-recipes.md`
- Unknown technical scope: `.agents/project-map.md`
- Private documentation: start at
  `../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/index.md`

Do not preload these files together. If review leads to implementation, finish
the review decision first and then switch responsibility.

## Decisions and Phases

- Execute one independently verifiable roadmap phase at a time from its linked
  section. Previous closed phases are not reaudited without a direct blocker.
- [CTRL-PHASE] Do not parallelize phases that share files, outputs, or
  sequential dependencies.
- Resolve derivable ambiguity from the routed sources. Ask the owner only when
  a missing choice changes architecture, permissions, credentials, persistence,
  security, operations, notifications, business policy, or a contract.
- Use the canonical roadmap recipe and its compactness and executability gate
  in `.agents/prompt-recipes.md`; do not reconstruct persistent context inside a
  generated prompt.
- Use a fresh task only when the primary responsibility changes. A direct fix
  to the current result remains in the same task. Hook events such as
  `SessionStart` are automatic and must not become user tasks or messages.

## Review State and Documentation

- `.codex/review-state.md` contains current technical state plus a compact
  resolved-provenance index. Read it for review work, not ordinary
  implementation.
- `.codex/review-history.md` routes resolved or superseded provenance. Read a
  history snapshot only when an active finding requires its origin or evidence.
- After an owner-requested commit resolves a finding or records an approved
  decision, follow the review contract and update only the canonical private
  document selected by its index.
- Follow `CONTRIBUTING.md` for requested commit messages.

## Product Invariants

- Bounded routes at 1366x768 keep navbar, primary content, and footer in one
  viewport without document or primary-section vertical scrolling. Variable
  lists use an explicit bounded interaction.
- Event detail routes are the exception: the document scrolls normally and no
  nested container may hide editorial content or historical galleries.
- `src/app/config/seo-data.json` owns route and organization metadata;
  `src/app/config/seo.ts` and `scripts/generate-route-html.mjs` consume it.
- Build runs postbuild route generation. SEO or head changes require source and
  generated-HTML verification. Gallery work requires data, components, and
  responsive outputs to be considered together.

## Completion

- Run the narrowest directed check first and select final checks through
  `.agents/verification.md`.
- [CTRL-FORMAT] After editing code or configuration, run
  `corepack pnpm run format`; LF and the repository's Prettier standard are
  required. `corepack pnpm run lint` must also pass. Report skipped or
  unavailable checks.
- [CTRL-DEPLOY] Do not claim a deployed problem is fixed from local files
  alone.
