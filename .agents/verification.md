# Verification Guide

Use the narrowest verification that proves the requested change.

## Default Commands

For TypeScript or React changes:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

For build-only/static output changes:

```powershell
npm.cmd run build
```

For responsive image pipeline changes:

```powershell
npm.cmd run images:responsive
npm.cmd run build
```

## SEO and Generated HTML Checks

After SEO/head changes:

```powershell
npm.cmd run build
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

## Responsive Checks

Use real route checks for:

- `/`
- `/galeria`
- `/afiliados`

Preferred viewport matrix:

- 360x800
- 390x844
- 768x1024
- 1366x768

For landscape-specific issues, do not treat scaled portrait behavior as proof.

## When Not To Claim Done

Do not claim a production issue is fixed from local `dist` alone when the user reported live behavior. Verify the deployed URL, headers, or redirect chain when the issue depends on production.
