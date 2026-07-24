# Technical Review State

```yaml
schema_version: 2
last_updated: 2026-07-24
contract: .agents/review-contract.md

state_rules:
  - Coverage is valid only for its recorded targets, axes, inclusions, and baseline.
  - An inspected target is not automatically reviewed.
  - A reviewed target is not automatically verified.
  - Changed targets make prior coverage stale until re-reviewed.
  - Legacy claims without reproducible evidence are historical, not current coverage.

latest_session:
  id: REV-2026-07-24-01
  requested_scope: Continue the prior redundancy review with component internals in scope and without implementing changes.
  actual_scope:
    targets:
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/Footer.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/Lightbox.tsx
      - src/app/components/Navbar.tsx
      - src/app/components/NotFoundSection.tsx
      - src/app/components/PageTitle.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - src/app/components/ui/ModalShell.tsx
    axes: [ARCH, REACT]
    included:
      - duplicated local helpers and presentation transformations
      - duplicated component lifecycle and interaction effects
      - duplicated conditional render branches
      - repeated responsive render trees
      - repeated pagination and navigation controls
    excluded:
      - implementation of proposed refactors
      - TypeScript, Tailwind, accessibility, performance, SEO, and responsive correctness
      - visual or pixel-level Figma comparison
      - runtime browser and production behavior
  baseline:
    commit: bffe7fc5
    worktree: clean
    fingerprint: Per-file SHA-256 hashes recorded in COV-2026-07-24-01 evidence.
  result: Four component-internal redundancy findings were added and STR-ARCH-006 was revalidated; repeated navigation markup in Navbar and control pairs in CalendarSection were judged intentional variants with shared data or styling already centralized.

prior_architecture_documentation_session:
  id: REV-2026-07-21-01
  requested_scope: Validate the reported architecture-documentation staleness finding against the named documentation and current main.
  actual_scope:
    targets:
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/architecture.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/technical-backlog.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/roadmap.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/project-baseline.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/decision-log.md
      - Git history from b7e337af through 71875972
    axes: [ARCH]
    included:
      - consistency of recorded dates and commit baselines
      - current-main drift affecting affiliates and gallery architecture
      - whether the calendar route is present on current main
      - preservation of the approved Phase 1 baseline as historical evidence
    excluded:
      - full re-review of the current application architecture
      - approval of the Phase 2 target architecture and ADRs
      - unmerged Calendar_Page implementation quality
  baseline:
    commit: 71875972
    worktree: clean
    documentation_fingerprints:
      architecture.md: AB8F6777D682B18C4B34AA14E9A7B53D07166803FCE45CE3695885AF1A97DDB4
      technical-backlog.md: F7BFD28CCD17984AB48AE4D9C8F16165A6531BEA2897973A13167DB3ACFC503F
      roadmap.md: B29B86BB8E9D2086E13A3E97269C4CB712758450F6DED3868E28304566AAF63B
      project-baseline.md: 78FECEACB873ECC32885FB769AC1AB4D4A67BCADE2A917174A09201DFD1880CC
      decision-log.md: 4F2B5648C11C8DF74C135E71E8130BFC85CA7DB75BE67C6E74893CF7E986FFEE
  result: The architecture proposal is stale for current main; reconciliation must use the final post-calendar merge commit while preserving the Phase 1 baseline as historical evidence.

prior_session:
  id: REV-2026-07-19-01
  requested_scope: Complete Tailwind and responsive audit of src/app/**/*.tsx and src/styles/globals.css, including typography, colors, radii, spacing, no-effect utilities, variant precedence, generated CSS, and the responsive cascade.
  actual_scope:
    targets:
      - 14 TSX files matched by src/app/**/*.tsx
      - src/styles/globals.css
      - compiled dist/assets/index-B0o7lP-v.css
      - local routes /, /calendario/, /galeria/, and /afiliados/
    axes: [TAILWIND, RESPONSIVE, ARCH]
    included:
      - typography utilities and base typography cascade
      - colors, opacities, and semantic-token consistency
      - radius convention
      - spacing, gap, size, padding, margin, and inset
      - no-effect, overwritten, duplicate, contradictory, and equivalent utilities
      - sm, md, lg, xl, land-sm, land-tall, tall-md, and land-compact precedence
      - intentional responsive restoration chains
      - generated CSS order
      - route geometry at the required responsive matrix and variant-boundary viewports
    excluded:
      - TS, React, accessibility, performance, and SEO concerns unrelated to the requested Tailwind/responsive behavior
      - pixel-level comparison with Figma because no Figma artifact was included in the inspected files
      - production deployment behavior
  baseline:
    commit: f35c9557
    worktree: dirty
    inventory_fingerprint_sha256: 4ae0e028297fb04be498de49f0f1a5337eb7de99e75d2a512f25c11b775b4929
    dirty_targets:
      - src/app/App.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/CalendarSection.tsx (untracked)
      - src/app/components/HeroSection.tsx
      - src/app/components/Navbar.tsx
      - src/app/components/PageTitle.tsx
  result: One responsive correctness defect, two structural issues, one responsive smell, and five Tailwind polish findings were recorded; the required 1366x768 no-scroll invariant passed on all four routes.

latest_resolution:
  id: FIX-2026-07-23-02
  source_session: REV-2026-07-23-02
  baseline:
    commit: 43bc58cf
    worktree: dirty
    fingerprints:
      PageTitle.tsx: 538E55BE3C5FC8D72FA445CDA2E907017585404B5400D375761449202D846D57
      CalendarSection.tsx: 11F0692E64021767BD724335939D7464676BCB9A2A3A066A0DCFFA7DCE50DBAF
      GallerySection.tsx: B9D032F0F614466AAE36166268807EC5DD945D637C91D332C40EF1174584A7EF
      AfiliadosSection.tsx: DD89694A077C40BBEF8FA0B98BC62DCB5570FEB94A25F21B7A50143019048E34
  resolved_findings:
    - SMELL-ARCH-001
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source inspection found three placement="floating" consumers and one centralized positioning class
    - generated calendario, galeria, and afiliados HTML retained the exact original floating-title class list

previous_resolution:
  id: FIX-2026-07-19-01
  source_session: REV-2026-07-19-01
  baseline:
    commit: f35c9557
    worktree: dirty
    target_fingerprint_sha256: a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
  resolved_findings:
    - CRIT-RESP-001
    - STR-ARCH-002
    - STR-TW-001
    - SMELL-RESP-001
    - POL-TW-001
    - POL-TW-002
    - POL-TW-003
    - POL-TW-004
    - POL-TW-005
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - generated CSS contains site semantic utilities and no legacy complex typography selector
    - raw palette utility search returned no matches in src/app TS and TSX files
    - browser route matrix checked at requested 360x800, 390x844, 768x1024, and 1366x768 overrides
    - compact landscape event displays were [flex, flex, none, none] at requested 1024x640
    - gallery frame computed flex was 0 0 auto at requested 1024x640 and 1 1 0% at requested 1024x641

coverage:
  - id: COV-2026-07-24-01
    targets:
      - src/app/components/**/*.tsx (14 files from the recorded inventory)
    axes: [ARCH, REACT]
    included:
      - duplicated local helpers and presentation transformations
      - duplicated component lifecycle and interaction effects
      - duplicated conditional render branches
      - repeated responsive render trees
      - repeated pagination and navigation controls
    excluded:
      - implementation
      - TypeScript, Tailwind, accessibility, performance, SEO, and responsive correctness
      - visual or pixel-level Figma comparison
      - runtime browser and production behavior
    depth: reviewed
    evidence:
      - git status --short returned no changes and git rev-parse --short HEAD returned bffe7fc5
      - rg --files src/app/components -g '*.tsx' returned the exact 14-file inventory
      - line-numbered and full-source inspection of every inventory target
      - exact searches for eventDateFormatter, getLocationMapUrl, feedbackTimeoutRef, previousHtmlOverflow, focus trapping, NAV_LINKS.map, and paired chevron controls
      - SHA-256 fingerprints: AfiliadosSection DD89694A077C40BBEF8FA0B98BC62DCB5570FEB94A25F21B7A50143019048E34; CalendarSection 11F0692E64021767BD724335939D7464676BCB9A2A3A066A0DCFFA7DCE50DBAF; EventDetailModal ABC80D05C3C99B3FF4D93F7585B1DDE405074528F7F3BF9CA6C9A89005001A52; Footer D1203595874C6970FDA39C363CBCDBF9CDD6690DC44812CF94C896DC296F6C2E; GallerySection B9D032F0F614466AAE36166268807EC5DD945D637C91D332C40EF1174584A7EF; HeroSection 875AA65F508DBCB0DF4DEB369D03900CE73061CDBA85EF960000B0108E405860; Lightbox C563149C56B23884924277FA78273BC6AACB596D29AC17114769F3D57FB23456; Navbar 72FF901122897A337F474EF4F2F33FDE2D8F17B2EDC69F119D5B3FB5EA24ECC9; NotFoundSection 9EA4F2A61F53004AB19743C43CF765D9D8169D3805EDD3A5B56987DEF4AB6A36; PageTitle 538E55BE3C5FC8D72FA445CDA2E907017585404B5400D375761449202D846D57; UpcomingEventsSection 3A5387FB1A2D9B7A894F591A184591DA9E7C0FB43E2446F541F0D7CC90C8245B; FeaturedImage 07448DD99D2D9C768AED9E91CD0014C4FF880471015BC7925B568A88530BBF88; GalleryThumbnails 5C3372DF57BFAA8AB67D08954CC2DB3D5F84F57A2DE64DDB3F8E17D86269C1C3; ModalShell 2D97637B7F3F9CAC9EFB787B8B60DD06E4C3B0651A863CDC0DD3D1AC50C2681E
    baseline:
      commit: bffe7fc5
      worktree: clean
    status: current
    file_results:
      src/app/components/AfiliadosSection.tsx: [SMELL-ARCH-002]
      src/app/components/CalendarSection.tsx: [STR-ARCH-006]
      src/app/components/EventDetailModal.tsx: no finding; shared modal lifecycle and calendar presentation helpers are consumed
      src/app/components/Footer.tsx: no finding
      src/app/components/GallerySection.tsx: no finding
      src/app/components/HeroSection.tsx: no finding
      src/app/components/Lightbox.tsx: [STR-REACT-001, SMELL-REACT-002]
      src/app/components/Navbar.tsx: no finding; the desktop and mobile trees share NAV_LINKS and differ in container behavior and close handling
      src/app/components/NotFoundSection.tsx: no finding
      src/app/components/PageTitle.tsx: no finding
      src/app/components/UpcomingEventsSection.tsx: [STR-ARCH-007]
      src/app/components/gallery/FeaturedImage.tsx: [SMELL-REACT-002]
      src/app/components/gallery/GalleryThumbnails.tsx: no finding
      src/app/components/ui/ModalShell.tsx: [STR-REACT-001]
    verification_gaps:
      - analysis-only review; no refactor or runtime behavior was verified

  - id: COV-2026-07-23-03
    targets:
      - src/app/components/PageTitle.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/AfiliadosSection.tsx
      - dist/calendario/index.html
      - dist/galeria/index.html
      - dist/afiliados/index.html
    axes: [ARCH]
    included:
      - implementation and verification of the shared floating PageTitle placement
      - preservation of the existing rendered class list in all three consumers
    excluded:
      - unrelated local changes
      - other PageTitle presentations
      - pixel-level browser comparison
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - source search found placement="floating" in CalendarSection, GallerySection, and AfiliadosSection
      - source search found the full positioning class only in PageTitle
      - generated route HTML contains the unchanged full positioning class for all three affected routes
    baseline:
      commit: 43bc58cf
      worktree: dirty
    status: current
    result: SMELL-ARCH-001 resolved without changing the rendered floating-title utility list.

  - id: COV-2026-07-23-02
    targets:
      - src/app/App.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/PageTitle.tsx
    axes: [ARCH]
    included:
      - shared route shell
      - repeated page-root composition
      - repeated title placement
      - repeated full-bleed image composition
      - duplicated empty and populated render branches
    excluded:
      - implementation
      - unrelated component internals
      - all non-ARCH axes
      - runtime browser and production behavior
    depth: reviewed
    evidence:
      - line-numbered inspection of all six targets
      - exact rg comparison for aria-labelledby, PageTitle, picture, absolute inset, and viewport-height patterns
      - SHA-256 fingerprints recorded in REV-2026-07-23-02
    baseline:
      commit: 43bc58cf
      worktree: dirty
    status: stale
    stale_reason: PageTitle and all three floating-title consumers changed during FIX-2026-07-23-02.
    file_results:
      src/app/App.tsx: no finding; shared navbar, main, footer, route manifest, metadata, and scroll behavior are centralized
      src/app/components/HeroSection.tsx: no finding; backdrop similarities have materially different semantics and responsive framing
      src/app/components/CalendarSection.tsx: [STR-ARCH-006, SMELL-ARCH-001]
      src/app/components/GallerySection.tsx: [SMELL-ARCH-001]
      src/app/components/AfiliadosSection.tsx: [SMELL-ARCH-001]
      src/app/components/PageTitle.tsx: [SMELL-ARCH-001]
    verification_gaps:
      - analysis-only review; no refactor was implemented or runtime-verified

  - id: COV-2026-07-21-01
    targets:
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/architecture.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/technical-backlog.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/roadmap.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/project-baseline.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/decision-log.md
      - Git history from b7e337af through 71875972
    axes: [ARCH]
    included:
      - documentation baseline consistency
      - supersession requirements
      - affiliate and gallery drift
      - calendar-route presence on current main
    excluded:
      - full current-architecture review
      - target-architecture and ADR approval
      - unmerged calendar branch review
    depth: reviewed
    evidence:
      - architecture.md records 2026-07-13 and b7e337af
      - git status reported clean main at 71875972 tracking origin/main
      - git diff b7e337af..71875972 shows affiliate pagination and gallery navigation changes
      - current seo-data.json and App.tsx contain only home, gallery, and affiliates route mappings
      - git history locates CalendarSection changes on Calendary_Page rather than current main
      - SHA-256 fingerprints recorded in REV-2026-07-21-01
    baseline:
      commit: 71875972
      worktree: clean
    status: current
    result: STR-ARCH-005 validated; documentation reconciliation remains gated on the final calendar merge commit.

  - id: COV-2026-07-16-01
    targets:
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/Footer.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/Lightbox.tsx
      - src/app/components/Navbar.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/components/gallery/FeaturedImage.tsx
    axes: [TAILWIND]
    included: [spacing, gap, size, inset shorthands, no-effect utility removal]
    excluded: [typography, colors, radii, variant precedence, full responsive cascade]
    depth: reviewed
    evidence:
      - commit b81ca418 changed the listed component files
      - original search command was not recorded
      - legacy state recorded typecheck, build, and a 1280x720 geometry check
    baseline:
      commit: b81ca418
      worktree: clean at commit
    status: stale
    stale_reason: One or more covered component files changed after the baseline.
    result: Only the included Tailwind utility families were reviewed; this is not a complete Tailwind audit.

  - id: COV-2026-07-17-01
    targets:
      - src/app/components/AfiliadosSection.tsx:60
      - src/styles/globals.css:7
      - compiled dist CSS for the selected utilities
    axes: [TAILWIND, RESPONSIVE]
    included:
      - text-xl base behavior
      - lg:text-lg behavior at min-width 1024px
      - land-compact:text-xl override in landscape at min-width 768px and max-height 480px
      - land-compact:leading-tight as an independent line-height change
    excluded:
      - other typography declarations
      - component-wide Tailwind consistency
      - route-wide visual regression
    depth: reviewed
    evidence:
      - exact rg search for the class chain
      - src/styles/globals.css custom variant definition
      - generated CSS rule order in dist/assets
      - git blame and history for AfiliadosSection.tsx
    baseline:
      commit: f35c9557
      worktree: dirty
      target_fingerprint: 40827ecd7c9e428b6f188b8b41fee10c8a6bf444
    status: stale
    stale_reason: AfiliadosSection.tsx changed in the dirty worktree after the recorded target fingerprint.
    result: No redundant rule was proven; land-compact:text-xl restores the base size after lg:text-lg where both media conditions match.

  - id: COV-2026-07-19-01
    targets:
      - src/app/App.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/Footer.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryDots.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/Lightbox.tsx
      - src/app/components/Navbar.tsx
      - src/app/components/NotFoundSection.tsx
      - src/app/components/PageTitle.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/styles/globals.css
    axes: [TAILWIND, RESPONSIVE, ARCH]
    included:
      - typography, font weight, line height, and tracking
      - colors, opacity, and semantic-token consistency
      - radii and primary-container convention
      - spacing, gap, size, padding, margin, and inset
      - no-effect, overwritten, duplicate, contradictory, and equivalent utilities
      - complete declared breakpoint and custom-variant cascade
      - intentional responsive restoration chains
      - generated CSS precedence
      - responsive route geometry
    excluded:
      - unrelated TS, React, accessibility, performance, and SEO concerns
      - pixel-level Figma comparison without a Figma artifact
      - production deployment behavior
    depth: reviewed
    evidence:
      - exact 15-file inventory from rg --files src/app -g '*.tsx' plus src/styles/globals.css
      - SHA-256 per target and aggregate inventory fingerprint 4ae0e028297fb04be498de49f0f1a5337eb7de99e75d2a512f25c11b775b4929
      - line-numbered inspection of every inventory target
      - corepack pnpm run build passed and generated dist/assets/index-B0o7lP-v.css
      - generated media order and targeted selector positions inspected in compiled CSS
      - browser geometry for /, /calendario/, /galeria/, and /afiliados/ at requested overrides 360x800, 390x844, 768x1024, and 1366x768, with actual inner dimensions recorded
      - variant-boundary checks at 844x390, 1024x640, 1024x641, and 1366x480
      - rg searches for raw palette utilities, semantic-token usage, exact duplicates, and equivalent utilities
    baseline:
      commit: f35c9557
      worktree: dirty
      inventory_fingerprint_sha256: 4ae0e028297fb04be498de49f0f1a5337eb7de99e75d2a512f25c11b775b4929
    status: stale
    stale_reason: The reviewed targets changed during FIX-2026-07-19-01 after the audit fingerprint was recorded.
    file_results:
      src/app/App.tsx: [STR-ARCH-002]
      src/app/components/AfiliadosSection.tsx: [STR-ARCH-002, POL-TW-002, POL-TW-003]
      src/app/components/CalendarSection.tsx: [STR-ARCH-002]
      src/app/components/Footer.tsx: [STR-ARCH-002, POL-TW-004]
      src/app/components/gallery/FeaturedImage.tsx: [STR-ARCH-002, SMELL-RESP-001, POL-TW-001, POL-TW-002]
      src/app/components/gallery/GalleryDots.tsx: [STR-ARCH-002]
      src/app/components/gallery/GalleryThumbnails.tsx: [STR-ARCH-002]
      src/app/components/GallerySection.tsx: [STR-ARCH-002]
      src/app/components/HeroSection.tsx: [STR-ARCH-002, POL-TW-005]
      src/app/components/Lightbox.tsx: [STR-ARCH-002, POL-TW-002]
      src/app/components/Navbar.tsx: [STR-ARCH-002, POL-TW-002]
      src/app/components/NotFoundSection.tsx: [STR-ARCH-002]
      src/app/components/PageTitle.tsx: [STR-ARCH-002]
      src/app/components/UpcomingEventsSection.tsx: [CRIT-RESP-001, STR-ARCH-002]
      src/styles/globals.css: [STR-TW-001, STR-ARCH-002, POL-TW-004]
    no_finding_targets: []
    verified_no_finding_cases:
      - AfiliadosSection InfoCell text-xl lg:text-lg land-compact:text-xl intentionally restores 20px in compact landscape.
      - lg:min-h-8 and compact-landscape spacing reductions intentionally restore smaller values after mobile touch-target defaults.
      - At 1366x768 all four routes keep document and primary-section scrollHeight equal to clientHeight.
    verification_gaps:
      - The browser reported actual inner dimensions 390x845 for the 390x844 override and 768x1025 for the 768x1024 override, so exact one-pixel geometry at those two requested heights remains unverified.

  - id: COV-2026-07-19-02
    targets:
      - findings CRIT-RESP-001, STR-ARCH-002, STR-TW-001, SMELL-RESP-001, and POL-TW-001 through POL-TW-005
      - src/app TS and TSX Tailwind color usage
      - src/styles/globals.css custom variants, semantic tokens, and base typography
      - local routes /, /calendario/, /galeria/, and /afiliados/
    axes: [TAILWIND, RESPONSIVE, ARCH]
    included:
      - implementation and verification of findings introduced or revalidated by REV-2026-07-19-01
      - semantic color token output
      - compact-landscape event visibility
      - 640px and 641px variant boundary
      - required desktop no-scroll invariant
    excluded:
      - unrelated findings and pending reviews
      - exact 390x844 and 768x1024 inner-height equality because the browser reported one extra pixel
      - production deployment behavior
    depth: verified
    evidence:
      - typecheck and build passed
      - generated dist/assets/index-CvcYiQ8L.css inspected
      - raw palette utility search returned no matches in src/app TS and TSX files
      - browser route matrix and boundary checks recorded in FIX-2026-07-19-01
    baseline:
      commit: f35c9557
      worktree: dirty
      target_fingerprint_sha256: a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
    status: stale
    stale_reason: CalendarSection.tsx and shared presentation targets changed after the recorded baseline.
    result: The nine listed findings were implemented and verified without changing the recorded color values or the 1366x768 route geometry.

  - id: COV-2026-07-23-01
    targets:
      - src/app/components/CalendarSection.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/PageTitle.tsx
      - src/app/components/Footer.tsx
    axes: [A11Y, TAILWIND, SEO]
    included:
      - semantic heading levels on the calendar page and event dialog
      - relative font sizes, weights, casing, and supporting-text hierarchy
      - visible h1 hierarchy in the inspected route components
    excluded:
      - responsive geometry
      - color contrast measurement
      - other routes and components
      - runtime screen-reader announcements
    depth: reviewed
    evidence:
      - Select-String query for h1, h2, h3, PageTitle, and text-size utilities
      - SHA-256 fingerprints recorded for all four targets
      - baseline commit 43bc58cf with a dirty worktree
    baseline:
      commit: 43bc58cf
      worktree: dirty
      fingerprints:
        CalendarSection.tsx: 7FB7C71115F48410EC68C2C4AFAC084E52F71F647B7EA411246D6261898B0E95
        EventDetailModal.tsx: ABC80D05C3C99B3FF4D93F7585B1DDE405074528F7F3BF9CA6C9A89005001A52
        PageTitle.tsx: E4A64A2BD0B309928141AB0A0C88CB6E6F4A5D4CE2FA5D0B9D3B3004A583F586
        Footer.tsx: D1203595874C6970FDA39C363CBCDBF9CDD6690DC44812CF94C896DC296F6C2E
    status: current
    result: Semantic and visual heading order are sound after resolving POL-TW-006.

legacy_coverage:
  status: evidence_incomplete
  rule: The records below preserve historical scope but do not prove current compliance.
  records:
    - id: COV-LEGACY-SEO-01
      targets: [route metadata, generated route HTML, sitemap, robots, production route responses]
      axes: [SEO, ARCH]
      depth: reviewed
      evidence: Detailed commands and baselines were not consistently recorded in v1.
    - id: COV-LEGACY-A11Y-01
      targets: [heading hierarchy, navbar touch target, gallery dot touch targets]
      axes: [A11Y, RESPONSIVE]
      depth: reviewed
      evidence: Detailed commands and baselines were not consistently recorded in v1.
    - id: COV-LEGACY-ARCH-01
      targets: [GitHub Actions coverage, test inventory, design tokens, project control documents]
      axes: [ARCH]
      depth: reviewed
      evidence: Detailed commands and baselines were not consistently recorded in v1.
    - id: COV-LEGACY-RESP-01
      targets: [PageTitle placement, desktop no-scroll invariant, variable-content reachability]
      axes: [RESPONSIVE]
      depth: reviewed
      evidence: Detailed commands and baselines were not consistently recorded in v1.

active_findings:
  - id: CRIT-ARCH-001
    level: CRITICAL
    axis: ARCH
    status: open_needs_revalidation
    target: route manifest, component map, and navigation for /calendario
    problem: The legacy review found that the required /calendario route rendered the 404 page and left events beyond the homepage preview unreachable.
    fix: Add and verify the route manifest entry, route component, navigation path, prerendered output, and bounded access to the full event list.
    cost_of_deferring: Users cannot reach the federation's complete calendar through the documented route.
    evidence:
      - migrated from v1 state
      - current worktree contains unreviewed calendar-related changes
    introduced_in: legacy-v1

  - id: STR-ARCH-001
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: .github/workflows
    problem: Ordinary repository changes are not protected by automated quality checks because the recorded workflow coverage is limited to calendar synchronization.
    fix: Add a change-validation workflow that runs the repository's relevant typecheck and build commands.
    cost_of_deferring: Routing, build, and type regressions can be merged without an automated gate.
    evidence: migrated from v1 state; current workflow inventory not revalidated in this session
    introduced_in: legacy-v1

  - id: STR-ARCH-003
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: automated browser-test harness
    problem: Critical routing, navigation, hydration, 404, and gallery behavior relies on manual regression checks.
    fix: Add a minimal browser-test harness covering the highest-risk route and interaction paths.
    cost_of_deferring: Regressions remain expensive to detect and easy to miss during solo development.
    evidence: migrated from v1 state; package scripts were not revalidated in this session
    introduced_in: legacy-v1

  - id: STR-ARCH-004
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: roadmap.md, project-baseline.md, and decision-log.md
    problem: Phase-control documentation was absent from the repository tree and local Git history in the legacy review.
    fix: Restore or recreate the control documents in the appropriate documentation workspace and keep runtime code independent from them.
    cost_of_deferring: Architecture and phase decisions remain difficult to reproduce across future sessions.
    evidence: migrated from v1 state; presence was not revalidated in this session
    introduced_in: legacy-v1

  - id: STR-ARCH-005
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: architecture.md, technical-backlog.md, roadmap.md, project-baseline.md, decision-log.md, and .codex/review-state.md
    problem: The Phase 2 architecture proposal still describes b7e337af from 2026-07-13 even though current main is 71875972 and later commits changed affiliate pagination and gallery navigation.
    fix: After the calendar work reaches main, reconcile the current architecture, review state, technical backlog, roadmap, and decision log against that single final commit; preserve project-baseline.md as the approved Phase 1 historical snapshot and add explicit supersession notes instead of rewriting its facts as current.
    cost_of_deferring: Phase 2 could approve an architectural description that does not match the product being governed.
    evidence:
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/architecture.md:4-5 records 2026-07-13 and b7e337af
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/architecture.md:37 and 50 omit the calendar route and CalendarSection
      - git diff b7e337af..71875972 includes affiliate pagination and replacement of GalleryDots with scrollable GalleryThumbnails
      - current main at 71875972 does not yet contain the calendar route in seo-data.json or App.tsx
    introduced_in: REV-2026-07-21-01

  - id: STR-ARCH-006
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: src/app/components/CalendarSection.tsx:278 and src/app/components/CalendarSection.tsx:343
    problem: CalendarSection duplicates the complete page frame in its empty-events and populated-events render branches.
    fix: Render one shared section with CalendarBackdrop and CalendarBanner, and choose only the body content conditionally inside that frame.
    cost_of_deferring: Future changes to the calendar page shell can update one branch while silently leaving the other visually or responsively stale.
    evidence:
      - identical section attributes and classes at lines 280-285 and 345-350
      - revalidated at clean commit bffe7fc5 and fingerprint 11F0692E64021767BD724335939D7464676BCB9A2A3A066A0DCFFA7DCE50DBAF
    introduced_in: REV-2026-07-23-02

  - id: STR-ARCH-007
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: src/app/components/UpcomingEventsSection.tsx:11-49
    problem: UpcomingEventsSection reimplements the date-range and Google Maps presentation logic already centralized in calendarEventPresentation.ts.
    fix: Export the structured date-range labels needed by the homepage from calendarEventPresentation.ts and import getLocationMapUrl instead of maintaining component-local copies.
    cost_of_deferring: Date formatting, inclusive end-date rules, localization, or map URL behavior can diverge between the homepage, calendar, and event modal.
    evidence:
      - eventDateFormatter and its helper chain are duplicated at UpcomingEventsSection.tsx:11-39 and calendarEventPresentation.ts:3-27
      - getLocationMapUrl is duplicated at UpcomingEventsSection.tsx:42-49 and calendarEventPresentation.ts:36-39
      - clean baseline bffe7fc5; UpcomingEventsSection fingerprint 3A5387FB1A2D9B7A894F591A184591DA9E7C0FB43E2446F541F0D7CC90C8245B
    introduced_in: REV-2026-07-24-01

  - id: STR-REACT-001
    level: STRUCTURAL
    axis: REACT
    status: open
    target: src/app/components/Lightbox.tsx and src/app/components/ui/ModalShell.tsx
    problem: Lightbox independently implements focus return, document scroll locking, Escape handling, focus trapping, backdrop closing, and dialog refs already owned by ModalShell.
    fix: Extract a shared useModalBehavior hook or add a layout variant to ModalShell so Lightbox supplies its specialized rendering and arrow-key navigation without duplicating modal lifecycle effects.
    cost_of_deferring: Fixes to modal lifecycle behavior must be made twice and the two dialogs can silently drift.
    evidence:
      - duplicated scroll-lock effects at Lightbox.tsx:88-99 and ModalShell.tsx:48-59
      - overlapping focus-return and keyboard/focus-trap effects at Lightbox.tsx:82-138 and ModalShell.tsx:42-100
      - clean baseline bffe7fc5; Lightbox fingerprint C563149C56B23884924277FA78273BC6AACB596D29AC17114769F3D57FB23456; ModalShell fingerprint 2D97637B7F3F9CAC9EFB787B8B60DD06E4C3B0651A863CDC0DD3D1AC50C2681E
    introduced_in: REV-2026-07-24-01

  - id: SMELL-ARCH-002
    level: SMELL
    axis: ARCH
    status: open
    target: src/app/components/AfiliadosSection.tsx:103-159
    problem: DojoInfo duplicates the location section, heading, definition list, and schedule-row composition across two branches instead of rendering normalized location groups once.
    fix: Group schedule slots by location first and map one shared location-section renderer for both single- and multi-location dojos.
    cost_of_deferring: New schedules can repeat location headings and every markup change must stay synchronized across both branches.
    evidence:
      - allSlotsShareLocation branch at lines 132-146 and per-slot branch at lines 147-158 repeat the same semantic shell
      - current dojo data exercises both branches
      - clean baseline bffe7fc5; fingerprint DD89694A077C40BBEF8FA0B98BC62DCB5570FEB94A25F21B7A50143019048E34
    introduced_in: REV-2026-07-24-01

  - id: SMELL-REACT-002
    level: SMELL
    axis: REACT
    status: open
    target: src/app/components/Lightbox.tsx:37-79 and src/app/components/gallery/FeaturedImage.tsx:69-131
    problem: Lightbox and FeaturedImage duplicate the same transient arrow-feedback state, timeout reset, and unmount cleanup behavior.
    fix: Extract a small useTransientDirectionFeedback hook returning activeDirection and showDirection.
    cost_of_deferring: Feedback timing or cleanup changes require synchronized edits in both gallery interaction surfaces.
    evidence:
      - matching feedbackTimeoutRef, activeArrow, showArrowFeedback, 220ms timeout, and cleanup blocks in both targets
      - clean baseline bffe7fc5; Lightbox fingerprint C563149C56B23884924277FA78273BC6AACB596D29AC17114769F3D57FB23456; FeaturedImage fingerprint 07448DD99D2D9C768AED9E91CD0014C4FF880471015BC7925B568A88530BBF88
    introduced_in: REV-2026-07-24-01

resolved_findings:
  - id: SMELL-ARCH-001
    status: resolved
    resolved_at: 2026-07-23
    summary: PageTitle now owns the floating placement preset used by Calendar, Gallery, and Affiliates.
    resolution:
      resolved_ref: 43bc58cf dirty worktree fingerprints recorded in FIX-2026-07-23-02
      checks: [typecheck, production and SSR build, source search, generated route HTML]
  - id: POL-TW-006
    status: resolved
    resolved_at: 2026-07-23
    summary: The calendar month h2 now uses text-lg beneath the shared text-xl PageTitle, matching the homepage's 20px to 18px hierarchy.
    resolution:
      resolved_ref: 43bc58cf dirty worktree fingerprint 7FB7C71115F48410EC68C2C4AFAC084E52F71F647B7EA411246D6261898B0E95
      checks: [source inspection, pnpm run typecheck]
  - id: LEGACY-SEO-001
    status: resolved_legacy_unverified
    resolved_at: 2026-07-11
    summary: Route manifest, shared head policy, SEO validation, JSON-LD extension, 404 metadata, SSR output, and shared route SEO payload were reported fixed.
    verification: Original per-finding commands and baselines were not recorded in v1.
  - id: LEGACY-REACT-001
    status: resolved_legacy_unverified
    resolved_at: 2026-07-11
    summary: ScrollToTop was reported updated to preserve initial and fragment navigation positions.
    verification: Original per-finding commands and baselines were not recorded in v1.
  - id: LEGACY-RESP-001
    status: resolved_legacy_unverified
    resolved_at: 2026-07-13
    summary: Navbar and gallery-dot controls were reported updated to 44px interactive targets.
    verification: Original per-finding commands and baselines were not recorded in v1.
  - id: LEGACY-TW-001
    status: resolved
    resolved_at: 2026-07-16
    summary: No-effect spacing utilities and equivalent padding/inset shorthands were reported cleaned in the eight listed component files.
    verification:
      - typecheck reported passing
      - build reported passing
      - geometry reported preserved at 1280x720 for /, /galeria, and /afiliados
    limitation: Typography, colors, radii, and variant precedence were not covered.
  - id: LEGACY-DESIGN-001
    status: resolved_legacy_unverified
    resolved_at: 2026-07-16
    summary: rounded-3xl was documented as the primary-container convention, with scoped internal-radius exceptions.
    verification: Original visual inventory and baseline were not recorded in v1.
  - id: LEGACY-RESP-002
    status: resolved_legacy_unverified
    resolved_at: 2026-07-17
    summary: Affiliates pagination was reported to bound desktop content to two dojo cards while preserving mobile scrolling.
    verification: Original command and viewport results were not recorded in v1.
  - id: CRIT-RESP-001
    status: resolved
    resolved_at: 2026-07-19
    summary: Compact landscape now hides both the third and fourth homepage preview cards instead of showing events 1, 2, and 4.
    resolution:
      resolved_ref: f35c9557 dirty worktree fingerprint a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
      checks: [typecheck, build, browser displays at requested 1024x640]
  - id: STR-ARCH-002
    status: resolved
    resolved_at: 2026-07-19
    summary: Components now use site semantic color tokens plus shared panel and action-control surface primitives.
    resolution:
      resolved_ref: f35c9557 dirty worktree fingerprint a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
      checks: [typecheck, build, generated CSS, raw palette search]
  - id: STR-TW-001
    status: resolved
    resolved_at: 2026-07-19
    summary: Base typography now uses direct element rules in the base layer without the ineffective complex selector.
    resolution:
      resolved_ref: f35c9557 dirty worktree fingerprint a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
      checks: [typecheck, build, generated CSS selector search]
  - id: SMELL-RESP-001
    status: resolved
    resolved_at: 2026-07-19
    summary: tall-md now starts at 641px, removing its overlap with land-sm at 640px.
    resolution:
      resolved_ref: f35c9557 dirty worktree fingerprint a985e5dfe9392042130b9cc66ab0e0697b8bd34105781c707e8b6cba1b582cef
      checks: [generated CSS, browser computed flex at requested 1024x640 and 1024x641]
  - id: POL-TW-001
    status: resolved
    resolved_at: 2026-07-19
    summary: Redundant sm:rounded-3xl utilities were removed from FeaturedImage.
    resolution: { resolved_ref: f35c9557 dirty worktree, checks: [typecheck, build] }
  - id: POL-TW-002
    status: resolved
    resolved_at: 2026-07-19
    summary: Equal height and width chains were replaced with size utilities in the finding targets.
    resolution: { resolved_ref: f35c9557 dirty worktree, checks: [typecheck, build, rg] }
  - id: POL-TW-003
    status: resolved
    resolved_at: 2026-07-19
    summary: The equivalent text-[16px] declaration now uses text-base.
    resolution: { resolved_ref: f35c9557 dirty worktree, checks: [typecheck, build, rg] }
  - id: POL-TW-004
    status: resolved
    resolved_at: 2026-07-19
    summary: The no-effect footer alignment and gallery dimension declarations were removed.
    resolution: { resolved_ref: f35c9557 dirty worktree, checks: [typecheck, build, generated CSS] }
  - id: POL-TW-005
    status: resolved
    resolved_at: 2026-07-19
    summary: The primary Hero container now uses rounded-3xl at the base viewport.
    resolution: { resolved_ref: f35c9557 dirty worktree, checks: [typecheck, build, browser matrix] }

pending_reviews:
  - id: PEND-ARCH-002
    target: Post-calendar documentation reconciliation against one final main commit
    axes: [ARCH]
    reason: The calendar implementation has not reached current main; reconciling now would create another knowingly temporary architecture baseline.
  - id: PEND-RESP-001
    target: exact 390x844 and 768x1024 inner-viewport geometry
    axes: [RESPONSIVE]
    reason: The browser viewport override reported one extra inner-height pixel at both requested sizes; nearby responsive behavior was checked but exact-pixel equality was not claimed.
  - id: PEND-SEO-001
    target: Search Console URL Inspection, Rich Results Test, and field Core Web Vitals
    axes: [SEO, PERF]
    reason: Requires external Google property access.
  - id: PEND-SEO-002
    target: visible dojo identity copy and possible per-dojo structured data
    axes: [SEO]
    reason: Requires approved public copy.
  - id: PEND-ARCH-001
    target: state-management architecture decision
    axes: [ARCH, REACT]
    reason: Comparison of local state, URL state, Context, Zustand, and Redux Toolkit was deferred.

migration:
  migrated_at: 2026-07-17
  source_schema: SESSION_STATE v1
  archive: .codex/review-history.md
  policy:
    - Preserve legacy technical claims in the archive as provenance.
    - Use only this v2 state for current review decisions.
    - Do not promote legacy claims to verified coverage without a new review.
```
