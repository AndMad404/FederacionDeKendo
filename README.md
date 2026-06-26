# Federacion de Asociaciones de Kendo

Sitio oficial de la Federacion de Asociaciones de Kendo, desarrollado con React, TypeScript, Tailwind CSS y Vite a partir del diseno base en Figma.

## Desarrollo

Instala dependencias:

```bash
pnpm install
```

Inicia el servidor local:

```bash
pnpm dev
```

Genera el build de produccion:

```bash
pnpm build
```
<<<<<<< HEAD

## Imagenes de galeria

Los originales de galeria se trabajan solo en local y no se suben al repo.

1. Copia las fotos originales a `local/image-originals/` con estos nombres:

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

2. Ejecuta:

```bash
pnpm images:gallery
```

Si `pnpm` no esta disponible directo en PowerShell, usa:

```bash
corepack pnpm images:gallery
```

Esto genera los banners optimizados, los WebP de galeria, thumbnails, actualiza `src/app/data/gallery.ts` y deja un manifiesto local en `local/gallery-manifest.ts` para revision.

El script conserva los datos editoriales existentes de la galeria: `title`, `tag`, `likes`, `objectPosition` y `date`.

Si Windows reporta una imagen como ocupada, cierra el navegador, vistas previas o el servidor local que la este usando y vuelve a correr el comando.
=======
>>>>>>> parent of 6186d40b (Merge pull request #8 from AndMad404/fixes_lighthouse)
