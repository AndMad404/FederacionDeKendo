# Federación de Asociaciones de Kendo de Costa Rica

Sitio institucional que sincroniza los eventos de Google Calendar, los normaliza y versiona, y genera páginas prerenderizadas y rutas optimizadas para buscadores, sin depender de un CMS tradicional.

[Visitar el sitio](https://fak-kendo.org/)

## Arquitectura

```text
Google Calendar → Sincronización → Normalización y validación → Estado versionado
      → Rutas y metadatos → SSR + prerender → Verificación → Publicación
```

El mismo árbol de componentes se usa en navegador y servidor: Vite genera el bundle del cliente y el bundle SSR (`src/entry-server.tsx`), `scripts/generate-route-html.mjs` prerenderiza las rutas públicas y `src/main.tsx` hidrata ese HTML en producción.

Las rutas estáticas y sus metadatos viven en `src/app/config/seo-data.json`; las de eventos y archivo histórico se derivan de los datos sincronizados.

## Decisiones de diseño

**Identidad vs. URL.** La identidad interna de un evento es independiente de su URL pública, así que un cambio editorial —como título o fecha— no se trata automáticamente como una entidad nueva. Si la edición cambia una URL ya publicada, la ruta anterior se conserva mediante redirect.

**Colisiones.** Títulos y fechas pueden producir URLs iguales o ambiguas; estas situaciones se detectan antes de publicar en lugar de resolverse silenciosamente.

**Eliminaciones.** Borrar un evento publicado puede romper URLs indexadas y enlaces externos, por lo que no se trata como equivalente a eliminar un registro local.

**Automatización acotada.** Lo derivable mediante reglas deterministas se automatiza; lo ambiguo o potencialmente destructivo pasa a revisión humana.

Estas decisiones sostienen el resto del pipeline: los datos inválidos no se publican, un fallo de sincronización no reemplaza contenido válido en silencio y el HTML generado se verifica como artefacto de producción antes de publicar.

## Diseño

La interfaz está construida con React y Tailwind CSS y se verifica en layouts de escritorio, tablet y móvil.

El diseño prioriza:

- navegación consistente entre resoluciones;
- páginas de eventos legibles y rastreables;
- controles táctiles y geometría responsive;
- galerías adaptadas a distintos tamaños de pantalla;
- imágenes responsive y activos optimizados;
- comportamiento visual verificable mediante pruebas automatizadas.

Las regresiones de geometría y comportamiento forman parte de `tests/design/`, mientras que las comparaciones visuales se ejecutan por separado debido a diferencias de rasterización entre plataformas.

## Pruebas y verificación

Las suites se separan por responsabilidad:

- `tests/architecture/`
- `tests/data/`
- `tests/behavior/`
- `tests/design/`

Las comparaciones visuales se mantienen aparte porque la rasterización cambia entre Windows y el entorno Ubuntu de CI. El detalle está documentado en [TESTING.md](TESTING.md).

Gate de release:

```bash
corepack pnpm run verify:site
```

Verifica formato, lint, tipos, build, pruebas, HTML generado y estado limpio del workspace.

## Stack

React 18 · TypeScript · React Router 7 · Tailwind CSS 4 · Vite 6 · Playwright · Node.js Test Runner · pnpm · GitHub Actions · Cloudflare Pages

## Desarrollo local

```bash
corepack pnpm install
corepack pnpm run dev
```

El proyecto corre con los datos versionados del repositorio y no requiere variables de entorno.

## Comandos principales

| Script | Uso |
| --- | --- |
| `dev` / `build` / `preview` | Desarrollo, build de producción y preview local |
| `verify:site` | Gate completo de verificación |
| `test:unit` / `test:all` / `test:visual` | Arquitectura y datos / suite completa / regresión visual |
| `lint` / `format` | Calidad de código; existen variantes `:fix` y `:check` |

## Actualización de contenido

- **Eventos:** `corepack pnpm run sync:calendar`, también ejecutado mediante GitHub Actions.
- **Rutas y SEO estáticos:** `src/app/config/seo-data.json`.
- **Dojos, galería y galerías de eventos:** `src/app/data/`.

## Licencia

El código se distribuye bajo MIT; consulta [LICENSE](LICENSE).

Las fotografías, logos y contenido institucional no están cubiertos por esa licencia; consulta [ASSETS-LICENSE.md](ASSETS-LICENSE.md).

Las licencias y atribuciones de terceros se mantienen en [ATTRIBUTIONS.md](ATTRIBUTIONS.md), y las convenciones del repositorio están documentadas en [CONTRIBUTING.md](CONTRIBUTING.md).