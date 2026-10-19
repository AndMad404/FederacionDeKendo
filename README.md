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
diseño.

ESLint y Prettier pueden corregir el código automáticamente con
`corepack pnpm run quality:fix`. `quality:check` comprueba el resultado sin
modificar archivos y registra ambos diagnósticos aunque una herramienta falle.
Los reportes JSON versionados y Markdown quedan en `.cache/verification/`;
`VERIFY_SITE_REPORT_DIR` permite elegir otra carpeta ignorada o externa al repo.
El gate construye antes de ejecutar una sola suite Node y una sola invocación
Playwright por modo; `check` es un alias de `verify:site`.

Actions aplica las correcciones antes del gate y retiene reportes y un parche
durante 30 días. En pushes a `main`, un job separado guarda las correcciones
verificadas; en PR entrega el parche sin escribir. Los flujos del calendario
incluyen las correcciones en su commit. Las escrituras comparten bloqueo y
rechazan cambios fuera de los paths aprobados o una rama que haya avanzado.
Un fallo restante detiene el autocommit y deja evidencia recuperable.
Cloudflare mantiene el despliegue directo; los reportes distinguen guardar en
Git de confirmar un despliegue. El token de Actions no dispara otro CI con su
push: la evidencia del árbol verificado y del commit final queda en el run original.

Para ejecutar una suite dirigida:

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

Las alertas de verificación y publicación se emiten solo si esa etapa falló.
Si Gmail rechaza la autenticación, revisar `CALENDAR_ALERT_SMTP_USERNAME` y
renovar `CALENDAR_ALERT_SMTP_APP_PASSWORD` con una contraseña de aplicación de
la misma cuenta. El envío elimina los espacios de agrupación de esa contraseña;
el resultado indica si el commit y push terminaron y conserva las alertas en
`calendar-notification-reports`, incluso si el correo falla.

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
