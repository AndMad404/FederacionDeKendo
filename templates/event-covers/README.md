# Event covers

Calendar covers (4:3) are approved and active for events without an official
poster. `src/app/config/eventCoverApproval.json` approves `calendar` independently;
`archive` is also approved with the reviewed vertical composition. The generator and build regenerate
only approved formats. Vite and guarded publication include both approved formats. Official posters always take priority, including Copa Shogun.

The editable source is `v1/source.svg`; its background, logo and text slots reflect
the reviewed design, with the original kendoka paths retained. Earlier review
assets are preserved. Both compositions have explicit owner approval.

The calendar remains the only source of event IDs, titles and event types.
`scripts/event-cover-model.ts` adapts that data for the renderer. It normalizes
Unicode and whitespace, rejects unsafe IDs and escapes Pango markup.

`v1/template.json` owns layout, palette, resource paths and output dimensions.
`v1/source.svg` (calendar) and `v1/source-vertical.svg` (archive) contain the user's separated `fondo-bandera` and `kendoka` groups.
`scripts/event-cover-svg.ts` extracts those groups without changing their paths.
The `logo`, `titulo` and `tag` placeholder groups are excluded; the official logo,
event title and event-type tag are overlaid dynamically using the source's slots.
The older `v1/kendoka.svg` is retained as an unused provisional reference. The official logo is
referenced from the existing site assets. The local TTF is Zen Kaku Gothic New
Bold from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/zenkakugothicnew),
distributed under the accompanying OFL license. Pango receives the TTF explicitly;
no font download is needed during generation.

Run `pnpm run generate:event-covers` after changing event data or the template.
Once approved, `pnpm run build` also generates covers before Vite consumes the manifest, so
all calendar, historical correction and editorial publication gates regenerate
after their data changes and before publishing. Never edit `calendarEvents.ts`
or `eventCovers.json` manually.

Outputs are WebP and AVIF in three widths for each format: calendar 4:3 and
archive 3:4. `src/app/data/eventCovers.json` owns their paths and dimensions,
separate from galleries. Fingerprints include normalized event input, template,
font, illustration, logo, renderer and Sharp versions. Unchanged complete outputs
are reused; missing variants regenerate; obsolete generated files are removed
only inside `public/images/event-covers/`. Keep this directory generator-owned.

Calendar uses the supplied source's native 1448x1086 canvas, with widths 640,
960 and 1448. Archive uses 900x1200 (3:4), a larger logo, a centered kendoka, a left-aligned multiline title and a bottom-right tag with 48px margins.
Calendar 4:3 replaces the earlier 16:9 proposal. The vertical SVG is the editable source for the archive illustration; template.json owns dynamic logo, title and tag slots.

Run `pnpm run generate:event-covers -- --samples` for PNG/SVG review artifacts in
`.cache/event-cover-samples/`, including a long accented title in both formats.
No AI service is used. Text is rasterized with the pinned font into the SVG
composition before Sharp produces optimized variants.

The approved display priority is official poster (`posterSource`) first,
otherwise the generated cover. Photographs remain in galleries and do not
replace a cover. `EventThumbnail` selects the calendar format by default; archive
cards request `format="archive"`. Titles stay aligned to the left.

To replace the design, add a versioned template directory, update `templateDir`
in the generator and regenerate. Colors and placement do not belong in event data.
