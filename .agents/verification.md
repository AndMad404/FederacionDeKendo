# Verification Guide

Use the narrowest verification that proves the requested change.

Use the repository package manager, `pnpm`. If it is not available directly in Windows PowerShell, prefix the same command with `corepack` (for example, `corepack pnpm run build`).

Tests that execute OS-exclusive primitives must run only on that OS. Cross-platform structural guarantees must continue to be validated statically in CI.

## Mandatory Delivery Gate

Before reporting an implementation as ready, select every applicable check in
this guide and in `.agents/project-map.md`, then run all of them successfully.
Do not treat a successful build, typecheck, or partial test run as completion
when the changed responsibility has a directed test.

If any required check fails or cannot run, report the change as incomplete,
name the exact check and reason, and do not present the code as ready to ship.
The final report must list the checks that passed.

Run the complete shared gate with `pnpm run verify:site`. It executes its
checks sequentially, repeats the formatting check at the end, rejects flaky
Playwright results, and verifies that tracked or unignored workspace content
did not change during verification. Any edit after the gate starts invalidates
all of its results; inspect the diff and rerun the complete gate.

## Default Commands

For TypeScript or React changes:

```powershell
pnpm run typecheck
pnpm run build
```

For build-only/static output changes:

```powershell
pnpm run build
```

For responsive image pipeline changes:

```powershell
pnpm run images:responsive
pnpm run build
```

## SEO and Generated HTML Checks

After SEO/head changes:

```powershell
pnpm run build
rg -n "<title>|canonical|og:|twitter:|application/ld\\+json|google-site-verification" index.html dist src public
```

For route-title changes, inspect at least:

```text
dist/index.html
dist/galeria/index.html
dist/afiliados/index.html
```

## Accessibility Checks

For semantic or interactive UI changes, inspect:

- Meaningful heading hierarchy
- One visible `h1` per route
- Button/link keyboard behavior
- Descriptive labels for icon-only controls
- Decorative images use empty alt text
- Meaningful images use descriptive alt text

## Visual Change Checks

For layout, spacing, component, or style changes:

1. Record the owner's explicit approval for the exact intended visual change.
2. Restate the approved baseline and identify its source.
3. Inspect the affected route at every target viewport named in the task.
4. Compare the relevant outer margins, internal padding, gaps, dimensions,
   alignment, component composition, tokens, and interactive states.
5. Check document and component overflow, including content at its expected
   maximum or variable length.
6. Capture or record reproducible visual evidence when practical and list any
   intentional deviation from the baseline.
7. Inspect the screenshot diff itself, not only the changed-pixel count. Map
   every material changed region to an explicitly authorized requirement.

An exact, narrowly scoped correction needs only the affected viewport and
nearby regression checks. A change to a shared primitive or responsive rule
must also inspect its affected consumers. A successful typecheck or build does
not prove visual correctness.

### Automated design-contract gate

`tests/design/geometry-contract.spec.ts` is the default executable contract for
the approved application design:

- It discovers every generated `dist/**/index.html` route automatically and
  enforces the strict 1366x768 shell, overflow, heading-boundary, footer, and
  no-scroll rules on bounded routes. Event-detail routes instead enforce
  normal document flow with no clipped content or nested vertical scrolling.
- One representative of every page design (`home`, `calendar`, `gallery`,
  `affiliates`, `event`, `pastEvents`, and `notFound`) is checked at 360x800,
  390x844, 768x1024, and 1366x768.
- Representative checks assert approved padding, margins, gaps, containment,
  content presence, link/image validity, unique IDs, and accessible control names.
- The values in `tests/design/design-contract.ts` describe the owner-approved
  current application. Changing a value requires the same explicit approval
  as changing the corresponding visual implementation.

Run the complete gate with:

```powershell
pnpm run build
pnpm run test:design
```

The platform-sensitive screenshot collection remains available as a directed
manual review:

```powershell
pnpm run test:visual
```

It is intentionally excluded from the default CI gate. Use it only in the
Windows environment where the approved snapshots were generated. A screenshot
failure never authorizes updating a baseline by itself.

Never update screenshot baselines merely to make a failing test pass. After
the owner explicitly approves an intentional visual change, regenerate them
with `pnpm run test:visual -- --update-snapshots`, inspect the changed images, and commit
the reviewed baselines with the implementation.

Visual comparisons fail closed:

- One expected difference does not waive unexpected differences elsewhere in
  the same screenshot.
- If the worktree contains unrelated visual changes, the result cannot verify
  a narrow change until that patch is isolated or the combined scope is
  explicitly approved.
- A reviewer must inspect expected, actual, and diff images before describing a
  failure as intentional.
- Structural assertions passing do not override a screenshot failure.
- Do not regenerate baselines from a mixed or partially approved worktree.

## Responsive Checks

Use real route checks for:

- `/`
- `/calendario`
- `/galeria`
- `/afiliados`

Preferred viewport matrix:

- 360x800
- 390x844
- 768x1024
- 1366x768

At 1366x768, verify for every bounded route that:

- The navbar, main content, and footer are visible in the same viewport.
- `document.documentElement.scrollHeight` equals its `clientHeight`.
- The route's primary section does not have hidden or scrollable vertical
  overflow (`scrollHeight` equals `clientHeight`).
- Variable-length content remains reachable through an explicit bounded
  interaction rather than desktop vertical scrolling.
- Any primary surface marked with `data-page-content-boundary` begins at or
  below the bottom edge of the route `h1`.

For event-detail routes at 1366x768, verify instead that:

- The document owns any required vertical overflow.
- The event surface does not clip its description or optional gallery.
- No nested vertical scroll container is introduced.
- The footer remains reachable after the complete event content.

For landscape-specific issues, do not treat scaled portrait behavior as proof.

## When Not To Claim Done

Do not claim a production issue is fixed from local `dist` alone when the user reported live behavior. Verify the deployed URL, headers, or redirect chain when the issue depends on production.
