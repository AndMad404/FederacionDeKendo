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

Las carpetas anteriores definen la responsabilidad de cada prueba. El nivel
tecnico de la tabla siguiente es complementario: indica si el archivo ejerce
una unidad, integra varias piezas, recorre la aplicacion en navegador o compara
una salida visual. La fuente referida conserva el requisito completo; esta
tabla solo permite localizar por que existe cada archivo y que riesgo protege.

| Archivo                                                      | Nivel tecnico                              | Comportamiento protegido                                                                             | Fuente canonica                                                                                | Riesgo protegido                                                                 |
| ------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `tests/architecture/agent-context-budget.test.mjs`           | Contrato estatico de tooling               | Mantiene compactos el contexto persistente, los controles criticos y el indice de revision.          | `AGENTS.md`; `.agents/review-contract.md`                                                      | Perder controles de supervision o exceder el contexto util.                      |
| `tests/architecture/calendar-workflow-architecture.test.mjs` | Integracion estructurada de CI             | Interpreta YAML y exige prueba dirigida, gate compartido y transferencia del artefacto historico.    | `docs/calendar-resilience-roadmap.md`, Fase 6                                                  | Publicar datos sin verificar o perder la evidencia historica.                    |
| `tests/architecture/codex-hooks.test.mjs`                    | Integracion de tooling                     | Valida configuracion, esquemas de salida y limites de actuacion de los hooks.                        | `.agents/review-contract.md`; `.codex/review-state.md`                                         | Bloquear incorrectamente una tarea o corromper el estado de revision.            |
| `tests/architecture/review-state.test.mjs`                   | Unitaria y contrato                        | Rechaza estados ambiguos y conserva atomicamente el ultimo estado valido.                            | `.agents/review-contract.md`                                                                   | Perder o mezclar hallazgos y resoluciones.                                       |
| `tests/architecture/style-priority-guard.test.mjs`           | Analisis estatico                          | Impide declaraciones CSS con prioridad `important`.                                                  | `AGENTS.md`, Core Rules                                                                        | Romper la jerarquia normal de estilos.                                           |
| `tests/data/calendar-history-correction.test.mjs`            | Integracion de script                      | Aplica solamente correcciones historicas aprobadas, vigentes, acotadas y atomicas.                   | `docs/event-history-roadmap.md`, Fase C3                                                       | Publicar una correccion parcial, obsoleta o no autorizada.                       |
| `tests/data/calendar-sync.test.mjs`                          | Unitaria e integracion de script           | Normaliza Calendar y protege identidad, checkpoints, desapariciones y publicacion atomica.           | `docs/calendar-sync.md`, Current route contract; `docs/calendar-resilience-roadmap.md`, Fase 2 | Retirar, mezclar o alterar eventos publicados por una entrada defectuosa.        |
| `tests/data/calendar-timezone-localization.spec.ts`          | Integracion en navegador                   | Calcula el vencimiento en la zona del evento y presenta traducciones editoriales conocidas.          | `docs/calendar-sync.md`, Semantica de fechas; `docs/event-translations-seo-roadmap.md`         | Archivar un evento en una fecha incorrecta o mostrar una traduccion no aprobada. |
| `tests/data/event-gallery-sync.test.mjs`                     | Integracion de script                      | Importa una galeria valida una vez y respeta limites y checkpoints de 24/48 horas.                   | `docs/event-history-roadmap.md`, Contrato de fotografias                                       | Inventar, reemplazar o publicar una galeria invalida.                            |
| `tests/data/event-history-filters.test.mjs`                  | Unitaria                                   | Ordena y filtra el archivo, conserva URLs localizadas y no condiciona eventos a una galeria.         | `docs/event-history-roadmap.md`, Fase 4                                                        | Ocultar eventos o producir filtros y URLs inconsistentes.                        |
| `tests/data/event-history-sync-contract.test.mjs`            | Contrato de dominio e integracion          | Congela snapshots, conserva evidencia y exige decisiones humanas para cambios historicos.            | `docs/calendar-resilience-roadmap.md`, Fases 1-5; `docs/event-history-roadmap.md`, Fases C1-C4 | Reescribir o eliminar automaticamente la historia institucional.                 |
| `tests/data/event-metadata.spec.ts`                          | E2E de metadata                            | Comprueba que una ruta prerenderizada servida expone metadata publica aprobada.                      | `docs/textos-seo.md`, Eventos generados                                                        | Servir metadata distinta del artefacto aprobado.                                 |
| `tests/data/gallery-data.test.mjs`                           | Contrato estatico de datos y assets        | Mantiene alineados hashes, imagen SEO y preload de la galeria.                                       | `docs/textos-seo.md`, SEO de imagenes                                                          | Servir assets obsoletos o referencias SEO inconsistentes.                        |
| `tests/data/generated-output.test.mjs`                       | Integracion postbuild                      | Verifica canonical, robots, sitemap, redirects, idiomas y publicacion condicional del HTML generado. | `docs/textos-seo.md`; `docs/event-translations-seo-roadmap.md`, Fases 2-4                      | Generar rutas o señales SEO incoherentes.                                        |
| `tests/data/llms-txt.test.mjs`                               | Contrato de contenido y unitaria           | Valida el `llms.txt` publicado y la alarma ante contenido invalido.                                  | `docs/textos-seo.md`, Archivo `llms.txt`                                                       | Publicar silenciosamente un archivo incompleto.                                  |
| `tests/data/localized-events.test.mjs`                       | Contrato de datos generado                 | Publica ingles solo con traduccion editorial valida sin bloquear espanol.                            | `docs/event-translations-seo-roadmap.md`, Fases 1-2                                            | Inventar un fallback o retirar la publicacion espanola.                          |
| `tests/data/meta-descriptions-approval.test.mjs`             | Contrato editorial e integracion postbuild | Prueba desde el modulo SEO el copy aprobado y la composicion de descripciones dinamicas.             | `docs/textos-seo.md`, Etiquetas por ruta                                                       | Alterar copy aprobado o producir descripciones invalidas.                        |
| `tests/data/static-public-content.test.mjs`                  | Contrato estructurado de contenido         | Carga los modulos tipados y exige metadata, paridad localizada y registros completos.                | `docs/textos-seo.md`; `src/app/config/seo-data.json`                                           | Publicar contenido incompleto o idiomas desalineados.                            |
| `tests/behavior/accessibility.spec.ts`                       | E2E de accesibilidad automatizada          | Escanea rutas representativas y el lightbox abierto contra reglas WCAG A y AA detectables.           | `.agents/verification.md`, Accessibility Checks; `docs/design-source-status.md`                | Introducir estructura o atributos inaccesibles sin deteccion automatica.         |
| `tests/behavior/calendar-behavior.spec.ts`                   | E2E funcional                              | Permite navegar meses con controles y gesto tactil y reinicia su paginacion.                         | `docs/calendar-sync.md`, Calendar UI contract                                                  | Dejar meses o eventos inaccesibles.                                              |
| `tests/behavior/event-history-filters.spec.ts`               | E2E funcional                              | Integra filtros, URL localizada, paginacion, gesto tactil y estado vacio.                            | `docs/event-history-roadmap.md`, Fase 4                                                        | Perder filtros o alcance de eventos al navegar.                                  |
| `tests/behavior/events.spec.ts`                              | E2E funcional                              | Protege rutas canonicas, ciclo de vida, compartir, idiomas y detalle historico.                      | `docs/calendar-sync.md`, Current route contract; `docs/event-history-roadmap.md`               | Romper enlaces, transiciones temporales o contenido del evento.                  |
| `tests/behavior/lightbox-behavior.spec.ts`                   | E2E funcional y accesibilidad              | Aisla el lightbox, restaura la aplicacion y limpia zoom y estado al cerrarlo.                        | `docs/design-source-status.md`, Medidas visuales aprobadas                                     | Dejar el fondo interactivo o estado residual del modal.                          |
| `tests/behavior/navbar-calendar-menu.spec.ts`                | E2E funcional y accesibilidad              | Hace accesible el archivo por hover, teclado, menu movil e historial.                                | `docs/event-history-roadmap.md`, Fase 6                                                        | Volver inaccesible la navegacion del calendario.                                 |
| `tests/design/button-interaction.spec.ts`                    | E2E de estado visual                       | Conserva estados aprobados de hover y respeta reduccion de movimiento.                               | `docs/design-source-status.md`, Medidas visuales aprobadas                                     | Introducir estados visuales o movimiento no autorizados.                         |
| `tests/design/event-content-layout.spec.ts`                  | E2E geometrico                             | Mantiene contenidas acciones, descripcion y galeria opcional del evento.                             | `docs/design-source-status.md`, Medidas visuales aprobadas                                     | Recortar o desbordar contenido editorial.                                        |
| `tests/design/geometry-contract.spec.ts`                     | E2E geometrico                             | Aplica el viewport critico, flujo documental, medidas y targets tactiles aprobados.                  | `AGENTS.md`, Product Invariants; `docs/design-source-status.md`                                | Introducir scroll, solapamiento o controles demasiado pequenos.                  |
| `tests/design/navigation-states.spec.ts`                     | E2E de estado visual                       | Conserva los estados de interaccion de flechas compartidas.                                          | `docs/design-source-status.md`, Medidas visuales aprobadas                                     | Romper la respuesta visual de controles reutilizados.                            |
| `tests/design/responsive-reachability.spec.ts`               | E2E responsive                             | Mantiene alcanzable todo el contenido en flujo documental o interaccion acotada.                     | `AGENTS.md`, Product Invariants; `.agents/verification.md`, Responsive Checks                  | Ocultar o atrapar contenido en un viewport.                                      |
| `tests/design/visual-regression.spec.ts`                     | Regresion visual                           | Compara los disenos aprobados en los cuatro viewports de referencia.                                 | `docs/design-source-status.md`; este documento, Revision visual manual                         | Aceptar diferencias visuales no autorizadas.                                     |

Las referencias `docs/...` de la tabla corresponden a la documentacion privada
canonica en
`../DesarrolloAsistidoIA/projects/federacion-de-kendo/docs/`. No son una
dependencia de runtime, build, pruebas ni workflows del sitio.

## Criterio de aceptacion

Un cambio esta verificado cuando pasan los controles proporcionales a su
riesgo. Un build exitoso no demuestra correccion visual, y una captura exitosa
no demuestra que los enlaces, la accesibilidad o los datos sean correctos.
