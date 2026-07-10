# Federacion de Asociaciones de Kendo

Sitio oficial de la Federacion de Asociaciones de Kendo, desarrollado con React, TypeScript, Tailwind CSS y Vite a partir del diseño base en Figma.

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

## Imagenes de galeria

Las variantes responsive de las imagenes LCP se generan desde los JPG fallback versionados en `public/images`.

Genera las variantes:

```bash
pnpm images:responsive
```

Si `pnpm` no esta disponible directo en PowerShell, usa:

```bash
corepack pnpm images:responsive
```

Esto genera las variantes usadas por `srcSet` en Home, Galeria y Afiliados.

Las rutas LCP usan variantes responsive:

- `public/images/gallery/thumbs/kendo-gallery-08-480.webp`
- `public/images/gallery/kendo-gallery-08-960.webp`
- `public/images/gallery/kendo-gallery-08-1600.webp`
- `public/images/affiliates/kendo-affiliates-768.webp`
- `public/images/affiliates/kendo-affiliates-1200.webp`

Si Windows reporta una imagen como ocupada, cierra el navegador, vistas previas o el servidor local que la este usando y vuelve a correr el comando.
