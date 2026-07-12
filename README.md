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

## Prerender e hidratacion

El build genera HTML inicial para Inicio, Galeria, Afiliados y la pagina 404:

1. Vite crea el bundle del navegador en `dist/`.
2. Vite crea el bundle SSR desde `src/entry-server.tsx` en `dist-ssr/`.
3. `scripts/generate-route-html.mjs` renderiza cada ruta e inserta el contenido en su archivo HTML.

`src/app/App.tsx` define el mismo arbol de componentes para el servidor y el navegador. No dupliques las rutas o el layout en `entry-server.tsx`, porque cualquier diferencia provoca errores de hidratacion.

El arranque de `src/main.tsx` depende del contenido de `#root`:

- En desarrollo, Vite sirve un contenedor vacio y React usa `createRoot`.
- En los archivos prerenderizados de produccion, el contenedor ya tiene HTML y React usa `hydrateRoot`.

Despues de cambiar rutas, layout compartido o SSR, ejecuta:

```bash
pnpm run typecheck
pnpm build
```

Verifica que `dist/index.html`, `dist/galeria/index.html`, `dist/afiliados/index.html` y `dist/404.html` contengan el body esperado. En el navegador no deben aparecer errores de hidratacion `#418` o `#423`.

## Arquitectura SEO

`src/app/config/seo-data.json` es la fuente principal de configuracion para las rutas indexables. Cada registro incluye la ruta, el componente asociado, los metadatos, la imagen social, la imagen LCP que debe precargarse y el tipo base de Schema.org.

`src/app/config/seo.ts` valida esa configuracion y genera:

- el manifiesto que consume React Router;
- canonical, robots, Open Graph y Twitter Cards;
- el grafo JSON-LD base;
- una descripcion comun de etiquetas para el navegador y el prerender.

El build usa el mismo manifiesto para generar las paginas HTML y `dist/sitemap.xml`. No edites un sitemap manual en `public/`: al agregar o eliminar una ruta indexable, actualiza `seo-data.json` y el sitemap se regenerara con `pnpm build`.

Para incorporar una nueva pagina:

1. Agrega su identificador a `RouteComponent` y su componente a `ROUTE_COMPONENTS`.
2. Agrega un registro completo en `seo-data.json`.
3. Ejecuta `pnpm run typecheck` y `pnpm build`.
4. Comprueba que aparezca en `dist/sitemap.xml` y que su HTML tenga una sola description, robots, canonical y bloque JSON-LD.

Las entidades estructuradas especificas de una ruta se agregan mediante `ROUTE_STRUCTURED_DATA_BUILDERS`. Solo deben representar informacion visible, verdadera y aprobada.

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
