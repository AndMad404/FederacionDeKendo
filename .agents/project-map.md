# Project Scope Map

Use this file to discover the smallest useful scope when the user describes a
problem without naming files, routes, or tests. It is a routing aid, not proof
that every listed file was inspected.

## Scope Discovery

1. Match the request to one or more domains below.
2. Read the primary files for those domains only.
3. Follow imports, generated inputs, or shared consumers only when evidence
   shows they can affect the request.
4. Select the narrowest reproducing check, then the smallest final gate that
   covers the changed responsibility.
5. Expand beyond the selected domain only when the initial evidence requires
   it. State the reason for expansion.

Do not inspect every route by default. Treat scope as repository-wide only
when the user explicitly requests it or the concern affects the route shell,
route manifest, shared SEO generation, shared visual primitives, build output,
or another dependency consumed across routes.

## Scope Levels

- Local: one route, component, hook, utility, data source, or test concern.
- Shared: a dependency with multiple known consumers. Inspect the dependency
  and only the consumers relevant to the requested behavior.
- Repository-wide: all generated routes or a complete named axis. Record the
  exact inventory, inclusions, exclusions, baseline, and evidence before making
  a repository-wide claim.

## Route and Domain Routing

| Domain | Routes | Start with | Add when evidence requires it | Directed checks |
|---|---|---|---|---|
| Route shell and registry | All routes | `src/app/App.tsx`, `src/app/routeRegistry.client.tsx`, `src/entry-server.tsx` | `src/app/config/routeTypes.ts`, `src/app/config/routePresentation.ts`, shared navbar/footer | `pnpm run typecheck`; `pnpm run build`; relevant E2E file |
| Home and upcoming events | `/`, `/en/` | `src/app/components/HeroSection.tsx`, `src/app/components/UpcomingEventsSection.tsx` | `src/app/components/events/UpcomingEventCard.tsx`, event data and routes | `tests/e2e/events.spec.ts`; geometry or visual checks only when applicable |
| Calendar UI | `/calendario/`, `/en/calendar/` | `src/app/components/CalendarSection.tsx`, `src/app/components/calendar/` | calendar hooks, sharing hook, event presentation utilities and data | `tests/e2e/calendar-behavior.spec.ts`; `tests/e2e/navbar-calendar-menu.spec.ts` for menu behavior |
| Event archive and filters | `/eventos/pasados/`, `/en/events/past/`, paginated archive routes | `src/app/components/PastEventsSection.tsx`, `src/app/utils/eventArchive.js`, `src/app/utils/eventRoutes.ts` | localized events, SEO route generation | `tests/event-history-filters.test.mjs`; `tests/e2e/event-history-filters.spec.ts` |
| Event detail | `/eventos/<slug>/`, `/en/events/<slug>/` | `src/app/components/EventPage.tsx`, `src/app/utils/eventRoutes.ts` | calendar events, localized events, event galleries, SEO | `tests/e2e/events.spec.ts`; `tests/generated-output.test.mjs` when generated HTML or metadata changes |
| Gallery | `/galeria/`, `/en/gallery/` | `src/app/components/GallerySection.tsx`, `src/app/components/gallery/`, `src/app/data/gallery.ts` | lightbox and carousel hooks, responsive image script and assets | `tests/e2e/lightbox-behavior.spec.ts`; directed geometry/visual checks when approved |
| Affiliates | `/afiliados/`, `/en/affiliates/` | `src/app/components/AfiliadosSection.tsx`, `src/app/components/affiliates/`, `src/app/data/dojos.ts` | shared media banner and image assets | directed geometry/visual checks when applicable |
| Navigation and language | All paired Spanish/English routes | `src/app/components/Navbar.tsx`, `src/app/config/i18n.tsx`, `src/app/App.tsx` | route metadata and event route helpers | `tests/e2e/navbar-calendar-menu.spec.ts`; language cases in `tests/e2e/events.spec.ts` |
| SEO and generated routes | Configured and generated routes | `src/app/config/seo-data.json`, `src/app/config/seo.ts`, `scripts/generate-route-html.mjs` | `src/entry-server.tsx`, route utilities, visible source data represented in metadata | `pnpm run build`; `pnpm run test:generated` |
| Calendar synchronization | Generated calendar data and event routes | `scripts/sync-calendar-events.mjs`, `src/app/data/calendarEventRegistry.json`, `src/app/data/calendarEvents.ts` | sync workflow, event route/archive utilities, gallery state when the phase touches galleries | directed `tests/calendar-sync.test.mjs`; `tests/event-history-sync-contract.test.mjs` |
| Event gallery synchronization | Event galleries | `scripts/sync-event-galleries.mjs`, `src/app/data/eventGalleries.ts`, `src/app/data/eventGalleryState.json` | gallery assets and calendar synchronization contract | `pnpm run test:event-galleries`; `tests/event-history-sync-contract.test.mjs` |
| Responsive geometry | Only affected route designs unless a shared primitive changes | affected component plus `tests/e2e/design-contract.ts` | `src/app/styles/shared.ts`, shared shell/components and affected consumers | directed `tests/e2e/geometry-contract.spec.ts`; `tests/e2e/responsive-reachability.spec.ts` |
| Visual regression | Only owner-approved visual scope | affected component and approved baseline | `tests/e2e/visual-regression.spec.ts` and named snapshots | directed `pnpm run test:visual`; never update snapshots without approval |

Unknown paths use the `notFound` route implemented by
`src/app/components/NotFoundSection.tsx`. Its behavior is covered by
`tests/e2e/events.spec.ts`; its geometry and approved snapshots live with the
shared geometry and visual suites.

## Verification Selector

- TypeScript or React implementation: begin with `pnpm run typecheck`.
- Build, SSR, routes, SEO, or generated HTML: run `pnpm run build`.
- Calendar, history, or gallery data logic: run the named Node test file first;
  use `pnpm run test:unit` only for the final combined unit gate.
- Browser behavior: run the named file under `tests/e2e/` first; use
  `pnpm run test:e2e` when the change is ready for the broader browser gate.
- Visual behavior: follow `.agents/verification.md`; visual approval and clean
  change isolation are required before comparison or snapshot updates.

## Scope Summary Format

When discovery is requested, summarize in no more than ten lines:

```text
Concern: [interpreted problem]
Scope level: [local | shared | repository-wide]
Routes: [affected routes]
Primary files: [initial files]
Related files: [only evidence-based additions]
Directed checks: [smallest reproducing checks]
Excluded: [nearby work intentionally not inspected]
Reason to expand: [none, or explicit evidence]
```

