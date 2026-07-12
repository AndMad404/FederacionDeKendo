# Nota de calidad de las capturas del PDF SEO

**Sitio documentado:** https://fak-kendo.pages.dev

**Fecha de verificación:** 11 de julio de 2026

**Alcance:** capturas usadas en `textos-seo-federacion-kendo.pdf`

## Criterio aplicado

Cada imagen representa únicamente el área visible del navegador en una de estas vistas:

- Portrait/mobile: 390 × 844 px
- Landscape: 844 × 390 px
- Tablet: 768 × 1024 px
- Desktop: 1366 × 768 px

Las capturas se realizaron con Microsoft Edge en modo headless, barras de desplazamiento ocultas y `deviceScaleFactor=1`. El generador rechaza cualquier PNG que no coincida exactamente con las dimensiones declaradas.

Los cambios semánticos de `h2`, `h3` y `h4` documentados posteriormente no modifican estilos, tamaños ni distribución. Por eso no requieren nuevas capturas visuales; permanecen marcados como implementados en código local hasta su despliegue y verificación en producción.

## Causa de las capturas defectuosas

La primera captura reservó 16 px para la barra vertical del navegador. Por eso algunas imágenes tenían, por ejemplo, 828 px de contenido en vez de los 844 px declarados, y el borde derecho parecía cortado.

También se intentó usar captura de página completa (`fullPage`). El sitio utiliza un shell de altura fija y algunas secciones tienen su propio desplazamiento interno. En esa estructura, `fullPage` produjo imágenes repetidas, incompletas o en blanco. Esas capturas se descartaron y no forman parte del documento corregido.

## Comportamientos verticales documentados

- **Afiliados en tablet:** la sección usa desplazamiento interno. El viewport completo mide 768 × 1024 px, pero parte de la segunda tarjeta queda debajo del área visible.
- **Galería en landscape:** el viewport mide 844 × 390 px y la página continúa verticalmente; el Footer queda fuera del área visible.
- **Lightbox:** las capturas mobile y desktop conservan el viewport completo, incluidos los márgenes reales de los controles.

Estas continuaciones se identifican en el PDF con la leyenda “Contenido adicional mediante scroll”. No se cosieron imágenes ni se simuló una página completa.

## Resultado de la auditoría horizontal

En las vistas revisadas, el ancho desplazable del documento coincide con su ancho visible (`scrollWidth == clientWidth`). No se encontró desbordamiento horizontal real. Por esa razón no se modificaron React, Tailwind ni la distribución pública del sitio.

## Conservación del entregable

El PDF final y el documento Markdown se conservan como entregables versionados. Los procesos internos utilizados para capturar, componer y verificar el informe se mantienen separados del repositorio público del sitio.
