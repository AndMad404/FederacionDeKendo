Federación de Asociaciones de Kendo de Costa Rica

Plataforma web institucional que sincroniza eventos desde Google Calendar, genera rutas prerenderizadas y publica contenido versionado sin depender de un CMS. Sitio en producción.

Arquitectura
text
Google Calendar → sincronización y validación → datos versionados
→ React Router → SSR y prerender → Cloudflare Pages
React comparte el árbol de componentes entre navegador y servidor.
Vite genera los bundles cliente y SSR; scripts/generate-route-html.mjs materializa las rutas públicas.
Las rutas estáticas y sus metadatos se definen en src/app/config/seo-data.json; las rutas de eventos se derivan de los datos sincronizados.
En producción, sitemap.xml, robots.txt y llms.txt se regeneran desde el manifiesto de rutas e incorporan automáticamente los eventos publicados. Los archivos de public/ sirven como respaldo para desarrollo.
La identidad de un evento está desacoplada de su URL. Los cambios de URL conservan redirects y las colisiones bloquean la publicación.
Una sincronización inválida no reemplaza el último estado válido. El HTML generado se verifica antes del despliegue.

El detalle de eventos, galerías y sincronización del calendario está en docs/calendario.md.

Stack

React · TypeScript · React Router · Tailwind CSS · Vite · Playwright · Node.js Test Runner · pnpm · GitHub Actions · Cloudflare Pages

Las versiones vigentes están en package.json.

Desarrollo
bash
corepack pnpm install
corepack pnpm run dev

El entorno local usa los datos versionados del repositorio y no requiere variables de entorno.

Verificación
bash
corepack pnpm run verify:site

Este gate ejecuta formato, lint, tipos, build, pruebas y validación del output generado. Las suites están separadas por arquitectura, datos, comportamiento y diseño, y pueden ejecutarse por separado:

bash
corepack pnpm run test:architecture
corepack pnpm run test:data
corepack pnpm run test:behavior
corepack pnpm run test:design

Para corregir el formato y el lint automáticamente:

bash
corepack pnpm run quality:fix

Los reportes de verificación se escriben en .cache/verification/. El funcionamiento de la integración continua, las alertas y la sincronización programada está documentado en docs/verificacion.md.

Estructura
Ruta Responsabilidad
src/app/ UI, rutas, configuración y datos versionados
public/ Archivos estáticos y respaldos para desarrollo
scripts/ Sincronización, prerender y verificación
tests/ Contratos de arquitectura, datos, comportamiento y diseño
docs/ Contratos y documentación operativa
.github/workflows/ Integración continua y sincronización programada
Licencia

El código usa licencia MIT. Fotografías, logos y contenido institucional se rigen por ASSETS-LICENSE.md; las dependencias y recursos de terceros se detallan en ATTRIBUTIONS.md.
