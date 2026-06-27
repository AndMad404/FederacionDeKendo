# Local images

These files are optimized web exports generated from the original images in:

`C:\Users\and_m\Documents\Profesional\Imagenes para la galeria de la federacion`

Recommended exports:

- Hero and section backgrounds: 1920x1080 minimum, 2560x1440 ideal.
- Mobile-specific backgrounds when added later: 1080x1350 or 1080x1920.
- Gallery images: 1600-2400 px on the long edge.
- Thumbnails, when split later: 320-480 px.
- Preferred formats for photos: WebP and AVIF.
- Keep descriptive filenames, dimensions in code, and meaningful alt text.

Current site images use WebP first, with JPG fallbacks for hero and affiliates.

## Responsive image processing

Responsive variants are generated from the committed JPG fallbacks in `public/images`.

Run:

```bash
pnpm images:responsive
```

If `pnpm` is not available directly in PowerShell, use:

```bash
corepack pnpm images:responsive
```

The script generates:

- `public/images/affiliates/kendo-affiliates-768.webp`
- `public/images/affiliates/kendo-affiliates-1200.webp`
- `public/images/gallery/thumbs/kendo-gallery-08-480.webp`
- `public/images/gallery/kendo-gallery-08-960.webp`
- `public/images/gallery/kendo-gallery-08-1600.webp`

If Windows reports an image as busy, close the browser, image previews, or local dev server using it and run the command again.
