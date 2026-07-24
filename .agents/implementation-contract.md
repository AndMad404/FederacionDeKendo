# Implementation Contract

Use this file when the user asks to apply, fix, build, implement, or change code.

## Before Editing

- Read the relevant files first.
- Check `git status --short`.
- Identify whether the requested change affects:
  - React behavior
  - TypeScript types
  - Tailwind/layout
  - SEO/head output
  - Public copy
  - Images/assets
  - Generated route HTML
- Keep unrelated dirty files unchanged.

## Change Rules

- Make the smallest change that satisfies the request.
- Preserve existing component and data patterns unless the task is explicitly structural.
- Do not introduce a new abstraction unless it removes real duplication or matches an existing local pattern.
- Do not change public copy, metadata, social handles, or legal wording unless requested.
- Do not mix formatting churn with behavioral changes.
- Prefer data/config changes over component changes when the repo already centralizes that concern.

## React and TypeScript

- Keep components focused on rendering and interaction.
- Move reusable stateful behavior into hooks only when duplication or complexity justifies it.
- Avoid prop drilling beyond two levels; use local composition or data modules before global state.
- Preserve strict TypeScript intent; do not add `any` to silence errors.

## Tailwind and UI

- Prefer existing Tailwind utilities and tokens.
- Avoid inline styles unless the existing component already requires dynamic CSS values.
- Keep responsive behavior component-scoped when possible.
- Touch targets should be at least 44px for interactive mobile controls.

### Visual Change Baseline

Before editing a visual or layout concern, record the smallest baseline that
can determine the intended result:

1. Explicit user-approved requirements and measurements.
2. An approved screenshot or rendered result from the current task.
3. Existing product components, semantic tokens, and geometry.
4. Figma only when the user confirms that it represents the current design.

The baseline must name the affected routes and viewports plus the relevant
outer margins, internal padding, gaps, dimensions, alignment, component
composition, style tokens, and interactive states. Mark items that do not
apply instead of inventing values.

- For a material or ambiguous change to layout, composition, responsive
  behavior, or shared primitives, present the baseline and obtain user
  approval before editing.
- An exact, narrowly scoped correction may proceed without a checkpoint when
  its source and value are explicit.
- When the available references do not determine a material decision, stop
  and ask; do not silently treat the current implementation as approved.
- Do not claim Figma fidelity when the Figma source is missing or stale.
- Keep visual corrections separate from new behavior and unrelated refactors.
  If they are inseparable, explain the dependency before editing and keep the
  combined scope explicit.

## SEO and Metadata

- Start with `src/app/config/seo-data.json`.
- Check `src/app/config/seo.ts`, `index.html`, `scripts/generate-route-html.mjs`, and generated `dist` HTML when the change affects head output.
- For legal metadata constraints, search JSON-LD, manifest, `llms.txt`, locale markers, and generated HTML.

## Images

- For gallery/image changes, inspect `src/app/data/gallery.ts`, image files under `public/images`, and the responsive-image script.
- Keep `width`, `height`, `alt`, `srcSet`, and `sizes` aligned with the actual asset set.

## After Editing

- Run the relevant commands from `.agents/verification.md`.
- Compare visual changes against the approved baseline at the affected
  viewports and record any intentional deviation.
- Summarize changed files and verification results.
- If a check fails, report the failure and the likely next step.
