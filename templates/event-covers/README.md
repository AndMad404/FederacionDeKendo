# Event covers

## Sources and dependencies

- `v1/template.json` owns source paths, logo and figure layout, background
  color, dimensions and variants. Covers do not embed event names or tags.
- `v1/source.svg` is the calendar source (1448x1086, 4:3).
- `v1/kendoka-vertical.svg` is the archive source (900x1200, 3:4),
  renamed from `source-vertical.svg`. Update the template source path whenever
  renaming an SVG. Tests resolve this path from the template.
- `scripts/event-cover-svg.ts` extracts only `fondo-bandera` and `kendoka`,
  retaining their vector paths and group transforms. Source logo/title/tag
  placeholders are excluded. The generator overlays the official logo from
  `public/images/logo/fakcr-logo.png` using the template's logo layout.
- `scripts/generate-event-covers.ts` consumes those sources, calendar events,
  existing galleries, the approval configuration and Sharp. Only event IDs
  associate the shared artwork with events; titles and tags are not renderer inputs.
  `scripts/prepare-event-covers.ts` runs it only after approval.
- The generated `src/app/data/eventCovers.json` is read by
  `src/app/utils/eventThumbnail.ts` and then `EventThumbnail`, calendar cards
  and archive cards. Do not edit the manifest manually.

Existing gallery thumbnails or first gallery images take priority over generated
covers; official posters retain their poster classification. Unknown event IDs
have no generated cover. Approval is checked independently for each format.

## Shared output

Without embedded text, events share one illustration per format. There are six
WebP files under `public/images/event-covers/shared/`: calendar widths 640,
960 and 1448, and archive widths 450, 675 and 900. Names follow
`kendo-costa-rica-<fingerprint>-<format>-<width>.webp`. All eligible manifest
entries reference these same files. Titles and event details remain in HTML;
image alternative text is supplied by the thumbnail selector.

The kendoka is positioned lower and the logo is enlarged in both compositions.
The generator renders the logo separately, so update both the editable SVG logo
and template logo layout when changing its size. The source group transform owns
kendoka placement; the template figure dimensions remain the full canvas.

Fingerprints include template, illustration, logo, renderer, approval and Sharp
versions. Event IDs, names and tags do not affect the shared artwork fingerprint.
Complete unchanged outputs are reused. Missing variants regenerate; obsolete
files are removed only inside the generator-owned output directory. The renderer
has no title/tag layers, text-layout settings or font-loading dependency.
No AVIF cover variants or external AI/font services are used.

## Generation and verification

Run `pnpm run generate:event-covers` after changing sources or the template.
Build also prepares approved covers before Vite consumes the manifest.
The shared Actions gate prepares covers, runs `quality:fix`, then starts
immutable `verify:site`. For a direct local full verification use:

```powershell
pnpm exec tsx scripts/prepare-event-covers.ts
pnpm run quality:fix
pnpm run verify:site
```

The build inside the gate must reuse prepared outputs; generated changes during
verification invalidate its result. Retained font assets and `v1/OFL.txt` are not
loaded by the generator.

Relevant checks:

- `tests/data/event-cover-svg.test.mjs`: source layers and compositions.
- `tests/data/event-covers.test.mjs`: dimensions, shared URLs, six files,
  descriptive names, approval, alternative text and existing-artwork priority.
- `tests/architecture/event-cover-build.test.mjs`: build preparation/copying.
- `tests/architecture/calendar-workflow-architecture.test.mjs`: preparation
  precedes formatting and immutable verification.
- `tests/behavior/event-covers.spec.ts` and
  `tests/behavior/calendar-adaptive-cover.spec.ts`: responsive presentation.

Use `--samples` for one shared sample per approved format as isolated PNG/SVG
review artifacts, or
`--review-calendar <event-id>` for one calendar PNG. Neither publishes the
production manifest. Keep temporary review artifacts under `.cache/`.
