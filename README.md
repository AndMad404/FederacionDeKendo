# Federacion de Asociaciones de Kendo

Sitio oficial de la Federacion de Asociaciones de Kendo, desarrollado con React, TypeScript, Tailwind CSS y Vite.

## Referencia visual

La referencia visual es la aplicacion vigente junto con las medidas, capturas y resultados renderizados aprobados por el propietario.

Un rediseño futuro debe partir del producto aprobado, cubrir las rutas y viewports soportados, documentar tokens, componentes y estados interactivos, y recibir aprobacion explicita antes de convertirse en una fuente de diseño.

## Desarrollo

Este repositorio usa pnpm. Si `pnpm` no esta disponible directamente en PowerShell, usa `corepack pnpm` con los mismos argumentos.

Instala dependencias:

```bash
pnpm install
```

Inicia el servidor local:

```bash
pnpm run dev
```

Genera el build de produccion:

```bash
pnpm run build
```

## Calidad de codigo

ESLint y Prettier son gates obligatorios del CI. ESLint rechaza tanto errores
como advertencias; Prettier comprueba que los archivos incluidos conserven el
formato reproducible del proyecto. Ejecuta localmente los mismos comandos que
usa CI antes de enviar cambios:

```bash
pnpm run lint
pnpm run format:check
```

Prettier comprobara y formateara solo archivos fuente versionados. Directorios
generados o transitorios como `dist/`, `dist-ssr/`, `node_modules/` y resultados
de pruebas se excluiran para evitar cambios mecanicos que se regeneran en cada
build o ejecucion de pruebas.

Aplica el formato a los archivos incluidos:

```bash
pnpm run format
```

## Pruebas

Las pruebas se agrupan por la responsabilidad que demuestran: arquitectura,
datos, comportamiento y diseno. Las capturas aprobadas se ejecutan por separado
en Windows para evitar diferencias de renderizado con el CI de Ubuntu.

```bash
pnpm run build
pnpm run test:architecture
pnpm run test:data
pnpm run test:behavior
pnpm run test:design
pnpm run test:all
pnpm run test:visual
```

Consulta [TESTING.md](TESTING.md) para conocer la estrategia completa, el
comportamiento ante eventos nuevos y el proceso aprobado para cambiar medidas
o capturas.

### Diagnostico opcional con Knip

Knip 6.29.0 se usa como herramienta global de diagnostico del entorno local; no
es una dependencia del proyecto ni participa en desarrollo, CI, build o
postbuild. La configuracion `knip.json` permanece en la raiz del repositorio
porque describe su entrada SSR especifica.

En una maquina nueva, instala la herramienta y ejecuta el analisis:

```bash
npm install --global knip@6.29.0
knip
```

No muevas `knip.json` al directorio global de npm: sus rutas pertenecen a este
repositorio y una actualizacion global podria reemplazar archivos en esa
ubicacion.

## Prerender e hidratacion

El build genera HTML inicial para todas las rutas publicas del manifiesto, incluidas las paginas principales, los eventos y su archivo, ademas de la pagina 404:

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
pnpm run build
```

Verifica que `dist/index.html`, `dist/galeria/index.html`, `dist/afiliados/index.html` y `dist/404.html` contengan el body esperado. En el navegador no deben aparecer errores de hidratacion `#418` o `#423`.

## Arquitectura SEO

`src/app/config/seo-data.json` es la fuente principal de configuracion para las rutas estaticas. Cada registro incluye la ruta, el componente asociado, los metadatos, la imagen social, la imagen LCP que debe precargarse y el tipo base de Schema.org. Las rutas de eventos y del archivo se derivan de los datos del calendario.

`src/app/config/seo.ts` valida esa configuracion y genera:

- el manifiesto que consume React Router;
- canonical, robots, Open Graph y Twitter Cards;
- el grafo JSON-LD base;
- una descripcion comun de etiquetas para el navegador y el prerender.

El build usa el mismo manifiesto para generar las paginas HTML y `dist/sitemap.xml`. El sitemap enumera todas las rutas publicas aunque la politica temporal del sitio mantenga su HTML en `noindex, nofollow`. No edites un sitemap manual en `public/`: las rutas estaticas provienen de `seo-data.json` y los eventos se incorporan automaticamente desde los datos del calendario en el siguiente build.

Para incorporar una nueva pagina:

1. Agrega su identificador a `RouteComponent` y su componente a `ROUTE_COMPONENTS`.
2. Agrega un registro completo en `seo-data.json`.
3. Ejecuta `pnpm run typecheck` y `pnpm run build`.
4. Comprueba que aparezca en `dist/sitemap.xml` y que su HTML tenga una sola description, robots y canonical. Mientras continue la politica temporal `noindex`, el JSON-LD se omite.

Las entidades estructuradas especificas de una ruta se agregan mediante `ROUTE_STRUCTURED_DATA_BUILDERS`. Solo deben representar informacion visible, verdadera y aprobada.

## Imagenes de galeria

Las variantes responsive de las imagenes LCP se generan desde los JPG fallback versionados en `public/images`.

Genera las variantes:

```bash
pnpm run images:responsive
```

Si `pnpm` no esta disponible directo en PowerShell, usa:

```bash
corepack pnpm run images:responsive
```

Esto genera las variantes usadas por `srcSet` en Home, Galeria y Afiliados.

Las rutas LCP usan variantes responsive:

- `public/images/gallery/thumbs/kendo-gallery-08-480.webp`
- `public/images/gallery/kendo-gallery-08-960.webp`
- `public/images/gallery/kendo-gallery-08-1600.webp`
- `public/images/affiliates/kendo-affiliates-768.webp`
- `public/images/affiliates/kendo-affiliates-1200.webp`

### Contrato responsive del pie de galeria

`src/app/components/gallery/FeaturedImage.tsx` mantiene un pie superpuesto con
reglas explicitas por viewport:

- Movil, antes de `sm`: composicion centrada en una columna, padding de 10 px
  (`p-2.5`), titulo y tag de 20 px, descripcion visible, accion centrada y
  contador a 10 px del borde derecho.
- Tablet y escritorio, desde `sm`: dos columnas y tres filas. Titulo y tag
  comparten tamano de 24 px y linea base en la primera fila; la descripcion
  ocupa la segunda; accion y contador comparten linea base en la tercera. La
  fila inferior conserva 10 px de separacion sobre la descripcion.
- Landscape compacto (`orientation: landscape` y `max-height: 640px`):
  cuadricula de dos columnas y dos filas. La descripcion se oculta; titulo y
  tag comparten tamano de 16 px y linea base arriba, y accion y contador se
  alinean abajo.

Al modificar este pie, verifica al menos `386x669`, `669x386`, `768x1024` y
`1366x768`. El documento y el carrusel no deben tener overflow horizontal, y
el modo landscape debe conservar sus dos filas dentro del viewport.

Si Windows reporta una imagen como ocupada, cierra el navegador, vistas previas o el servidor local que la este usando y vuelve a correr el comando.
