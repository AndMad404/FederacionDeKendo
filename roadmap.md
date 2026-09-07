# Roadmap de producto - FederacionDeKendo

Revision documental: 2026-09-06.

## Responsabilidad

Este documento posee los pendientes de producto, sus prioridades, condiciones
de inicio y criterios de cierre. Actualizar al aceptar una decision, verificar
un pendiente o cerrar una tarea. El estado tecnico se contrasta con el codigo
y `pnpm run verify:site`; esta separacion documental no revalida findings.
Las referencias historicas de la tabla son evidencia registrada, no resultados
de pruebas ejecutadas hoy. `README.md`, `TESTING.md`, los scripts y las pruebas
versionadas gobiernan la operacion publica del producto.

## Siguiente accion

Revisar en modo de solo lectura los avisos existentes de GitHub y Cloudflare.
Presentar canal, destinatario y condiciones antes de modificar alertas.
Se conserva la publicacion automatica; no se activa un gate de despliegue.

## Separacion del tooling privado - 2026-09-06

La instrumentacion asistida privada, sus contratos, estado, hooks, indices y
pruebas especificas se retiraron a su repositorio propietario externo. El
producto conserva codigo, datos, build, CI, documentacion operativa y este
roadmap. `tests/architecture/repository-hygiene.test.mjs` protege de forma
permanente esa frontera sin depender del tooling externo. La edicion local
preexistente del workflow de calendario queda fuera de este cierre.

## Pendientes de producto

Estado de las filas: PENDIENTE; las condiciones limitan su activacion.
No ejecutar toda la tabla como una fase unica. Elegir una tarea, verificar su
vigencia, delimitar su resultado y aplicar los checks correspondientes.

| Prioridad | Trabajo                                               | Evidencia                                                                                                                                                                                                                                                                                                                           | Impacto                                                                                                                                     | Dependencia                                                                                                              | Condicion verificable para iniciar                                                                                                                                                                                                    |
| --------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1        | Revisar alertas de GitHub y Cloudflare bajo DEC-034   | Produccion automatica desde `main`; el despliegue de `e7fd7ea` termino 87 segundos antes que CI. Relacion externa comprobada para esa muestra.                                                                                                                                                                                      | Detectar fallos sin condicionar la publicacion al resultado de CI, conforme a la decision del propietario.                                  | Inventario de avisos existentes y aprobacion de cualquier cambio concreto                                                | Revisar en modo de solo lectura los avisos actuales; presentar canal, destinatario y condiciones sin duplicaciones. No activar ni modificar alertas sin permiso.                                                                      |
| P1        | Validar zoom nativo al 200 por ciento                 | El equivalente de reflow paso en Inicio, Calendario, Galeria y Afiliados desde `1366x768` y `768x1024`: sin clipping, scroll interno ni overflow horizontal. El navegador embebido no permitio fijar un nivel de zoom verificable, por lo que aun falta una ejecucion nativa.                                                       | Evita afirmar conformidad WCAG 1.4.4 usando solo una aproximacion, aunque no existe ya un fallo reproducido del mecanismo de zoom completo. | Matriz de navegadores soportados                                                                                         | Ejecutar zoom nativo al 200 por ciento en al menos un navegador desktop soportado y verificar contenido, funciones, reflow y scroll en las cuatro rutas.                                                                              |
| P2        | Decidir soporte adicional de ampliacion solo de texto | Forzar temporalmente la raiz de 16px a 32px recorta contenido en Inicio, Calendario y Galeria; Afiliados genera overflow horizontal a `768x1024`. W3C permite satisfacer SC 1.4.4 mediante al menos un mecanismo de escala soportado, por lo que esta simulacion no prueba por si sola incumplimiento si el zoom completo funciona. | Usuarios que prefieren tamanos de fuente predeterminados o ampliacion solo de texto pueden recibir una experiencia menos resiliente.        | Comprension y decision explicita del propietario                                                                         | Elegir si este comportamiento adicional forma parte del producto antes de aprobar cambios de tipografia, alturas o contencion.                                                                                                        |
| P2        | Decidir politica de objetivos interactivos grandes    | En las cuatro rutas a `1366x768`, todo enlace o boton visible medido alcanzo al menos 24 px en ambas dimensiones. Calendario usa detalles y ubicacion de 32 px de alto y compartir de 32x32 px; cumple el minimo AA de WCAG 2.2, pero no una politica mejorada de 44x44 px.                                                         | Desktop tactil y usuarios con dificultad motora reciben una superficie menos tolerante aunque no exista un fallo AA reproducido.            | Decision explicita entre minimo AA y politica mejorada, mas autorizacion para alterar o preservar el contrato sin scroll | Elegir entre conservar 32 px, ampliar solo el hit area, responder a `pointer`/`any-pointer`, o redisenar la densidad desktop con controles visibles de 44 px.                                                                         |
| P1        | Migracion gradual hacia limites de features y paginas | Las rutas se conectan directamente a componentes `*Section`; galeria ya agrupa varios hooks y componentes.                                                                                                                                                                                                                          | Los limites pueden volverse ambiguos al agregar comportamiento.                                                                             | Arquitectura objetivo aprobada                                                                                           | Una funcionalidad real necesita tocar al menos dos responsabilidades actualmente mezcladas.                                                                                                                                           |
| P2        | Resolver nomenclatura interna del paquete             | `package.json` usa `federacion-kendo-costa-rica` en un paquete privado.                                                                                                                                                                                                                                                             | Puede no coincidir con una futura plantilla, pero no afecta el producto actual.                                                             | Segundo caso real o extraccion                                                                                           | Revisar solo cuando otro proyecto consuma una plantilla o paquete compartido.                                                                                                                                                         |
| P2        | Evaluar recortes editoriales de imagenes panoramicas  | El banner de Calendario usa una fuente 1600x1069 dentro de una franja de 112 px con `object-position` vertical al 20%; Afiliados usa 1500x1001 a 33%; y la foto 2 del evento Examen usa 1600x1200 dentro de una superficie horizontal.                                                                                              | Un recorte editorial aprobado podria reducir el peso de las fuentes y concentrar la composicion en la zona visible.                         | Aprobacion explicita del propietario para cada encuadre, mas una referencia visual por ruta.                             | Documentar y aprobar por separado el recorte propuesto para `/calendario/`, `/afiliados/` o `/eventos/2026-08-08-examen/`; medir reduccion de bytes y revisar las regiones visibles en desktop y movil antes de reemplazar un activo. |

## Cierre y evidencia de cada tarea

Registrar alcance y autorizacion, revision/base, archivos afectados, resultado,
verificaciones y omisiones. No copiar credenciales, destinatarios privados ni
adjuntos. Actualizar aqui el estado y conservar evidencia tecnica en fuente.
La evaluacion del metodo corresponde a su repositorio metodologico privado y no condiciona
las prioridades ni el cierre del producto. No crear cambios para muestras.
Si se realiza una comparacion metodologica, registrar la conclusion manual
antes de ejecutar el piloto sobre el mismo diff; la evaluacion se conserva
fuera del producto y no es dependencia de runtime, build ni publicacion.
