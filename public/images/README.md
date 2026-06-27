# Local images

These files are optimized web exports generated from the original images in:

`C:\Users\and_m\Documents\Profesional\Imagenes para la galeria de la federacion`

Recommended exports:

- Hero and section backgrounds: 1920x1080 minimum, 2560x1440 ideal.
- Mobile-specific backgrounds when added later: 1080x1350 or 1080x1920.
- Gallery images: 1600-2400 px on the long edge.
- Thumbnails: 160, 320, and 480 px widths.
- Preferred formats for photos: WebP and AVIF.
- Keep descriptive filenames, dimensions in code, and meaningful alt text.

Current site images use AVIF first where available, WebP next, with JPG fallbacks for hero and affiliates.

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

- `public/images/affiliates/kendo-affiliates-768.avif`
- `public/images/affiliates/kendo-affiliates-1200.avif`
- `public/images/affiliates/kendo-affiliates-768.webp`
- `public/images/affiliates/kendo-affiliates-1200.webp`
- `public/images/gallery/thumbs/kendo-gallery-01-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-01-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-01-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-02-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-02-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-02-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-03-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-03-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-03-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-04-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-04-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-04-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-05-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-05-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-05-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-06-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-06-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-06-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-07-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-07-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-07-480.webp`
- `public/images/gallery/thumbs/kendo-gallery-08-160.webp`
- `public/images/gallery/thumbs/kendo-gallery-08-320.webp`
- `public/images/gallery/thumbs/kendo-gallery-08-480.webp`
- `public/images/gallery/kendo-gallery-08-960.webp`
- `public/images/gallery/kendo-gallery-08-1600.webp`

If Windows reports an image as busy, close the browser, image previews, or local dev server using it and run the command again.
