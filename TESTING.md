# Estrategia de pruebas

Este proyecto separa los contratos deterministas de la aplicacion de las
comparaciones visuales sensibles a plataforma. El objetivo es proteger el
diseno aprobado sin tratar cada cambio de texto, fecha o evento como una
regresion visual.

## Principios

- La aplicacion vigente y las medidas aprobadas por el propietario son la
  referencia de diseno.
- El contenido ordinario es relativo: texto, enlaces e imagenes pueden cambiar
  siempre que mantengan su estructura y validez.
- El contenido exacto se reserva para requisitos legales, nombre oficial,
  metadatos SEO, etiquetas de accesibilidad y copy expresamente aprobado.
- Padding, margen, gap, radio, containment y relaciones entre componentes son
  contratos explicitos, no inferencias hechas desde una captura.
- Las capturas complementan la revision; no reemplazan los contratos de
  estructura, geometria, contenido o accesibilidad.

## Responsabilidades

Ejecutar despues del build:

```powershell
pnpm run build
pnpm run test:architecture
pnpm run test:data
pnpm run test:behavior
pnpm run test:design
pnpm run test:all
```

Cada caso pertenece a una sola responsabilidad: Arquitectura protege limites
estructurales y workflows; Datos protege contenido estatico, SEO y transiciones
dinamicas; Comportamiento protege interaccion y accesibilidad funcional; Diseno
protege geometria y responsive mobile-first. `test:visual` conserva solamente
las capturas aprobadas y no forma parte de `test:all`.

La suite cubre:

- navegacion, idiomas, enlaces de eventos, rutas historicas y pagina 404;
- todas las rutas generadas en el viewport critico de 1366x768;
- ausencia de overflow horizontal y scroll vertical no autorizado;
- navbar, encabezado, contenido principal y footer dentro del viewport;
- limites declarados entre encabezados y contenido para evitar solapamientos;
- padding, margen, gap y radio aprobados para componentes representativos;
- un representante de cada diseno en 360x800, 390x844, 768x1024 y 1366x768;
- un `h1`, IDs unicos, destinos de enlaces, fuentes y `alt` de imagenes, y
  nombres accesibles de controles visibles.

Las medidas y viewports aprobados viven en
`tests/design/design-contract.ts`. Cambiar ese archivo equivale a cambiar el
contrato visual y requiere aprobacion explicita del propietario.

## Eventos nuevos

El build genera normalmente dos paginas por evento:

- `/eventos/<slug>/`;
- `/en/events/<slug>/`.

La suite descubre ambas rutas automaticamente. Cada evento nuevo agrega una
prueba estructural de escritorio por idioma, no una matriz completa de
capturas. La pagina se rechaza si el contenido nuevo provoca overflow, scroll,
recorte o solapamiento.

El diseno de evento en los cuatro viewports se valida mediante una ruta
representativa estable. Agregar otro evento no crea nuevos baselines.

## Revision visual manual

Las 32 capturas existentes se ejecutan por separado en Windows. Cubren siete
tipos de pagina en cuatro viewports mas el estado abierto del lightbox de la
galeria principal en esos mismos cuatro viewports:

```powershell
pnpm run test:visual
```

Esta suite contiene siete tipos de pagina por cuatro viewports y cuatro
capturas adicionales del lightbox. Se mantiene fuera del CI predeterminado
porque la rasterizacion de fuentes e imagenes difiere entre Windows y Ubuntu.

Un cambio intencional, como modificar una transparencia, debe hacer fallar la
captura afectada. El flujo correcto es:

1. Obtener aprobacion para el cambio visual exacto.
2. Ejecutar solamente los casos afectados cuando sea posible.
3. Inspeccionar expected, actual y diff.
4. Confirmar que cada region modificada corresponde al cambio autorizado.
5. Regenerar unicamente los baselines afectados.

```powershell
pnpm run test:visual -- --grep "home matches" --update-snapshots
```

Nunca se regeneran baselines solo para convertir una falla en verde. Los
baselines actualizados el 2026-08-12 corresponden a cambios visuales
autorizados de CTA, galeria, miniaturas y lightbox; un evento nuevo puede
cambiar el contenido visible de Inicio o Calendario, pero no autoriza
reemplazar automaticamente la captura.

## Cambios de espaciado

Cuando se aprueba un cambio de margin, padding o gap:

1. Actualizar el componente.
2. Actualizar la medida correspondiente en `design-contract.ts`.
3. Ejecutar el contrato del diseno afectado.
4. Ejecutar la suite predeterminada completa si se modifico una primitiva
   compartida o una regla responsive.
5. Ejecutar la revision visual dirigida cuando el resultado visible cambio.

Ejemplo de ejecucion dirigida:

```powershell
pnpm exec playwright test --grep "affiliates preserves content"
```

Las comparaciones de geometria permiten una tolerancia de 0.51 px para
redondeos de subpixel. Los valores CSS aprobados siguen siendo explicitos.

## Responsabilidades de cada archivo

- `tests/architecture/`: limites internos, estilos y workflows.
- `tests/data/`: contenido publico, SEO, sincronizacion y estados de datos.
- `tests/behavior/`: navegacion, calendario, filtros, idiomas y lightbox.
- `tests/design/`: medidas, responsive, controles tactiles y capturas manuales.
- `playwright.config.ts`: suite predeterminada de CI.
- `playwright.visual.config.ts`: suite visual de Windows.
- `.agents/verification.md`: criterios de verificacion para implementaciones.

## Criterio de aceptacion

Un cambio esta verificado cuando pasan los controles proporcionales a su
riesgo. Un build exitoso no demuestra correccion visual, y una captura exitosa
no demuestra que los enlaces, la accesibilidad o los datos sean correctos.
