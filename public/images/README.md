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
<<<<<<< HEAD

## Gallery processing

Gallery source images are local-only and should not be committed.

1. Put original images in `local/image-originals/` with these exact official names:

```text
Afiliados Banner.jpg
Hero Banner.jpg
Kendo Gallery (1).jpeg
Kendo Gallery (2).jpg
Kendo Gallery (3).jpg
Kendo Gallery (4).jpg
Kendo Gallery (5).jpeg
Kendo Gallery (6).JPG
Kendo Gallery (7).JPG
Kendo Gallery (8).jpeg
```

2. Run:

```bash
pnpm images:gallery
```

If `pnpm` is not available directly in PowerShell, use:

```bash
corepack pnpm images:gallery
```

The script generates:

- `public/images/hero/kendo-hero.webp`
- `public/images/hero/kendo-hero.jpg`
- `public/images/affiliates/kendo-affiliates.webp`
- `public/images/affiliates/kendo-affiliates.jpg`
- `public/images/gallery/<name>.webp`
- `public/images/gallery/thumbs/<name>-480.webp`
- `src/app/data/gallery.ts`
- `local/gallery-manifest.ts`

The script preserves existing gallery editorial data: `title`, `tag`, `likes`, `objectPosition`, and `date`. Review `local/gallery-manifest.ts` only as a local audit file.

If Windows reports an image as busy, close the browser, image previews, or local dev server using it and run the command again.
=======
>>>>>>> parent of 6186d40b (Merge pull request #8 from AndMad404/fixes_lighthouse)
