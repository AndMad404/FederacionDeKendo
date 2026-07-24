# Review Contract v2

Use this file only for review requests. Its purpose is to make every review
claim traceable to an exact scope, axis, code baseline, and body of evidence.

## Non-Negotiable Rules

- Review only what the user shares or explicitly names.
- Read relevant files before making claims.
- Never treat a file inventory as proof that every concern in those files was
  reviewed.
- Never expand a narrow review into a repository-wide claim.
- Preserve prior findings until they are explicitly resolved or invalidated by
  evidence.
- Keep `.codex/review-state.md` limited to technical review state.
- Keep superseded schemas and verbose legacy provenance in
  `.codex/review-history.md`; history is not current coverage.

## Review Vocabulary

Use these terms consistently:

- `inspected`: read or located for context; no systematic quality claim.
- `reviewed`: evaluated systematically against named axes and inclusions.
- `verified`: a finding or fix was checked with recorded reproducible evidence.
- `stale`: the reviewed target changed after the recorded baseline, so its
  previous coverage cannot be treated as current.

`Reviewed` never implies `verified`, and reviewing one axis never implies that
another axis was covered.

## Session Workflow

### 1. Read the Existing State

At the start of every review session:

1. Read `.codex/review-state.md` if it exists.
2. Check relevant targets against the recorded baseline and mark affected
   coverage `stale` when those targets changed.
3. If there are three or more open CRITICAL findings, lead with them before
   reviewing new material.
4. Read `git status --short` so the review does not confuse committed code with
   an already modified worktree.

### 2. Declare Scope Before Reviewing

Record all of the following:

```yaml
session:
  id: REV-YYYY-MM-DD-NN
  requested_scope: exact user request
  actual_scope:
    targets: [exact files, components, folders, or routes]
    axes: [one or more review axes]
    included: [properties or concerns actually evaluated]
    excluded: [nearby concerns not evaluated]
  baseline:
    commit: short Git SHA
    worktree: clean | dirty
    fingerprint: file hash or inventory reference when practical
```

If actual scope differs from requested scope, explain why. Do not silently
broaden it.

### 3. Collect Evidence

Evidence must be sufficient to reproduce the claim. Record exact file paths,
relevant line numbers when useful, and commands or checks performed.

Examples:

- `rg` query plus the glob or directory searched.
- Git diff, blame, or commit inspected.
- Typecheck or build command and its result.
- Route and viewport used for a responsive check.
- Generated HTML or CSS file inspected.

If a command was not recorded in a legacy review, say `not recorded`; do not
reconstruct or invent it later.

### 4. Evaluate Only the Declared Axes

Assign every finding exactly one primary axis:

- `TS`: TypeScript strict compliance, no implicit any, proper generic usage.
- `REACT`: component responsibility, hook hygiene, concurrent-safe patterns,
  unnecessary renders.
- `TAILWIND`: utility-first discipline, inline styles, token consistency.
- `ARCH`: feature structure, separation of concerns, prop drilling.
- `A11Y`: semantic HTML, ARIA, keyboard navigation.
- `PERF`: lazy loading, image optimization, bundle awareness.
- `SEO`: headings, metadata, canonical URLs, structured data, alt text.
- `RESPONSIVE`: breakpoint behavior, orientation rules, viewport assumptions,
  touch targets.

Review depth is bounded by `included` and `excluded`. For example, reviewing
Tailwind spacing utilities does not cover typography, colors, radii, or the
responsive cascade unless those concerns are listed under `included`.

### 5. Record Findings with Stable IDs

Finding levels, in output order:

1. `CRITICAL`: breaks functionality, security, or accessibility.
2. `STRUCTURAL`: architectural issue that compounds over time.
3. `SMELL`: works but creates friction at scale.
4. `POLISH`: minor improvement or optimization.

Use this user-facing format:

```text
[LEVEL] AXIS: Title
Problem: one sentence describing the issue
Fix: concrete example or structural change
Cost of deferring: one sentence
```

Persist each finding with a stable ID and evidence:

```yaml
- id: TW-001
  level: POLISH
  axis: TAILWIND
  status: open
  target: src/app/components/Example.tsx:42
  problem: concise technical problem
  fix: concrete correction
  cost_of_deferring: concrete consequence
  evidence: [file, line, command, or check]
  introduced_in: REV-YYYY-MM-DD-NN
```

Do not silently drop excess findings. Put them in `pending_reviews` with their
reason and intended scope.

### 6. Verify Before Closing

A finding may move to `resolved` only when the fix and relevant behavior were
verified. Record:

```yaml
resolution:
  resolved_at: YYYY-MM-DD
  resolved_ref: short Git SHA or worktree fingerprint
  checks: [commands, routes, viewports, or inspected output]
```

Legacy resolutions without recorded evidence remain
`resolved_legacy_unverified`; they are historical claims, not current verified
coverage.

### 7. Update Coverage and State

Every completed review adds or updates a coverage record:

```yaml
- id: COV-YYYY-MM-DD-NN
  target: exact target or glob
  axes: [TAILWIND]
  included: [spacing, gap, size, inset]
  excluded: [typography, color, radius, responsive cascade]
  depth: reviewed
  evidence: [commands and inspected files]
  baseline: { commit: abc1234, worktree: clean }
  status: current
```

When a covered target changes, set `status: stale`; do not delete the record or
continue presenting it as current.

## Repository-Wide Claim Gate

The phrases `repository-wide`, `whole repository`, `all components`, and
equivalents are forbidden unless the coverage record includes all of:

1. An exact target glob or file inventory.
2. Named axes and included subtopics.
3. Explicit exclusions.
4. A reproducible search or inspection command.
5. The reviewed Git commit and worktree state.
6. A result for every matched target, including `no finding` results.

If any item is missing, use narrower language such as `files inspected in this
session` or name the exact utility families reviewed.

## Staleness Rules

- File coverage becomes stale when that file changes after its baseline.
- Folder or repository coverage becomes stale when any included file changes.
- A stale coverage record does not automatically reopen a resolved finding,
  but it cannot prove the current code is still compliant.
- Re-review creates a new coverage record or refreshes the existing record with
  a new baseline and evidence.
- Dirty-worktree reviews must record that fact and, when practical, a content
  fingerprint for the reviewed target.

## Solo Developer Rules

- Flag early STRUCTURAL findings; they are cheaper before more components
  depend on them.
- Skip team-coordination concerns unless asked.
- Flag visible Figma-to-code drift under ARCH with note `Figma drift`.
- Flag excess nesting, magic numbers, and duplicated AI-export logic under ARCH
  with note `AI-gen smell`.

## Required Session Output

After findings, always include:

```text
PENDING: [findings or review scopes deferred this session]
NEXT: [recommended next file, component, or concern]
```

Then update `.codex/review-state.md`. The state update must reflect actual
coverage, including exclusions and verification gaps; it must not merely state
that a file was reviewed.

When the active state becomes difficult to scan, move superseded session detail
to `.codex/review-history.md` and leave stable IDs plus concise resolution
summaries in the active state. Never use the history archive to satisfy current
coverage requirements.

## Tailwind Scope Example

Correct:

```yaml
target: src/app/**/*.tsx
axes: [TAILWIND]
included: [spacing, gap, size, inset shorthands]
excluded: [typography, colors, radii, variant precedence]
evidence:
  - rg query recorded for the target glob
result: no-effect spacing utilities removed in matched files
```

Incorrect:

```yaml
result: repository-wide Tailwind cleanup complete
```

The incorrect version claims coverage of Tailwind concerns that were never
included in the review.
