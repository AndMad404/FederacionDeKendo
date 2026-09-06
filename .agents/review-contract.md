# Review Contract

Use only for review requests. Bound every claim by target, axis, baseline and
reproducible evidence.

## Workflow

1. Read `git status --short`; preserve unrelated changes.
2. Declare requested and actual targets, axes, inclusions, exclusions, Git
   baseline and worktree state.
3. Inspect the relevant sources and collect exact files, lines, checks or
   rendered evidence. Do not infer repository-wide coverage from an inventory.
4. Evaluate the declared axes: TS, REACT, TAILWIND, ARCH, A11Y, PERF, SEO or
   RESPONSIVE. Separate verified findings from suggestions.
5. Report findings in severity order: CRITICAL, STRUCTURAL, SMELL, POLISH.
   Explain the problem, concrete correction and cost of deferring.
6. Select checks through `.agents/verification.md` when verification applies.

## Evidence and decisions

- Missing evidence is reported as missing, never reconstructed.
- Historical records never establish current technical coverage.
- A retired or unapproved design reference cannot establish visual drift.
- Preserve owner decisions; inspection never authorizes changes or commits.
- Internal review persistence is optional and routed through the local
  `.agents/private-context.md`, when available. Public reviews can complete
  without private records.

End the review with `PENDING:` for deferred scope and `NEXT:` for the smallest
justified next concern.
