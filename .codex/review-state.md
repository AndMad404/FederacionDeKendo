# Technical Review State

```yaml
schema_version: 2
last_updated: 2026-08-21
contract: .agents/review-contract.md

latest_test-responsibility_review:
  id: REV-2026-08-21-01
  requested_scope: Review whether the refactored test suite contains unnecessary or overlapping tests.
  actual_scope:
    targets:
      - tests/architecture/**/*.test.mjs
      - tests/data/**/*.{test.mjs,spec.ts}
      - tests/behavior/**/*.spec.ts
      - tests/design/**/*.{spec.ts,ts}
      - package.json
    axes: [ARCH, RESPONSIVE]
    included:
      - responsibility boundaries after the test refactor
      - repeated contracts across Data, Behavior, and Design
      - duplicate viewport matrices and command composition
    excluded:
      - product behavior correctness, visual baseline accuracy, test performance, and CI execution
  baseline:
    commit: 1fca95bf
    worktree: dirty with owner Codex-hook additions and package.json changes
    fingerprint:
      tests/behavior/events.spec.ts: B11E949D53FAC9140B493D9C32D6784B940922B71C08CA0A983F69C7B32CD28A
      tests/behavior/event-history-filters.spec.ts: 6F9530F3212D3960A9B84AD5ACA702E0C2F596E79B961EB63B78DBF0536D789D
      tests/design/event-content-layout.spec.ts: D1FD33521DC8CB122DC15DC97E724858C88B01ADA31DF37A69688E5180B90EAB
      tests/design/geometry-contract.spec.ts: F970E1B0DAACD17CC7343E43E97DB6E8E84F44B9EE6E72E412EEA14B4CF2E860
  findings:
    - id: TEST-ARCH-001
      level: STRUCTURAL
      axis: ARCH
      status: resolved
      target: tests/behavior/events.spec.ts:304-335
      problem: The Behavior suite rechecks route-shell visibility and 1366x768 overflow for ten routes at four viewports, which is already the Design suite's geometry and reachability contract.
      fix: Remove this matrix from Behavior; retain route navigation assertions there and let tests/design/geometry-contract.spec.ts plus tests/design/responsive-reachability.spec.ts own shell and viewport checks.
      cost_of_deferring: The same layout regression fails in two responsibilities, making failures slower to diagnose and weakening the stated classification rule.
      evidence:
        - tests/behavior/events.spec.ts:304-335
        - tests/design/geometry-contract.spec.ts:164-421
        - tests/design/responsive-reachability.spec.ts:154
      resolution:
        resolved_at: 2026-08-21
        resolved_ref: worktree SHA256 7150303AFB66F47A3F1590A991B8CF34B8CB7ED8789927A844618F615108C09D
        checks:
          - corepack pnpm run test:behavior (32 passed)
          - corepack pnpm run test:design (180 passed)
    - id: TEST-RESP-001
      level: SMELL
      axis: RESPONSIVE
      status: resolved
      target: tests/behavior/event-history-filters.spec.ts:80-109
      problem: A Behavior test loops through the entire viewport matrix solely to assert filter visibility and adds a desktop document-height assertion, which is a Design responsibility and overlaps the design contracts.
      fix: Keep one semantic filter-interaction test in Behavior; move viewport visibility and bounded-shell assertions to the relevant Design contract or remove them if that contract already covers the archive route.
      cost_of_deferring: Behavior failures can be caused by responsive geometry rather than an interaction regression.
      evidence:
        - tests/behavior/event-history-filters.spec.ts:80-109
        - tests/design/geometry-contract.spec.ts:164-421
        - tests/design/responsive-reachability.spec.ts:154
      resolution:
        resolved_at: 2026-08-21
        resolved_ref: worktree SHA256 81BD428CEBE4A92A456D5D24F2B61A5DFF8BFEE25E69C9BD525B8CE8DF173DE5
        checks:
          - corepack pnpm run test:behavior (32 passed)
          - corepack pnpm run test:design (180 passed)
    - id: TEST-DATA-001
      level: SMELL
      axis: ARCH
      status: open
      target: tests/data/gallery-data.test.mjs:14-24; tests/data/static-public-content.test.mjs:73-120
      problem: The English-gallery inventory is split between two source-parsing tests that both enumerate the same Spanish IDs and English records.
      fix: Merge the English-copy identity assertion into static-public-content.test.mjs, leaving gallery-data.test.mjs focused on asset hashes and gallery SEO assets.
      cost_of_deferring: A future gallery schema change requires editing two nearby inventory tests and obscures which one owns the public-content contract.
      evidence:
        - tests/data/gallery-data.test.mjs:14-24
        - tests/data/static-public-content.test.mjs:73-120
  evidence:
    - rg inventory of every test declaration under tests/ on 2026-08-21
    - package.json command composition inspected
    - corepack pnpm run test:behavior passed 32 tests after removing the two matrices
    - corepack pnpm run test:design passed 180 tests after removing the two matrices
    - node node_modules/prettier/bin/prettier.cjs --check tests/behavior/events.spec.ts tests/behavior/event-history-filters.spec.ts passed
  result: The four top-level responsibilities are understandable. The two Behavior-versus-Design overlaps are removed and verified; the gallery-data separation remains intentionally unchanged at owner direction.
  pending:
    - Inspect runtime duration and flaky-test history before deciding whether to reduce remaining cross-browser viewport repetitions.
  next: Reassess TEST-DATA-001 only if the gallery content schema changes; the owner chose to retain its current split.

latest_screaming_frog_internal_html_review:
  id: REV-2026-08-20-06
  requested_scope: Review the supplied Screaming Frog internal HTML crawl as an SEO audit.
  actual_scope:
    targets:
      - C:/Users/and_m/Documents/internos_todo.csv
      - 44 HTML URLs represented by that crawl
    axes: [SEO, PERF]
    included:
      - HTTP status, indexability reporting, title, meta description, H1, canonical, language, crawl depth, internal links, near duplicates, HTML size, and response time
    excluded:
      - images and other non-HTML resources, structured-data validation, hreflang inventory, external links, Search Console, field Core Web Vitals, and live behavior after the recorded crawl
  baseline:
    commit: e0c13066
    worktree: dirty with pre-existing SEO and review-state changes
    crawl_timestamp: 2026-08-20 13:46
    crawl_sha256: 99FC7DA057A77A610415C353CBAC4C7F9B87DDD2B4E6CD4219870289C0DD952E
  findings:
    - id: SEO-TITLE-WIDTH-001
      level: POLISH
      axis: SEO
      status: open
      target: generated event route titles
      problem: 33 of 44 titles exceed Screaming Frog's approximate 580-pixel preview threshold, all on event-detail routes.
      fix: Use a shorter event-title suffix or compact localized site name while retaining the unique event name and date.
      cost_of_deferring: Google may truncate or rewrite some event title links, although this is not a Google compliance failure or fixed character-limit violation.
      evidence:
        - supplied crawl reports widths from 596 to 947 pixels for the 33 affected titles
    - id: SEO-DESC-TRUNC-001
      level: SMELL
      axis: SEO
      status: open
      target: generated event route descriptions
      problem: 24 event meta descriptions end without sentence punctuation and visibly stop inside an address or introductory clause.
      fix: Summarize location at a meaningful boundary and reserve space for a complete event-specific sentence instead of truncating mechanically near 155 characters.
      cost_of_deferring: Search snippets may present incomplete phrases and hide the event's most useful distinguishing information.
      evidence:
        - supplied crawl contains descriptions ending with fragments such as "doscientos metros", "este y", or "Participation includes:"
  evidence:
    - parsed 44 HTML URL rows from the CSV; excluded the two Screaming Frog path-summary rows
    - all 44 URLs returned HTTP 200 and text/html; charset=utf-8
    - no missing or duplicate title, meta description, H1, or canonical; no canonical mismatch and no near-duplicate group reported
    - crawl contains 22 Spanish and 22 English pages
    - response time ranged from 0.087 to 0.232 seconds, average 0.182 seconds
    - HTML size ranged from 14694 to 29615 bytes, average 18807 bytes
    - 40 pages under 100 words and 18 pages with fewer than three unique internal inlinks were treated as context, not automatic defects; none is an orphan in the supplied crawl
  result: The crawl is technically healthy. The actionable SEO work is limited to snippet quality on event pages: overly wide titles and mechanically truncated descriptions. Intentional noindex is accepted and not counted as a finding.
  pending:
    - Validate structured data, hreflang, response headers, and Core Web Vitals with their dedicated exports or tools.
    - Re-crawl after any metadata changes to confirm the event snippet inventory.
  next: Adjust the event metadata template as one non-visual SEO phase after owner approval, then run the generated-output checks and a fresh crawl.

latest_google_seo_best_practices_review:
  id: REV-2026-08-20-05
  requested_scope: Audit the site against current Google Search SEO best practices while accepting the intentional noindex policy.
  actual_scope:
    targets:
      - src/app/config/seo-data.json
      - src/app/config/seo.ts
      - scripts/generate-route-html.mjs
      - public/robots.txt
      - tests/generated-output.test.mjs
      - fresh dist/**/index.html, dist/404.html, dist/sitemap.xml, and dist/_redirects
    axes: [SEO, PERF]
    included:
      - crawl access, prerendered content, titles, descriptions, canonical URLs, language and hreflang
      - crawlable internal links, heading/main landmarks, image alt text, sitemap policy, redirects, and structured-data readiness
      - source-level page-experience readiness and presence of measurement evidence
    excluded:
      - the owner-approved temporary noindex decision itself
      - deployed response headers, Search Console, Googlebot rendering, Rich Results Test, CrUX, backlinks, and ranking outcomes
  baseline:
    commit: e0c13066
    worktree: dirty with owner changes in scripts/generate-route-html.mjs and tests/generated-output.test.mjs
    fingerprint:
      scripts/generate-route-html.mjs: 84EDDC5206758773D8B31E8262FD140893A739A191316B9AD26AC8B0AE2809C4
      tests/generated-output.test.mjs: 7BBF52FE8535270846DAE3F874B39CFD484F39833274D4F7E59F1BEA161E21C2
      src/app/config/seo.ts: 21CCB2A2E59E394875C2DCC8E095F3DE2182B43643CCB405BDD2EAB46633E06F
      src/app/config/seo-data.json: 21670FA1D92D38D874ADFFAFBA00D057B869BF81B0818CAC9AD642C111F0F9F8
  findings:
    - id: PERF-CWV-001
      status: open
      evidence:
        - current source and generated-output review still contains no field or repeatable lab measurements for LCP, INP, or CLS
  evidence:
    - current Google Search Central documentation reviewed for the SEO Starter Guide, noindex, sitemaps, Event structured data, and page experience
    - fresh corepack pnpm run build passed after an initial sandbox-only filesystem denial
    - corepack pnpm run test:generated passed 12 tests
    - generated inventory inspected 44 route index files: no missing title, description, canonical, html lang, single h1, or main landmark; no duplicate titles or descriptions
    - generated inventory inspected 112 images with no missing alt attribute and 44 internal link targets with no unresolved generated route
    - all generated routes emit noindex, follow; robots.txt allows crawling; the freshly generated sitemap has no loc or image entries
    - structured data is intentionally suppressed while noindex is active; source inspection confirms Event name, startDate, location, image, URL, attendance mode, and status generation for the indexed state
  result: No additional Google SEO defect was confirmed in the reviewed local scope beyond the already-open lack of measured Core Web Vitals evidence. The current dirty-worktree sitemap change aligns the noindex deployment with Google's sitemap guidance, but deployed and indexing-enabled behavior remain unverified.
  pending:
    - Run Search Console URL Inspection and deployed crawling after launch-domain approval.
    - Validate indexing-enabled JSON-LD with Google's Rich Results Test before enabling indexing.
    - Establish field or repeatable lab evidence for LCP, INP, and CLS.
  next: Perform a launch-readiness verification on the approved canonical production domain before changing the global indexing flag.

latest_whatsapp_open_graph_review:
  id: REV-2026-08-20-01
  requested_scope: Audit whether the site emits metadata that WhatsApp uses for link previews.
  actual_scope:
    targets:
      - index.html
      - src/app/config/seo-data.json
      - src/app/config/seo.ts
      - scripts/generate-route-html.mjs
      - tests/generated-output.test.mjs
      - fresh dist/**/index.html output
    axes: [SEO]
    included:
      - Open Graph required properties: og:title, og:type, og:image, og:url
      - recommended share-preview properties: og:description, og:locale, og:site_name
      - absolute HTTPS URLs, canonical-to-og:url equality, and emitted social-image presence
    excluded:
      - deployed Cloudflare response headers and WhatsApp's external crawler fetch
      - Twitter Cards, structured data, visual card appearance, and editorial-copy quality
  baseline:
    commit: 545ae9f1
    worktree: clean before the required review-state update
  evidence:
    - source inspection at src/app/config/seo.ts:638-660 and scripts/generate-route-html.mjs:30-84
    - fresh corepack pnpm run build passed on 2026-08-20
    - corepack pnpm run test:generated passed 11 tests on fresh output
    - reproducible generated-HTML audit inspected 44 public route files with no missing required or recommended Open Graph properties, no non-HTTPS og:url or og:image values, no canonical-to-og:url mismatch, and no missing emitted social image
  result: All 44 generated public routes emit the Open Graph metadata WhatsApp needs for previews. Each uses og:type=website and the absolute 1200x630 JPEG social card, with matching canonical and og:url values. Local output does not prove WhatsApp can fetch the deployed URL.
  pending:
    - Verify a deployed production URL with WhatsApp's sharing debugger or an actual WhatsApp message after deployment.
  next: If preview-card behavior is reported as incorrect in WhatsApp, inspect the deployed route and social-image response rather than changing the local metadata generator.

latest_deployed_eventos_route_review:
  id: REV-2026-08-20-02
  requested_scope: Investigate metadata problems at https://fak-kendo.pages.dev/eventos/.
  actual_scope:
    targets:
      - deployed https://fak-kendo.pages.dev/eventos/
      - deployed https://fak-kendo.pages.dev/eventos/pasados/
      - deployed https://fak-kendo.pages.dev/eventos/2026-08-08-examen/
      - src/app/config/seo.ts
      - scripts/generate-route-html.mjs
      - generated dist/_redirects
    axes: [SEO]
    included:
      - HTTP status and presence of Open Graph required properties
      - generated route and redirect coverage for the /eventos/ directory URL
    excluded:
      - event-detail and archive metadata quality beyond presence
      - WhatsApp cache state, visual share-card rendering, and implementation changes
  baseline:
    commit: 545ae9f1
    worktree: review-state update only
  findings:
    - id: SEO-EVENTOS-ROOT-001
      level: STRUCTURAL
      axis: SEO
      status: open
      target: https://fak-kendo.pages.dev/eventos/
      problem: The directory-level Spanish events URL returns HTTP 404 and consequently emits none of the four Open Graph properties WhatsApp requires.
      fix: Add an explicit permanent redirect from /eventos/ to the intended public destination, currently /eventos/pasados/, and add a generated-output regression assertion.
      cost_of_deferring: Links shared with the directory URL cannot produce a valid WhatsApp preview and lead visitors to a missing page.
      evidence:
        - read-only deployed comparison on 2026-08-20: /eventos/ returned 404 with no og:title, og:type, og:image, or og:url
        - /eventos/pasados/ and /eventos/2026-08-08-examen/ returned 200 and all four properties
        - src/app/config/seo.ts:335-343 generates redirects only for event aliases
        - fresh dist/_redirects contains only event-alias redirect entries
  result: The reported metadata problem is caused by a missing route or redirect, not a malformed Open Graph implementation on existing public event routes.
  pending:
    - Owner confirmation that /eventos/pasados/ is the intended permanent destination for /eventos/.
  next: Implement the explicit redirect and its regression test after destination approval.

latest_deployed_whatsapp_metadata_inventory:
  id: REV-2026-08-20-03
  requested_scope: Audit the reported WhatsApp metadata problem across all deployed pages.
  actual_scope:
    targets:
      - all 44 URLs declared in deployed https://fak-kendo.pages.dev/sitemap.xml
      - deployed https://fak-kendo.pages.dev/eventos/
      - deployed https://fak-kendo.pages.dev/en/events/
      - deployed Open Graph social image
    axes: [SEO]
    included:
      - HTTP status
      - required Open Graph properties: og:title, og:type, og:image, og:url
      - recommended Open Graph properties: og:description, og:locale, og:site_name
      - canonical-to-og:url equality and public social-image availability
    excluded:
      - URLs outside the sitemap except the two shareable event-directory entry points
      - WhatsApp cache state, visual card appearance, and content-quality review
  baseline:
    deployed_at: 2026-08-20
    inventory: deployed sitemap with 44 URLs plus two event-directory URLs
  findings:
    - id: SEO-EVENTOS-ROOT-001
      status: open
      evidence:
        - the sitemap audit confirms the same failure for both /eventos/ and /en/events/
  evidence:
    - read-only deployed audit inspected 46 URLs: 44 sitemap URLs and two event-directory URLs
    - all 44 sitemap URLs returned HTTP 200 and emitted every included Open Graph property, with canonical equal to og:url
    - /eventos/ and /en/events/ each returned HTTP 404 and emitted none of the included Open Graph properties
    - https://fak-kendo.pages.dev/images/social/kendo-social-card-20260812.jpg returned HTTP 200 with Content-Type image/jpeg
    - https://fak-kendo.pages.dev/eventos/pasados/? returned HTTP 200; all included properties were present and both canonical and og:url normalized to https://fak-kendo.pages.dev/eventos/pasados/
  result: The deployed sitemap inventory has complete WhatsApp-relevant Open Graph metadata. The only confirmed failures are the unimplemented Spanish and English event-directory URLs, which are outside the sitemap and return 404.
  pending:
    - Owner confirmation of the desired permanent redirect destinations for both directory URLs.
  next: Add redirects for /eventos/ and /en/events/ to their respective archive pages, with regression coverage, after owner approval.

latest_whatsapp_preview_screenshot_followup:
  id: REV-2026-08-20-04
  requested_scope: Diagnose the bare-domain WhatsApp previews shown for /eventos/pasados/ and /eventos/.
  actual_scope:
    targets:
      - deployed https://fak-kendo.pages.dev/eventos/pasados/
      - deployed https://fak-kendo.pages.dev/eventos/
      - deployed Open Graph social image
    axes: [SEO]
    included:
      - responses served to Meta and WhatsApp-style crawler user agents
      - response status, Open Graph property presence, and social-image availability
    excluded:
      - Meta's private preview cache, WhatsApp client rendering, and implementation changes
  baseline:
    deployed_at: 2026-08-20
  evidence:
    - facebookexternalhit/1.1 and WhatsApp/2.24.0 each received HTTP 200 and og:title, og:image, and og:url from /eventos/pasados/
    - both crawler user agents received HTTP 404 and no Open Graph metadata from /eventos/
    - facebookexternalhit/1.1 received HTTP 200 and Content-Type image/jpeg from the social-card URL
  result: The current archive response is consumable by Meta-style crawlers. The screenshot's bare preview for that URL is consistent with stale WhatsApp or Meta preview-cache data, but the cache state cannot be inspected from this repository. The /eventos/ preview is expected to fail because that URL remains 404.
  pending:
    - Request a fresh scrape for /eventos/pasados/ in Meta's Sharing Debugger, then send a new WhatsApp message to confirm the refreshed card.
    - Owner approval to redirect /eventos/ and /en/events/.
  next: Treat a bare archive preview that persists after a fresh Meta scrape as an external-platform investigation; do not change the verified local Open Graph generator without new evidence.

latest_deployed_crawl_seo_review:
  id: REV-2026-08-17-02
  requested_scope: Summarize problems in the supplied deployed crawl and identify implementable improvements, accepting noindex as expected.
  actual_scope:
    targets:
      - supplied Screaming Frog-style CSV crawl of https://fak-kendo.pages.dev/
      - src/app/config/seo-data.json
      - src/app/config/seo.ts
      - scripts/generate-route-html.mjs
      - src/app/data/calendarEvents.ts
      - src/app/components/HeroSection.tsx
    axes: [SEO, PERF]
    included:
      - HTTP status, required metadata, canonical, language, titles and descriptions
      - duplicate event metadata, sitemap/noindex consistency, internal-link counts, and crawled image weight
    excluded:
      - visual design, editorial fact checking, Search Console, field Core Web Vitals, and deployed response headers not present in the crawl
  baseline:
    commit: 458cdc17
    worktree: clean
    crawl_timestamp: 2026-08-17
  findings:
    - id: SEO-SITEMAP-001
      level: STRUCTURAL
      axis: SEO
      status: open
      target: scripts/generate-route-html.mjs
      problem: The generated sitemap includes routes whenever they have a canonical URL, even while every route emits noindex.
      fix: Include only routes whose effective robots policy is indexable, while retaining canonicals on noindex pages if desired.
      cost_of_deferring: The sitemap and page directives send conflicting crawl/indexing signals during the intentional noindex period.
      evidence:
        - deployed sitemap is 12498 bytes while all 44 crawled HTML pages are noindex
        - sitemap generation filters on canonicalUrl rather than effective robots policy
    - id: SEO-EVENT-META-001
      level: SMELL
      axis: SEO
      status: open
      target: src/app/config/seo.ts:282
      problem: Recurring events reuse generic titles and summaries, producing duplicate titles and descriptions across distinct URLs.
      fix: Generate event metadata with localized date and, where useful, location while keeping visible event names unchanged.
      cost_of_deferring: Event pages remain difficult to distinguish in search previews, shares, and crawlers after indexing is enabled.
      evidence:
        - seven Spanish Examination titles and seven English Examination titles are duplicated
        - repeated generic examination and tournament descriptions occur across multiple routes
    - id: SEO-EVENT-I18N-001
      level: SMELL
      axis: SEO
      status: open
      target: src/app/data/calendarEvents.ts:63
      problem: The English Gasshuku route reuses the Spanish title and long Spanish summary, and the summary is cut mechanically at 160 characters.
      fix: Supply localized event summaries and normalize/truncate metadata at a sentence or word boundary.
      cost_of_deferring: The English route exposes mismatched-language and visibly truncated metadata.
      evidence:
        - both Gasshuku language routes have the same Spanish 160-character description
        - both descriptions measure 977 pixels in the supplied crawl
    - id: SEO-TITLE-WIDTH-001
      level: POLISH
      axis: SEO
      status: open
      target: src/app/config/seo.ts:301
      problem: Six event titles exceed the crawler's approximate 580-pixel display threshold.
      fix: Use a shorter site-name suffix for event metadata or a route-specific compact title template.
      cost_of_deferring: Some event titles may be truncated in result snippets and link previews.
      evidence:
        - six crawled event titles measure 608 to 770 pixels
    - id: PERF-SOCIAL-IMAGE-001
      level: POLISH
      axis: PERF
      status: open
      target: src/app/config/seo-data.json:24
      problem: Crawlers fetch the 848570-byte original hero JPEG through page metadata even though the rendered hero uses responsive WebP files.
      fix: Create an optimized social-preview image and reference it from SEO metadata without changing the approved visible hero.
      cost_of_deferring: Social crawlers and audits transfer substantially more image data than necessary; this is not evidence of an LCP regression.
      evidence:
        - supplied crawl reports the original hero JPEG at 848570 bytes
        - HeroSection renders responsive WebP sources
  evidence:
    - parsed all 103 crawl rows and separately evaluated 44 HTML rows
    - all 103 resources returned 200 OK
    - all HTML rows contain title, meta description, H1, canonical, and language
    - inspected current SEO generation and event metadata sources at commit 458cdc17
  result: The deployed crawl has no broken responses or missing basic metadata; the implementable work is sitemap-policy consistency, unique/localized event metadata, compact event titles, and a lighter social image.
  pending:
    - Owner decision whether intentional noindex should remain nofollow or become follow.
    - Decide whether low event-page inlink counts warrant a navigation/content change after indexation is planned.
  next: Implement the non-visual SEO generation fixes as one bounded phase after owner selects the robots follow policy.

latest_rendering_seo_performance_review:
  id: REV-2026-08-17-01
  requested_scope: Determine whether the site applies prerendering/indexation, Core Web Vitals optimization, technical SEO, and SEO troubleshooting practices.
  actual_scope:
    targets:
      - src/app/config/seo-data.json
      - src/app/config/seo.ts
      - src/entry-server.tsx
      - src/main.tsx
      - scripts/generate-route-html.mjs
      - public/robots.txt
      - tests/generated-output.test.mjs
      - generated dist route HTML, sitemap.xml, and _redirects
    axes: [SEO, PERF]
    included:
      - SSG/prerender and hydration architecture
      - robots directives, canonical URLs, hreflang, structured-data generation, sitemap, 404 output, and event redirects
      - source-level LCP image prioritization, responsive images, lazy loading, and bundle output
      - presence or absence of measured LCP, INP, and CLS evidence
    excluded:
      - deployed response status and redirect chains
      - Google Search Console, CrUX, field data, crawl logs, and live index coverage
      - a fresh Lighthouse or browser performance trace
  baseline:
    commit: b4516da7
    worktree: clean before generated build artifacts
  findings:
    - id: SEO-INDEX-001
      level: STRUCTURAL
      axis: SEO
      status: open_owner_policy
      target: src/app/config/seo.ts:158
      problem: Global indexing is deliberately disabled, so every generated route emits noindex, nofollow, structured data is suppressed, and the generated sitemap contains no URL entries.
      fix: After owner approval of the canonical domain, legal identity, and launch policy, enable the global and applicable event indexing flags and verify generated plus deployed output.
      cost_of_deferring: Search engines can crawl the public files but are explicitly instructed not to index any site page.
      evidence:
        - SITE_INDEXING_ENABLED is false
        - generated-output tests assert noindex, no structured data, and no sitemap loc entries
        - corepack pnpm run build passed and regenerated all configured routes
      introduced_in: REV-2026-08-17-01
    - id: PERF-CWV-001
      level: SMELL
      axis: PERF
      status: open
      target: repository performance verification
      problem: The implementation contains LCP-oriented image optimizations, but no recorded automated or field measurement establishes current LCP, INP, or CLS values.
      fix: Establish repeatable lab budgets and collect field data after deployment, then diagnose regressions per route and device class.
      cost_of_deferring: Core Web Vitals compliance and regressions remain assumptions rather than measured behavior.
      evidence:
        - route image preloads use fetchpriority high and responsive source metadata
        - primary images use eager/high priority while secondary images use lazy loading
        - no Lighthouse, web-vitals, CrUX, or PerformanceObserver checks found in the reviewed scope
      introduced_in: REV-2026-08-17-01
  evidence:
    - corepack pnpm run build passed outside the filesystem sandbox, including client build, SSR bundle, prerendered route HTML, 404.html, sitemap.xml, and _redirects
    - corepack pnpm run test:generated passed 6 tests before the clean rebuild
    - inspected generated-route and metadata source paths at commit b4516da7
  result: SSG/prerender and most technical SEO mechanisms are implemented and build successfully, but public indexation is intentionally paused and Core Web Vitals are optimized only at source level, not currently demonstrated by measurements.
  pending:
    - owner launch/indexing approval
    - deployed crawl/index evidence and repeatable LCP, INP, and CLS measurements
  next: Run a production performance/indexability audit after the owner approves indexing and the canonical production domain.

latest_stale_coverage_reconciliation:
  id: REV-2026-08-16-01
  requested_scope: Reconcile the technical and visual coverage marked stale since 2026-08-12.
  actual_scope:
    targets:
      - scripts/sync-calendar-events.mjs
      - scripts/sync-event-galleries.mjs
      - scripts/correct-calendar-history.mjs
      - scripts/correct-calendar-history-range.mjs
      - src/app/components/EventPage.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/calendar/CalendarEventCard.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HistoricalEventGallery.tsx
      - src/app/components/Lightbox.tsx
      - generated routes and the existing 32-snapshot visual matrix
    axes: [ARCH, A11Y, RESPONSIVE]
    included:
      - calendar, gallery, historical-publication, and workflow contracts
      - generated-route behavior, geometry, reachability, and lightbox lifecycle
      - comparison against the existing approved Windows screenshots without updating baselines
    excluded:
      - production deployment and external Calendar, Drive, GitHub Actions, or Cloudflare execution
      - SEO, performance, and source-wide architecture review
      - approval of visual changes or snapshot regeneration
  baseline:
    commit: 504fc8ff
    worktree: clean before generated verification artifacts
  findings:
    - id: VIS-REG-001
      level: STRUCTURAL
      axis: RESPONSIVE
      status: open
      target: tests/e2e/visual-regression.spec.ts-snapshots
      problem: Seven current renders differ materially from the approved snapshot baseline: Event at all four viewports, Gallery at both mobile viewports, and Home at tablet.
      fix: Attribute every changed region to an explicitly approved visual requirement; preserve or correct the implementation as directed, then update only owner-approved baselines.
      cost_of_deferring: The structural suites remain green, but the repository cannot claim current visual-baseline coverage for those seven surfaces.
      evidence:
        - corepack pnpm run test:visual: 25 passed, 7 failed
        - inspected expected/actual diff artifacts for all seven failures
      introduced_in: REV-2026-08-16-01
  evidence:
    - corepack pnpm run lint passed with zero warnings and errors
    - corepack pnpm run test:sync-directed passed 59 tests
    - corepack pnpm run build passed, including SSR and generated route HTML
    - corepack pnpm run test:e2e passed 209 tests
    - corepack pnpm run test:visual passed 25 and failed 7 without updating snapshots
  result: Synchronization and UI behavior coverage is current at 504fc8ff; visual coverage remains stale only for the seven named route/viewport surfaces. The other 25 screenshots, including all four lightbox snapshots, match.
  pending:
    - Owner attribution and approval for the seven visual differences before any baseline update.
  next: Review the seven expected, actual, and diff image triplets against the intended Event, mobile Gallery, and Home tablet changes.

latest_calendar_resilience_script_review:
  id: REV-2026-08-14-01
  requested_scope: Verify the script-backed identity and fingerprint checks plus the resilience behavior represented by the two calendar infrastructure diagrams.
  actual_scope:
    targets:
      - scripts/sync-calendar-events.mjs
      - scripts/apply-calendar-editorial-decision.mjs
      - scripts/correct-calendar-history.mjs
      - scripts/correct-calendar-history-range.mjs
      - .github/workflows/sync-calendar.yml
      - .github/workflows/apply-calendar-editorial-decision.yml
      - .github/workflows/correct-calendar-history-range.yml
      - tests/event-history-sync-contract.test.mjs
      - tests/calendar-history-correction.test.mjs
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-infrastructure-flows.md
    axes: [ARCH]
    included:
      - exact decision identity, revision, and evidence checks
      - historical range report and local-state fingerprint checks
      - pending, published, and removed transitions for future and historical events
      - mass-disappearance preservation and artifact handoff
      - correspondence between the implemented behavior and both diagrams
    excluded:
      - external GitHub Actions and Cloudflare execution, UI, SEO, visual behavior, and implementation changes
  baseline:
    commit: f9cdfe61
    worktree: clean before this review-state update
  confirmed_findings:
    - CRIT-ARCH-001
    - DOC-ARCH-003
  evidence:
    - corepack pnpm exec node --test tests/event-history-sync-contract.test.mjs tests/calendar-history-correction.test.mjs passed 45 tests
    - exact source, revision, and evidence comparison at scripts/sync-calendar-events.mjs:678-689
    - historical snapshot and proposal comparisons at scripts/correct-calendar-history.mjs:125-139
    - artifact upload/download names in .github/workflows/sync-calendar.yml and .github/workflows/correct-calendar-history-range.yml
    - future replacement and rejected-deletion transitions at scripts/sync-calendar-events.mjs:479-508 and 646-660
  result: Core pending/publicado/eliminado and fail-closed mass-disappearance behavior is implemented and covered by directed tests, but the historical correction artifact cannot currently be downloaded by its consumer workflow and the resilience diagram overstates revision/evidence retention for future edits and rejected deletions.

latest_calendar_resilience_findings:
  - id: CRIT-ARCH-001
    level: CRITICAL
    axis: ARCH
    status: resolved
    target: .github/workflows/correct-calendar-history-range.yml:39
    problem: The correction workflow downloads artifact calendar-historical-changes, while synchronization uploads the report inside artifact calendar-notification-reports.
    fix: Use one artifact name in both workflows and add a contract assertion for the producer-consumer name.
    cost_of_deferring: Every approved historical range correction run fails before the correction script can execute.
    evidence:
      - .github/workflows/sync-calendar.yml:87
      - .github/workflows/correct-calendar-history-range.yml:39
    introduced_in: REV-2026-08-14-01
    resolution:
      resolved_at: 2026-08-14
      resolved_ref: implementation worktree based on f9cdfe61
      checks:
        - corepack pnpm exec node --test tests/calendar-workflow-architecture.test.mjs passed 3 tests
        - corepack pnpm run test:unit passed 91 tests
        - git diff --check passed
  - id: DOC-ARCH-003
    level: STRUCTURAL
    axis: ARCH
    status: resolved
    target: ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-infrastructure-flows.md:159
    problem: The implemented-resilience diagram says applicable future edits retain the previous revision and all saved paths retain revision and evidence, but future edits replace the prior registry event and rejected deletion removes pendingRevision.
    fix: Either narrow the diagram wording to the state actually retained or implement explicit prior-revision and evidence retention for those transitions.
    cost_of_deferring: Operators and future phases may rely on an audit trail that the current registry does not preserve.
    evidence:
      - scripts/sync-calendar-events.mjs:479-508
      - scripts/sync-calendar-events.mjs:646-660
      - tests/event-history-sync-contract.test.mjs
    introduced_in: REV-2026-08-14-01
    resolution:
      resolved_at: 2026-08-14
      resolved_ref: documentation worktree
      checks:
        - calendar-infrastructure-flows.md distinguishes ordinary published updates from retained pending-revision evidence

latest_calendar_flow_alignment_review:
  id: REV-2026-08-13-01
  requested_scope: Determine whether recent repository changes alter the canonical calendar infrastructure flow diagram.
  actual_scope:
    targets:
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-infrastructure-flows.md
      - scripts/sync-calendar-events.mjs
      - scripts/sync-event-galleries.mjs
      - scripts/correct-calendar-history-range.mjs
      - .github/workflows/sync-calendar.yml
      - .github/workflows/correct-calendar-history-range.yml
      - src/app/utils/eventArchive.js
    axes: [ARCH]
    included:
      - triggers, source artifacts, decisions, publication paths, and gates represented by the current-flow diagram
      - committed changes through 22c12617
    excluded:
      - visual UI behavior, SEO, non-calendar gallery asset hashing, external workflow execution, and changes to the objective diagram
  baseline:
    commit: 22c12617
    worktree: clean
  confirmed_findings:
    - DOC-ARCH-002
  evidence:
    - calendar-infrastructure-flows.md current-flow Mermaid diagram
    - .github/workflows/correct-calendar-history-range.yml
    - scripts/correct-calendar-history-range.mjs
    - git diff 2555735b..HEAD for calendar workflow and pipeline targets
  result: The current-flow diagram is stale for the separately triggered, report-driven historical correction workflow. The 48-hour archive/gallery checkpoint changes a business timing rule but does not change the diagram topology.

open_findings:
  - id: DOC-ARCH-002
    level: STRUCTURAL
    axis: ARCH
    status: resolved
    target: ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-infrastructure-flows.md:19
    problem: The current-flow diagram shows the retained historical-change report as terminal, but it omits the manual correction workflow that downloads that report, validates an approved date range, writes the registry and public event data, verifies, commits, and re-enters CI.
    fix: Add a separate manual-trigger branch from the retained report to correct-calendar-history-range.yml, its validation/correction step, calendarEventRegistry.json and calendarEvents.ts, the existing verification gate, commit, and CI.
    cost_of_deferring: Readers cannot trace the implemented human-approved correction path and may mistake the report for an informational dead end.
    evidence:
      - .github/workflows/correct-calendar-history-range.yml
      - scripts/correct-calendar-history-range.mjs
    introduced_in: REV-2026-08-13-01
    resolution:
      resolved_at: 2026-08-13
      resolved_ref: documentation worktree
      checks:
        - calendar-infrastructure-flows.md includes the manual correction branch from the retained report through the existing verification and CI path

state_rules:
  - Coverage is valid only for its recorded targets, axes, inclusions, and baseline.
  - An inspected target is not automatically reviewed.
  - A reviewed target is not automatically verified.
  - Changed targets make prior coverage stale until re-reviewed.
  - Legacy claims without reproducible evidence are historical, not current coverage.

latest_c2_alarm_review:
  id: REV-2026-08-11-01
  requested_scope: Review the pending Phase C2 historical-calendar alarm.
  actual_scope:
    targets:
      - scripts/sync-calendar-events.mjs
      - .github/workflows/sync-calendar.yml
      - tests/event-history-sync-contract.test.mjs
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/event-history-roadmap.md
    axes: [ARCH]
    included:
      - deterministic historical-change detection
      - immutability of historical snapshots
      - private-data redaction
      - GitHub Actions alarm channel and structured artifact
      - alignment of the canonical roadmap status with repository evidence
    excluded:
      - implementation changes
      - external GitHub Actions execution
      - visual UI, gallery-pipeline, correction-operation, and deployment review
  baseline:
    commit: 2555735b
    worktree: clean
  confirmed_findings: []
  evidence:
    - corepack pnpm exec node --test tests/event-history-sync-contract.test.mjs passed 15 tests
    - scripts/sync-calendar-events.mjs exports detectHistoricalChanges, redacts report values, writes the report, and emits an Actions warning and summary
    - .github/workflows/sync-calendar.yml uploads calendar-historical-changes.json for 30 days without issue permissions or a failure gate
    - event-history-roadmap.md was reconciled on 2026-08-12
  result: C2 is implemented locally with the selected non-blocking GitHub Actions summary/warning plus JSON-artifact channel. The canonical roadmap and operator workflow were reconciled on 2026-08-12; external Actions execution remains outside this review.

resolved_findings:
  - id: DOC-ARCH-001
    level: SMELL
    axis: ARCH
    status: resolved
    target: ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/event-history-roadmap.md:3
    problem: The roadmap states that C2 is pending, while repository code, its workflow, and directed C2 tests implement the documented alarm channel.
    fix: Mark C2 implemented and verified locally, record the chosen channel as an Actions warning/summary plus 30-day JSON artifact, and remove the pre-implementation decision gate.
    cost_of_deferring: Roadmap-driven planning will incorrectly report C2 as the next phase and may duplicate completed work.
    evidence:
      - commit e13300cd
      - scripts/sync-calendar-events.mjs:529
      - .github/workflows/sync-calendar.yml:41
      - tests/event-history-sync-contract.test.mjs:179
      - corepack pnpm exec node --test tests/event-history-sync-contract.test.mjs
    introduced_in: REV-2026-08-11-01
    resolution:
      resolved_at: 2026-08-12
      resolved_ref: documentation worktree
      checks:
        - event-history-roadmap.md records C2 as implemented and verified locally
        - calendar-sync.md records the selected alarm channel and operator workflow

stale_coverage_notices:
  - id: STALE-2026-08-12-01
    targets:
      - src/app/components/EventPage.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/calendar/CalendarEventCard.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HistoricalEventGallery.tsx
      - src/app/components/Lightbox.tsx
      - scripts/sync-calendar-events.mjs
      - scripts/sync-event-galleries.mjs
      - scripts/correct-calendar-history.mjs
      - scripts/correct-calendar-history-range.mjs
      - related workflows, directed tests, and visual baselines
    reason: Changes committed on 2026-08-12 alter historical-gallery publication, correction workflow, event actions, calendar-card sharing, lightbox presentation, and approved visual snapshots after the prior recorded baselines.
    status: partially_reconciled_by_REV-2026-08-16-01
    limitation: Synchronization and UI behavior are current at 504fc8ff; visual coverage remains stale for Event at four viewports, Gallery at two mobile viewports, and Home at tablet pending owner attribution and approval.

design_source_status:
  status: obsolete_pending_recreation
  obsolete_source: the original Figma Make design and export
  temporary_visual_authority:
    - current application behavior and geometry
    - owner-approved measurements, screenshots, and rendered results
  rule: Do not claim fidelity to or drift from the original Figma. A recreated Figma becomes authoritative only after explicit owner approval.
  planned_work: Recreate Figma from the approved current product, including supported routes, responsive viewports, components, tokens, and interactive states.
  recorded_at: 2026-08-01

latest_calendar_freeze_review:
  id: REV-2026-08-10-01
  requested_scope: Review calendar synchronization so historical event data is captured once and later Calendar changes require manual confirmation.
  actual_scope:
    targets:
      - scripts/sync-calendar-events.mjs
      - scripts/sync-event-galleries.mjs
      - tests/calendar-sync.test.mjs
      - tests/event-gallery-sync.test.mjs
      - .github/workflows/sync-calendar.yml
    axes: [ARCH]
    included:
      - historical snapshot immutability
      - change detection and warning delivery
      - automatic commit behavior
      - unit-test coverage of the freeze contract
    excluded:
      - implementation changes
      - gallery UI and visual design
      - deployment and external notification integrations
  baseline:
    commit: aa454631
    worktree: clean
  confirmed_findings:
    - STR-ARCH-015
    - STR-ARCH-016
    - SMELL-ARCH-011
  evidence:
    - corepack pnpm run test:unit passed 33 tests
    - direct mergeRegistry reproduction showed historical startTime, endTime, location, summary, and eventType replaced without warning
  result: Historical event identity is only partially frozen; non-identity public fields still update automatically, and current warnings do not create a manual approval gate.

latest_process_incident:
  id: INC-2026-08-04-01
  requested_scope: Reduce the homepage hero overlay so a person at the right edge is more recognizable without weakening text contrast.
  baseline:
    commit: b59c5813
    worktree: dirty with unrelated in-progress bilingual route and component changes across 31 files
    approved_visual_oracle: committed Playwright screenshots for the current official design
  observed:
    - The desktop homepage screenshot comparison failed with 74504 changed pixels, an 8 percent ratio.
    - The diff contained the intended overlay change plus unrelated navbar, hero geometry, and event-title differences.
    - UpcomingEventCard.tsx had unrelated flex and min-height title changes that differed from the approved official presentation.
    - The overlay change did not improve recognition enough to satisfy the owner's visual objective.
  failure:
    - The mixed dirty worktree was used to evaluate a narrow visual change.
    - The screenshot failure was described as expected without first attributing every material changed region.
    - Passing structural checks were allowed to overshadow the blocking visual comparison.
  corrective_rules:
    - Require explicit owner approval before every visual edit, including spacing, alignment, typography, color, filters, visibility, and responsive presentation.
    - Feature approval does not authorize incidental design changes.
    - Isolate narrow visual work from unrelated dirty visual changes before validation.
    - Treat visual comparisons as fail-closed and inspect expected, actual, and diff images.
    - Never approve or regenerate a baseline until every material difference is authorized by the owner.
    - Preserve owner work and request explicit direction before any destructive reset, checkout, stash, or relocation.
  corrective_action:
    - removed the unapproved min-height and flex alignment added to homepage event titles
    - reverted the rejected responsive hero-overlay change
  status: documented; rejected visual changes removed and the remaining mixed implementation must not become a visual baseline without review

latest_responsive_overlap_fix:
  id: FIX-2026-08-04-02
  requested_scope: Explain and fix the desktop banner overlap on Affiliates, check the duplicated Calendar layout pattern, and document the regression.
  baseline:
    commit: d1df5cd3
    worktree: dirty with the owner's in-progress bilingual-route changes
    visual_authority:
      - owner-provided local and deployed Affiliates screenshots showing the banner heading obscured by the dojo cards
      - the established 1366x768 no-scroll desktop requirement
  root_cause:
    introduced_by: 424a6218
    explanation: The custom tall-md variant is emitted after the built-in xl variant. Adding tall-md:p-4 therefore reset xl:pt-20 from 80px to 16px when both variants matched, while the z-20 absolute content layer rendered above the banner.
    affected_pattern:
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/CalendarSection.tsx
  implemented:
    - added tall-md:xl:pt-20 at the exact variant intersection in Affiliates and Calendar
    - preserved the existing tall-md tablet padding, compact-landscape overrides, bilingual content work, and 1366x768 no-scroll composition
  verification:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the filesystem sandbox, including SSR and generated route HTML
    - git diff --check passed before the documentation update
    - local /afiliados at 1366x768 measured heading bottom 122.98px and dojo-list top 161.99px with no overlap
    - local /calendario at 1366x768 measured heading bottom 122.98px and content-panel top 161.99px with no overlap
    - both routes measured document clientHeight and scrollHeight at 768px and primary-section clientHeight and scrollHeight at 542px
  result: The desktop content layers begin below the visible banner headings again without introducing document or primary-section scrolling.

latest_visual_regression_gate:
  id: FIX-2026-08-04-03
  status: superseded
  superseded_by: FIX-2026-08-04-04
  requested_scope: Treat the approved design as a site-wide CI contract so any generated page that breaks raises an error, rather than adding an Affiliates-only regression test.
  baseline:
    commit: d1df5cd3
    worktree: dirty with FIX-2026-08-04-02 and this test implementation
    authority: The owner explicitly confirmed that the current rendered design is approved for every page.
  implemented:
    - added tests/e2e/visual-regression.spec.ts with automatic discovery of every generated dist route plus the custom not-found route
    - checks every generated page at 360x800, 390x844, 768x1024, and 1366x768
    - enforces horizontal overflow, heading viewport bounds, declared heading-to-content boundaries, and the desktop document, footer, and primary-section no-scroll contract
    - added data-page-content-boundary to the Affiliates dojo list and Calendar panel so the regression introduced by 424a6218 fails geometrically
    - added 28 approved screenshots covering home, calendar, gallery, affiliates, event, pastEvents, and notFound across all four viewports
    - configured platform-neutral screenshot paths and a 1% maximum pixel-difference ratio for useful Windows/Linux comparison
    - documented that baselines require explicit owner approval before regeneration
  verification:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed, including SSR and generated route HTML
    - structural gate: 92 passed across 23 generated/not-found pages and four viewports
    - visual gate: 28 passed across seven page designs and four viewports
    - complete Playwright suite: 130 passed
    - all seven desktop baselines were visually inspected after generation
  result: Historical implementation record. Its cross-platform screenshot gate and four-viewport all-route matrix were replaced by FIX-2026-08-04-04.

latest_design_contract_migration:
  id: FIX-2026-08-04-04
  status: current
  supersedes: FIX-2026-08-04-03
  requested_scope: Replace redundant platform-sensitive screenshot gating with explicit geometry, relative-content, selected semantic accessibility, and responsive contracts.
  baseline:
    commit: c0e73e23
    worktree: clean before implementation
    visual_authority: Current owner-approved application geometry and rendered styles; the obsolete Figma was not used.
  result_ref: uncommitted worktree based on c0e73e23
  implemented:
    - added tests/e2e/design-contract.ts as the explicit source for approved viewports, margins, padding, gaps, radius, and representative page selection
    - added tests/e2e/geometry-contract.spec.ts with desktop checks for every generated route and complete viewport checks for seven representative page designs
    - checks relative text, link and image presence without freezing ordinary event copy
    - checks one h1, unique IDs, image alt declarations, link destinations, and accessible names for visible controls
    - separated the 28 pixel screenshots into the manual test:visual workflow and excluded them from the default cross-platform CI gate
    - removed the redundant assertion that Spanish and English homepage content must produce identical vertical geometry while retaining independent geometry checks for both routes
  verification:
    - TypeScript no-emit check passed
    - production and SSR build plus generated route output passed
    - default Playwright suite passed with 86 tests
    - directed component-contract matrix passed with 28 tests
    - manual Windows visual suite passed with 28 approved screenshots and no baseline regeneration
  result: Default browser coverage is deterministic and content-relative while retaining explicit protection for approved spacing, containment, overlap, overflow, and responsive geometry.

latest_session:
  id: REV-2026-08-01-02
  requested_scope: Review the gallery landscape padding.
  actual_scope:
    targets:
      - src/app/components/gallery/FeaturedImage.tsx
      - /galeria at compact landscape viewports
    axes: [TAILWIND, RESPONSIVE]
    included:
      - computed outer and internal padding, responsive variant precedence, and alignment offsets
      - requested 669x386 and nearby 844x390 landscape presentations
    excluded:
      - application-code edits, typography, colors, radii, other routes, Figma comparison, and production behavior
  baseline:
    commit: ece88800
    worktree: dirty only from the prior review-state documentation update
    fingerprint:
      FeaturedImage.tsx: 12DABEEB6374B38D4320E959D8162A365E52B42556EA36380A46008AD7F93DA9
  confirmed_findings:
    - POL-TW-009
  result: The landscape caption padding finding was corrected to 10px on every side, verified locally, and approved by the owner on 2026-08-01.

previous_landscape_review:
  id: REV-2026-08-01-01
  requested_scope: Review the current gallery landscape layout.
  actual_scope:
    targets:
      - src/app/components/GallerySection.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - /galeria at compact landscape viewports
    axes: [RESPONSIVE, A11Y]
    included:
      - geometry, horizontal alignment, overflow, responsive visibility, and visible touch-target sizing
      - requested 669x386 and nearby 844x390 landscape presentations
    excluded:
      - application-code edits
      - Figma comparison, other routes, keyboard interaction, screen-reader execution, performance, SEO, and production behavior
  baseline:
    commit: ece88800
    worktree: clean before this review-state update
    fingerprints:
      GallerySection.tsx: E625488992DF39923E53C288155EA4EED305F867ACDCFF7963A6D0A9CFF0B724
      FeaturedImage.tsx: 12DABEEB6374B38D4320E959D8162A365E52B42556EA36380A46008AD7F93DA9
      GalleryThumbnails.tsx: 659DC05D119679677366D92062929B7F8D5711FA12632E50910F676BAFF4850D
  confirmed_findings: []
  result: No in-scope landscape defect was confirmed; the two caption rows remain horizontally organized, no horizontal overflow occurs, and visible navigation controls meet a 44px minimum target.

previous_ai_test_review:
  id: REV-2026-07-31-05
  requested_scope: Audit the AI-generated tests as untrusted code for hallucinated claims, false positives, weak assertions, and independence from the implementation.
  actual_scope:
    targets:
      - tests/e2e/events.spec.ts
      - tests/calendar-sync.test.mjs
      - tests/generated-output.test.mjs
      - tests/fixtures/calendar-events.ics
      - relevant calendar synchronization, route generation, SEO, event sharing, archive, and not-found implementations
    axes: [ARCH, SEO, RESPONSIVE]
    included:
      - correspondence between each test name, arrangement, action, assertion, and claimed behavior
      - deterministic test data, assertion specificity, negative cases, route identity, generated-output freshness, and local HTTP semantics
      - distinction between current behavior being correct and the test being able to detect a future defect
    excluded:
      - editing tests or application code
      - exhaustive mutation testing
      - production HTTP behavior and stakeholder approval of business requirements
      - accessibility, performance, security, and visual fidelity except where an existing test name claims them
  baseline:
    commit: 23907229
    worktree: dirty only from the prior review-state update
    test_fingerprints: unchanged from REV-2026-07-31-04
  confirmed_findings:
    - STR-ARCH-011
    - SMELL-ARCH-008
    - SMELL-ARCH-009
    - SMELL-SEO-005
    - STR-RESP-002
  result: No fabricated test execution was found, but several tests overstate what their assertions prove; passing status must remain provisional until the owner approves the acceptance criteria and the highest-risk tests are strengthened or mutation-checked.

previous_test_strategy_review:
  id: REV-2026-07-31-04
  requested_scope: Analyze how Playwright and the wider test strategy are used in the project, identify performed and missing manual and automated tests, and align the result with QA interview preparation and spec-driven development.
  actual_scope:
    targets:
      - playwright.config.ts
      - tests/e2e/events.spec.ts
      - tests/calendar-sync.test.mjs
      - tests/generated-output.test.mjs
      - .github/workflows/ci.yml
      - package.json test scripts
      - .agents/review-contract.md
      - .agents/implementation-contract.md
      - .agents/verification.md
      - external technical-backlog.md
    axes: [ARCH, A11Y, RESPONSIVE]
    included:
      - automated test inventory and classification
      - Playwright configuration, locators, assertions, isolation, retries, reporters, browser coverage, CI execution, and diagnostic artifacts
      - functional, responsive, accessibility, visual, production-smoke, and manual-test gaps
      - requirements-to-tests traceability and specification drift
    excluded:
      - implementation of new tests or configuration changes
      - exhaustive application-code review outside interactions needed to identify test gaps
      - production deployment, live assistive-technology execution, performance benchmarking, security testing, and real-device testing
  baseline:
    commit: 23907229
    worktree: clean before this review-state update
    fingerprints:
      playwright.config.ts: C274ECCD512A807686F5387CC0DBFC462842FD2A2E8FDF15B76B59827B6BD9BA
      events.spec.ts: EE3A6429F533224F77E4142FAE9B31C7A7318F5F768044658C7991F7EE6494BC
      calendar-sync.test.mjs: 58481D7F87A01D82AE228B0310F29FD42208C9A29FCEB3A160EE5ED362F1536C
      generated-output.test.mjs: 50486325C12F6FC6EFCE538BC13FB0BC93412A8032ACB4478FB9F793FE1AA1A8
      ci.yml: C34EE415008A76BD55F9C3163A083852F0E405917F84BE9ABEF3E40D4A15DD1C
  confirmed_findings:
    - STR-RESP-002
    - STR-ARCH-010
    - SMELL-ARCH-006
    - SMELL-A11Y-002
    - SMELL-ARCH-007
  result: The project has a fast, passing automated baseline with unit, generated-artifact, browser-functional, SEO, and responsive-smoke coverage, but its browser suite remains Chromium-only and shallow for interaction, accessibility, visual fidelity, CI diagnostics, and formal requirement traceability.

previous_architecture_review:
  id: REV-2026-07-27-02
  requested_scope: Compare the promised Google Calendar ownership and indexable event-content model with the current project, identify unrealistic metrics, and recommend a proportionate direction.
  actual_scope:
    targets:
      - .github/workflows/sync-calendar.yml
      - scripts/sync-calendar-events.mjs
      - src/app/types.ts
      - src/app/data/calendarEvents.ts
      - src/app/components/CalendarSection.tsx
      - src/app/config/seo.ts
      - src/app/config/seo-data.json
      - scripts/generate-route-html.mjs
      - generated dist/calendario/index.html and dist/sitemap.xml
      - external ADR 002, calendar operation guide, roadmap, decision log, and technical backlog
    axes: [ARCH, SEO]
    included:
      - editorial ownership and publication latency
      - ICS-to-generated-TypeScript boundaries and content completeness
      - event fragment URLs versus independently indexable event pages
      - stable event identity, historical retention, prerendering, metadata, structured data, and sitemap inclusion
      - provisional organization identity and canonical-domain timing
      - realistic operational, indexing, rich-result, and business metrics
    excluded:
      - implementation or visual design of a dedicated event page
      - legal interpretation of the pending Gaceta publication
      - Search Console property data, analytics data, and production rich-result validation
      - exhaustive RFC 5545 compatibility testing
  baseline:
    commit: 0729f5fc
    worktree: clean
    fingerprints:
      sync-calendar-events.mjs: 0A83814461E06ED2F6CE78F64D0B25DF8F8AD7C9EAE073106F58B6CFFAF8E248
      types.ts: 6D7D63147AF36705440B1CD85FB8A5D8B865DB8F3EF685AD50084C859FD6A853
      calendarEvents.ts: D26F25C055212D70B311D380A6E9FBA8FA5632814E158D9AAA07139751EAAC05
      CalendarSection.tsx: 2272F4F24FF792B3AFBFACC0499A56002B40E2A3413F1DEA2696BE18AC478641
      seo.ts: B495061FD1288F74D6C9F643690F0D9BC28FF9494314E48371BBDA5297683237
      seo-data.json: 149C2AC6E5FB17DB8E2400677C3BA0DD52F793A0AC50ACA62D5E9CCE2DE3EE5D
      generate-route-html.mjs: 25A7A3B7DA414FF569078592C7D12EEAC2959F79BBB0135435763669678EBF62
      sync-calendar.yml: E657ACD7F0278314B2582527AB5D06115892D5EE84F9CA89955669F8F2554AF4
  confirmed_findings:
    - STR-SEO-001
    - STR-SEO-002
    - STR-ARCH-008
    - STR-ARCH-009
    - SMELL-ARCH-004
  result: Google Calendar as the editorial source and a generated static artifact fit the product, but the current implementation provides shareable fragment state rather than independently indexable event pages and needs stable identity, history, content governance, and an explicit publication SLA before the SEO promise is complete.

latest_calendar_identity_implementation:
  id: FIX-2026-08-04-01
  requested_scope: Keep calendar source identity internal, keep technical identity fragments out of public event URLs, reject duplicate date-and-title canonicals safely, preserve existing canonicals, and retain global alias validation without changing UI, SEO policy, cron, Playwright, or generated-output tests.
  approved_criteria:
    - A UID maps consistently to an opaque 24-character hexadecimal sourceId, with exam-1@example.test mapping to aac691754e9f35832d4dfec4.
    - The sourceId remains in calendarEventRegistry.json as synchronization metadata and is not serialized into the public event model or URL.
    - Public event slugs use the event date and the slugified Google Calendar title; the synchronization code does not append inferred editorial context or a sourceId fragment.
    - The Google Calendar title remains under the federation president's editorial ownership; technical uniqueness is enforced by the synchronization layer without rewriting the title.
    - Two current events with the same date-derived canonical slug are treated as invalid input and abort synchronization before either destination is published.
    - Existing unique canonicals remain authoritative for known sourceIds; any canonical namespace conflict with retained history also aborts instead of generating a technical suffix.
    - An alias is removed from every event when it collides with any canonical or is claimed by more than one sourceId; no redirect is emitted for that ambiguous source.
    - A title-only or date-only update preserves the prior canonical and retains only globally unambiguous legacy aliases.
    - All-day DTEND remains stored as the exclusive ICS boundary.
    - Invalid feed parsing continues to fail before publication and leaves both destinations unchanged.
  baseline:
    commit: 7446a94a
    worktree: clean
  fingerprints:
    sync-calendar-events.mjs: 78DBB6B3B53F7CF15287F06EA7440BF2662144C3B8F01E744EA97469DBF35CF7
    calendar-sync.test.mjs: 562C2AF82362E5BCBC8401D138A425A7D9F542D25687DFC5A4D09B1450B10F3C
  pre_fix_evidence:
    - Initial identity correction: corepack pnpm run test:unit produced 6 passes and 7 failures covering canonical churn, feed-order collision ownership, and ambiguous aliases.
    - Revised no-technical-ID-in-URL policy: corepack pnpm run test:unit produced 11 passes and 1 failure because duplicate date and title still generated a suffixed URL instead of aborting.
  verification:
    - corepack pnpm run test:unit: 12 passed
    - corepack pnpm run typecheck: passed
    - corepack pnpm run build: passed, including SSR and generated routes
    - corepack pnpm run test:generated: 4 passed
    - generated URL audit: 18 event directories, zero sourceId-prefix leaks, 17 redirect rules, and zero conflicting redirect sources
    - git diff --check: passed
  excluded:
    - SEO implementation changes, visible calendar behavior, UI, cron, Playwright, fixture expansion, generated-output test changes, and production behavior
    - cross-file transactional write refactor
    - test-strategy findings outside calendar synchronization identity, collisions, ranges, invalid feeds, and aliases
  result: Calendar source identity remains stable and internal, public URLs contain no technical identity fragments, duplicate date-and-title canonicals fail without publication, unique prior canonicals are retained, and ambiguous aliases are omitted before generated redirects consume the synchronized data.

latest_implementation:
  id: FIX-2026-07-27-03
  requested_scope: Implement generated static event pages backed by Google Calendar while keeping event routes noindex until Gaceta approval.
  baseline:
    commit: 0729f5fc
    worktree: dirty with the prior review-state update plus this implementation
  implemented:
    - daily 09:00 UTC synchronization with a manual trigger
    - hashed UID registry, canonical slugs, aliases, historical preservation, future deletion, draft and recurrence policies, warnings, and guarded atomic output
    - prerendered event pages, temporary noindex canonicals, conditional Event JSON-LD, archive pagination, sitemap policy, and 301 redirect rules
    - canonical event-page navigation from Home and Calendar plus old-hash redirects
    - unit, generated-output, Playwright, CI, and synchronization verification coverage
  deferred:
    - official identity, canonical production domain, event indexing, Search Console, and post-launch metrics
    - registration CTA
    - expanded event editorial content for responsible parties, regulations, documents, results, and galleries
  result: Event pages are statically generated and shareable now, but remain excluded from indexing and the sitemap through the central event flag.

latest_style_review_session:
  id: REV-2026-07-27-03
  requested_scope: Evaluate whether the generated event-page styles agree with the rest of the site.
  actual_scope:
    targets:
      - src/app/components/EventPage.tsx
      - src/app/components/PastEventsSection.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/calendar/CalendarEventCard.tsx
      - src/app/components/affiliates/DojoCard.tsx
      - src/app/components/ui/MediaPageBanner.tsx
      - src/app/styles/shared.ts
      - owner-provided event-page screenshot
    axes: [ARCH, TAILWIND, RESPONSIVE]
    included:
      - banner geometry and treatment
      - semantic color tokens, surfaces, radii, shadows, buttons, typography, spacing, and central-content composition
      - comparison with Calendar and Affiliates as the closest internal-page references
    excluded:
      - Figma pixel fidelity because no current Figma node was supplied
      - SEO, copy quality, React behavior, and production deployment
      - exhaustive visual inspection of every site route
  baseline:
    commit: 711945b7
    worktree: clean
    fingerprints:
      EventPage.tsx: 0808380A58D6F38E04DC215087716E3179BEDE2F46FC6E3E981FE5A15F7D7803
      PastEventsSection.tsx: 181C1397B09EA8AD8E6B86E7C31D5B446AE1145FEEAD4734F6A20F8CDF820283
      CalendarSection.tsx: 368C23442C335EFF520A5FEBF1A2A7361E7B35C41A544214E9CF9809F235E72B
      AfiliadosSection.tsx: 6C9DA0D00B44CACC744CF12BA16977A541B606971B63C9F02A4565CAAFB932E7
      MediaPageBanner.tsx: 17514E30E5F9B558B9D7DC135AC37E3616ED108686AC99BDB6EF5BA1AAF2BE04
      shared.ts: 0EA18BC10AAF6F7C86D574CB3B3B384A2793D84ACB5D2315A630D5D336A98809
  confirmed_findings: [POL-ARCH-002]
  result: Event routes use the same visual system and shared primitives as the inspected site references; the remaining difference is a narrower, non-overlapping central-content composition.

latest_knip_review_session:
  id: REV-2026-07-30-01
  requested_scope: Validate the user-provided Knip 6.29.0 report.
  actual_scope:
    targets:
      - src/app/components/ui/ModalShell.tsx
      - src/entry-server.tsx
      - src/app/components/calendar/CalendarMonth.tsx
      - src/app/config/seo.ts
      - src/app/styles/shared.ts
      - src/app/utils/eventRoutes.ts
      - package.json build script
      - scripts/generate-route-html.mjs
    axes: [ARCH, TS, TAILWIND]
    included:
      - static reference tracing for every reported file, export, and exported type
      - build-entry and generated SSR consumer boundaries
      - distinction between dead declarations, excessive module visibility, and Knip false positives
    excluded:
      - implementation or deletion of reported declarations
      - runtime, visual, accessibility, performance, and SEO behavior
      - a fresh Knip execution
  baseline:
    commit: 711945b7
    worktree: dirty because .codex/review-state.md already contained the prior style-review update
  confirmed_findings: [SMELL-ARCH-005, POL-TW-007, POL-TS-001]
  invalidated_reports:
    - src/entry-server.tsx is the explicit Vite SSR entry in package.json.
    - getEventRedirects and getRouteSitemapImageUrls cross the generated dist-ssr boundary and are consumed by scripts/generate-route-html.mjs.
  result: Two declarations are dead, three declarations only expose unnecessary module API, and the SSR entry plus its two SEO exports are false positives caused by the generated build boundary.

latest_knip_cleanup:
  id: FIX-2026-07-30-01
  source_session: REV-2026-07-30-01
  baseline:
    commit: 711945b7
    worktree: dirty with the prior review-state update
  implemented:
    - removed the orphaned ModalShell component and unused badgeClass declaration
    - made CALENDAR_EVENTS_PER_PAGE, PreloadImage, and findEventBySlug module-private
    - configured src/entry-server.tsx as an explicit Knip entry while preserving getEventRedirects and getRouteSitemapImageUrls
    - kept Knip outside package.json and pnpm-lock.yaml; local use is through the globally installed Knip 6.29.0
    - preserved the pending-Gaceta identity, indexing, metadata, and canonical-domain policy unchanged
  resolved_findings: [SMELL-ARCH-005, POL-TW-007, POL-TS-001]
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed, including the SSR bundle and generated route HTML
    - npx.cmd --yes knip@6.29.0 passed with no findings or configuration hints
    - the globally installed knip command reports 6.29.0 and passes with no findings
    - git diff --check passed
  result: The confirmed dead code and excessive exports are removed, the SSR build boundary is modeled for Knip, and the preserved SSR exports remain operational.

latest_affiliates_layout_fix:
  id: FIX-2026-07-31-01
  requested_scope: Remove one redundant spacing block and align the contact and schedule text columns in the affiliate dojo cards.
  baseline:
    commit: c45ee08f
    worktree: clean
  resolved_ref: c20a8bcd
  implemented:
    - removed the explicit empty desktop spacer column from the contact and schedule grids
    - moved the right-side contact and schedule content into the resulting four-column grid
    - matched the schedule column proportions to the contact grid so both text columns share the same horizontal starts
    - preserved the compact-landscape two-column overrides and public dojo copy
  verification:
    source_fingerprint_sha256: 4FCABCC1A3B3013C603AF50D9A352596EBF4EE8F0620F8F4FAD60BC1A35297BF
    checks:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed, including the SSR bundle and generated route HTML
      - local /afiliados at 1366x768 kept document clientHeight and scrollHeight at 768 with no horizontal overflow
      - the first dojo card kept client and scroll dimensions equal at 558x440
      - contact and schedule grid columns both computed to 47.9972px 207.997px 47.9972px 158.224px
      - left text starts matched at 196.0795px and right text starts matched at 484.0625px
      - git diff --check passed
  limitation: Production deployment was not inspected; the evidence applies to the local implementation.
  result: Affiliate contact and schedule text columns are aligned without the redundant spacer or desktop overflow.

latest_design_metrics_review:
  id: REV-2026-07-31-02
  requested_scope: Re-review design metrics using the previous utility-cleanup criteria, including unnecessary classes, redundancies, and declarations duplicated from parent containers.
  actual_scope:
    targets:
      - src/app/App.tsx
      - src/app/components/**/*.tsx
      - src/app/styles/shared.ts
      - src/styles/globals.css
      - src/styles/index.css
      - generated dist/assets/index-DCiBSByF.css
    axes: [TAILWIND, ARCH]
    included:
      - spacing, sizing, alignment, radius, surface, and typography utility composition
      - same-element class conflicts and generated CSS precedence
      - inherited text declarations repeated by descendants
      - no-effect absolute sizing, aspect-ratio, centering, and base-typography utilities
      - repeated important overrides and legacy Figma theme scaffolding
    excluded:
      - Figma pixel fidelity because no current Figma node was supplied
      - responsive browser geometry, copy, SEO, accessibility, React behavior, and production deployment
  baseline:
    commit: 39386711
    worktree: clean
    target_inventory_fingerprint_sha256: FF1CF4BCEBFF578222ED4FC1E67CD98BA40B71539060326211CD4AB0C56E14D7
  confirmed_findings: [STR-TW-002, SMELL-TW-001, SMELL-TW-002, POL-TW-008, POL-ARCH-003]
  checks:
    - className inventory across src/app/**/*.tsx
    - shared-style consumer search across src/app
    - legacy token and custom-variant reference search across source
    - corepack pnpm run build passed, including SSR and generated route HTML
    - generated CSS places rounded-xl after rounded-lg and text-site-text after text-site-action
    - generated CSS still contains the legacy chart variables and dark theme block
  result: The current site has no critical design-metric regression in the reviewed scope, but one shared surface abstraction silently overrides caller radius and text intent, PageTitle is routinely countermanded with important utilities, legacy theme scaffolding remains, and a small set of no-effect utilities and wrappers survived the prior cleanup.

latest_design_metrics_cleanup:
  id: FIX-2026-07-31-02
  source_session: REV-2026-07-31-02
  baseline:
    commit: 39386711
    worktree: dirty only with the review-state update before implementation
  implemented:
    - split neutral surface metrics from panel radius and text tone, then used the neutral primitive for the Calendar empty state and NotFound actions
    - replaced PageTitle important overrides with explicit density, decoration, and casing variants
    - removed unused generic Figma/shadcn theme families, the dark-mode block, the dark custom variant, and generated chart/sidebar tokens while preserving consumed base tokens
    - removed the reviewed no-effect absolute sizing, thumbnail aspect ratio, centering, inherited text, and base paragraph-size utilities
    - removed the redundant Footer heading and contact wrappers
  resolved_findings: [STR-TW-002, SMELL-TW-001, SMELL-TW-002, POL-TW-008, POL-ARCH-003]
  verification:
    target_inventory_fingerprint_sha256: 29FC55201050DD80870189BC353FC27C7CF085B5B9EEBFDCA7AA9ABF5764715C
    checks:
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed, including SSR and generated route HTML
      - all ten Playwright tests passed across six routes and 360x800, 390x844, 768x1024, and 1366x768
      - generated CSS dropped from 49.67 kB to 47.49 kB and contains neither the dark block nor chart tokens
      - source searches found no important PageTitle padding overrides, legacy theme scaffold, thumbnail aspect residue, or panel radius/text conflicts
      - at 1366x768 the Calendar panel computed to 14px radius with the intended site text color, its banner picture matched the banner bounds, and both document and primary section had no vertical overflow
      - at 1366x768 the NotFound actions computed to 10px radius and rgb(22, 58, 99), with no document scroll
      - at the requested 390x844 override the Gallery title kept zero padding and its thumbnail, featured frame, and full overlay retained nonzero matching geometry without section overflow; the browser reported the documented 845px inner-height limitation
      - the Home hero picture matched its banner bounds and the Footer sections now directly contain [H2, P] and [H2, UL]
      - git diff --check passed
  result: All five findings from REV-2026-07-31-02 are implemented and verified locally without changing public copy, route behavior, or the established responsive metrics.

prior_external_feedback_session:
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
  id: FIX-2026-07-27-02
  source_session: legacy-v1
  baseline:
    commit: 32fa7f7d
    worktree: dirty
    fingerprints:
      ci.yml: 918E2FD063B49021ABD1A8EA37FBF658874621E70C4674C0BBB1EB6301BF7091
  resolved_findings:
    - STR-ARCH-001
  checks:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed outside the sandbox
    - git diff --check passed
    - workflow source uses read-only contents permission, frozen-lockfile installation, Node 22, and push and pull-request triggers

prior_resolution_2026_07_27_01:
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
  - id: COV-2026-08-01-03
    date: 2026-08-01
    baseline: 424a6218 with only review-state documentation dirty
    targets:
      - src/app/components/gallery/FeaturedImage.tsx:112
      - /galeria at requested 669x386 and nearby 844x390 landscape viewports
    axes: [TAILWIND, RESPONSIVE]
    included:
      - computed caption padding, content edge offsets, caption-row overlap, and horizontal document overflow
    excluded:
      - unrelated gallery behavior, other routes, Figma fidelity, deployed production output, and regenerated documentation screenshots
    depth: reviewed_and_locally_verified
    status: current
    evidence:
      - FeaturedImage.tsx fingerprint C514CD983B6A56248FE8F6C8B029EE9D32DCB2E07BAB0598BD09DB67773D9088
      - corepack pnpm run typecheck passed
      - corepack pnpm run build passed
      - computed caption padding and both content edge offsets were 10px at 669x386 and 844x390
      - neither caption row overlapped and no horizontal document overflow was present
      - owner confirmed the resulting layout is correct on 2026-08-01

  - id: COV-2026-08-01-02
    date: 2026-08-01
    baseline: ece88800 dirty only from prior review-state documentation
    targets:
      - src/app/components/gallery/FeaturedImage.tsx
      - /galeria at requested 669x386 and nearby 844x390 landscape viewports
    axes: [TAILWIND, RESPONSIVE]
    included:
      - computed padding, responsive variant precedence, and caption content offsets
    excluded:
      - implementation, typography, color, radius, other routes, Figma fidelity, and production behavior
    depth: reviewed_and_locally_verified
    status: stale
    stale_reason: FeaturedImage.tsx changed when POL-TW-009 was resolved; the resolution checks below supersede only the padding finding, not the full original review scope.
    evidence:
      - FeaturedImage.tsx:112 combines p-2.5 with land-sm:px-20 and land-sm:py-2
      - computed caption padding was 8px 80px at both landscape viewports
      - title left inset and tag right inset were both 80px from the featured frame
      - outer gallery inset remained 10px and the arrow layer used 12px horizontal padding

  - id: COV-2026-07-31-05
    date: 2026-07-31
    baseline: 23907229 dirty only from review-state documentation
    targets:
      - tests/e2e/events.spec.ts
      - tests/calendar-sync.test.mjs
      - tests/generated-output.test.mjs
      - tests/fixtures/calendar-events.ics
      - directly corresponding implementation paths
    axes: [ARCH, SEO, RESPONSIVE]
    included:
      - false-positive risk, assertion strength, test-name accuracy, oracle independence, data determinism, and local response semantics
    excluded:
      - implementation, exhaustive mutation testing, production responses, stakeholder acceptance, accessibility, performance, security, and visual fidelity
    depth: reviewed
    status: current
    evidence:
      - line-by-line inspection of all 21 automated cases and their fixture
      - direct comparison with synchronization, SEO generation, routing, sharing, archive, and not-found source
      - current event JSON-LD independently parsed successfully from dist
      - local preview returned 200 for both the event route and unknown event route
      - prior execution remained 7 of 7 unit, 4 of 4 generated, and 10 of 10 Playwright cases

  - id: COV-2026-07-31-04
    date: 2026-07-31
    baseline: 23907229 clean worktree before this review-state update
    targets:
      - playwright.config.ts
      - tests/e2e/events.spec.ts
      - tests/calendar-sync.test.mjs
      - tests/generated-output.test.mjs
      - .github/workflows/ci.yml
      - package.json test scripts
      - .agents review, implementation, and verification contracts
      - external technical-backlog.md
    axes: [ARCH, A11Y, RESPONSIVE]
    included:
      - test taxonomy, automated coverage, CI execution, browser and device projects, retries, reporters, traces, and requirement traceability
      - current user-interaction inventory used only to identify missing browser scenarios
    excluded:
      - implementation changes
      - full source-code review of the interaction components
      - production, real-device, screen-reader, performance, load, and security execution
    depth: reviewed_and_locally_verified
    status: current
    evidence:
      - Playwright 1.62.0 read from installed package metadata
      - corepack pnpm run typecheck passed
      - corepack pnpm run test:unit passed 7 of 7
      - corepack pnpm run build passed
      - corepack pnpm run test:generated passed 4 of 4
      - corepack pnpm run test:e2e passed 10 of 10
      - direct inspection of configuration, workflow, all three test files, project contracts, and technical backlog
      - official Playwright documentation for best practices, projects, visual comparisons, accessibility, and CI

  - id: COV-2026-07-31-02
    date: 2026-07-31
    baseline: 39386711 dirty worktree from FIX-2026-07-31-02
    targets:
      - src/app/components/AfiliadosSection.tsx
      - src/app/components/CalendarSection.tsx
      - src/app/components/EventPage.tsx
      - src/app/components/Footer.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/HeroSection.tsx
      - src/app/components/NotFoundSection.tsx
      - src/app/components/PageTitle.tsx
      - src/app/components/PastEventsSection.tsx
      - src/app/components/UpcomingEventsSection.tsx
      - src/app/components/gallery/FeaturedImage.tsx
      - src/app/components/gallery/GalleryThumbnails.tsx
      - src/app/components/ui/MediaPageBanner.tsx
      - src/app/styles/shared.ts
      - src/styles/globals.css
      - generated dist/assets/index-BvSSVbGA.css
    axes: [TAILWIND, ARCH, RESPONSIVE]
    included:
      - resolution of STR-TW-002, SMELL-TW-001, SMELL-TW-002, POL-TW-008, and POL-ARCH-003
      - generated CSS output and responsive geometry of affected consumers
      - desktop no-scroll invariant across all six routes
    excluded: [exact Figma fidelity, production deployment]
    depth: implemented_and_verified
    status: current
    fingerprint: 29FC55201050DD80870189BC353FC27C7CF085B5B9EEBFDCA7AA9ABF5764715C
    evidence:
      - typecheck and production/SSR build
      - ten Playwright tests and targeted computed-style browser checks
      - source residue searches and generated CSS inspection
      - git diff check

  - id: COV-2026-07-31-01
    date: 2026-07-31
    baseline: 39386711 clean worktree
    targets:
      - src/app/App.tsx
      - src/app/components/**/*.tsx
      - src/app/styles/shared.ts
      - src/styles/globals.css
      - src/styles/index.css
      - generated dist/assets/index-DCiBSByF.css
    axes: [TAILWIND, ARCH]
    included:
      - spacing, sizing, alignment, radius, surface, and typography utility composition
      - parent-to-child text inheritance
      - same-element conflicts and generated CSS precedence
      - no-effect utilities, repeated important overrides, and excess presentational nesting
      - legacy theme and dark-mode scaffolding
    excluded:
      - exact Figma fidelity
      - responsive browser geometry and runtime interaction
      - color contrast, semantics, SEO, React hook behavior, and performance
    depth: reviewed
    status: stale
    stale_reason: The reviewed targets changed in FIX-2026-07-31-02; COV-2026-07-31-02 records the implemented and verified replacement coverage.
    fingerprint: FF1CF4BCEBFF578222ED4FC1E67CD98BA40B71539060326211CD4AB0C56E14D7
    evidence:
      - rg className inventory and targeted utility searches over all matched source targets
      - direct inspection of every matched component and shared/global style source
      - production and SSR build passed
      - generated CSS precedence indices recorded for radius and text-color collisions

  - id: COV-2026-07-30-01
    date: 2026-07-30
    baseline: 711945b7 dirty worktree
    targets:
      - the eight Knip 6.29.0 reports supplied by the user
      - package.json:7
      - scripts/generate-route-html.mjs:5-11,129,146
    axes: [ARCH, TS, TAILWIND]
    included: [static references, module visibility, build-entry boundaries]
    excluded: [implementation, runtime behavior, visual behavior, fresh Knip execution]
    depth: reviewed
    evidence:
      - rg reference search across tracked source, scripts, tests, package metadata, and documentation
      - direct inspection of all reported source declarations
      - package.json identifies src/entry-server.tsx as the Vite SSR entry
      - generate-route-html.mjs imports the two SEO helpers from generated dist-ssr/entry-server.js

  - id: COV-2026-07-27-04
    date: 2026-07-27
    baseline: 0729f5fc dirty worktree from FIX-2026-07-27-03
    targets:
      - scripts/sync-calendar-events.mjs
      - src/app/data/calendarEventRegistry.json
      - src/app/data/calendarEvents.ts
      - src/app/config/events.ts
      - src/app/config/seo.ts
      - src/app/components/EventPage.tsx
      - src/app/components/PastEventsSection.tsx
      - src/app/components/CalendarSection.tsx
      - scripts/generate-route-html.mjs
      - .github/workflows/ci.yml
      - .github/workflows/sync-calendar.yml
      - tests/calendar-sync.test.mjs
      - tests/generated-output.test.mjs
      - tests/e2e/events.spec.ts
    axes: [ARCH, SEO, REACT, A11Y, PERF]
    depth: implemented_and_verified
    evidence:
      - seven calendar synchronization unit tests pass
      - TypeScript strict check passes
      - production and SSR builds generate twelve event documents, the archive, sitemap, 404, and redirect rules
      - four generated-output assertions cover canonical/noindex, conditional Event JSON-LD, sitemap exclusion, archive, and 301 aliases
      - ten Playwright tests cover direct navigation, old-hash redirects, event-page links from Home and Calendar, sharing, full descriptions, archive, 404, and six routes at 360x800, 390x844, 768x1024, and 1366x768
      - all six routes keep navbar, main content, and footer visible without document scroll at 1366x768
    limitations:
      - production deployment and a real scheduled synchronization are not verified locally
      - no historical event exists in the current generated dataset, so multi-page archive generation is unit- and source-covered rather than exercised by current production content

  - id: COV-2026-07-27-03
    targets:
      - calendar generation, route generation, SEO configuration, and workflow files recorded in REV-2026-07-27-02
      - generated dist/calendario/index.html and dist/sitemap.xml
      - external ADR 002 and calendar operation documentation
    axes: [ARCH, SEO]
    included:
      - source-to-build ownership boundary
      - publication triggers and latency
      - event field contract and current generated-data completeness
      - event identity and future-only selection
      - fragment URL, canonical metadata, prerendered route, sitemap, and Event structured-data readiness
      - provisional identity and domain decision gate
      - realistic measurement categories
    excluded:
      - event-page implementation and design
      - legal advice
      - production Search Console, analytics, and rich-result results
      - exhaustive recurrence and timezone interoperability
    depth: reviewed
    evidence:
      - source inspection found event shares and direct opens using /calendario/ hash fragments
      - generated calendar HTML has one /calendario/ canonical, CollectionPage JSON-LD, and no event-specific head
      - generated sitemap contains four static route URLs and no event URLs
      - sync source derives ids from mutable title and date, ignores UID, and emits only selected future events
      - current generated data contains 12 events; location is present on 10, summary on 11, and type, organizer, and infoUrl on 0
      - workflow source runs weekly or manually and requires repository access for manual dispatch
      - official Google Event documentation requires one unique leaf URL focused on each event and does not guarantee rich-result appearance
    baseline:
      commit: 0729f5fc
      worktree: clean
      fingerprint: per-file SHA-256 values recorded in REV-2026-07-27-02
    status: current
    result: The static generated-content architecture is proportionate, while five gaps separate the current calendar experience from the promised owner-operated, indexable event-content system.

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
  - id: STR-ARCH-015
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: scripts/sync-calendar-events.mjs:424
    problem: Historical events spread the current Calendar record and restore only identity fields, so time, location, description, type, organizer, URL, and timezone continue changing automatically after archival.
    fix: Treat the entire published historical event as an immutable snapshot; compare the current normalized record against it and preserve every published field until a separate explicit correction operation is approved.
    cost_of_deferring: Editing or deleting past Calendar documentation can silently rewrite the public historical record.
    evidence:
      - mergeRegistry returns currentEvent before overriding only sourceId, slug, title, date, archiveEligibleAt, aliases, and historical
      - direct mergeRegistry reproduction replaced historical startTime, endTime, location, summary, and eventType
    introduced_in: REV-2026-08-10-01

  - id: STR-ARCH-016
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: scripts/sync-calendar-events.mjs:599
    problem: The synchronization neither detects nor reports field-level changes or disappearance of frozen historical events, and the workflow automatically commits any resulting data changes.
    fix: Produce a deterministic historical-change report, preserve the frozen snapshot, and route proposed corrections through a separate manual approval command that names the event and accepted fields.
    cost_of_deferring: There is no reliable confirmation boundary between an accidental Calendar edit and a published historical correction.
    evidence:
      - mergeRegistry returns no warnings or change set
      - missing historical events are retained silently
      - the workflow commits synchronization paths whenever they differ
    introduced_in: REV-2026-08-10-01

  - id: SMELL-ARCH-011
    level: SMELL
    axis: ARCH
    status: open
    target: tests/calendar-sync.test.mjs historical freeze coverage
    problem: The historical-freeze test asserts only slug, title, date, archiveEligibleAt, and aliases, allowing all remaining public fields to mutate while the suite stays green.
    fix: Add owner-approved Given/When/Then cases covering every persisted public field, event removal, album metadata changes, warning content, and the manual-confirmation path.
    cost_of_deferring: Passing unit tests continue to certify a narrower contract than the owner requires.
    evidence:
      - corepack pnpm run test:unit passed all 33 tests while the direct full-field reproduction demonstrated mutation
    introduced_in: REV-2026-08-10-01

  - id: STR-ARCH-011
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: AI-generated automated test suite and feature acceptance criteria
    problem: The same agent produced much of the implementation and its tests without an independently owner-approved acceptance oracle, so internally consistent mistakes can pass together.
    fix: Translate every high-risk test into owner-readable Given/When/Then criteria, obtain explicit approval, and then mutation-check that breaking the required behavior makes the test fail.
    cost_of_deferring: Passing CI can be mistaken for product approval even when both code and assertions encode the same incorrect assumption.
    evidence:
      - owner states the generated tests have not been reviewed
      - tests contain no stable requirement IDs linked to an owner-approved specification
      - multiple test names make claims stronger than their assertions
    partial_resolution: The owner approved the revised calendar identity boundary on 2026-08-04: Google Calendar titles remain editorial input, sourceId remains internal metadata, public URLs use date and title, and duplicate canonicals abort publication. Relevant regression tests failed before each implementation stage and passed afterward. Acceptance criteria and independent checks for the rest of the generated test strategy remain open.
    introduced_in: REV-2026-07-31-05

  - id: STR-ARCH-012
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: scripts/sync-calendar-events.mjs writeAtomically
    problem: The registry and generated TypeScript file are committed by two sequential renames, so failure of the second rename after the first succeeds can publish mismatched versions.
    fix: Design a separate two-file transaction that stages both outputs, preserves recoverable backups, rolls back the first replacement if either commit rename fails, and cleans up only after both replacements succeed; account for Windows file-lock and replacement behavior as well as POSIX rename semantics.
    cost_of_deferring: A filesystem error, file lock, or interrupted process during the commit phase can leave calendar identity data inconsistent with the generated application data until the next successful synchronization.
    evidence:
      - writeAtomically writes all temporary files before publication but then renames each temporary path to its destination sequentially
      - the catch block deletes remaining temporary files but does not restore a destination already replaced by an earlier successful rename
      - Windows can reject a rename when the destination is locked, while POSIX atomic rename of one path does not make two destination replacements transactional
    reproducible_test: Inject or wrap rename so the second destination replacement fails after the first succeeds, seed both destinations with distinct prior contents, and assert that rollback restores both originals and removes temporary and backup files on Windows and Linux.
    scope_note: No transactional refactor was included in FIX-2026-08-04-01 because pre-publication canonical validation and alias resolution do not require it.
    introduced_in: FIX-2026-08-03-01

  - id: SMELL-ARCH-008
    level: SMELL
    axis: ARCH
    status: open
    target: tests/generated-output.test.mjs and tests/e2e/events.spec.ts
    problem: Several remaining names overclaim their assertions, including valid JSON-LD without JSON parsing, prerendering with JavaScript enabled, complete description from one excerpt, and historical archive from heading and page count only.
    fix: Rename tests to their actual scope or strengthen assertions to prove the named behavior with exact outputs, parsed structures, disabled-JavaScript or raw-response checks, and representative archive entries.
    cost_of_deferring: Reports will communicate coverage that the suite cannot actually guarantee.
    evidence:
      - generated-output.test.mjs:9-23 only regex-matches Event JSON-LD
      - events.spec.ts:5-20 loads the browser normally
      - events.spec.ts:54-77 checks one description excerpt and absence of a button
      - events.spec.ts:80-91 checks archive heading/page count and not-found copy
      - current dist JSON-LD parses successfully, but that parse is absent from the automated test
    partial_resolution: calendar-sync.test.mjs now evaluates the same UID twice, asserts the exact expected sourceId, proves it is absent from the public event model and URL, and uses narrowly named tests for canonical preservation, collision rejection, aliases, all-day ranges, and invalid feeds.
    introduced_in: REV-2026-07-31-05

  - id: SMELL-ARCH-009
    level: SMELL
    axis: ARCH
    status: open
    target: package.json test:generated and tests/generated-output.test.mjs
    problem: The generated-output command reads the existing dist directory without building it, so it can pass against stale artifacts when run directly outside the ordered CI workflow.
    fix: Encode freshness in the command, for example with a dedicated pretest build/generation step, or test the generator in an isolated temporary output directory.
    cost_of_deferring: Local green results may describe an older build rather than the current source tree.
    evidence:
      - package.json test:generated invokes only node --test
      - generated-output.test.mjs reads ../dist directly
      - ci.yml avoids the issue only because build precedes test:generated
    introduced_in: REV-2026-07-31-05

  - id: SMELL-SEO-005
    level: SMELL
    axis: SEO
    status: open
    target: tests/e2e/events.spec.ts custom not-found scenario
    problem: The test proves that custom not-found copy is visible but does not verify hosting response semantics; local Vite preview returns 200 while the currently deployed Pages route correctly returns 404.
    fix: Keep the UI assertion and add a separate deployment-level response-status smoke check after deployment rather than expecting Vite Preview to emulate host 404 behavior.
    cost_of_deferring: The current deployment is correct, but a future hosting or redirect configuration regression would not be detected by the local Playwright suite.
    evidence:
      - events.spec.ts:89-90 asserts only visible text
      - http://127.0.0.1:4173/eventos/ruta-inexistente/ returned HTTP 200 during this review
      - scripts/generate-route-html.mjs generates 404.html but local preview does not prove host response semantics
      - https://fak-kendo.pages.dev/eventos/ruta-inexistente/ returned HTTP 404 on 2026-07-31
    introduced_in: REV-2026-07-31-05

  - id: STR-RESP-002
    level: STRUCTURAL
    axis: RESPONSIVE
    status: open
    target: tests/e2e/events.spec.ts responsive route matrix
    problem: The route matrix proves that navigation, main, and footer nodes exist and checks document overflow at desktop, but does not fully encode the required primary-section no-scroll invariant or horizontal-overflow and mobile reachability contracts.
    fix: Add reusable viewport-contract assertions for document and primary-section geometry, horizontal overflow, and the intended footer visibility or reachability rule at each supported viewport.
    cost_of_deferring: Layout regressions can pass CI while violating the project's defining desktop and responsive acceptance criteria.
    evidence:
      - tests/e2e/events.spec.ts route matrix
      - .agents/verification.md responsive matrix and 1366x768 invariant
      - current 10 of 10 Playwright cases pass
    introduced_in: REV-2026-07-31-04

  - id: STR-ARCH-010
    level: STRUCTURAL
    axis: ARCH
    status: open
    target: feature specifications, automated suites, and external technical-backlog.md
    problem: Requirements do not have stable IDs mapped to acceptance scenarios and automated evidence, while the external backlog still states that Playwright and CI are absent.
    fix: Maintain a lightweight requirement-to-test matrix and reconcile each feature spec, task, test ID, and current CI evidence when behavior changes.
    cost_of_deferring: Code, tests, and planning documents can disagree without a reliable way to prove which product requirement is actually complete.
    evidence:
      - no per-feature requirement IDs or test mapping found in the inspected contracts and tests
      - external technical-backlog.md dated 2026-07-13 describes the missing harness and CI
      - playwright.config.ts and .github/workflows/ci.yml show both now exist
    introduced_in: REV-2026-07-31-04

  - id: SMELL-ARCH-006
    level: SMELL
    axis: ARCH
    status: open
    target: tests/e2e/events.spec.ts event-route scenarios
    problem: Browser scenarios depend on a mutable generated event slug and title and sometimes select the first matching link, coupling behavior verification to current calendar content.
    fix: Use a deterministic calendar fixture or stable seeded test event and scope locators to the intended card and acceptance condition.
    cost_of_deferring: Legitimate editorial calendar changes can produce false failures or let ambiguous UI matches hide regressions.
    evidence:
      - hard-coded Examen event route and heading in tests/e2e/events.spec.ts
      - first() used for duplicate event-detail link matches
    introduced_in: REV-2026-07-31-04

  - id: SMELL-A11Y-002
    level: SMELL
    axis: A11Y
    status: open
    target: tests/e2e/events.spec.ts and interactive route behavior
    problem: Role-based locators provide useful semantic evidence, but the suite does not exercise keyboard focus workflows, modal focus containment, or automated accessibility scans.
    fix: Add focused keyboard tests for navbar and gallery modal behavior plus a small axe scan on stable route states, retaining manual screen-reader testing for final verification.
    cost_of_deferring: Keyboard and detectable accessibility regressions remain invisible to CI until a manual review finds them.
    evidence:
      - current Playwright suite has no keyboard or axe assertions
      - PEND-A11Y-001 retains real screen-reader verification
    introduced_in: REV-2026-07-31-04

  - id: SMELL-ARCH-007
    level: SMELL
    axis: ARCH
    status: open
    target: playwright.config.ts and .github/workflows/ci.yml
    problem: CI runs only Chromium with the GitHub reporter and does not upload a Playwright HTML report or trace artifacts, limiting portability evidence and failure diagnosis.
    fix: Keep the full suite economical, add a Firefox/WebKit smoke project where justified, use one CI worker for stability, and upload HTML and test-results artifacts on failure.
    cost_of_deferring: Browser-specific defects and intermittent CI failures will be slower to reproduce and diagnose.
    evidence:
      - playwright.config.ts defines no projects or CI worker limit and uses trace on first retry
      - ci.yml installs only Chromium and has no artifact-upload step
      - official Playwright projects and CI guidance
    introduced_in: REV-2026-07-31-04

  - id: STR-SEO-002
    level: STRUCTURAL
    axis: SEO
    status: open
    target: src/app/config/seo-data.json and canonical domain policy
    problem: The public indexable configuration declares a SportsOrganization with an official federation name and "Sitio oficial" copy while the owner reports that Gaceta publication and authorization to use official names are still pending.
    fix: Obtain an explicit client-approved interim publication policy—approved provisional identity or staging noindex—and perform one controlled canonical-name and domain cutover with redirects after officialization.
    cost_of_deferring: Search engines can associate authority with a provisional entity and pages.dev URLs, creating reputational ambiguity and avoidable migration work.
    evidence:
      - user-provided business constraint in REV-2026-07-27-02
      - seo-data.json:2-4 publishes pages.dev, the federation name, and Sitio oficial
      - generated calendar JSON-LD identifies the entity as SportsOrganization
      - robots.txt allows crawling and references the public sitemap
    introduced_in: REV-2026-07-27-02

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

  - id: POL-ARCH-002
    level: POLISH
    axis: ARCH
    status: open
    target: src/app/components/EventPage.tsx and src/app/components/PastEventsSection.tsx
    problem: Event routes use a max-w-5xl panel in normal flow, with the detail page vertically centered, while Calendar and Affiliates use max-w-6xl content that overlaps the media banner.
    fix: If strict visual parity is desired, reuse the internal-page overlap wrapper and max-w-6xl width while retaining the event-specific two-column content.
    cost_of_deferring: The pages remain usable and on-brand, but retain visibly more whitespace and feel slightly separate from the established internal-page family.
    evidence:
      - EventPage.tsx:93-95 uses tall-md:items-center and max-w-5xl
      - PastEventsSection.tsx:54-55 uses normal flow and max-w-5xl
      - CalendarSection.tsx:282-284 uses negative overlap and md:max-w-6xl
      - AfiliadosSection.tsx:85-86 uses the same overlap pattern and md:max-w-6xl
      - owner-provided desktop screenshot shows the narrower centered event panel
    introduced_in: REV-2026-07-27-03

resolved_findings:
  - id: POL-TW-009
    status: resolved
    resolved_at: 2026-08-01
    summary: The compact-landscape caption now retains the site's 10px spacing rhythm on every side.
    resolution:
      resolved_ref: commit 424a6218, FeaturedImage.tsx C514CD983B6A56248FE8F6C8B029EE9D32DCB2E07BAB0598BD09DB67773D9088
      checks:
        - corepack pnpm run typecheck passed
        - corepack pnpm run build passed
        - computed caption padding was 10px at 669x386 and 844x390
        - title and tag measured 10px from the respective featured-frame edges at both viewports
        - neither caption row overlapped and no horizontal document overflow was present
        - owner approved the visual result on 2026-08-01

  - id: STR-TW-002
    status: resolved
    resolved_at: 2026-07-31
    summary: Neutral surface metrics are separated from panel radius and tone, and Calendar empty-state and NotFound action consumers no longer emit conflicting radius or text classes.
    resolution:
      resolved_ref: 39386711 dirty worktree from FIX-2026-07-31-02
      checks: [typecheck, production and SSR build, generated CSS inspection, NotFound and Calendar computed styles]

  - id: SMELL-TW-001
    status: resolved
    resolved_at: 2026-07-31
    summary: PageTitle exposes density, decoration, and casing variants; all three important padding overrides and the hero underline/casing overrides were removed.
    resolution:
      resolved_ref: 39386711 dirty worktree from FIX-2026-07-31-02
      checks: [typecheck, build, source search, Home, Gallery, Calendar, and NotFound computed styles]

  - id: SMELL-TW-002
    status: resolved
    resolved_at: 2026-07-31
    summary: Unused generic theme families, dark-mode scaffolding, and chart/sidebar tokens were removed while consumed base and site tokens were preserved.
    resolution:
      resolved_ref: 39386711 dirty worktree from FIX-2026-07-31-02
      checks: [build, source search, generated CSS inspection, responsive Playwright suite]

  - id: POL-TW-008
    status: resolved
    resolved_at: 2026-07-31
    summary: The reviewed no-effect absolute sizing, thumbnail aspect ratio, centering, inherited color, and paragraph-size utilities were removed with geometry preserved.
    resolution:
      resolved_ref: 39386711 dirty worktree from FIX-2026-07-31-02
      checks: [source search, build, responsive Playwright suite, targeted banner, overlay, thumbnail, and overflow measurements]

  - id: POL-ARCH-003
    status: resolved
    resolved_at: 2026-07-31
    summary: Footer purpose and contact content now render directly under their sections without the three presentational wrapper divs.
    resolution:
      resolved_ref: 39386711 dirty worktree from FIX-2026-07-31-02
      checks: [typecheck, build, responsive Playwright suite, computed Footer child structure]

  - id: SMELL-ARCH-005
    status: resolved
    resolved_at: 2026-07-30
    summary: The orphaned ModalShell component was deleted while the Lightbox consumers of useModalBehavior and ModalControls were preserved.
    resolution:
      resolved_ref: 711945b7 dirty worktree from FIX-2026-07-30-01
      checks: [typecheck, production and SSR build, Knip 6.29.0, git diff check]

  - id: POL-TW-007
    status: resolved
    resolved_at: 2026-07-30
    summary: The unused badgeClass Tailwind class group was removed from shared styles.
    resolution:
      resolved_ref: 711945b7 dirty worktree from FIX-2026-07-30-01
      checks: [typecheck, production build, Knip 6.29.0]

  - id: POL-TS-001
    status: resolved
    resolved_at: 2026-07-30
    summary: CALENDAR_EVENTS_PER_PAGE, PreloadImage, and findEventBySlug are now module-private.
    resolution:
      resolved_ref: 711945b7 dirty worktree from FIX-2026-07-30-01
      checks: [typecheck, production and SSR build, Knip 6.29.0]

  - id: STR-SEO-001
    status: resolved
    resolved_at: 2026-07-27
    summary: Every generated event has a dedicated prerendered canonical page with conditional Event JSON-LD, and Home and Calendar link to it directly; legacy calendar hashes redirect to the canonical page.
    resolution:
      resolved_ref: 0729f5fc dirty worktree recorded in FIX-2026-07-27-03
      checks: [unit tests, typecheck, build, generated-output tests, Playwright direct route and hash tests]
    limitation: Event routes remain intentionally noindex and excluded from the sitemap until official approval.

  - id: STR-ARCH-008
    status: resolved
    resolved_at: 2026-07-27
    summary: Synchronization uses an opaque truncated SHA-256 UID digest for identity, preserves canonical and previous slugs, deletes missing future events, and retains completed events indefinitely.
    resolution:
      resolved_ref: 0729f5fc dirty worktree recorded in FIX-2026-07-27-03
      checks: [UID unit test, alias unit test, future-deletion unit test, historical-preservation unit test, generated 301 test]

  - id: STR-ARCH-009
    status: resolved
    resolved_at: 2026-07-27
    summary: Calendar authoring now has explicit draft, recurrence, incomplete-content, timed cross-date, deletion, placeholder, and structured-data eligibility policies.
    resolution:
      resolved_ref: 0729f5fc dirty worktree recorded in FIX-2026-07-27-03
      checks: [fixture-based unit tests, Action summary implementation, conditional Event JSON-LD test]
    limitation: Registration CTA and expanded editorial fields remain research items.

  - id: STR-ARCH-003
    status: resolved
    resolved_at: 2026-07-27
    summary: Playwright now covers critical direct routing, hash/modal behavior, event links, sharing, dialogs, archive, 404, and the responsive route matrix.
    resolution:
      resolved_ref: 0729f5fc dirty worktree recorded in FIX-2026-07-27-03
      checks: [nine local Playwright tests]

  - id: SMELL-ARCH-004
    status: resolved
    resolved_at: 2026-07-27
    summary: Calendar synchronization now runs daily at 09:00 UTC with an accepted publication latency of up to 24 hours and retains manual workflow dispatch.
    resolution:
      resolved_ref: 0729f5fc dirty worktree recorded in FIX-2026-07-27-03
      checks: [workflow source inspection]

  - id: STR-ARCH-001
    status: resolved
    resolved_at: 2026-07-27
    summary: Ordinary pushes and pull requests now run frozen dependency installation, TypeScript validation, and the complete production build in GitHub Actions.
    resolution:
      resolved_ref: 32fa7f7d dirty worktree fingerprint recorded in FIX-2026-07-27-02
      checks: [typecheck, build, workflow source inspection]
    hosted_verification: CI run 1 passed on main for commit 0729f5f in 24 seconds, as shown in the owner-provided GitHub Actions evidence.

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

current_review:
  id: REV-2026-08-04-01
  requested_scope: Critique the current project while respecting its documented constraints.
  actual_scope:
    targets:
      - src/app/App.tsx
      - src/app/routeRegistry.client.tsx
      - src/app/config/i18n.tsx
      - src/app/config/seo.ts
      - src/app/components/CalendarSection.tsx
      - src/app/components/GallerySection.tsx
      - src/app/components/AfiliadosSection.tsx
      - src/styles/globals.css
      - tests/e2e/design-contract.ts
      - tests/e2e/geometry-contract.spec.ts
    axes: [ARCH, REACT, TS, TAILWIND, A11Y, PERF, RESPONSIVE, SEO]
    included:
      - route-shell boundaries, localization ownership, component responsibility, duplicated responsive composition, strict TypeScript configuration, route lazy loading, and documented geometry-test strategy
    excluded:
      - exhaustive repository-wide coverage, visual fidelity, production behavior, live assistive technology, field performance, external SEO services, and application-code changes
  baseline:
    commit: 5faf69f7
    worktree: clean before this review-state update
  confirmed_findings: [STR-ARCH-008, STR-REACT-002, SMELL-ARCH-003]
  verification:
    - corepack pnpm run typecheck passed
    - corepack pnpm run test:unit passed with 12 tests
    - corepack pnpm run test:generated passed with 5 tests
  result: No reproducible CRITICAL was found in the inspected sample; three maintainability risks were confirmed without using the obsolete Figma as evidence.

latest_calendar_refactor:
  id: FIX-2026-08-04-05
  status: approved_by_owner
  requested_scope: Refactor CalendarSection without changing public behavior, remove all legacy URL behavior, centralize stable bilingual interface copy, and document the resulting system.
  implemented:
    - CalendarSection now composes useCalendarNavigation and useCalendarEventSharing.
    - Mobile navigation moves one month, desktop navigation moves two, swipe uses the same actions, and changing month resets internal pagination.
    - Calendar sharing preserves Web Share, clipboard, WhatsApp fallback, 2.2-second copied feedback, and timer cleanup.
    - Event routing now accepts only the current canonical slug; aliases, previous-slug retention, old hash redirects, and generated redirect output were removed.
    - Stable UI copy is centralized in the typed COPY contract; localized event, dojo, and gallery records remain in their existing data sources.
    - External architecture, calendar operation, and technical backlog documentation was reconciled with the implementation.
  verification:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed, including SSR and generated routes
    - calendar synchronization tests passed with 10 tests
    - generated-output tests passed with 4 tests
    - complete Playwright suite passed with 93 tests
    - approved Windows visual suite passed with 28 comparisons and no baseline regeneration
    - git diff --check passed
  owner_decisions:
    - The owner approved the calendar intervention on 2026-08-04.
    - The owner accepted the current accessibility behavior; no execution with NVDA, JAWS, or VoiceOver is claimed.
    - The Calendar and Affiliates SPA composition is an accepted reuse decision and is not queued for another abstraction.
    - No commit is created until the owner requests the project-level commit.

open_findings:
  - id: STR-ARCH-008
    level: STRUCTURAL
    axis: ARCH
    status: resolved
    target: src/app/components and src/app/config/i18n.tsx
    problem: Localized public copy is split between the central COPY object and repeated component-level language conditionals.
    fix: Move stable interface and public copy behind typed translation keys while leaving event and dojo records in their existing localized data sources.
    cost_of_deferring: Every copy revision or additional locale will require coordinated edits across presentation components and increases inconsistency risk.
    evidence: [src/app/config/i18n.tsx:44, src/app/components/CalendarSection.tsx:43, src/app/components/AfiliadosSection.tsx:25, src/app/components/EventPage.tsx:110]
    introduced_in: REV-2026-08-04-01
    resolution:
      resolved_at: 2026-08-04
      resolved_ref: uncommitted worktree based on 5faf69f7
      summary: Stable Spanish and English interface copy now lives in the typed COPY contract by domain; components consume translation keys while routes, formatting logic, and localized event, dojo, and gallery records remain in their existing sources.
      checks: [typecheck, production and SSR build, calendar synchronization tests, generated-output tests, complete Playwright suite with 93 tests, approved visual suite with 28 comparisons, git diff check]
  - id: STR-REACT-002
    level: STRUCTURAL
    axis: REACT
    status: resolved
    target: src/app/components/CalendarSection.tsx
    problem: CalendarSection owns legacy URL migration, responsive grouping, clipboard and share fallbacks, swipe recognition, pagination state, formatting, and page composition in one component.
    fix: Extract behavior-focused hooks for calendar navigation and event sharing while keeping CalendarSection as the route composition boundary.
    cost_of_deferring: Changes to navigation, sharing, or breakpoints remain coupled and require reasoning through a 376-line stateful component.
    evidence: [src/app/components/CalendarSection.tsx:25, src/app/components/CalendarSection.tsx:62, src/app/components/CalendarSection.tsx:93, src/app/components/CalendarSection.tsx:119, src/app/components/CalendarSection.tsx:142, src/app/components/CalendarSection.tsx:188, src/app/components/CalendarSection.tsx:242]
    introduced_in: REV-2026-08-04-01
    resolution:
      resolved_at: 2026-08-04
      resolved_ref: uncommitted worktree based on 5faf69f7
      summary: CalendarSection composes typed hooks for navigation, swipe, and event sharing; the owner subsequently removed all alias, old-hash redirect, prior-slug preservation, and generated event-redirect behavior in favor of current canonical routes only.
      checks: [typecheck, production and SSR build, calendar synchronization tests, generated-output tests, directed calendar behavior tests, complete Playwright suite, approved visual comparisons]
  - id: SMELL-ARCH-003
    level: SMELL
    axis: ARCH
    status: accepted_by_owner
    target: src/app/components/CalendarSection.tsx and src/app/components/AfiliadosSection.tsx
    problem: Calendar and Affiliates duplicate the same long banner-overlap and responsive-positioning utility chain.
    fix: Reuse one non-visual layout primitive or exported class for the approved media-page content layer, preserving the exact current classes and geometry.
    cost_of_deferring: A future breakpoint fix can update one route but miss the other, repeating the variant-precedence regression already recorded in project history.
    evidence: [src/app/components/CalendarSection.tsx:293, src/app/components/AfiliadosSection.tsx:90, FIX-2026-08-04-02]
    introduced_in: REV-2026-08-04-01
    resolution:
      resolved_at: 2026-08-04
      resolved_ref: owner architecture decision; no code change
      summary: The owner confirmed that the current Calendar and Affiliates composition follows the intended SPA component-reuse logic. It remains unchanged unless a reproducible regression or additional consumer justifies revisiting it.

coverage:
  - id: COV-2026-08-04-01
    target: the ten files listed in REV-2026-08-04-01 actual_scope.targets
    axes: [ARCH, REACT, TS, TAILWIND, A11Y, PERF, RESPONSIVE, SEO]
    included: [the bounded concerns listed in the session]
    excluded: [exhaustive per-file axis coverage and all excluded session concerns]
    depth: reviewed
    evidence: [source inspection, rg inventories, typecheck, unit tests, generated-output tests]
    baseline: { commit: 5faf69f7, worktree: clean before state update }
    status: current

pending_reviews:
  - id: PEND-ARCH-005
    target: recreate Figma from the approved current product
    axes: [ARCH, RESPONSIVE]
    reason: The original Figma Make design is obsolete. A new file must cover current routes, reference viewports, tokens, components, and interactive states, then receive explicit owner approval before it can establish fidelity or drift.
  - id: PEND-SEO-003
    target: client-approved provisional name, official-name cutover, canonical domain, and redirect policy
    axes: [SEO, ARCH]
    reason: The owner confirmed that Gaceta publication is pending, but the exact legally approved interim public identity and final domain are not yet available.
  - id: PEND-SEO-004
    target: production event-page indexing, Event rich results, impressions, clicks, and conversion baselines
    axes: [SEO, PERF]
    reason: Dedicated event pages now exist behind temporary noindex, but Gaceta approval, production indexing, Search Console, and analytics data remain unavailable.
  - id: PEND-ARCH-003
    target: event registration CTA and participation workflow
    axes: [ARCH]
    reason: The first event-page version intentionally excludes registration; requirements, destination, ownership, and eligibility rules need client research.
  - id: PEND-ARCH-004
    target: expanded event editorial page
    axes: [ARCH]
    reason: Responsible parties, regulations, documents, results, and per-event galleries were explicitly deferred from the first generated-page version.
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

latest_spa_mobile_review:
  id: REV-2026-08-04-02
  requested_scope: Critique the project as an SPA and mobile-first implementation, then identify structural weaknesses.
  actual_scope:
    targets: [src/app/App.tsx, src/main.tsx, src/app/routeRegistry.client.tsx, src/app/components/**/*.tsx, src/app/hooks/*.ts, src/styles/globals.css, responsive Playwright inventory]
    axes: [ARCH, REACT, A11Y, PERF, RESPONSIVE]
    included: [SPA navigation and hydration, route splitting, viewport and orientation strategy, content reachability, touch targets, modal isolation, responsive test matrix]
    excluded: [SEO depth, copy accuracy, visual fidelity, obsolete Figma comparison, live assistive technology, field performance, generator internals]
  baseline: { commit: a394c725, worktree: clean before this state update }
  confirmed_findings: [CRIT-RESP-001, STR-RESP-003, STR-ARCH-013, SMELL-A11Y-003, SMELL-A11Y-004]
  evidence:
    - inspected the declared source inventory and recorded responsive utility patterns with rg
    - inspected the configured 360x800, 390x844, 768x1024, and 1366x768 Playwright viewport matrix
    - inspected existing dist chunk sizes; no runtime or field-performance measurement was performed
    - headless Chromium reproduced hidden, non-scrollable interactive content at 768x641 on Calendar and Affiliates
    - text enlargement to 200 percent reproduced clipped interactive content at the approved desktop and tablet viewports; this is a text-enlargement simulation, not a live assistive-technology test
    - the open gallery lightbox retained 15 visible focusable controls outside the dialog subtree
    - Calendar controls measured 32px high at 1366x768 except the 48px month-navigation controls
  result: The SPA foundations and base-first Tailwind cascade are sound, but viewport containment now has a reproducible reachability failure at a breakpoint boundary; component-local breakpoint composition, reduced large-screen targets, and incomplete modal isolation remain additional risks.

  findings:
    - id: CRIT-RESP-001
      level: CRITICAL
      axis: RESPONSIVE
      status: accepted_owner_policy
      target: 768x641 Calendar and Affiliates route content
      problem: At exactly 768x641 the tall-md fixed-viewport mode activates, the document cannot scroll, and interactive Calendar and Affiliates content extends below overflow-hidden route containers without another reachable scroll owner.
      fix: Do not select an implementation until the owner understands and approves a content-reachability contract; then ensure overflowing content has one explicit reachable scroll owner while preserving the separately approved 1366x768 composition.
      cost_of_deferring: Users at affected intermediate viewports cannot reach event actions or affiliate contact and location links.
      evidence: [Chromium measurements at 768x640 and 768x641 on commit a394c725, Calendar section 389px clientHeight versus 600px scrollHeight, Affiliates section 389px clientHeight versus 858px scrollHeight, document scrollHeight locked to 641px]
      resolution:
        resolved_at: 2026-08-05
        summary: Named tablet-fit and page-fit modes now keep intermediate and short-height presentations in document flow, preserve verified contained compositions, and let the 768x1024 Affiliates page grow so every schedule remains reachable.
        checks: [typecheck, build, unit tests, generated-output tests, 132-test Playwright suite, 39-case reachability matrix, 28 approved visual comparisons]
    - id: STR-RESP-003
      level: STRUCTURAL
      axis: RESPONSIVE
      status: resolved
      target: src/app/App.tsx:63 and tall-md route containers
      problem: At tablet-or-wider widths and heights above 640px the shell and primary route containers switch to fixed viewport containment with overflow hidden, making content reachability depend on every descendant fitting its allocated height.
      fix: Keep document flow as the resilient default and scope the desktop no-scroll composition to an explicit desktop contract, with an internal overflow owner for variable or zoomed content.
      cost_of_deferring: Text zoom, localization growth, browser chrome, or an untested intermediate viewport can clip content even while the four approved viewport snapshots pass.
      resolution:
        resolved_at: 2026-08-05
        summary: tablet-fit and page-fit replaced the broad tall-md viewport lock; intermediate and zoom-reflow widths use document flow, while contained modes are limited to verified route and viewport combinations.
        checks: [39-case responsive reachability matrix, 132-test Playwright suite, 28 approved visual comparisons, 200-percent reflow-equivalent checks for four routes from desktop and tablet reference viewports]
    - id: STR-ARCH-013
      level: STRUCTURAL
      axis: ARCH
      status: resolved
      target: custom responsive variants and route-level component utility chains
      problem: Layout policy is distributed across width, height, and orientation variants inside individual components, including intersecting overrides whose source-order behavior has already caused a regression.
      fix: Define a small documented responsive composition contract and reuse non-visual shell primitives or named class sets for viewport ownership, banners, panels, and compact landscape behavior.
      cost_of_deferring: Each new route or breakpoint multiplies variant intersections and makes fixes easy to apply inconsistently.
    - id: STR-ARCH-014
      level: STRUCTURAL
      axis: ARCH
      status: resolved
      target: src/app/App.tsx route containment decision and responsive reachability coverage
      problem: The shell infers tablet containment through the negative exception component !== affiliates, so every future route is treated as safe to contain unless someone remembers to add another exception, while the intermediate-height test enumerates only three hand-picked routes.
      fix: Introduce an exhaustive typed route-presentation policy keyed by RouteComponent with an explicit tablet mode for every component, and derive the reachability matrix from that contract or assert every route component has a tested decision.
      cost_of_deferring: A new content-heavy route can silently inherit unsafe containment and remain absent from the boundary matrix until users encounter another clipping regression.
      evidence: [src/app/config/routeTypes.ts exhaustive seven-design union, src/app/config/routePresentation.ts exhaustive tablet policy, exhaustive client and server registries, 91-case responsive reachability matrix, 184-test complete Playwright suite, 28 unchanged visual baselines]
    - id: SMELL-A11Y-003
      level: SMELL
      axis: A11Y
      status: open_decision_required
      target: calendar and event controls using lg:min-h-8 or lg:size-8
      problem: Several Calendar controls shrink from 44px to 32px at large widths even though large screens can still be touch-enabled or used under motor constraints; the measured targets satisfy the WCAG 2.2 AA minimum but not the 44px enhanced target policy.
      fix: Decide whether the product targets WCAG 2.2 AA only or adopts a broader 44px ergonomic policy; if adopted, prefer expanding hit areas or using input-capability-aware sizing before increasing visible card geometry.
      cost_of_deferring: Desktop touch and reduced-dexterity use remains less forgiving, but no measured control is currently below the 24px AA minimum.
      evidence: [1366x768 measurement across Home, Calendar, Gallery, and Affiliates; Calendar event actions 32px high, share controls 32x32px, all measured visible targets at least 24px in both dimensions, W3C SC 2.5.8 and SC 2.5.5]
    - id: SMELL-A11Y-004
      level: SMELL
      axis: A11Y
      status: resolved
      target: src/app/hooks/useModalBehavior.ts
      problem: The gallery dialog traps ordinary Tab navigation and locks scrolling but does not mark the application background inert, so 20 visible external controls remain programmatically focusable and focus can be moved outside the modal.
      fix: Render the dialog through a body-level portal and apply/restore inert on the application root, or make the non-dialog sibling branches inert while retaining focus return and scroll restoration; the current dialog is nested inside the application root, so that root cannot simply become inert in place.
      cost_of_deferring: The visual modal and accessibility interaction boundary can disagree in programmatic navigation and assistive technologies that do not fully enforce aria-modal semantics.
      evidence: [Lightbox at 768x1024, initial focus on Close, eight Tab presses remained inside three dialog controls, Escape returned focus to the opener, 20 visible outside controls had no inert or aria-hidden ancestor, programmatic focus escaped to the skip link]
      resolution:
        resolved_at: 2026-08-05
        summary: The existing lightbox is rendered through a body-level portal while #root is inert, with focus containment, scroll restoration, focus return, and cleanup preserved for Escape, backdrop closure, and route unmount.
        checks: [4-case directed lightbox behavior suite, pixel-identical open-lightbox fingerprints at 360x800, 390x844, 768x1024, 844x390, and 1366x768, 188-test complete Playwright suite, 28 approved visual comparisons]
    - id: SMELL-A11Y-005
      level: SMELL
      axis: A11Y
      status: resolved
      target: src/styles/globals.css root font size and text-only enlargement behavior
      problem: The root font size is fixed at 16px and the layouts are not resilient when only that value is doubled, even though the verified full-page reflow equivalent remains reachable.
      fix: First decide whether text-only enlargement and user default-font preferences are an explicit product requirement beyond the verified full-page zoom path; only then test native browser mechanisms and choose between removing the fixed root size, adding a supported text-scale mode, or accepting zoom as the supported mechanism.
      cost_of_deferring: Users who prefer text-only scaling instead of full-page zoom may encounter clipped content or horizontal overflow, but this is not currently proven to violate WCAG 1.4.4 because a supported zoom mechanism can be sufficient.
      evidence: [src/styles/globals.css root --font-size 16px, temporary root 32px measurements at 768x1024 and 1366x768, W3C Understanding SC 1.4.4]
      resolution:
        resolved_at: 2026-08-16
        summary: Full-page browser zoom is the supported 200-percent enlargement mechanism; text-only enlargement is not a product requirement.
        checks: [owner-confirmed native Microsoft Edge 200-percent zoom validation, automated reflow-equivalent reachability coverage]

phase_zero_spa_mobile:
  status: responsive_problem_understood_and_fixed
  rule: No test, layout, responsive, touch-target, or modal implementation is approved until the owner can explain the reproduced problem, affected scope, current scroll ownership, and chosen acceptance criteria.
  baseline: { commit: a394c725, worktree: dirty only from review-state documentation }
  completed:
    - production, SSR, and generated-route build passed
    - normal-flow behavior confirmed at 768x640
    - breakpoint-boundary clipping confirmed at 768x641
    - the 768px-wide height sweep confirmed that the failure is not limited to the boundary: clipped controls remain at 720px and 800px; at 900px Home and Affiliates still clip controls; all sampled controls are reachable at 1024px
    - approved 1366x768 no-scroll geometry remained intact at normal text size
    - 200-percent text-enlargement simulation exposed clipping on Home, Calendar, and Affiliates
    - gallery lightbox focus started on Close but 15 visible background controls remained outside the dialog and not inert
    - 32px Calendar event controls confirmed at 1366x768
  pending:
    - owner decision on whether text-only enlargement and default-font preferences are an explicit requirement beyond the full-page zoom mechanism
    - owner decision on large-screen 44px hit areas
    - owner decision on the modal isolation acceptance criterion
  owner_confirmation:
    recorded_at: 2026-08-05
    understood: The intended mobile, mobile-landscape, tablet, and desktop presentations are implemented with overlapping media conditions rather than mutually exclusive modes; at 768x641 multiple conditions activate and the fixed-height overflow chain makes content unreachable.
    decision: The responsive reachability failure is in scope and must be solved.
    completed_later: Acceptance criteria, scroll ownership, implementation technique, visual differences, test changes, and the resulting Affiliates 768x1024 baseline were all explicitly approved before closure.

phase_one_responsive_contract:
  status: completed_and_owner_approved
  evidence_update:
    - At width 768, fixed containment is unsafe across the sampled 641, 720, 800, and 900px heights, not only at the 640/641 boundary.
    - At 768x1024 all sampled interactive controls were reachable; Calendar and Gallery sections fit, while Affiliates retained 858px scrollHeight inside a 772px overflow-hidden section without sampled focusable clipping.
    - Width and height must both participate in any future contained-layout mode; one tall-md condition cannot safely represent tablet and desktop composition.
  proposed_acceptance:
    - use document scrolling when a tablet or intermediate presentation cannot fit all content
    - preserve the approved normal 768x1024 presentation
    - preserve the strict 1366x768 no-document-scroll contract
    - do not hide additional content to satisfy containment
    - verify reachability at both sides of responsive boundaries and at representative intermediate heights
  approval_scope: Historical first approval covered acceptance behavior and scroll ownership; the implementation conditions and exact visual delta were approved separately before baseline regeneration.
  owner_approval:
    recorded_at: 2026-08-05
    approved: Use document scrolling when tablet or intermediate content cannot fit, preserve the intended 768x1024 tablet and strict 1366x768 desktop compositions, do not hide content, and do not introduce nested Calendar or Affiliates scroll owners.
  red_test:
    file: tests/e2e/responsive-reachability.spec.ts
    result: 16 failed and 17 passed before implementation
    confirmed:
      - 15 failures cover Home, Calendar, and Affiliates across 768x641, 769x641, 768x720, 768x800, and 768x900.
      - The approved 768x1024 Affiliates presentation also clips non-interactive schedule terms and descriptions even though its sampled controls remain reachable.
      - Approved 1366x768 representatives and normal-flow boundary or short-landscape cases pass.
    implication: Preserving 768x1024 must mean preserving its intended visual composition, not preserving the newly confirmed hidden schedule content defect.
  implementation:
    - Added named tablet-fit and page-fit composition variants so viewport containment is no longer selected by tall-md alone.
    - Preserved tablet containment at 768x1024 only for route components verified to fit; Affiliates uses normal document flow because its schedule content does not fit.
    - Limited the Calendar and Affiliates absolute banner-panel overlap to page-fit, requiring at least 1280x768.
    - Added a 39-case reachability matrix across breakpoint boundaries, intermediate tablet heights, short landscape, short desktop, approved tablet, and approved desktop.
  verification:
    - typecheck passed
    - production and SSR build plus generated route output passed
    - unit tests passed: 10
    - generated-output tests passed: 4
    - complete Playwright suite passed: 132
    - directed responsive reachability matrix passed: 39
    - before baseline approval, visual comparison passed 27 of 28 baselines; mobile, every non-Affiliates tablet route, and desktop 1366x768 remained pixel-identical
    - the sole reviewed visual difference was Affiliates at 768x1024, where the document continues below the first viewport and exposes the schedules previously clipped by the primary section
    - after explicit owner approval and replacement of only affiliates-tablet-768x1024.png, the complete visual suite passed 28 of 28
  final_owner_approval:
    recorded_at: 2026-08-05
    approved: The inspected Affiliates 768x1024 rendered result and replacement of its single visual baseline.

phase_two_text_resize:
  status: completed_with_full_page_zoom_policy
  requested_scope: Understand the 200-percent text-enlargement concern before any approval or implementation.
  actual_scope:
    targets: [src/styles/globals.css, Home, Calendar, Gallery, Affiliates]
    axes: [A11Y, RESPONSIVE]
    included: [WCAG 1.4.4 mechanism distinction, 200-percent reflow equivalent, root-font-only enlargement, clipping, horizontal overflow, scroll ownership]
    excluded: [application edits, native Firefox testing, live assistive technology, operating-system text scaling, visual approval]
  baseline: { commit: 71159b8c, worktree: dirty with the approved responsive implementation }
  verified:
    - Reflow equivalents of 1366x768 at 200 percent (683x384 CSS viewport) kept all meaningful content reachable on Home, Calendar, Gallery, and Affiliates with document scrolling, no clipped content, no nested vertical scroll owner, and no horizontal overflow.
    - Reflow equivalents of 768x1024 at 200 percent (384x512 CSS viewport) produced the same reachable result on all four routes.
    - A separate text-only simulation forcing the root from 16px to 32px clipped content on Home, Calendar, and Gallery at 768x1024; Affiliates remained vertically reachable but grew to 831px width inside a 768px viewport.
    - At 1366x768 the same text-only simulation clipped content on all four routes because page-fit containment remained active.
  interpretation:
    - Full-page zoom and text-only enlargement are different mechanisms because full-page zoom reduces the effective CSS viewport and activates responsive reflow, while changing only the root font size leaves desktop/tablet containment conditions active.
    - W3C states that SC 1.4.4 can be satisfied when content scales to 200 percent through at least one user-agent-supported text scaling mechanism; failure of the exploratory root-font-only simulation does not by itself prove non-conformance when full-page zoom is supported.
    - The in-app browser did not expose a trustworthy zoom-level control, so the current zoom evidence is a reflow-equivalent measurement rather than a direct native-browser zoom execution.
    - No connected Chrome browser was available for a second native-zoom attempt in this session.
    - Chromium CDP Emulation.setPageScaleFactor was rejected as evidence: at factor 2 it reduced only the visual viewport to 683x384, kept the 1366x768 layout viewport and min-width:1280 media query active, and reported page zoom 1.
  decision_gate:
    - Owner confirmed native Microsoft Edge zoom at 200 percent on 2026-08-16.
    - Full-page zoom is supported; text-only enlargement and user-configured default font sizes are outside the current product requirement.
    - No layout or typography change is required for this decision.

phase_three_lightbox_isolation:
  status: completed_and_owner_approved
  requested_scope: Understand the semantic modal-isolation weakness before any approval or implementation.
  actual_scope:
    targets: [src/app/components/Lightbox.tsx, src/app/components/GallerySection.tsx, src/app/hooks/useModalBehavior.ts]
    axes: [A11Y, REACT, ARCH]
    included: [dialog semantics, focus entry and cycling, Escape, focus restoration, scroll lock, background focusability, inertness, DOM ownership]
    excluded: [visual edits, gesture behavior changes, image presentation changes, live screen-reader testing]
  baseline: { commit: 71159b8c, worktree: dirty with the approved responsive implementation }
  verified_strengths:
    - The dialog exposes role=dialog, aria-modal=true, an accessible title, and a conditional accessible description.
    - Initial focus moves to Close; repeated Tab navigation cycles through Close, Previous, and Next without escaping.
    - Escape closes the lightbox and returns focus to the image-opening control.
    - After React effects settle, html and body both use overflow hidden while the lightbox is open.
    - The full-screen overlay prevents ordinary pointer interaction with the obscured page.
  verified_gap:
    - Twenty visible focusable elements outside the dialog had neither an inert ancestor nor an aria-hidden ancestor at 768x1024.
    - Programmatic focus moved from the dialog to the outside skip link while the modal remained open.
    - aria-modal communicates modality to supporting assistive technologies but does not itself change DOM focusability or pointer behavior.
  structural_constraint:
    - The Lightbox is rendered inside GallerySection, which is inside #root.
    - Applying inert directly to #root in the current structure would also inert the Lightbox descendant and is therefore invalid.
  options:
    - Keep the current custom ARIA modal and accept the residual compatibility gap; this preserves code and visuals but relies on focus trapping plus aria-modal support.
    - Recommended: portal the existing overlay to document.body and apply/restore inert on #root while open; this preserves the current visual component and makes the background natively inoperable and absent from accessibility APIs.
    - Migrate to a native dialog opened with showModal(); this provides browser-managed top-layer modality and inertness but has a broader rendering, event, and visual-regression surface.
  decision_gate:
    - The owner must choose whether native background inertness is required and, if so, approve the portal-plus-inert implementation or the broader native-dialog migration.
    - No modal implementation or visual change is approved in this phase.
  exact_recommended_proposal:
    implementation:
      - Return the existing Lightbox overlay through createPortal(..., document.body), retaining its current DOM subtree, classes, gestures, backdrop behavior, and ARIA attributes.
      - While the modal is mounted, set the #root element inert and restore its exact prior inert state during cleanup.
      - Retain the existing focus entry, Tab cycle, Escape handling, focus restoration, and html/body scroll lock as defense in depth.
    tests:
      - Opening places focus on Close and marks #root inert.
      - Tab and Shift+Tab remain inside the three dialog controls.
      - Programmatic focus attempts on a background link do not move focus outside the dialog.
      - Escape and backdrop closure remove inert, restore scroll state, and return focus to the opener.
      - Unmount or route cleanup cannot leave #root inert.
    visual_contract:
      - No intentional change to dimensions, position, backdrop opacity, typography, colors, image crop, captions, controls, gestures, or responsive presentation.
      - Compare the open lightbox before and after at 360x800, 390x844, 768x1024, compact landscape, and 1366x768; any pixel difference is blocking unless separately approved.
    files: [src/app/components/Lightbox.tsx, src/app/hooks/useModalBehavior.ts, directed lightbox behavior test]
  approval_state: The owner explicitly approved the non-visual lightbox-isolation refactor on 2026-08-05.
  implementation:
    - Lightbox retains its existing overlay subtree and classes but returns it through createPortal(..., document.body).
    - useModalBehavior records the prior #root inert state, enables inert while mounted, and restores that exact state during cleanup.
    - Focus restoration is deferred one animation frame and guarded by isConnected so backdrop pointer completion cannot overwrite it and route unmount cannot focus a detached trigger.
    - A directed Playwright suite covers portal ownership, inertness, programmatic focus containment, Tab and Shift+Tab, Escape, backdrop closure, scroll restoration, focus restoration, and route-unmount cleanup.
  verification:
    - the isolation test failed before implementation with dialogIsOutsideRoot=false, rootIsInert=false, and focusStayedInDialog=false
    - typecheck passed
    - production and SSR build plus generated route output passed
    - unit tests passed: 10
    - generated-output tests passed: 4
    - directed lightbox behavior tests passed: 4
    - complete Playwright suite passed: 188
    - open-lightbox screenshots remained byte-identical at 360x800, 390x844, 768x1024, 844x390, and 1366x768
    - visual regression suite passed: 28 of 28 without updating baselines

phase_four_target_size:
  status: problem_explained_decision_pending
  requested_scope: Understand the large-screen 32px target concern before any approval or implementation.
  actual_scope:
    targets: [visible links and buttons on Home, Calendar, Gallery, and Affiliates at 1366x768]
    axes: [A11Y, RESPONSIVE]
    included: [bounding dimensions, WCAG 2.2 AA minimum, enhanced 44px criterion, desktop touch ergonomics, no-scroll tradeoff]
    excluded: [application edits, physical-device testing, pointer accuracy study, visual approval]
  baseline: { commit: 71159b8c, worktree: dirty with the approved responsive implementation }
  verified:
    - Every measured visible link and button was at least 24 CSS pixels in both bounding-box dimensions on all four routes.
    - Calendar event details and location links measured 32px high, and share buttons measured 32x32px.
    - Main month-navigation controls remain 48x48px; mobile-oriented controls retain 44px minimums through their base styles.
    - Navigation links measured 26px or 30px high, footer and affiliate text links measured 24px high, and all had widths above 24px.
  interpretation:
    - WCAG 2.2 SC 2.5.8 Level AA requires at least 24x24 CSS pixels or an applicable exception, so the measured 32px controls are not an AA failure.
    - WCAG SC 2.5.5 Target Size Enhanced uses 44x44 CSS pixels at Level AAA; adopting 44px everywhere is an optional stronger product policy.
    - Increasing visible control height may consume the limited vertical budget protected by the approved 1366x768 no-scroll contract.
  options:
    - Keep 32px desktop controls and document WCAG 2.2 AA as the target; lowest visual and layout cost.
    - Preserve the compact 32px visual surface while expanding non-overlapping interactive hit areas toward 44px; requires geometry and overlap verification.
    - Use pointer/any-pointer capability queries to retain compact fine-pointer controls and provide 44px on coarse-pointer devices; helps hybrid touch hardware but is not a universal motor-accessibility policy.
    - Adopt visible 44px controls everywhere and redesign the desktop density contract; largest visual scope and highest risk to 1366x768 containment.
  decision_gate:
    - The owner must choose the accessibility target (AA minimum or enhanced 44px policy) and whether the strict desktop no-scroll composition may change.
    - No control-size or visual change is approved in this phase.

phase_five_route_layout_policy:
  status: completed_and_owner_approved
  requested_scope: Identify structural weaknesses after the SPA and mobile-first review.
  actual_scope:
    targets: [src/app/config/routeTypes.ts, src/app/config/routePresentation.ts, src/app/App.tsx, src/app/config/seo.ts, src/app/routeRegistry.client.tsx, src/entry-server.tsx, tests/e2e/responsive-reachability.spec.ts]
    axes: [ARCH, RESPONSIVE, TS]
    included: [route containment ownership, explicitness, exhaustiveness, future-route behavior, boundary-test coverage]
    excluded: [route redesign, SEO output changes, component folder migration, visual change]
  baseline: { commit: 71159b8c, worktree: dirty with the approved responsive implementation }
  verified:
    - AppShell sets allowsTabletContainment by checking that the current RouteComponent is not affiliates.
    - RouteComponent is a finite typed union already used by both the client registry and server registry.
    - The responsive reachability matrix manually lists Home, Calendar, and Affiliates rather than deriving coverage from the route-component contract.
    - A newly added RouteComponent would require registry and SEO updates but would still default to tablet containment and would not automatically enter the intermediate-height matrix.
    - NotFoundSection is held in a separate registry property while createNotFoundMeta reports component home, so a policy keyed only by the current RouteComponent union would silently classify the 404 presentation as Home.
    - A directed 52-case extension covering Gallery, Event, PastEvents, and NotFound across the eleven flow viewports plus 768x1024 and 1366x768 produced zero clipping, nested scroll, horizontal overflow, or unexpected shell flow locks.
  recommended_direction:
    - Move the renderable component identity to a route-types module and include all seven designs: home, calendar, gallery, affiliates, event, pastEvents, and notFound.
    - Make both client and server registries exhaustive Records of that union instead of keeping notFound as an untyped special property.
    - Correct createNotFoundMeta to report component notFound rather than home.
    - Add a small typed route-presentation contract separate from public SEO copy, for example Record<RouteComponent, { tabletMode: 'contained' | 'flow' }>.
    - Require one explicit policy value per RouteComponent so TypeScript prevents new page designs from inheriting containment accidentally.
    - Expand the responsive matrix to one representative of each of the seven designs and validate behavior according to the declared policy without importing CSS implementation details.
    - Keep page-fit as the shared verified desktop mode and preserve every approved visual result.
  exact_non_visual_scope:
    files: [new route types and presentation contract, src/app/App.tsx, client and server route registries, src/app/config/seo.ts, tests/e2e/responsive-reachability.spec.ts]
    policy:
      home: contained
      calendar: contained
      gallery: contained
      affiliates: flow
      event: contained
      pastEvents: contained
      notFound: contained
    invariants:
      - No route paths, lazy-loading boundaries, metadata, public copy, component output, breakpoint values, or CSS classes change.
      - Every one of the 28 visual baselines remains pixel-identical.
      - Existing responsive behavior remains identical; only ownership and exhaustiveness become explicit.
  decision_gate:
    - The owner explicitly approved the non-visual per-route responsive-contract refactor on 2026-08-05.
    - The lightbox, control-size, typography, route redesign, and visual scopes remain unapproved and unchanged.
  implementation:
    - RouteComponent now represents all seven renderable designs, including notFound, in a dedicated route-types module.
    - Client and server registries are exhaustive Records with no special notFound property.
    - The 404 metadata now reports notFound while preserving its existing SEO payload and rendered output.
    - The negative affiliates exception was replaced by an exhaustive typed tablet presentation policy: affiliates uses flow and the other six designs use contained.
    - The reachability matrix covers one representative of every design across eleven flow viewports and two approved contained viewports.
  verification:
    - typecheck passed
    - production and SSR build plus generated route output passed
    - unit tests passed: 10
    - generated-output tests passed: 4
    - directed responsive reachability matrix passed: 91
    - complete Playwright suite passed: 184
    - visual regression suite passed: 28 of 28 without updating baselines
latest_hero_overlay_review:
  id: REV-2026-08-09-01
  requested_scope: Compare the local HeroSection change with the approved 1366x768 and mobile visual baseline, measure text legibility, and assess whether the gradient recognizes the person on the right without regressions.
  actual_scope:
    targets: [src/app/components/HeroSection.tsx, homepage at 360x800, 390x844, 768x1024, and 1366x768]
    axes: [A11Y, RESPONSIVE]
    included: [saved Git diff, approved screenshot comparison, text-to-image contrast, right-side subject visibility]
    excluded: [style edits, baseline regeneration, obsolete Figma, production behavior, other routes except contamination checks]
  baseline:
    commit: 88733b9c
    worktree: dirty with unrelated EventPage.tsx and MediaPageBanner.tsx visual changes
    HeroSection_sha256: 79DDDD42DAA7D4925E2D7E3B3F487CEC558CD472640BAA3B43D0C6344FE366CD
    approved_visual_oracle: committed Playwright screenshots
  evidence:
    - HeroSection.tsx has no saved staged or unstaged difference from HEAD.
    - The unrelated dirty files do not feed the homepage hero; the directed homepage screenshots passed at 360x800, 390x844, and 1366x768 without updating baselines.
    - The homepage tablet screenshot failed at 768x1024 with 57611 changed pixels (8 percent); expected, actual, and diff showed a material whole-page composition difference and it remains blocking outside the requested desktop/mobile targets.
    - Reconstructed image-plus-gradient sampling at core glyph pixels measured desktop minima of 6.00:1 for the title, 5.85:1 for the bold lead, and 7.36:1 for the description.
    - At 360x800 and 390x844, the large title remained above 3:1, but 10.35 percent and 9.82 percent of sampled bold-lead core pixels fell below 4.5:1; 2.37 percent and 1.79 percent of description core pixels fell below 4.5:1.
    - The desktop right-side subject remains visibly recognizable and the right-side region retains luminance variation, but the saved implementation is identical to the approved baseline and therefore provides no verified improvement over it; mobile object-cover cropping does not preserve that same far-right subject.
  confirmed_findings: [SMELL-A11Y-003, POL-RESP-010]
  findings:
    - id: SMELL-A11Y-003
      level: SMELL
      axis: A11Y
      status: open
      target: src/app/components/HeroSection.tsx:35
      problem: The mobile gradient does not keep all lead and description glyph locations at 4.5:1 against the variable image background.
      fix: Requires owner-approved visual treatment; no change was made during review.
      cost_of_deferring: Legibility remains image-position-dependent for portions of the mobile copy.
    - id: POL-RESP-010
      level: POLISH
      axis: RESPONSIVE
      status: open
      target: src/app/components/HeroSection.tsx:35
      problem: The saved gradient is baseline-identical, so it cannot substantiate the requested improvement, and the far-right desktop subject is cropped out on mobile.
      fix: Clarify whether subject recognition is a desktop-only objective and provide the saved candidate change for comparison before approving any visual adjustment.
      cost_of_deferring: The recognition objective remains unverified as an improvement rather than merely preserving the approved presentation.
    - id: STR-RESP-011
      level: STRUCTURAL
      axis: RESPONSIVE
      status: open
      target: tests/e2e/visual-regression.spec.ts-snapshots/home-tablet-768x1024.png
      problem: The approved Home tablet screenshot predates the ES/EN navigation and tablet containment changes, while the deterministic geometry gate does not assert the complete tablet shell or footer-in-viewport composition.
      fix: Requires owner direction on whether the current tablet composition or the historical screenshot is authoritative; only then may implementation or the baseline be changed, followed by complete visual inspection.
      cost_of_deferring: The manual visual suite remains red at tablet and the geometry suite can pass without detecting this whole-page composition mismatch.
      evidence:
        - The Home tablet snapshot was last changed by b59c5813 on 2026-08-04 15:44 -0600.
        - Commit c0e73e23 added the visible ES/EN selector and responsive content changes later that day without updating the Home tablet snapshot.
        - Commit c7684604 added tablet containment and updated only the Affiliates tablet snapshot.
        - Current Home at 768x1024 differs by 57611 pixels (8 percent), including the navbar, hero height, event-card composition, and absent footer in the captured viewport.
        - The directed responsive reachability checks passed 13 Home cases and the directed tablet geometry contract passed 1 case, demonstrating the coverage gap rather than visual equivalence.
  result: Desktop and requested mobile screenshots preserve their approved baselines, but the current saved gradient does not fully meet the combined recognition-and-uniform-legibility objective. The tablet failure is traced to a stale pre-bilingual Home screenshot plus incomplete tablet whole-shell assertions; no visual files or baselines were changed.

latest_home_tablet_frame_fix:
  id: FIX-2026-08-09-01
  requested_scope: Keep the approved ES/EN control and restore the approved complete Home framing at 768x1024 without regenerating baselines.
  approval: The owner explicitly approved the tablet Home visual correction and confirmed the current ES/EN design on 2026-08-09.
  baseline:
    commit: 88733b9c
    visual_oracle: committed Home screenshots plus the owner-approved ES/EN selector as the sole allowed historical-baseline difference
    worktree: dirty with unrelated EventPage.tsx and MediaPageBanner.tsx visual changes that do not feed Home
  implementation:
    - fixed the Home hero to 348px only at tablet-fit so it no longer consumes the event/footer budget
    - restored the 10rem tablet date-label cap while preserving the current mobile width and the unrestricted desktop width
    - kept ES/EN, hero content, colors, gradient, typography, buttons, mobile presentation, and desktop presentation unchanged
  verification:
    - typecheck passed
    - production and SSR build plus generated route output passed
    - the four Home visual comparisons passed without updating baselines under the configured 1 percent tolerance
    - the directed Home tablet geometry contract passed
    - all 13 directed Home responsive reachability cases passed
    - a temporary zero-tolerance comparison found 3040 residual changed pixels; inspected diff attributed the remaining material region to the owner-approved ES/EN navbar addition
    - no screenshot baseline was regenerated
  result: Home again presents navbar, 348px hero, all three visible event cards, and footer inside the 768x1024 frame; mobile and 1366x768 remain baseline-matching.

latest_event_seo_review:
  id: REV-2026-08-13-01
  requested_scope: Assess SEO for upcoming and past events.
  actual_scope:
    targets:
      - src/app/config/events.ts
      - src/app/config/seo.ts
      - src/app/utils/eventRoutes.ts
      - src/app/utils/eventArchive.js
      - src/app/components/PastEventsSection.tsx
      - scripts/generate-route-html.mjs
      - generated event and archive HTML plus sitemap
    axes: [SEO]
    included:
      - indexability, canonical URLs, hreflang, sitemap, event structured data
      - server-rendered historical archive content
    excluded:
      - production deployment configuration and search-console coverage
      - keyword research, backlinks, performance, and visual presentation
  baseline:
    commit: 1dbec00d
    worktree: clean before review-state update
    fingerprints:
      events.ts: 6053F2452EF4DD51D164688E6F44DE8CA3597CD41A74C80A6AC578FAF669E395
      seo.ts: 806129991AB0AEA573750447EB692C3CD10E39F9D2375D180E10617541F4DC38
      eventRoutes.ts: EEBCE353B54638F1DC4E4A3AACF5C1AB9D9446617A075FAE6C7BCAEC8400F7DE
      PastEventsSection.tsx: 7F2A4F7792BF4E5F88C04CEDF3600CCDBF5B416852BD7115C1171905DBD9C147
  confirmed_findings: [STR-SEO-006, STR-SEO-007, SMELL-SEO-006, SMELL-SEO-007]
  findings:
    - id: STR-SEO-006
      level: STRUCTURAL
      axis: SEO
      status: resolved
      target: src/app/config/seo.ts:157-160; src/app/config/events.ts:1
      problem: SITE_INDEXING_ENABLED and EVENT_INDEXING_ENABLED are false, so every event, calendar, and archive page emits noindex,nofollow; the sitemap is empty and no JSON-LD is emitted.
      fix: Enable public indexing only after confirming the canonical domain and launch policy, then make the event-level index policy explicit for upcoming and historical details.
      cost_of_deferring: Search engines are instructed not to index any event URL, so the event content cannot obtain organic visibility.
      evidence:
        - corepack pnpm run build
        - corepack pnpm run test:generated passed 5 tests
        - dist/eventos/2026-09-12-gasshuku-monteverde/index.html:26
        - dist/eventos/pasados/index.html:20
        - dist/sitemap.xml contains no url entries
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: owner direction
        checks:
          - all generated routes emit noindex, nofollow
          - sitemap contains no URL entries
          - generated output tests passed
    - id: STR-SEO-007
      level: STRUCTURAL
      axis: SEO
      status: resolved
      target: src/app/components/PastEventsSection.tsx:30-34
      problem: The archive obtains historical events only after useEffect sets now; static SSR output has an empty archive and no links to historical detail pages.
      fix: Supply a deterministic server render time or precompute archive content during static generation, while preserving client freshness after hydration.
      cost_of_deferring: Even after indexing is enabled, crawlers that use the generated HTML will not discover archive entries from the archive page.
      evidence:
        - corepack pnpm run build
        - dist/eventos/pasados/index.html SSR body says Todavia no hay eventos en el archivo
        - getPastEvents defaults to a real current date when invoked by getRouteManifest in src/app/config/seo.ts:250-268
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: worktree
        checks:
          - generated archive HTML contains historical event links
          - generated output tests passed
    - id: SMELL-SEO-006
      level: SMELL
      axis: SEO
      status: resolved
      target: src/app/config/seo.ts:391-426
      problem: The future Event JSON-LD is prepared only for events with location and assigns EventScheduled without considering a historical event state.
      fix: When indexing is approved, emit a complete Event entity for eligible published events and use EventCompleted for past events.
      cost_of_deferring: Rich-result eligibility and schema accuracy will be inconsistent across the archive after indexing is enabled.
      evidence:
        - src/app/config/seo.ts:391-426
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: worktree
        checks:
          - generated historical event JSON-LD uses EventCompleted
          - generated output tests passed
    - id: SMELL-SEO-007
      level: SMELL
      axis: SEO
      status: deferred_presidency_authority
      target: src/app/config/seo.ts:300
      problem: Detail-page titles use only the event name, so recurring events such as Examen generate identical HTML titles across different dates.
      fix: Include the event date or year in the detail-page title while retaining the concise visible h1.
      cost_of_deferring: Search results and social previews cannot clearly distinguish recurring editions of the same event.
      evidence:
        - dist/eventos/2026-08-08-examen/index.html title is Examen | Federacion de Asociaciones de Kendo
        - dist/eventos/2027-01-30-examen/index.html has the same title
  evidence:
    - attempted production URL inspection was blocked by the browsing safety gate; no claim about deployed headers or deployed HTML is made
    - canonical and reciprocal hreflang tags are present in generated Spanish and English event and archive pages
    - event title and meta description are generated from localized event data
  result: The owner-required global noindex policy is active for all routes. The archive now retains server-rendered historical links for a future approved indexing phase; titles remain unchanged under Presidency authority.
  pending: Production deployment and Search Console indexing coverage were not reviewed.
  next: Do not enable indexing until the owner explicitly authorizes it.

latest_calendar_timezone_and_localization_review:
  id: REV-2026-08-13-02
  requested_scope: Validate the reported calendar-status and event-title-localization findings.
  actual_scope:
    targets:
      - src/app/utils/calendarEvents.ts
      - src/app/utils/eventArchive.js
      - src/app/utils/calendarEventPresentation.ts
      - src/app/utils/localizedEvents.ts
      - src/app/types.ts
      - direct callers in EventPage.tsx and seo.ts
    axes: [ARCH]
    included:
      - event-end instant construction and its time-zone source
      - archive eligibility comparison
      - English event-title translation lookup and ordinal grammar
    excluded:
      - implementation changes
      - visual presentation
      - calendar synchronization, historical-route behavior, and non-title localization
  baseline:
    commit: 9fd8331d
    worktree: dirty
    limitation: eventArchive.js and EventPage.tsx contain unrelated route-worktree changes; evidence below is from their current contents.
  confirmed_findings:
    - STR-ARCH-017
    - SMELL-ARCH-012
    - STR-ARCH-018
  findings:
    - id: STR-ARCH-017
      level: STRUCTURAL
      axis: ARCH
      status: resolved
      target: src/app/utils/calendarEvents.ts:20-58
      problem: Event start and end instants are constructed in the executing environment's local time zone rather than event.timeZone, so upcoming, detail, and Event JSON-LD completion decisions vary by visitor or build-host time zone.
      fix: Convert the event's date and time to an instant using event.timeZone, preserving the existing all-day end-date semantics, and cover offset-boundary cases with directed tests.
      cost_of_deferring: The public status of an event can disagree with the Costa Rica-anchored archive eligibility around date boundaries.
      evidence:
        - src/app/utils/calendarEvents.ts:20-68
        - src/app/types.ts:38-57
        - src/app/utils/eventArchive.js:22-71
        - src/app/components/EventPage.tsx:58
        - src/app/config/seo.ts:414
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: worktree
        checks:
          - calendarEvents.ts derives timed and all-day end instants from event.timeZone, defaulting to America/Costa_Rica
          - EventPage, upcoming-event filtering, and Event JSON-LD transition at the same inclusive end instant
          - corepack pnpm run typecheck passed
          - corepack pnpm run build passed, including SSR and generated route HTML
          - playwright test tests/e2e/calendar-timezone-localization.spec.ts passed 3 tests
    - id: SMELL-ARCH-012
      level: SMELL
      axis: ARCH
      status: resolved
      target: src/app/utils/localizedEvents.ts:13-23
      problem: Title translations use sequential exact string replacements while summaries use a lookup dictionary with a fallback; whitespace-sensitive literals make title localization silently brittle when source calendar text changes.
      fix: Use a title Record<string, string> for known source titles, retaining the original title as the fallback; keep any intentionally general ordinal translation as a separately tested rule.
      cost_of_deferring: Small upstream copy changes can expose Spanish event titles in English pages without an error.
      evidence:
        - src/app/utils/localizedEvents.ts:4-35
        - src/app/data/calendarEvents.ts:9-184
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: worktree
        checks:
          - localizedEvents.ts uses TITLE_TRANSLATIONS with the original title as fallback
          - playwright test tests/e2e/calendar-timezone-localization.spec.ts verifies a published title translation
    - id: STR-ARCH-018
      level: STRUCTURAL
      axis: ARCH
      status: resolved
      target: src/app/utils/localizedEvents.ts:21-22
      problem: The ordinal title rule maps only 3 to rd and maps 1 and 2 to th, producing grammatically incorrect English titles such as 1th and 2th Tournament.
      fix: Implement the correct ordinal rules (including 11th, 12th, and 13th) or enumerate the published title translations in the title lookup.
      cost_of_deferring: Public English event copy is visibly incorrect for affected tournament titles.
      evidence:
        - src/app/utils/localizedEvents.ts:21-22
      resolution:
        resolved_at: 2026-08-13
        resolved_ref: worktree
        checks:
          - published tournament titles are explicit dictionary entries with correct English ordinals
          - playwright test tests/e2e/calendar-timezone-localization.spec.ts verifies 3er Torneo becomes 3rd Tournament
  evidence:
    - Get-Content .agents/review-contract.md
    - rg -n -C 4 "createLocalDate|getEventEndDate|archiveEligibleAt|translateTitle|SUMMARY_TRANSLATIONS|Torneo" src scripts
    - git status --short showed a dirty worktree before review
    - no directed tests presently match calendarEvents.ts or localizedEvents.ts
  result: All three reported findings were resolved in the worktree. Event completion is now stable across visitor zones and uses an inclusive end instant consistent with archive eligibility; title localization is dictionary-backed with a safe fallback.
  pending: The unrelated pre-existing end-to-end failure in events.spec.ts for the 48-hour archive transition remains outside this change.
  next: Reconcile the archive-transition test with the current archive behavior in a separate targeted task.

latest_calendar_date_helper_followup:
  id: FIX-2026-08-13-05
  requested_scope: Implement and document the confirmed calendar data/generator follow-up.
  actual_scope:
    targets:
      - src/app/utils/calendarDate.js
      - src/app/utils/calendarEvents.ts
      - scripts/sync-calendar-events.mjs
      - tests/calendar-sync.test.mjs
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-sync.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/architecture.md
    axes: [ARCH]
    excluded:
      - public event data changes
      - visual presentation
      - archive policy and external synchronization execution
  implementation:
    - Extracted ISO calendar-day arithmetic and deterministic local date/time sort keys into calendarDate.js, importable by both the application and the Node sync script.
    - Replaced the sync script's host-local Date construction and addDays helpers with the shared functions.
    - Retained event instant conversion in calendarEvents.ts, where event.timeZone is required to answer whether an event has ended.
  resolved_findings:
    - id: SMELL-ARCH-013
      level: SMELL
      axis: ARCH
      status: resolved
      target: src/app/utils/calendarDate.js
      problem: Calendar-day addition and chronological sorting had independent application/script implementations, so a later date-logic change could diverge between generated data and runtime behavior.
      fix: Share pure ISO-date helpers; calendar-day arithmetic and wall-clock sorting do not consult the runner or visitor time zone.
      checks:
        - corepack pnpm exec node --test tests/calendar-sync.test.mjs passed 19 tests
        - corepack pnpm run typecheck passed
        - corepack pnpm run build passed, including SSR and generated route HTML
        - git diff --check passed
  documented:
    - calendar-sync.md distinguishes host-independent calendar arithmetic from event.timeZone instant conversion.
    - architecture.md records the shared calendar-date boundary and its consumers.
  result: The previous time-zone and ordinal findings remain closed by their existing directed browser tests; the remaining date-helper duplication is now removed and documented.

latest_event_public_history_fix:
  id: FIX-2026-08-23-01
  requested_scope: Move completed events from upcoming events into past events while preserving the 48-hour content window.
  baseline:
    commit: 4f1cb335
    worktree: clean immediately after the implementation commit
  implementation:
    - Public classification now uses the event end instant for upcoming lists, historical lists, canonical paths, and historical route acceptance.
    - archiveEligibleAt remains the separate 48-hour checkpoint used by synchronization to freeze editorial content and galleries.
  verification:
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed, including generated historical routes for the 2026-08-22 tournament
    - corepack pnpm run test:behavior passed 33 tests
    - corepack pnpm run test:sync-directed passed 62 tests
    - corepack pnpm run test:generated passed 12 tests
    - directed Prettier check and git diff --check passed
    - global format:check remains blocked by pre-existing formatting differences in CalendarEventCard.tsx and CalendarSection.tsx
  result: Commit 4f1cb335 separates public past-event visibility from the 48-hour editorial freeze without changing synchronization policy.
  documented:
    - event-history-roadmap.md records the public transition and updated phase evidence.
    - calendar-sync.md distinguishes the public event-end boundary from archiveEligibleAt.

latest_calendar_phase6_review:
  id: REV-2026-08-14-01
  requested_scope: Determine whether Phase 6 of the calendar-resilience roadmap is implemented and identify anything omitted.
  actual_scope:
    targets:
      - .github/actions/verify-site/action.yml
      - .github/workflows/ci.yml
      - .github/workflows/sync-calendar.yml
      - .github/workflows/apply-calendar-editorial-decision.yml
      - .github/workflows/correct-calendar-history-range.yml
      - package.json
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-resilience-roadmap.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-sync.md
      - ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/technical-backlog.md
    axes: [ARCH]
    included:
      - shared verification-gate implementation
      - verification ordering before automated commits
      - suppression of duplicate CI for bot-authored commits
      - preservation of CI coverage for human pushes and pull requests
      - documentation alignment and deployment-gate evidence
    excluded:
      - external GitHub Actions execution
      - Cloudflare deployment configuration and runtime behavior
      - visual, SEO, and calendar data behavior
  baseline:
    commit: 4a37a9f0
    worktree: clean before review-state update
  confirmed_findings:
    - DOC-ARCH-003
    - EXT-ARCH-001
  findings:
    - id: DOC-ARCH-003
      level: STRUCTURAL
      axis: ARCH
      status: open
      target: ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-resilience-roadmap.md:3; ../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/calendar-sync.md:9
      problem: The Phase 6 implementation in commit 4a37a9f0 is not recorded as completed; the roadmap and operator guide still say CI optimization is pending, and the technical backlog retains the same work as P1.
      fix: Reconcile the three canonical planning/operation documents with the implemented shared verification gate, retaining only unresolved external deployment evidence as a follow-up.
      cost_of_deferring: Planning reports a non-existent next implementation phase and can duplicate work.
      evidence:
        - commit 4a37a9f0
        - .github/actions/verify-site/action.yml
        - .github/workflows/ci.yml
        - .github/workflows/sync-calendar.yml
    - id: EXT-ARCH-001
      level: STRUCTURAL
      axis: ARCH
      status: open
      target: Cloudflare Pages and GitHub repository configuration outside the local repository
      problem: The repository proves verification completes before each automatic commit and skips duplicate bot CI, but it cannot prove Cloudflare waits for GitHub Actions or consumes only verified artifacts.
      fix: Inspect one automatic commit in GitHub Actions and its matching Cloudflare deployment timestamps/status, then record the observed publication contract; if Pages deploys directly from push, revise the Phase 6 exit criterion or configure an external gate.
      cost_of_deferring: The roadmap cannot truthfully claim that deployment only consumes verified artifacts.
      evidence:
        - calendar-resilience-roadmap.md:275-286
        - calendar-sync.md:407-411
        - technical-backlog.md:22
  verification:
    - corepack pnpm run test:sync-directed passed
    - corepack pnpm run test:unit:without-sync passed
    - corepack pnpm run test:unit:without-history-correction passed
    - corepack pnpm run typecheck passed
    - corepack pnpm run build passed, including SSR and generated routes
    - corepack pnpm run test:generated passed 5 tests
    - corepack pnpm run test:e2e passed 207 tests
  result: The repository implementation satisfies the internal CI-deduplication and human-push coverage portions of Phase 6. Completion of its deployment-artifact condition remains externally unverified, and documentation is stale.
  pending:
    - Verify the GitHub Actions-to-Cloudflare publication relationship for an automatic calendar commit.
    - Reconcile the canonical roadmap, operator guide, and technical backlog after that evidence is recorded or the exit criterion is revised.
  next: Inspect the external GitHub Actions and Cloudflare deployment records for one known automatic calendar commit.

```
