# Technical Review State

```yaml
schema_version: 2
last_updated: 2026-07-27
contract: .agents/review-contract.md

state_rules:
  - Coverage is valid only for its recorded targets, axes, inclusions, and baseline.
  - An inspected target is not automatically reviewed.
  - A reviewed target is not automatically verified.
  - Changed targets make prior coverage stale until re-reviewed.
  - Legacy claims without reproducible evidence are historical, not current coverage.

latest_session:
  id: REV-2026-07-27-01
  requested_scope: Validate external Kimi 3 and Claude feedback against the published site and current sources, consolidate confirmed findings, and record the result without implementing fixes.
  actual_scope:
    targets:
      - src/app/components/Navbar.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/components/events/UpcomingEventCard.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - src/app/components/gallery/galleryText.ts
      - src/app/components/ui/MediaPageBanner.tsx
      - src/app/components/HeroSection.tsx
      - src/app/data/gallery.ts
      - src/app/utils/calendarEvents.ts
      - scripts/sync-calendar-events.mjs
      - scripts/generate-route-html.mjs
      - public/robots.txt
      - published routes /, /calendario/, /galeria/, /afiliados/, and a nonexistent route
    axes: [A11Y, ARCH, REACT, PERF]
    included:
      - internal route consistency, active navigation, event hashes, and custom 404 behavior
      - event filtering and date-range semantics
      - external-link announcements and decorative-image semantics
      - gallery controls, lightbox behavior, thumbnail naming, scrolling discoverability, overlay, copy, and responsive image loading
      - live contrast measurement for calendar event times
    excluded:
      - SEO quality, metadata, canonical policy, and search-engine recommendations
      - implementation of confirmed findings
      - exhaustive screen-reader testing on physical assistive technology
  baseline:
    commit: b3744e7f
    worktree: clean
  confirmed_findings:
    - CRIT-A11Y-001
    - CRIT-A11Y-002
    - SMELL-A11Y-001
    - POL-ARCH-001
  invalidated_reports:
    - Internal navigation and the route manifest consistently use trailing slashes; slashless requests redirect permanently to the canonical slash route.
    - NavLink exposes the active route visually and through aria-current.
    - Breadcrumbs are optional for the current one-level route hierarchy and were not recorded as a defect.
    - Homepage detail hashes resolve through CalendarSection and open the matching event modal.
    - No /eventos/ or gallery child-page links are emitted by the inspected UI.
    - Runtime and synchronization utilities both filter events by their end date.
    - External map links include screen-reader text announcing the new tab.
    - Calendar and affiliate banner images are decorative inside an aria-hidden picture.
    - Gallery thumbnails are decorative images inside explicitly named buttons.
    - Gallery controls, dialog semantics, keyboard navigation, focus containment, and dark overlays are present.
    - Gallery assets use WebP or AVIF, responsive srcSet values, and lazy-loaded thumbnails.
    - The published robots.txt returns HTTP 200 and nonexistent routes return a custom HTTP 404 page.
    - The hero alt text is concise but valid; more specificity requires approved factual context.
  result: Four findings were confirmed, the legacy calendar-route critical was revalidated as resolved, and the remaining external reports were rejected with source or published-site evidence.

prior_modal_control_review_session:
  id: REV-2026-07-25-01
  requested_scope: Analyze visual consistency and positioning of the close and previous/next controls in the calendar event modal and gallery lightbox without implementing changes.
  actual_scope:
    targets:
      - src/app/styles/shared.ts
      - src/app/components/ui/ModalShell.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/Lightbox.tsx
      - local routes /calendario/ and /galeria/
    axes: [ARCH, TAILWIND, A11Y]
    included:
      - close-control size, icon size, surface styling, anchor, and inset
      - previous/next control size, icon size, placement, and visual feedback
      - desktop 1366x768 and mobile 390x844 rendered geometry
      - minimum interactive-target size and semantic labels
    excluded:
      - implementation of the recommended control primitive
      - exhaustive keyboard, swipe, and focus regression testing
      - pixel-level comparison with Figma because no Figma artifact was supplied
      - production deployment behavior
  baseline:
    commit: 391c061b
    worktree: dirty
    fingerprints:
      shared.ts: C2F862790AB610ECAD073074C74FB57C7AF10445CC0F8C9FC49AFF97E37FDE77
      ModalShell.tsx: 25D01221918EFEAFF99D5C40E1180D57E648142E625DCD376C821AC3D2637087
      EventDetailModal.tsx: 6DAD8E82506467CEB4FD328E99178E99CD0E04D130BCFB772C05636454EA6F52
      Lightbox.tsx: 04179A0B4E2970D7ACD3C074AEC7743328167C60874472F7C4097C28ECAFB09D
  result: The controls meet the 44px minimum target and use consistent semantics, but their shared styling contract does not cover close anchoring or arrow icon geometry, allowing visible drift between the two dialogs.

prior_redundancy_session:
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
  id: FIX-2026-07-27-01
  source_session: REV-2026-07-27-01
  baseline:
    commit: b3744e7f
    worktree: dirty
    fingerprints:
      calendarEventPresentation.ts: 5C3910E5F189E96B59675BE3CFE655F4E0A5C59B454DDA5A0C8329318BAE2031
      UpcomingEventCard.tsx: 4AC7602AC656F2DF557A530BC8506561B477E70E65E3BC4E900435F4CC5AE6A1
      CalendarEventCard.tsx: 3ADFAF54FD1EE1D24A5BA42CD7D7ABE8F2DFC84AE896DFB56CF63B529AFC3900
      EventDetailModal.tsx: B77CF57BD1A216811D49B0B2D8FFE7452620C7563E2965216DFC109280C6C072
      galleryText.ts: 09BFC20B22CE1CA29DF7DC33DE7F15E9D58E34B3DF92921AF990A496E73BF388
      FeaturedImage.tsx: 77E68B3E5779F892B4F8DA41D5041353B868E8FD1F7444AEE85F1A8A6C2002D8
      GalleryThumbnails.tsx: 408F8E4DD5ADB99A999032B035827EB26B80CD6EDC50AE78309350887A67DFFD
  resolved_findings:
    - CRIT-A11Y-001
    - CRIT-A11Y-002
    - SMELL-A11Y-001
    - POL-ARCH-001
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed
    - mobile accessibility tree exposed separate start and inclusive-end time elements with ISO dateTime values and the semantic separator al
    - local calendar event-time contrast measured 6.13:1 at 14px normal weight
    - gallery overflow cues switched from right-only to left-only after selecting the final thumbnail at 390x844
    - the updated Abrir detalles control opened the gallery lightbox
    - all four routes preserved the 1366x768 no-scroll invariant with visible footer and no horizontal overflow
    - browser console warning and error log was empty

prior_resolution_2026_07_24_06:
  id: FIX-2026-07-24-06
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      EventDetailModal.tsx: 48FB5739F62139501ECD2005DB028F8C8641C9F9E02DF19888D0DB6F6844FFA4
      ModalShell.tsx: 4F26FAF166CE2EB3751E0A5100669C3A5EA3A31D96AA12623B4EA058855982F0
      Lightbox.tsx: 04179A0B4E2970D7ACD3C074AEC7743328167C60874472F7C4097C28ECAFB09D
      useModalBehavior.ts: 0D0317C215B7835D39434D77635FD8550E05C2913E06D9C60B7A47F65D35E507
  resolved_findings:
    - POL-A11Y-001
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - local calendar modal navigated Examen to 3er Torneo with ArrowRight and back with ArrowLeft
    - local calendar modal preserved focus containment with Tab, Escape close, hash cleanup, and scroll restoration
    - local gallery modal preserved ArrowRight navigation from 1/8 to 2/8 and Escape close

prior_resolution_2026_07_24_05:
  id: FIX-2026-07-24-05
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      useTransientDirectionFeedback.ts: ABE00D26CC5167FAF5DEF5F30649E84A7A8E2F3264B06FC255E94A3BEA7DC516
      Lightbox.tsx: 1A033D58293F92D703603B7916FCC3EE0539975F38CDD1FDAC7CE6D66592C05D
      FeaturedImage.tsx: 9937325625E695CB2201009B2CC1A2DA3D15C9422228F67E12A0EB95E313404E
  resolved_findings:
    - SMELL-REACT-002
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source search found the 220ms timeout, reset, and cleanup only in useTransientDirectionFeedback.ts
    - source inspection found both consumers binding activeDirection to their existing conditional active classes
    - local gallery checks preserved featured-image and lightbox navigation, settled inactive classes, clean lightbox unmount, and an empty console error log

prior_resolution_2026_07_24_04:
  id: FIX-2026-07-24-04
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      AfiliadosSection.tsx: 98E0B3BB4FE775610AB7EF3D030BB24773A9E03C004D91F2148ECF7A22E142F9
  resolved_findings:
    - SMELL-ARCH-002
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source search found one normalized schedule-group render path and no allSlotsShareLocation branch
    - local /afiliados/ at 1366x768 preserved two ordered Koken locations and one Heredia location with three ordered slots
    - local /afiliados/ preserved single-slot and multi-slot dl classes, the no-scroll invariant, and an empty browser console error log

prior_resolution_2026_07_24_03:
  id: FIX-2026-07-24-03
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      useModalBehavior.ts: 0D0317C215B7835D39434D77635FD8550E05C2913E06D9C60B7A47F65D35E507
      Lightbox.tsx: A9943DED4CBE2839D7BA94C849C771F8B3F52FEB119B61C2E80962F20602BB13
      ModalShell.tsx: 7E45A39306260E084E5C957CB22DCA5505BAA0E60E8C3747DE8C19AE9C218DF6
  resolved_findings:
    - STR-REACT-001
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source search found modal lifecycle effects only in useModalBehavior.ts
    - lightbox browser checks passed initial focus, Tab wrapping, arrow navigation, Escape, focus return, and scroll restoration
    - event-modal browser checks passed initial focus, Tab wrapping, Escape, hash cleanup, focus return, and scroll restoration
    - both browser flows produced no console errors

prior_resolution_2026_07_24_02:
  id: FIX-2026-07-24-02
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      UpcomingEventsSection.tsx: 8A4524F13E2C5CC250AAA67252909303A420C473C7DF2B1A64FB18D91C3DE747
      calendarEventPresentation.ts: 8031A73A0EA5A13ED8A0AEFFF72C13429CFBE411156E5E5238B72E6B9A0A06E1
  resolved_findings:
    - STR-ARCH-007
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source search found date formatting and Google Maps URL construction only in calendarEventPresentation.ts
    - local homepage at 1366x768 preserved all four date labels, three Google Maps URLs, and one pending-location state
    - local homepage kept document scrollHeight equal to clientHeight and produced no browser console errors

prior_resolution_2026_07_24_01:
  id: FIX-2026-07-24-01
  source_session: REV-2026-07-24-01
  baseline:
    commit: 3eb99cd0
    worktree: dirty
    fingerprints:
      CalendarSection.tsx: DF590806F9617004ADC592875FC4F0184826402230AB1AA22FBAD97E7E74B8E0
  resolved_findings:
    - STR-ARCH-006
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - source search found one calendar section, one CalendarBackdrop, and one CalendarBanner
    - local /calendario/ at 1366x768 kept document and primary-section scrollHeight equal to clientHeight
    - local /calendario/ rendered one calendar title and one calendar section with no browser console errors

prior_resolution_2026_07_23:
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
  - id: COV-2026-07-27-02
    targets:
      - findings CRIT-A11Y-001, CRIT-A11Y-002, SMELL-A11Y-001, and POL-ARCH-001
      - src/app/utils/calendarEventPresentation.ts
      - src/app/components/events/UpcomingEventCard.tsx
      - src/app/components/calendar/CalendarEventCard.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/gallery/galleryText.ts
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - local routes /, /calendario/, /galeria/, and /afiliados/
    axes: [A11Y, ARCH, REACT, TAILWIND]
    included:
      - separate machine-readable start and inclusive-end dates in every event presentation
      - assistive semantic separator for multi-day ranges
      - calendar event-time normal-text contrast
      - position-aware gallery thumbnail overflow cues
      - visible and accessible gallery detail wording
      - required desktop route geometry and affected mobile behavior
      - TypeScript, production build, SSR output, and browser console integrity
    excluded:
      - physical screen-reader announcement testing
      - production deployment behavior
      - unrelated open findings
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed and regenerated route HTML
      - local homepage at 390x844 exposed 2026-09-11 and 2026-09-12 as separate time elements with al in the accessibility tree
      - local calendar at 390x844 exposed the same separate range semantics and measured rgb(49, 95, 140) on rgb(247, 245, 240) at 6.13:1
      - local gallery at 390x844 measured 355px client width and 524px scroll width; the right cue was present at the start and the left cue was present after selecting image eight
      - local gallery at 1366x768 measured 1152px client width and 1539px scroll width with the right overflow cue visible
      - Abrir detalles was visible and the updated featured-image accessible control opened the lightbox
      - /, /calendario/, /galeria/, and /afiliados/ each kept document clientHeight and scrollHeight at 768 with no horizontal overflow
      - browser console warning and error log was empty
    baseline:
      commit: b3744e7f
      worktree: dirty
      fingerprints:
        calendarEventPresentation.ts: 5C3910E5F189E96B59675BE3CFE655F4E0A5C59B454DDA5A0C8329318BAE2031
        UpcomingEventCard.tsx: 4AC7602AC656F2DF557A530BC8506561B477E70E65E3BC4E900435F4CC5AE6A1
        CalendarEventCard.tsx: 3ADFAF54FD1EE1D24A5BA42CD7D7ABE8F2DFC84AE896DFB56CF63B529AFC3900
        EventDetailModal.tsx: B77CF57BD1A216811D49B0B2D8FFE7452620C7563E2965216DFC109280C6C072
        galleryText.ts: 09BFC20B22CE1CA29DF7DC33DE7F15E9D58E34B3DF92921AF990A496E73BF388
        FeaturedImage.tsx: 77E68B3E5779F892B4F8DA41D5041353B868E8FD1F7444AEE85F1A8A6C2002D8
        GalleryThumbnails.tsx: 408F8E4DD5ADB99A999032B035827EB26B80CD6EDC50AE78309350887A67DFFD
    status: current
    result: All four findings from REV-2026-07-27-01 are implemented and verified locally.

  - id: COV-2026-07-27-01
    targets:
      - findings CRIT-A11Y-001, CRIT-A11Y-002, SMELL-A11Y-001, and POL-ARCH-001
      - finding CRIT-ARCH-001
      - navigation, event, gallery, media-banner, calendar-filtering, route-generation, and robots targets recorded in REV-2026-07-27-01
      - published routes /, /calendario/, /galeria/, /afiliados/, /calendario/#examen-2026-08-08, and /ruta-inexistente/
    axes: [A11Y, ARCH, REACT, PERF]
    included:
      - adjudication of the supplied external feedback
      - route and hash functionality, active navigation, custom 404, and slash redirect behavior
      - date-range semantics, event-time contrast, and runtime plus synchronization filtering
      - gallery accessible naming, controls, modal behavior, overlay, thumbnail discoverability, copy, and image loading
      - decorative-image handling and external-link new-tab announcements
    excluded:
      - SEO assessment beyond checking robots.txt availability as a disputed production fact
      - implementation or verification of fixes for the four confirmed findings
      - physical assistive-technology testing
    depth: reviewed
    evidence:
      - git status --short returned no changes and git rev-parse --short HEAD returned b3744e7f before the state update
      - source inspection found canonical slash paths in Navbar and the route configuration
      - the published slashless /afiliados request returned HTTP 308 to /afiliados/
      - the published robots.txt returned HTTP 200
      - the published nonexistent route returned HTTP 404 and rendered the custom Pagina no encontrada view
      - the published /calendario/#examen-2026-08-08 route opened the Examen dialog after the lazy modal loaded
      - published route DOM and screenshots were inspected at 1366x768 and 390x844
      - browser accessibility snapshots exposed active navigation, labeled gallery controls, dialog semantics, and screen-reader new-tab descriptions
      - source inspection found runtime and synchronization-time future-event filters
      - source inspection found WebP and AVIF srcSet candidates plus lazy-loaded gallery thumbnails
      - computed calendar event-time contrast measured approximately 4.37:1 against the card surface
    baseline:
      commit: b3744e7f
      worktree: clean
    status: stale
    stale_reason: All four confirmed finding targets changed during the implementation verified by COV-2026-07-27-02.
    result: Four findings were current at this baseline; they are now resolved by FIX-2026-07-27-01.

  - id: COV-2026-07-25-02
    targets:
      - finding SMELL-ARCH-003
      - src/app/components/ui/ModalControls.tsx
      - src/app/components/ui/ModalShell.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/Lightbox.tsx
      - src/app/styles/shared.ts
      - local routes /calendario/ and /galeria/
    axes: [ARCH, TAILWIND, A11Y]
    included:
      - shared close and previous/next control primitives
      - identical control and icon geometry across both dialogs
      - calendar direction feedback for click, swipe, and keyboard paths
      - mobile, tablet, and desktop placement at 390x844, 768x1024, and 1366x768
      - previous/next navigation and Escape close in both dialogs
      - TypeScript and production plus SSR build integrity
    excluded:
      - pixel-level Figma comparison
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - git diff --check passed
      - both close controls measured 44x44 with 20x20 icons and 12px dialog-relative top/right insets
      - both navigation control pairs measured 44x44 with 20x20 icons at 390x844 and 48x48 with 24x24 icons at md and larger
      - gallery navigation remained below the image at 390x844 and 768x1024, and centered vertically at the image sides at 1366x768
      - calendar retained its bottom navigation row and both routes kept document clientHeight equal to scrollHeight at 1366x768
      - scoped next navigation and Escape close passed in both dialogs
    baseline:
      commit: 391c061b
      worktree: dirty
      fingerprints:
        ModalControls.tsx: 3A4F442801B81B0DD3BC8D87AF18A9695177CD3FA3C1FCDE79EBF0065996B8D5
        ModalShell.tsx: 71A5CD3C53C1F369A5EF1A9532D301A225E027D75500661D08A99EF94EC7639E
        EventDetailModal.tsx: 8030AE8D7DDA2C7C01AC0BD943A88BE795073A994651C027596B7A4DF978B3DE
        Lightbox.tsx: A0CA135DA8D166B6BD7723AE430B6FDDBA9B24DA50E5B896F6BF195B3BC5D3BE
        shared.ts: 422DAAB2BAB25E9F89799BF868C7A63B74EEB86CE2DC732E75C4BBD1D2E77D55
    status: stale
    stale_reason: EventDetailModal.tsx changed after this baseline; current date semantics and route geometry are verified by COV-2026-07-27-02, while the complete modal-control matrix was not rerun.
    result: Calendar and gallery now share the same modal-control geometry and interaction states while retaining content-appropriate responsive placement.

  - id: COV-2026-07-25-01
    targets:
      - src/app/styles/shared.ts
      - src/app/components/ui/ModalShell.tsx
      - src/app/components/EventDetailModal.tsx
      - src/app/components/Lightbox.tsx
      - local routes /calendario/ and /galeria/
    axes: [ARCH, TAILWIND, A11Y]
    included:
      - modal close and previous/next control geometry, styling, placement, and labels
      - rendered comparison at 1366x768 and 390x844
    excluded:
      - implementation
      - exhaustive modal interaction regression
      - Figma pixel comparison
      - production behavior
    depth: reviewed
    evidence:
      - source inspection and line-targeted search of shared modal classes and both dialog render trees
      - browser-computed button and SVG rectangles at 1366x768 and 390x844
      - calendar close measured 44x44 with a 20x20 icon and absolute dialog-relative positioning
      - gallery close measured 44x44 with a 20x20 icon and fixed viewport-relative positioning
      - desktop navigation controls measured 48x48 in both dialogs, with 20x20 calendar icons and 24x24 gallery icons
    baseline:
      commit: 391c061b
      worktree: dirty
      fingerprints:
        shared.ts: C2F862790AB610ECAD073074C74FB57C7AF10445CC0F8C9FC49AFF97E37FDE77
        ModalShell.tsx: 25D01221918EFEAFF99D5C40E1180D57E648142E625DCD376C821AC3D2637087
        EventDetailModal.tsx: 6DAD8E82506467CEB4FD328E99178E99CD0E04D130BCFB772C05636454EA6F52
        Lightbox.tsx: 04179A0B4E2970D7ACD3C074AEC7743328167C60874472F7C4097C28ECAFB09D
    status: stale
    stale_reason: All reviewed control targets changed during the implementation verified by COV-2026-07-25-02.
    result: Visual drift is confirmed in close anchoring and arrow icon geometry; target size and accessible naming are consistent.

  - id: COV-2026-07-24-08
    targets:
      - finding POL-A11Y-001
      - src/app/components/EventDetailModal.tsx
      - src/app/components/ui/ModalShell.tsx
      - src/app/components/Lightbox.tsx
      - src/app/hooks/useModalBehavior.ts
      - local routes /calendario/ and /galeria/
    axes: [A11Y]
    included:
      - keyboard parity for ArrowLeft and ArrowRight between the event modal and gallery lightbox
      - preservation of Tab focus containment and Escape close
      - preservation of gallery keyboard navigation after preventing default arrow behavior
      - TypeScript and production plus SSR build integrity
    excluded:
      - swipe gesture behavior
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - calendar ArrowRight changed Examen, Evento 1 de 12, to 3er Torneo, Evento 2 de 12, and updated the URL fragment
      - calendar ArrowLeft returned to Examen, Evento 1 de 12; Tab focused the close control and Escape removed the dialog and URL fragment
      - gallery ArrowRight changed Practicantes en seiza, 1 / 8, to Combates con armadura, 2 / 8; Escape removed the dialog
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprints:
        EventDetailModal.tsx: 48FB5739F62139501ECD2005DB028F8C8641C9F9E02DF19888D0DB6F6844FFA4
        ModalShell.tsx: 4F26FAF166CE2EB3751E0A5100669C3A5EA3A31D96AA12623B4EA058855982F0
        Lightbox.tsx: 04179A0B4E2970D7ACD3C074AEC7743328167C60874472F7C4097C28ECAFB09D
        useModalBehavior.ts: 0D0317C215B7835D39434D77635FD8550E05C2913E06D9C60B7A47F65D35E507
    status: stale
    stale_reason: EventDetailModal.tsx changed after this baseline; the current gallery lightbox open flow passed, but the complete paired keyboard-navigation matrix was not rerun.
    result: Calendar and gallery dialogs now expose the same left/right keyboard navigation contract.

  - id: COV-2026-07-24-07
    targets:
      - findings STR-ARCH-006, STR-ARCH-007, STR-REACT-001, SMELL-ARCH-002, and SMELL-REACT-002
      - src/app/components/CalendarSection.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/utils/calendarEventPresentation.ts
      - src/app/hooks/useModalBehavior.ts
      - src/app/components/ui/ModalShell.tsx
      - src/app/components/Lightbox.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/app/hooks/useTransientDirectionFeedback.ts
      - src/app/components/gallery/FeaturedImage.tsx
      - local routes /, /calendario/, /galeria/, and /afiliados/
    axes: [ARCH, REACT]
    included:
      - final current-state audit of all five component-redundancy resolutions
      - unique shared sources and removal of the reviewed duplicate branches
      - TypeScript and production plus SSR build integrity
      - required 1366x768 no-scroll geometry on all four routes
      - current Lightbox focus, keyboard navigation, Escape, focus return, and scroll restoration after the feedback refactor
    excluded:
      - unrelated active findings
      - synthetic browser rendering of an empty calendar dataset
      - runtime capture of the 220ms transient active frame
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed on the final accumulated source state
      - corepack pnpm run build passed outside the sandbox on the final accumulated source state
      - git diff --check passed
      - source counts found one CalendarSection frame, one CalendarBackdrop, and one CalendarBanner
      - source searches found calendar date and map presentation only in calendarEventPresentation.ts
      - source searches found modal lifecycle only in useModalBehavior.ts and direction-feedback timeout state only in useTransientDirectionFeedback.ts
      - source searches found one affiliate schedule-group render path and no allSlotsShareLocation branch
      - browser geometry at 1366x768 recorded document clientHeight and scrollHeight as 768 on all four routes; every primary section recorded equal clientHeight and scrollHeight
      - current Lightbox opened with close focus and hidden overflow, wrapped Shift+Tab, navigated from 1/8 to 2/8 with ArrowRight, closed with Escape, restored trigger focus and overflow, and produced no console errors
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprints:
        CalendarSection.tsx: DF590806F9617004ADC592875FC4F0184826402230AB1AA22FBAD97E7E74B8E0
        UpcomingEventsSection.tsx: 8A4524F13E2C5CC250AAA67252909303A420C473C7DF2B1A64FB18D91C3DE747
        calendarEventPresentation.ts: 8031A73A0EA5A13ED8A0AEFFF72C13429CFBE411156E5E5238B72E6B9A0A06E1
        useModalBehavior.ts: 0D0317C215B7835D39434D77635FD8550E05C2913E06D9C60B7A47F65D35E507
        ModalShell.tsx: 7E45A39306260E084E5C957CB22DCA5505BAA0E60E8C3747DE8C19AE9C218DF6
        Lightbox.tsx: 1A033D58293F92D703603B7916FCC3EE0539975F38CDD1FDAC7CE6D66592C05D
        AfiliadosSection.tsx: 98E0B3BB4FE775610AB7EF3D030BB24773A9E03C004D91F2148ECF7A22E142F9
        useTransientDirectionFeedback.ts: ABE00D26CC5167FAF5DEF5F30649E84A7A8E2F3264B06FC255E94A3BEA7DC516
        FeaturedImage.tsx: 9937325625E695CB2201009B2CC1A2DA3D15C9422228F67E12A0EB95E313404E
    status: stale
    stale_reason: ModalShell and Lightbox changed after this baseline; current modal keyboard behavior is revalidated by COV-2026-07-24-08.
    result: All five component-redundancy findings from REV-2026-07-24-01 are resolved and verified on the final accumulated worktree state.
    verification_gaps:
      - Calendar empty-state behavior is source- and type-verified without replacing generated event data.
      - The 220ms active feedback frame is source-verified; navigation, settled state, and cleanup are runtime-verified.

  - id: COV-2026-07-24-06
    targets:
      - src/app/hooks/useTransientDirectionFeedback.ts
      - src/app/components/Lightbox.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - local /galeria/
    axes: [REACT]
    included:
      - centralization of direction-feedback state
      - 220ms timeout reset and unmount cleanup
      - connection to both existing conditional active-class presentations
      - preservation of featured-image and lightbox navigation
    excluded:
      - changes to the active visual class tokens
      - swipe-gesture recognition itself
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - source search found feedback timeout state and cleanup only in useTransientDirectionFeedback.ts
      - source inspection found activeDirection connected to left/right conditional classes in both consumers
      - featured-image navigation advanced from 1/8 through 3/8 and the right arrow had no active class after 300ms
      - lightbox navigation advanced from 3/8 to 4/8 and the right arrow had no active class after 300ms
      - lightbox closed with focus and overflow restored; browser console error log was empty
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprints:
        useTransientDirectionFeedback.ts: ABE00D26CC5167FAF5DEF5F30649E84A7A8E2F3264B06FC255E94A3BEA7DC516
        Lightbox.tsx: 1A033D58293F92D703603B7916FCC3EE0539975F38CDD1FDAC7CE6D66592C05D
        FeaturedImage.tsx: 9937325625E695CB2201009B2CC1A2DA3D15C9422228F67E12A0EB95E313404E
    status: stale
    stale_reason: Lightbox changed after this baseline; current gallery arrow navigation is revalidated by COV-2026-07-24-08.
    result: SMELL-REACT-002 resolved with one transient direction-feedback hook.
    verification_gap: The 220ms active frame is shorter than the browser-control click round trip; activation is source-verified while navigation and settled cleanup are runtime-verified.

  - id: COV-2026-07-24-05
    targets:
      - src/app/components/AfiliadosSection.tsx
      - src/app/data/dojos.ts
      - local /afiliados/
    axes: [ARCH]
    included:
      - normalization of schedule slots by location
      - preservation of location and slot order
      - preservation of single-slot and multi-slot definition-list presentation
      - required 1366x768 no-scroll geometry
    excluded:
      - the remaining gallery feedback finding
      - changes to public dojo data or copy
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - source search found one getScheduleGroups pipeline and one scheduleGroups render path
      - browser DOM preserved Moravia / Guadalupe then Curridabat with one slot each and no dl class
      - browser DOM preserved Colegio Europeo once with three ordered slots and grid gap-1
      - browser geometry at 1366x768 recorded document 768/768 and primary section 554/554 clientHeight/scrollHeight
      - browser console error log was empty and screenshot inspection found no visual regression
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprint: 98E0B3BB4FE775610AB7EF3D030BB24773A9E03C004D91F2148ECF7A22E142F9
    status: current
    result: SMELL-ARCH-002 resolved with one ordered location-group rendering pipeline.

  - id: COV-2026-07-24-04
    targets:
      - src/app/hooks/useModalBehavior.ts
      - src/app/components/Lightbox.tsx
      - src/app/components/ui/ModalShell.tsx
      - local /galeria/
      - local /calendario/
    axes: [REACT]
    included:
      - initial and return focus
      - document scroll locking and restoration
      - Escape handling
      - Tab focus wrapping
      - backdrop-target validation
      - preservation of lightbox arrow-key navigation
    excluded:
      - visual redesign of either dialog
      - swipe behavior unrelated to modal lifecycle
      - transient arrow-feedback deduplication
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - source searches found both consumers using useModalBehavior and lifecycle implementation only in the hook
      - lightbox opened with close focus and hidden html/body overflow; Shift+Tab and Tab wrapped between last and first controls
      - lightbox ArrowRight changed the title and position from 1/8 to 2/8; Escape restored focus to the original featured-image trigger and restored overflow
      - event modal opened with the dialog focused and hidden html/body overflow; Shift+Tab and Tab wrapped between last and first controls
      - event-modal Escape removed the hash, restored focus to the originating event button, and restored overflow
      - browser console error log was empty
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprints:
        useModalBehavior.ts: 0D0317C215B7835D39434D77635FD8550E05C2913E06D9C60B7A47F65D35E507
        Lightbox.tsx: A9943DED4CBE2839D7BA94C849C771F8B3F52FEB119B61C2E80962F20602BB13
        ModalShell.tsx: 7E45A39306260E084E5C957CB22DCA5505BAA0E60E8C3747DE8C19AE9C218DF6
    status: stale
    stale_reason: Lightbox.tsx changed while resolving SMELL-REACT-002; current modal behavior was revalidated in COV-2026-07-24-07.
    result: STR-REACT-001 resolved with shared modal lifecycle behavior and preserved specialized dialog rendering.

  - id: COV-2026-07-24-03
    targets:
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/utils/calendarEventPresentation.ts
      - local /
    axes: [ARCH]
    included:
      - centralization of event date-range labels
      - centralization of Google Maps URL construction
      - preservation of homepage date and location output
    excluded:
      - the remaining component redundancy findings
      - unrelated calendar-event selection logic
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - exact source searches found no component-local eventDateFormatter, date-range helper, or getLocationMapUrl
      - browser DOM at 1366x768 preserved four expected date labels, including two inclusive multi-day ranges
      - browser DOM preserved three encoded Google Maps URLs and one pending-location presentation
      - homepage document clientHeight and scrollHeight were both 768; browser console error log was empty
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprints:
        UpcomingEventsSection.tsx: 8A4524F13E2C5CC250AAA67252909303A420C473C7DF2B1A64FB18D91C3DE747
        calendarEventPresentation.ts: 8031A73A0EA5A13ED8A0AEFFF72C13429CFBE411156E5E5238B72E6B9A0A06E1
    status: stale
    stale_reason: calendarEventPresentation.ts changed after this baseline; current date-range output is verified by COV-2026-07-27-02.
    result: STR-ARCH-007 resolved by making calendarEventPresentation.ts the single source for date ranges and map URLs.

  - id: COV-2026-07-24-02
    targets:
      - src/app/components/CalendarSection.tsx
      - local /calendario/
    axes: [ARCH]
    included:
      - consolidation of the empty and populated page frame
      - preservation of the populated calendar composition
      - required 1366x768 no-scroll geometry
    excluded:
      - the remaining component redundancy findings
      - synthetic browser rendering of an empty calendar dataset
      - production deployment behavior
    depth: verified
    evidence:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed outside the sandbox
      - exact source searches found one calendar section, one CalendarBackdrop, and one CalendarBanner
      - browser DOM snapshot preserved the calendar h1, month navigation, two visible event cards, and footer
      - browser geometry at 1366x768 recorded document 768/768 and calendar section 554/554 clientHeight/scrollHeight
      - browser console error log was empty
    baseline:
      commit: 3eb99cd0
      worktree: dirty
      fingerprint: DF590806F9617004ADC592875FC4F0184826402230AB1AA22FBAD97E7E74B8E0
    status: current
    result: STR-ARCH-006 resolved by rendering the shared frame once and selecting only the page body conditionally.

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
    status: stale
    stale_reason: CalendarSection changed while resolving STR-ARCH-006; results for the other thirteen component targets remain useful but this folder-wide record no longer proves the current complete inventory.
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
    status: stale
    stale_reason: EventDetailModal.tsx changed after this baseline; current heading structure remained present but the original scoped coverage was not rerun in full.
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

resolved_findings:
  - id: CRIT-A11Y-001
    status: resolved
    resolved_at: 2026-07-27
    summary: Multi-day events now expose separate start and inclusive-end time elements with independent ISO values and an assistive al separator across the homepage, calendar cards, and event modal.
    resolution:
      resolved_ref: b3744e7f dirty worktree fingerprints recorded in FIX-2026-07-27-01
      checks: [typecheck, build, mobile accessibility tree, desktop route matrix]
    limitation: Final announcement remains pending on a physical screen reader.

  - id: CRIT-A11Y-002
    status: resolved
    resolved_at: 2026-07-27
    summary: Calendar event times now use site-action-soft and measure 6.13:1 against the calendar card surface.
    resolution:
      resolved_ref: b3744e7f dirty worktree fingerprint 3ADFAF54FD1EE1D24A5BA42CD7D7ABE8F2DFC84AE896DFB56CF63B529AFC3900
      checks: [typecheck, build, computed-color contrast measurement at 390x844]

  - id: SMELL-A11Y-001
    status: resolved
    resolved_at: 2026-07-27
    summary: The gallery thumbnail strip now shows position-aware edge fades only where additional off-screen thumbnails remain.
    resolution:
      resolved_ref: b3744e7f dirty worktree fingerprint 408F8E4DD5ADB99A999032B035827EB26B80CD6EDC50AE78309350887A67DFFD
      checks: [typecheck, build, initial and final thumbnail positions at 390x844, desktop gallery screenshot]

  - id: POL-ARCH-001
    status: resolved
    resolved_at: 2026-07-27
    summary: Gallery preview copy and the featured-image accessible control now consistently use Abrir detalles.
    resolution:
      resolved_ref: b3744e7f dirty worktree fingerprints recorded in FIX-2026-07-27-01
      checks: [typecheck, build, accessibility snapshot, visible desktop and mobile copy, lightbox open flow]

  - id: CRIT-ARCH-001
    status: resolved
    resolved_at: 2026-07-27
    summary: The calendar route, navigation entry, prerendered output, bounded month and event pagination, and hash-addressable event modal are present and reachable on the published site.
    resolution:
      resolved_ref: b3744e7f clean worktree and published-site checks recorded in COV-2026-07-27-01
      checks: [source route inspection, published calendar route, active navigation, event pagination, direct event hash modal, custom 404 control]

  - id: SMELL-ARCH-003
    status: resolved
    resolved_at: 2026-07-25
    summary: Calendar and gallery now render shared close and navigation primitives with identical geometry, styling, focus, hover, pressed, and transient direction states while retaining content-appropriate responsive placement.
    resolution:
      resolved_ref: 391c061b dirty worktree fingerprints recorded in COV-2026-07-25-02
      checks: [typecheck, production and SSR build, git diff check, responsive browser geometry, scoped navigation and Escape flows]

  - id: POL-A11Y-001
    status: resolved
    resolved_at: 2026-07-24
    summary: EventDetailModal now handles ArrowLeft and ArrowRight through the shared modal behavior path, matching Lightbox keyboard navigation.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprints recorded in FIX-2026-07-24-06
      checks: [typecheck, production and SSR build, calendar and gallery keyboard browser flows]

  - id: SMELL-REACT-002
    status: resolved
    resolved_at: 2026-07-24
    summary: Lightbox and FeaturedImage now share transient direction state, timeout reset, and cleanup through useTransientDirectionFeedback.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprints recorded in FIX-2026-07-24-05
      checks: [typecheck, production and SSR build, source search, gallery navigation and settled-state browser checks]
    limitation: The 220ms active frame was source-verified because browser-control click completion exceeds the feedback window.

  - id: SMELL-ARCH-002
    status: resolved
    resolved_at: 2026-07-24
    summary: Affiliate schedules now normalize slots into ordered location groups and render one shared semantic structure.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprint 98E0B3BB4FE775610AB7EF3D030BB24773A9E03C004D91F2148ECF7A22E142F9
      checks: [typecheck, production and SSR build, source search, browser DOM, screenshot, and geometry at 1366x768]

  - id: STR-REACT-001
    status: resolved
    resolved_at: 2026-07-24
    summary: Lightbox and ModalShell now share modal focus, keyboard, scroll-lock, and backdrop-target behavior through useModalBehavior.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprints recorded in FIX-2026-07-24-03
      checks: [typecheck, production and SSR build, source search, complete browser interaction flows for both dialogs]

  - id: STR-ARCH-007
    status: resolved
    resolved_at: 2026-07-24
    summary: UpcomingEventsSection now consumes shared date-range and Google Maps presentation utilities.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprints recorded in FIX-2026-07-24-02
      checks: [typecheck, production and SSR build, source search, homepage DOM and geometry at 1366x768]

  - id: STR-ARCH-006
    status: resolved
    resolved_at: 2026-07-24
    summary: CalendarSection now renders one shared section, backdrop, and banner for both empty and populated event states.
    resolution:
      resolved_ref: 3eb99cd0 dirty worktree fingerprint DF590806F9617004ADC592875FC4F0184826402230AB1AA22FBAD97E7E74B8E0
      checks: [typecheck, production and SSR build, source search, browser DOM and geometry at 1366x768]
    limitation: The populated state was browser-verified; the empty branch was source- and type-verified without replacing the generated calendar dataset.

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
  - id: PEND-A11Y-001
    target: implemented multi-day event range with a real screen reader
    axes: [A11Y]
    reason: Source and browser accessibility-tree verification now pass, but final announcement behavior still requires physical assistive-technology verification.
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
