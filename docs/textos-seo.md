# Textos SEO — Federación de Asociaciones de Kendo

Documento de trabajo para la reunión con la Federación.

**Estado de la revisión:** código y sitio publicado contrastados el 10 de julio de 2026. Desde entonces hay cambios adicionales implementados en el código local (11 de julio), todavía no desplegados ni verificados en producción: ver §0.1.

**Sitio revisado:** `https://fak-kendo.pages.dev`

**Audiencia:** personas no técnicas que deben revisar y aprobar nombres, textos y descripciones.

**Propósito:** repasar los textos que aportan al SEO, identificar en qué componente aparecen y separar claramente lo publicado, lo propuesto y lo pendiente.

## Cómo leer este documento

- **Texto actual:** ya aparece en el código o en el sitio publicado.
- **Borrador:** propuesta que todavía no debe publicarse.
- **Decisión pendiente:** punto que la Federación debe resolver.
- **Objetivo editorial:** longitud recomendada para facilitar la lectura; no es un límite técnico de Google.

Las futuras referencias promocionales de cada dojo no se mostrarán visualmente dentro de las tarjetas. Tampoco son una `meta description`: esa etiqueta existe una sola vez por página y actualmente describe la página completa de Afiliados. Su destino técnico todavía debe definirse antes de afirmar que aportan al SEO.

---

## 0. Decisiones pendientes para la reunión

| Decisión | Estado actual del sitio | Qué debe confirmar la Federación |
|---|---|---|
| Nombre oficial | Federación de Asociaciones de Kendo | Si debe incluir “de Costa Rica” |
| Nombre corto | `FAK` en `site.webmanifest` | Si la sigla oficial será `FAK` o `FAKCR` |
| País en datos estructurados | No se declara `areaServed` | Si en el futuro se autoriza declarar Costa Rica como área atendida |
| Referencias promocionales de dojos | No existen todavía | Cada dojo debe aportar y aprobar su propio contenido |

Mientras estas decisiones sigan pendientes, los borradores de los dojos no usarán `FAK`, `FAKCR` ni el nombre largo de la Federación.

### 0.1 Cambios técnicos implementados en código local (11 de julio, sin desplegar)

Estos cambios no afectan textos ni diseño visible; se documentan porque cambian cómo Google y otros rastreadores ven el sitio.

| Cambio | Qué resuelve | Impacto visible para el usuario |
|---|---|---|
| Página 404 real | Antes, una URL inventada (ej. `/cualquier-cosa`) mostraba el contenido de Inicio con código `200` ("todo OK"), confundiendo a los buscadores. Ahora existe una página "Página no encontrada" dedicada, con enlaces de vuelta a Inicio/Galería/Afiliados, y el servidor responde con el código correcto (`404`). | Ninguno para navegación normal; solo se ve al visitar una URL que no existe. |
| Contenido inicial ya no depende de JavaScript | Antes, el HTML que recibía un buscador al cargar la página estaba vacío hasta que el navegador ejecutaba React. Ahora el texto visible (título, hero, eventos, galería, dojos) ya viene incluido en el HTML que se entrega primero. | Ninguno para la persona; el sitio se ve igual. Mejora cómo lo indexan los buscadores. |

Pendiente antes de dar esto por cerrado: correr `pnpm build` y verificar en producción que ambos cambios funcionan como se espera (no se ha podido probar todavía en este equipo).

### Cambios recientes que ya aparecen en el sitio

- Inicio, Galería y Afiliados usan ahora un H1 visible con el mismo tratamiento gráfico.
- En Inicio, el H1 se presenta en una línea en pantallas amplias y en dos líneas en mobile.
- Los títulos de Galería y Afiliados ya no son únicamente texto oculto para accesibilidad: ahora forman parte visible de cada página.
- Las tarjetas de los dojos siguen mostrando solamente nombre, contacto, sedes y horarios.

### Jerarquía semántica implementada en código local

Estos cambios no alteran la apariencia de las capturas. Están implementados en el código y quedan pendientes de despliegue y contraste final en producción.

| Ruta o componente | Nivel | Texto o contenido | Estado |
|---|---:|---|---|
| Inicio / `PageTitle` | `h1` | KENDO - EL CAMINO DE LA ESPADA | Publicado |
| Inicio / Hero | `h2` | Invitación institucional a descubrir el kendo | Publicado |
| Inicio / `UpcomingEventsSection` | `h2` | Calendario de Próximos Eventos | Publicado |
| Inicio / tarjeta de evento | `h3` | Título dinámico de cada evento | Implementado localmente |
| Galería / `PageTitle` | `h1` | Galería de kendo | Publicado |
| Galería / `FeaturedImage` | `h2` | Título de la imagen destacada | Implementado localmente |
| Galería / `Lightbox` | `h2` | Título de la imagen abierta | Implementado localmente |
| Afiliados / `PageTitle` | `h1` | Dojos afiliados | Publicado |
| Afiliados / `DojoInfo` | `h2` | Nombre de cada dojo | Publicado |
| Afiliados / horario | `h3` | Horario de clases | Publicado |
| Afiliados / sede | `h4` | Nombre de la sede | Publicado |
| Footer | `h2` | Propósito del KENDO / Contactos de la Federación | Implementado localmente |

El build continúa generando un cuerpo inicial con `<div id="root"></div>`. La jerarquía anterior aparece cuando React se ejecuta; hacerla parte del HTML inicial requeriría una fase separada de prerenderizado o SSG.

---

## 1. Criterios de longitud

### Títulos y descripciones de buscador

Como guía editorial se conservarán estos objetivos:

| Campo | Objetivo editorial |
|---|---:|
| Título SEO | Hasta aproximadamente 60 caracteres |
| Meta description | Hasta aproximadamente 155 caracteres |

No son límites fijos. Google puede recortar el resultado según el ancho del dispositivo y también puede generar un título o fragmento diferente usando el contenido visible de la página.

Referencias:

- [Google: cómo influir en los títulos de los resultados](https://developers.google.com/search/docs/advanced/appearance/good-titles-snippets)
- [Google: cómo se generan las descripciones o fragmentos](https://developers.google.com/search/docs/appearance/snippet)

### Textos visibles

Los textos de interfaz se evalúan con dos criterios:

1. Los límites programados que ya existen en Galería.
2. El espacio real observado en mobile, landscape, tablet y desktop.

La claridad y la veracidad tienen prioridad sobre completar un número exacto de caracteres.

---

## 2. Textos globales

| Uso | Texto actual | Caracteres | Estado o nota |
|---|---|---:|---|
| Nombre oficial | Federación de Asociaciones de Kendo | 35 | Decisión pendiente: confirmar si agrega “de Costa Rica” |
| Nombre corto de la aplicación | FAK | 3 | Decisión pendiente: `FAK` o `FAKCR` |
| Descripción general | Sitio oficial de la Federación de Asociaciones de Kendo: comunidad, galería y dojos afiliados. | 94 | Se reutiliza como descripción general del sitio |
| Actividad | Kendo | 5 | Declarada en los datos estructurados de la organización |
| País / área atendida | No declarado | — | `areaServed` está disponible, pero no tiene valor |
| Idioma del documento | `es` | — | Español |
| Configuración regional social | `es_LA` | — | Español de Latinoamérica |

---

## 3. Inicio

### SEO de la página

| Uso | Texto actual | Caracteres | Objetivo editorial |
|---|---|---:|---:|
| Título SEO | Inicio \| Federación de Asociaciones de Kendo | 44 | Aproximadamente 60 |
| Meta description | Conoce la Federación de Asociaciones de Kendo y su comunidad de práctica. | 73 | Aproximadamente 155 |
| Alt de imagen social | Tarjeta social de la Federación de Asociaciones de Kendo | 56 | Describir la imagen con claridad |
| Alt del Hero | Grupo de practicantes de kendo reunidos despues de una actividad | 64 | Describir la escena con claridad |

### Hero Banner

| Uso | Texto actual | Comportamiento actual |
|---|---|---|
| H1 en tablet y desktop | KENDO - EL CAMINO DE LA ESPADA | Una línea, 30 caracteres |
| H1 en mobile | KENDO / EL CAMINO DE LA ESPADA | Dos líneas: 5 y 22 caracteres |
| Texto descriptivo | La Federacion de asociaciones de kendo te invita a descubrir este arte marcial japonés. Clases para todos los niveles y edades. | Un solo `h2`, 127 caracteres |

El bloque descriptivo no está dividido en un encabezado y un párrafo: todo el texto pertenece al mismo `h2`.

### Calendario de eventos

| Componente | Jerarquía | Texto |
|---|---|---|
| `UpcomingEventsSection` | `h2` | Calendario de Próximos Eventos |
| Cada tarjeta de evento | `h3` | Título dinámico del evento |

Las fechas, horas y ubicaciones permanecen como datos asociados al `h3`; no deben convertirse en encabezados.

### Revisión ortográfica pendiente

Estos textos se documentan como aparecen publicados; no se consideran copy aprobado:

- “Federacion” debería revisarse como “Federación”.
- “despues” debería revisarse como “después”.
- También conviene confirmar la capitalización de “asociaciones de kendo”.

---

## 4. Galería

### SEO de la página

| Uso | Texto actual | Caracteres | Objetivo editorial |
|---|---|---:|---:|
| Título SEO | Galería \| Federación de Asociaciones de Kendo | 45 | Aproximadamente 60 |
| Meta description | Galería oficial de la comunidad, entrenamientos y actividades de kendo. | 71 | Aproximadamente 155 |
| H1 visible | Galería de kendo | 16 | Debe caber en una línea en las vistas verificadas |
| H2 de imagen destacada | Título activo de la galería | Hasta 32 | Máximo programado |

### Límites programados

Estos límites sí son reglas del sitio:

| Campo | Máximo programado | Comportamiento |
|---|---:|---|
| Título de imagen | 32 caracteres | Se corta en el borde de una palabra y agrega `...` |
| Tag o categoría | 20 caracteres | Se corta en el borde de una palabra y agrega `...` |
| Descripción completa | 200 caracteres | Se corta y agrega `...` si supera el límite |
| Vista previa mobile | 70 caracteres totales | Incluye `...Ver mas >>`; quedan aproximadamente 57 caracteres para la idea inicial |

La idea principal de cada descripción debe aparecer en los primeros 57 caracteres para que sea comprensible en mobile sin interacción.

### Imágenes actuales

| # | Título | Tag | Descripción actual |
|---:|---|---|---|
| 1 | Practicantes en seiza | Reiho | La posicion de seiza marca el inicio y cierre de la practica con respeto, atencion y disciplina. |
| 2 | Combates con armadura | Bogu geiko | Practicantes con bogu aplican distancia, timing y precision durante ejercicios de combate controlado. |
| 3 | Armaduras | Bogu | Detalle del equipo de proteccion usado en kendo: men, kote, do y tare listos para la practica. |
| 4 | Entrenamiento multinivel | Mitori geiko | La observacion activa permite aprender ritmo, postura y etiqueta antes de entrar al combate. |
| 5 | Uniforme | Gi y Hakama | El gi y la hakama forman el uniforme tradicional, preparado para moverse con orden y seguridad. |
| 6 | Comunidad de kendo | Equipo y convivencia | La comunidad crece compartiendo entrenamientos, apoyo entre practicantes y momentos fuera del dojo. |
| 7 | Kirikaeshi | Tecnica | Kirikaeshi trabaja cortes repetidos, desplazamiento y respiracion para fortalecer fundamentos. |
| 8 | Combate competitivo | Shiai | El shiai pone a prueba tecnica, decision y respeto dentro de un formato competitivo. |

Los títulos se reutilizan como texto alternativo cuando la imagen es protagonista o se abre en el lightbox.

El título de la imagen destacada utiliza `h2`. Al abrir el Lightbox, el título activo también utiliza `h2` y continúa dando nombre al diálogo mediante `aria-labelledby`.

### Revisión ortográfica pendiente

Las descripciones anteriores reflejan literalmente el código. Antes de tratarlas como texto final se deben revisar tildes como “posición”, “práctica”, “atención”, “precisión”, “protección”, “observación”, “técnica” y “decisión”.

### Textos de interacción

| Uso | Texto actual | Visibilidad |
|---|---|---|
| Abrir imagen | Abrir imagen | Oculto visualmente; accesible para lectores de pantalla |
| Cerrar galería | Cerrar galería | Etiqueta accesible del control |
| Imagen anterior | Imagen anterior | Etiqueta accesible del control |
| Imagen siguiente | Imagen siguiente | Etiqueta accesible del control |
| Grupo de miniaturas | Miniaturas de galería | Etiqueta accesible |
| Selector de puntos | Selector de imágenes de galería | Etiqueta accesible |
| Botón de miniatura | Ver imagen: [título] | Etiqueta accesible generada con el título |
| Indicador | 1 / 8, 2 / 8, etc. | Visible |
| Expansión mobile | Ver mas >> | Visible cuando la descripción se corta |
| Título del Lightbox | [título activo] | `h2` visible y nombre accesible del diálogo |

---

## 5. Afiliados

### SEO de la página

| Uso | Texto actual | Caracteres | Objetivo editorial |
|---|---|---:|---:|
| Título SEO | Dojos afiliados \| Federación de Asociaciones de Kendo | 53 | Aproximadamente 60 |
| Meta description | Información de contacto, horarios y ubicación de dojos afiliados a la federación. | 81 | Aproximadamente 155 |
| H1 visible | Dojos afiliados | 15 | Debe caber en una línea en las vistas verificadas |
| Alt de imagen principal | Nuestro dojo | 12 | Revisión futura: podría describir mejor la escena |

Si el nombre oficial incorporara “de Costa Rica”, el título SEO de Afiliados tendría 67 caracteres. Esto no invalida la página, pero aumenta la posibilidad de que el título se recorte o sea reformulado en el buscador.

La jerarquía de cada tarjeta ya es `h2` para el nombre del dojo, `h3` para “Horario de clases” y `h4` para el nombre de cada sede.

### Referencias promocionales SEO asociadas a los dojos

Cada dojo aportará su propio material promocional. No se mostrará visualmente dentro de la tarjeta y no se redactará inventando historia, logros, instructores ni características. El contenido podrá incluir:

- un slogan o frase de identidad aprobado por el dojo;
- una referencia breve sobre quiénes son;
- una indicación clara de dónde entrenan o cómo encontrarlos;
- una invitación publicitaria coherente con la información real del dojo.

No será una lista de palabras clave y no modificará la meta description general de la página. Tampoco se incluirá en JSON-LD durante esta fase.

Google recomienda que los datos estructurados representen contenido visible y veraz. Si posteriormente se modela cada dojo en JSON-LD, deberá revisarse nuevamente qué información está publicada para usuarios. Véanse las [directrices de datos estructurados de Google](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

### Contenido pendiente de aportar

| Dojo | Referencia promocional SEO no visible | Insumos pendientes | Estado |
|---|---|---|---|
| Asociación Deportiva Kendo Koken Chiai | **Pendiente de redacción** | Slogan, quiénes son, sedes o cómo encontrarlos e invitación publicitaria | **Pendiente de aprobación del dojo** |
| Heredia Kendo Club | **Pendiente de redacción** | Slogan, quiénes son, Colegio Europeo o cómo encontrarlos e invitación publicitaria | **Pendiente de aprobación del dojo** |

Mientras no se defina una superficie técnica que los buscadores puedan interpretar, estos textos serán material editorial asociado a `DojoInfo`, pero no producirán efecto SEO por sí solos.

### Datos actuales por dojo

| Dojo | Contacto y ubicación actuales | Horario actual |
|---|---|---|
| Asociación Deportiva Kendo Koken Chiai | Correo, teléfono, Instagram, Moravia/Guadalupe y Curridabat | Lunes, miércoles y viernes en Moravia/Guadalupe; martes y jueves en Curridabat |
| Heredia Kendo Club | Correo, teléfono, Instagram y Colegio Europeo | Viernes y dos bloques los sábados |

El campo promocional todavía no existe en los datos ni en el componente de la tarjeta. No se añadirá hasta recibir contenido real, aprobación y una decisión sobre su destino técnico.

---

## 6. Logo e imágenes decorativas

| Imagen | Tratamiento actual | Motivo |
|---|---|---|
| Logo en navegación | `alt=""` y `aria-hidden="true"` | El enlace ya contiene el nombre visible de la Federación; repetirlo sería redundante |
| Miniaturas de galería | `alt=""` | El botón que contiene cada miniatura ya indica “Ver imagen: [título]” |

---

## 7. Texto para bots e IA (`llms.txt`)

| Uso | Texto actual | Caracteres |
|---|---|---:|
| Título | Federación de Asociaciones de Kendo | 35 |
| Descripción breve | Sitio oficial de la Federación de Asociaciones de Kendo. | 58 |
| Enlace de Inicio | Inicio | 6 |
| Enlace de Galería | Galería | 7 |
| Enlace de Afiliados | Afiliados | 9 |

`llms.txt` no utiliza los límites visuales de un resultado de Google, pero debe mantenerse alineado con la decisión final sobre el nombre oficial.

---

## 8. Otros textos visibles

| Componente | Uso | Texto actual | Caracteres o nota |
|---|---|---|---|
| Navbar | Nombre junto al logo | Federación de Asociaciones de Kendo | 35; se divide en mobile |
| Navbar | Enlaces | Inicio / Galería / Afiliados | 6 / 7 / 9 |
| Navbar | Botón mobile | Abrir menú / Cerrar menú | Etiquetas funcionales |
| Footer | Encabezado `h2` | Propósito del KENDO | 19; el texto completo pertenece al encabezado |
| Footer | Párrafo | El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana. | 113 |
| Footer | Encabezado `h2` | Contactos de la Federación | 26 |
| Footer | Correo | secretaria.fedekendo@outlook.com | Dato de contacto |
| Inicio | Encabezado de eventos `h2` | Calendario de Proximos Eventos | 30; revisar tilde en “Próximos” |
| Inicio | Título de evento `h3` | [título dinámico] | Depende del calendario |
| Galería | Título destacado `h2` | [título activo] | Máximo programado: 32 |
| Lightbox | Título `h2` | [título activo] | También identifica el diálogo |

Los títulos, fechas, horas y ubicaciones de los eventos son datos operativos y cambian con el calendario. No requieren aprobación como copy institucional, pero sí se incluyen en la matriz tipográfica.

---

## 9. Matriz tipográfica verificada

Los tamaños se midieron en el sitio publicado con estas vistas:

- **Mobile:** 390 × 844 px
- **Landscape:** 844 × 390 px
- **Tablet:** 768 × 1024 px
- **Desktop:** 1366 × 768 px

| Elemento | Mobile | Landscape | Tablet | Desktop |
|---|---:|---:|---:|---:|
| Nombre en navegación | 18 px | 16 px | 18 px | 18 px |
| Enlaces de navegación | 18 px | 16 px | 18 px | 18 px |
| H1 de página | 20 px | 20 px | 20 px | 20 px |
| Texto del Hero | 18 px | 18 px | 18 px | 18 px |
| H2 de eventos | 18 px | 20 px | 24 px | 24 px |
| H3 de evento / hora | 16 / 14 px | 16 / 14 px | 16 / 14 px | 16 / 14 px |
| Título de imagen | 20 px | 16 px | 24 px | 24 px |
| Tag de galería | 16 px | 10 px | 16 px | 16 px |
| Descripción de galería | 14 px | 10 px | 14 px | 14 px |
| Contador de galería | 12 px | 10 px | 12 px | 12 px |
| Nombre del dojo | 24 px | 24 px | 24 px | 24 px |
| Etiquetas de contacto | 20 px | 20 px | 20 px | 18 px |
| Valores y horarios | 16 px | 16 px | 16 px | 16 px |
| “Horario de clases” | 24 px | 24 px | 24 px | 24 px |
| Nombre de sede | 18 px | 18 px | 18 px | 18 px |
| Footer: títulos / cuerpo / texto legal | 18 / 16 / 12 px | 18 / 16 / 12 px | 18 / 16 / 12 px | 18 / 16 / 12 px |

La matriz solo incluye texto visible y medible. La referencia promocional SEO de los dojos no tiene tamaño tipográfico porque no se mostrará dentro de la tarjeta.

### Nota de espacio disponible

- En mobile, la página crece verticalmente y permite desplazamiento normal.
- En tablet, Afiliados ya utiliza desplazamiento interno.
- En desktop, las tarjetas mantienen su distribución actual porque la referencia promocional no se mostrará visualmente.

---

## 10. Implementación después de la aprobación

Cuando la Federación y los dojos aporten y aprueben los textos:

1. Recibir de cada dojo su slogan, referencia institucional y forma de encontrarlo.
2. Verificar que cada afirmación sea real y esté aprobada por el dojo.
3. Redactar una referencia promocional breve, natural y orientada a publicidad.
4. Definir la superficie técnica donde se incorporará antes de atribuirle una función SEO.
5. Mantener sin cambios la meta description general de Afiliados y el JSON-LD durante esta fase.
6. Verificar TypeScript, build y las cuatro vistas si la decisión técnica requiere cambios de código.
7. Contrastar nuevamente el sitio publicado antes de actualizar este PDF.

---

## 11. Lista de aprobación para la reunión

- [ ] Confirmar el nombre oficial.
- [ ] Confirmar si la sigla será `FAK` o `FAKCR`.
- [ ] Confirmar si se podrá declarar Costa Rica como área atendida en el futuro.
- [ ] Solicitar a Koken Chiai su slogan, referencia institucional y forma de encontrarlo.
- [ ] Solicitar a Heredia Kendo Club su slogan, referencia institucional y forma de encontrarlo.
- [ ] Aprobar la redacción publicitaria final de cada dojo.
- [ ] Decidir si se corrigen las tildes y la capitalización de los textos actuales.
- [ ] Autorizar la implementación de las descripciones en las tarjetas.

## Siguiente etapa

Después de aprobar e implementar los textos, este Markdown será la fuente del PDF ilustrado. El PDF relacionará cada componente visual con su función SEO mediante capturas de Inicio, Galería y Afiliados.
