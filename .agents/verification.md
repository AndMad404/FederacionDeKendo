# Verification Guide

Use the narrowest verification that proves the requested change.

Use the repository package manager, `pnpm`. If it is not available directly in Windows PowerShell, prefix the same command with `corepack` (for example, `corepack pnpm run build`).

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

1. Restate the approved baseline and identify its source.
2. Inspect the affected route at every target viewport named in the task.
3. Compare the relevant outer margins, internal padding, gaps, dimensions,
   alignment, component composition, tokens, and interactive states.
4. Check document and component overflow, including content at its expected
   maximum or variable length.
5. Capture or record reproducible visual evidence when practical and list any
   intentional deviation from the baseline.

An exact, narrowly scoped correction needs only the affected viewport and
nearby regression checks. A change to a shared primitive or responsive rule
must also inspect its affected consumers. A successful typecheck or build does
not prove visual correctness.

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

At 1366x768, verify for every route that:

- The navbar, main content, and footer are visible in the same viewport.
- `document.documentElement.scrollHeight` equals its `clientHeight`.
- The route's primary section does not have hidden or scrollable vertical
  overflow (`scrollHeight` equals `clientHeight`).
- Variable-length content remains reachable through an explicit bounded
  interaction rather than desktop vertical scrolling.

For landscape-specific issues, do not treat scaled portrait behavior as proof.

## When Not To Claim Done

Do not claim a production issue is fixed from local `dist` alone when the user reported live behavior. Verify the deployed URL, headers, or redirect chain when the issue depends on production.
