# Federacion de Asociaciones de Kendo

Sitio oficial de la Federacion de Asociaciones de Kendo de Costa Rica.

[Visitar el sitio](https://fak-kendo.pages.dev)

## Funcionalidad

- Contenido completo en espanol e ingles.
- Calendario de torneos, examenes, seminarios y actividades.
- Paginas individuales y archivo para eventos pasados.
- Galeria principal y galerias historicas por evento.
- Directorio de dojos afiliados con horarios, ubicacion y contacto.
- HTML prerenderizado, metadatos por ruta, datos estructurados y sitemap.
- Imagenes responsive en WebP y AVIF.

## Tecnologias

- React 18 y TypeScript
- React Router 7
- Tailwind CSS 4
- Vite 6
- Playwright y Node.js Test Runner
- ESLint y Prettier
- pnpm 11

## Desarrollo local

Requisitos:

- Node.js compatible con las dependencias del proyecto
- Corepack habilitado

Instala las dependencias e inicia el servidor:

```bash
corepack pnpm install
corepack pnpm run dev
```

Vite mostrara en la terminal la direccion local de la aplicacion.

## Comandos principales

Ejecuta cada script con `corepack pnpm run <nombre>`.

| Script              | Proposito                                                           |
| ------------------- | ------------------------------------------------------------------- |
| `dev`               | Inicia el entorno de desarrollo.                                    |
| `build`             | Genera el bundle, el render SSR y las paginas prerenderizadas.      |
| `preview`           | Sirve localmente el build de produccion.                            |
| `check`             | Ejecuta todas las comprobaciones de calidad y pruebas no visuales.  |
| `typecheck`         | Comprueba los tipos de TypeScript.                                  |
| `lint`              | Ejecuta ESLint sin permitir advertencias.                           |
| `format:check`      | Comprueba el formato con Prettier.                                  |
| `test:all`          | Ejecuta las suites de arquitectura, datos, comportamiento y diseno. |
| `test:visual`       | Ejecuta las comparaciones visuales aprobadas en Windows.            |
| `images:responsive` | Regenera las variantes responsive y los hashes de las imagenes.     |

La estrategia completa, los viewports cubiertos y el procedimiento para
actualizar capturas estan documentados en [TESTING.md](TESTING.md).

## Arquitectura y prerender

La aplicacion usa el mismo arbol de React en el navegador y en el servidor:

1. Vite genera el bundle del navegador en `dist/`.
2. Vite genera el bundle SSR desde `src/entry-server.tsx` en `dist-ssr/`.
3. `scripts/generate-route-html.mjs` prerenderiza las rutas publicas y genera
   el sitemap.

`src/app/config/seo-data.json` es la fuente principal de rutas estaticas y
metadatos. Las rutas de eventos y del archivo se derivan de los datos del
calendario. En produccion, `src/main.tsx` hidrata el HTML generado; durante el
desarrollo crea la aplicacion dentro de un contenedor vacio.

## Pruebas y calidad

Antes de proponer un cambio, ejecuta como minimo los controles rapidos:

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run format:check
```

Para comprobar la aplicacion completa:

```bash
corepack pnpm run build
corepack pnpm run check
```

Las pruebas se dividen por responsabilidad:

- `tests/architecture/`: limites internos y flujos del repositorio.
- `tests/data/`: contenido, SEO, sincronizacion y salidas generadas.
- `tests/behavior/`: navegacion, idiomas, calendario y accesibilidad funcional.
- `tests/design/`: geometria responsive, controles tactiles y capturas.

La suite visual se mantiene separada porque la rasterizacion difiere entre
Windows y el entorno Ubuntu de CI.

## Actualizacion de contenido

- Las rutas y los metadatos estaticos viven en
  `src/app/config/seo-data.json`.
- Los eventos se sincronizan mediante `corepack pnpm run sync:calendar` y los
  workflows de GitHub Actions.
- Los datos de dojos viven en `src/app/data/dojos.ts`.
- La galeria principal vive en `src/app/data/gallery.ts`.
- Las galerias de eventos viven en `src/app/data/eventGalleries.ts`.

Los cambios de rutas, SEO, calendario o imagenes deben verificarse tambien en
el HTML generado por el build.

## Contribuciones

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer los controles de
pre-commit y la convencion de mensajes de commit. No se requiere un archivo de
variables de entorno para ejecutar el sitio localmente con los datos
versionados.
