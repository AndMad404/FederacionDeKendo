# Federación de Asociaciones de Kendo de Costa Rica

Plataforma web institucional que sincroniza eventos desde Google Calendar,
genera rutas prerenderizadas y publica contenido versionado sin depender de un
CMS. [Sitio en producción](https://fak-kendo.org/).

## Arquitectura

```text
Google Calendar → sincronización y validación → datos versionados
                → React Router → SSR y prerender → Cloudflare Pages
```

- React comparte el árbol de componentes entre navegador y servidor.
- Vite genera los bundles cliente y SSR; `scripts/generate-route-html.mjs`
  materializa las rutas públicas.
- Las rutas estáticas y sus metadatos se definen en
  `src/app/config/seo-data.json`; las rutas de eventos se derivan de los datos
  sincronizados.
- La identidad de un evento está desacoplada de su URL. Los cambios de URL
  conservan redirects y las colisiones bloquean la publicación.
- Una sincronización inválida no reemplaza el último estado válido. El HTML
  generado se verifica antes del despliegue.

## Stack

React 18 · TypeScript · React Router 7 · Tailwind CSS 4 · Vite 6 · Playwright ·
Node.js Test Runner · pnpm · GitHub Actions · Cloudflare Pages

## Desarrollo

```bash
corepack pnpm install
corepack pnpm run dev
```

El entorno local usa los datos versionados del repositorio y no requiere
variables de entorno.

## Verificación

```bash
corepack pnpm run verify:site
```

Este gate ejecuta formato, lint, tipos, build, pruebas y validación del output
generado. Las suites están separadas por arquitectura, datos, comportamiento y
diseño; consulta [TESTING.md](TESTING.md) para los comandos dirigidos.

## Estructura

| Ruta                 | Responsabilidad                                           |
| -------------------- | --------------------------------------------------------- |
| `src/app/`           | UI, rutas, configuración y datos versionados              |
| `scripts/`           | Sincronización, prerender y verificación                  |
| `tests/`             | Contratos de arquitectura, datos, comportamiento y diseño |
| `.github/workflows/` | Integración continua y sincronización programada          |

## Licencia

El código usa licencia [MIT](LICENSE). Fotografías, logos y contenido
institucional se rigen por [ASSETS-LICENSE.md](ASSETS-LICENSE.md); las
dependencias y recursos de terceros se detallan en
[ATTRIBUTIONS.md](ATTRIBUTIONS.md).
