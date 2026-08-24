# Technical Review State

This file contains only unresolved technical review state. Full findings,
resolved sessions, stale coverage, and prior verification evidence are routed
through `.codex/review-history.md` and loaded only when provenance is required.

```yaml
schema_version: 3
last_updated: 2026-08-23
contract: .agents/review-contract.md
history_index: .codex/review-history.md
history_snapshot: .codex/review-history-2026-08-23.md

state_rules:
  - Open entries are leads, not proof of current behavior; reverify the target before acting.
  - Changed targets invalidate prior coverage until a new bounded review records evidence.
  - Resolved and superseded records live only in history and are not current coverage.
  - A hook gate failure remains active until a human resolves or archives it.

coverage: []
coverage_note: No pre-migration coverage was promoted because the repository changed after many recorded baselines.

id_conflicts:
  - source_id: SMELL-A11Y-003
    status: needs_reverification
    targets:
      - compact desktop calendar and event controls
      - mobile hero text contrast
    rule: Treat these as separate unresolved leads and assign distinct stable IDs only after a bounded re-review.

open_findings:
  - id: TEST-DATA-001
    level: SMELL
    axis: ARCH
    status: open
    target: tests/data/gallery-data.test.mjs; tests/data/static-public-content.test.mjs
    summary: English gallery identity is checked by two source-parsing inventories.
  - id: SEO-TITLE-WIDTH-001
    level: SMELL
    axis: SEO
    status: open
    target: generated event route titles
    summary: Event titles may exceed crawler preview thresholds; remeasure current output before changing copy.
  - id: SEO-DESC-TRUNC-001
    level: STRUCTURAL
    axis: SEO
    status: open
    target: generated event route descriptions
    summary: Some descriptions were mechanically truncated inside a sentence or address.
  - id: PERF-CWV-001
    level: SMELL
    axis: PERF
    status: open
    target: repository performance verification
    summary: No recorded field or automated measurement proves current LCP, INP, or CLS.
  - id: SEO-EVENTOS-ROOT-001
    level: STRUCTURAL
    axis: SEO
    status: open
    target: /eventos/
    summary: The Spanish events directory URL was reported as missing metadata because it returned 404.
  - id: SEO-SITEMAP-001
    level: SMELL
    axis: SEO
    status: open
    target: scripts/generate-route-html.mjs
    summary: Sitemap inclusion may conflict with the temporary global noindex policy.
  - id: SEO-EVENT-META-001
    level: STRUCTURAL
    axis: SEO
    status: open
    target: src/app/config/seo.ts
    summary: Recurring event routes may emit duplicate titles or descriptions.
  - id: SEO-EVENT-I18N-001
    level: STRUCTURAL
    axis: SEO
    status: open
    target: localized generated event metadata
    summary: At least one English route was reported with Spanish title and summary content.
  - id: PERF-SOCIAL-IMAGE-001
    level: SMELL
    axis: PERF
    status: open
    target: src/app/config/seo-data.json
    summary: Social metadata may select an unnecessarily large original image.
  - id: SEO-INDEX-001
    level: POLICY
    axis: SEO
    status: open_owner_policy
    target: global indexing policy
    summary: Indexing remains disabled pending an explicit owner and legal decision.
  - id: VIS-REG-001
    level: STRUCTURAL
    axis: RESPONSIVE
    status: open
    target: tests/design/visual-regression.spec.ts-snapshots
    summary: Historical visual differences require a fresh clean-worktree comparison before any baseline decision.
  - id: STR-ARCH-015
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: scripts/sync-calendar-events.mjs
    summary: Historical events were reported to preserve identity fields but not the entire published snapshot.
  - id: STR-ARCH-016
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: calendar historical-change reporting
    summary: Historical changes and disappearances require deterministic evidence and an approval boundary.
  - id: SMELL-ARCH-011
    level: SMELL
    axis: ARCH
    status: open
    target: calendar historical-freeze coverage
    summary: The freeze test was reported to cover fewer public fields than the persistence contract.
  - id: STR-ARCH-011
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: generated acceptance criteria and tests
    summary: High-risk behavior lacks a complete independently approved acceptance oracle.
  - id: STR-ARCH-012
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: multi-file calendar publication
    summary: Sequential destination replacement may leave registry and generated data inconsistent after partial failure.
  - id: SMELL-ARCH-008
    level: SMELL
    axis: ARCH
    status: open
    target: generated-output and browser test names
    summary: Some test names were reported to claim more than their assertions prove.
  - id: SMELL-ARCH-009
    level: SMELL
    axis: ARCH
    status: open
    target: test:generated
    summary: The generated-output command may read stale dist artifacts when run without a preceding build.
  - id: SMELL-SEO-005
    level: SMELL
    axis: SEO
    status: open
    target: custom not-found browser scenario
    summary: Local browser behavior does not prove deployed HTTP response semantics.
  - id: STR-RESP-002
    level: STRUCTURAL
    axis: RESPONSIVE
    status: open
    target: responsive route contracts
    summary: Historical route coverage did not fully encode bounded desktop sections, horizontal overflow, and mobile reachability.
  - id: STR-ARCH-010
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: requirements and automated evidence
    summary: Requirements lack stable IDs mapped to owner-readable acceptance scenarios and tests.
  - id: SMELL-ARCH-006
    level: SMELL
    axis: ARCH
    status: open
    target: event-route browser scenarios
    summary: Some scenarios depend on mutable generated event slugs, titles, or first-match selection.
  - id: SMELL-A11Y-002
    level: SMELL
    axis: A11Y
    status: open
    target: interactive browser coverage
    summary: Keyboard workflows, modal focus containment, and automated accessibility scans remain incomplete.
  - id: SMELL-ARCH-007
    level: SMELL
    axis: ARCH
    status: open
    target: Playwright CI diagnostics
    summary: Cross-browser coverage and retained HTML or trace artifacts were reported as absent.
  - id: STR-SEO-002
    level: STRUCTURAL
    axis: SEO
    status: open
    target: public organization identity and canonical domain policy
    summary: Official identity and domain claims remain constrained by pending authorization.
  - id: STR-ARCH-004
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: phase-control documentation provenance
    summary: Legacy review could not reproduce roadmap, baseline, and decision-log provenance from the public repository.
  - id: STR-ARCH-005
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: private architecture and phase-control documentation
    summary: Some private architecture records were reported against an obsolete product revision.
  - id: POL-ARCH-002
    level: POLICY
    axis: ARCH
    status: open
    target: event and archive layout policy
    summary: Event layout differs from bounded media routes and requires an explicit product policy before change.
  - id: SMELL-A11Y-003
    level: SMELL
    axis: A11Y
    status: open_decision_required
    target: compact desktop event controls
    summary: Controls satisfy the recorded AA minimum but not the optional 44 px enhanced target policy.
  - id: MIG-A11Y-001
    source_id: SMELL-A11Y-003
    level: SMELL
    axis: A11Y
    status: needs_reverification
    target: mobile hero text contrast
    summary: The historical state reused an existing ID for a separate reported hero-contrast problem.
  - id: POL-RESP-010
    level: POLICY
    axis: RESPONSIVE
    status: open
    target: mobile hero treatment
    summary: The recorded baseline did not prove the requested contrast and crop improvement.
  - id: STR-RESP-011
    level: STRUCTURAL
    axis: RESPONSIVE
    status: open
    target: Home tablet visual baseline
    summary: The tablet snapshot may predate navigation and containment changes.
  - id: SMELL-SEO-007
    level: SMELL
    axis: SEO
    status: deferred_presidency_authority
    target: recurring event detail titles
    summary: Date disambiguation is deferred to the public identity and editorial authority decision.
  - id: DOC-ARCH-003
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: private calendar resilience documentation
    summary: Phase 6 documentation was reported stale relative to the implemented verification gate.
  - id: EXT-ARCH-001
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: external GitHub Actions and Cloudflare publication relationship
    summary: Local files do not prove that deployment consumes only verified artifacts.

pending_reviews:
  - id: PEND-SEO-001
    target: Search Console, Rich Results, and field Core Web Vitals
    dependency: external Google property access
  - id: PEND-SEO-002
    target: dojo identity copy and per-dojo structured data
    dependency: approved public copy
  - id: PEND-SEO-003
    target: provisional identity, official-name cutover, canonical domain, and redirects
    dependency: legal and owner approval
  - id: PEND-SEO-004
    target: production event indexing and analytics baselines
    dependency: indexing approval and external data
  - id: PEND-ARCH-001
    target: state-management architecture decision
    dependency: a feature that exceeds current local and URL state patterns
  - id: PEND-ARCH-003
    target: event registration workflow
    dependency: product requirements and ownership
  - id: PEND-ARCH-004
    target: expanded event editorial page
    dependency: approved content responsibilities
  - id: PEND-RESP-001
    target: exact tablet and mobile inner-viewport geometry
    dependency: reproducible native viewport evidence
```
