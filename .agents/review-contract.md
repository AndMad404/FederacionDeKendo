# Review Contract v3

Use only for review requests. Every claim is bounded by target, axis, baseline,
and recorded evidence.

## Invariants

- Review only the named scope; inspection is not review and review is not
  verification.
- Never infer repository-wide coverage from an inventory or one axis.
- Preserve open findings until evidence resolves or invalidates them.
- `.codex/review-state.md` contains only unresolved findings, pending reviews,
  current coverage, and unresolved hook failures.
- Resolved, stale, superseded, and verbose session records move immediately to
  the snapshot routed by `.codex/review-history.md`. History never proves
  current coverage and is loaded only for required provenance.

## Workflow

1. Read the active state and `git status --short`. Do not read history unless a
   relevant active entry requires prior evidence.
2. Declare requested and actual targets, one or more axes, inclusions,
   exclusions, Git baseline, and worktree state.
3. Collect reproducible evidence: exact sources, useful lines, searches,
   commands, routes, viewports, or generated output.
4. Evaluate only the declared axes: `TS`, `REACT`, `TAILWIND`, `ARCH`, `A11Y`,
   `PERF`, `SEO`, or `RESPONSIVE`.
5. Report findings in order: `CRITICAL`, `STRUCTURAL`, `SMELL`, `POLISH`.
6. Update active state with concise open entries and current coverage. Archive
   the full session record rather than appending it to active state.

## Records

Open finding:

```yaml
- id: AXIS-NNN
  level: STRUCTURAL
  axis: ARCH
  status: open
  target: exact source or behavior
  summary: concise verified problem
  introduced_in: REV-YYYY-MM-DD-NN
```

Keep full problem, fix, deferral cost, evidence, and resolution in the dated
history snapshot. User-facing findings retain this format:

```text
[LEVEL] AXIS: Title
Problem: verified problem
Fix: concrete correction
Cost of deferring: concrete consequence
```

Current coverage:

```yaml
- id: COV-YYYY-MM-DD-NN
  target: exact target or glob
  axes: [ARCH]
  included: [evaluated concerns]
  excluded: [nearby concerns]
  evidence: [reproducible checks]
  baseline: { commit: abc1234, worktree: clean }
  status: current
```

Any target change makes its coverage stale; archive that record and create new
coverage only after re-review. A resolution requires a verified ref and checks;
archive the complete finding immediately and remove it from active state.

## Claim and Decision Gates

- A repository-wide claim requires an exact inventory or glob, axes,
  inclusions, exclusions, reproducible evidence, baseline, and a result for
  every target. Otherwise name the inspected files or narrower concern.
- Dirty-worktree reviews record that state and a target fingerprint when
  practical.
- A retired or unapproved external design source cannot establish visual drift.
- Missing evidence is reported as missing, never reconstructed.
- Owner-approved commits and durable decisions are recorded only after the
  commit exists, then routed to one canonical private document through its
  index.

## Required Output

End every review with:

```text
PENDING: [deferred findings or scopes]
NEXT: [smallest justified next concern]
```

Add `RECOMMENDATIONS:` only for an approved-commit handoff with a material,
evidence-backed opportunity; otherwise use `RECOMMENDATIONS: none`.
