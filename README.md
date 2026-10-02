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
- En producción, `sitemap.xml`, `robots.txt` y `llms.txt` se regeneran desde el
  manifiesto de rutas e incorporan automáticamente los eventos publicados; los
  archivos de `public/` sirven como respaldo para desarrollo.
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
diseño. Para ejecutar una suite dirigida:

```bash
corepack pnpm run test:architecture
corepack pnpm run test:data
corepack pnpm run test:behavior
corepack pnpm run test:design
```

Las comparaciones visuales se ejecutan por separado con
`corepack pnpm run test:visual`.

Los flujos de calendario usan `verify:site -- --mode calendar`: datos,
reglas editoriales, tipos, build y funcionamiento bloquean la publicación.
Después del commit y push, `review:calendar-design` revisa el mismo build con
`test:calendar-layout`. Los problemas de diseño y las revisiones incompletas
producen avisos, correo y artefactos sin revertir los datos. Los avisos distinguen
el contenido guardado en Git del despliegue de Cloudflare, que no se confirma
desde esta revisión.

La página densa de Gasshuku calibra alturas de bloques y márgenes en las cuatro
presentaciones. Sus cantidades de texto, listas y fotos no son límites ni
producen avisos por sí solas. Las fixtures neutras varían carga de contenido,
dimensiones y proporciones de una imagen reutilizada; los contenedores conservan
su geometría independientemente del tamaño natural de la foto. La revisión
registra medidas incluso sin roturas y resume máximos observados por viewport,
separando calibración, fixtures y contenido generado. Los máximos son evidencia,
no topes de altura: se permite crecer con scroll vertical. Solo las roturas o
revisiones incompletas generan alertas. Informes y capturas quedan en
`test-results/` o en el directorio temporal del runner, fuera de `dist/`.
La sincronización y las utilidades de fechas y archivo se ejecutan mediante
`tsx` y se comprueban estrictamente con `typecheck`, incluidos los scripts.

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
