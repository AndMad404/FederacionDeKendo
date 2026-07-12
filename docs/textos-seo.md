# Textos y componentes SEO

Guía visual para revisar y actualizar posteriormente el SEO de la Federación de Asociaciones de Kendo.

**Sitio documentado:** https://fak-kendo.pages.dev  
**Capturas verificadas:** 11 de julio de 2026  
**Audiencia:** personas responsables de aprobar nombres, textos, imágenes y descripciones.

Este documento registra el contenido actual. No publica automáticamente los textos pendientes.

## Índice

**Parte I. Muestra visual de componentes**

1. Navbar
2. Hero de Inicio
3. Calendario de eventos
4. Galería destacada y lightbox
5. Tarjetas de dojos
6. Footer

**Parte II. SEO necesario del sitio**

7. Metadatos globales
8. Etiquetas por ruta
9. Open Graph para Facebook
10. Qué es JSON-LD
11. SEO de imágenes
12. Archivo `llms.txt`
13. Archivos y señales complementarias

# PARTE I. MUESTRA VISUAL DE COMPONENTES

## 1. Navbar

**Capturas:** `navbar-desktop.jpg` y `navbar-mobile-menu.jpg`.

| Campo | Valor |
|---|---|
| Nombre visible | Federación de Asociaciones de Kendo - 35 caracteres |
| Enlaces | Inicio - 6; Galería - 7; Afiliados - 9 |
| Mobile | Botón con etiquetas accesibles “Abrir menú” y “Cerrar menú” |
| Logo | `alt=""` y `aria-hidden="true"`; el nombre visible evita una repetición innecesaria |
| Tipografía observada | 18 px en mobile, tablet y desktop; 16 px en landscape |

## 2. Hero de Inicio

**Capturas:** `hero-mobile.jpg` (390 × 844), `hero-landscape.jpg` (844 × 390), `hero-tablet.jpg` (768 × 1024) y `hero-desktop.jpg` (1366 × 768).

| Campo | Valor |
|---|---|
| `h1` | KENDO - EL CAMINO DE LA ESPADA |
| `h2` | La Federación de Asociaciones de Kendo te invita a descubrir este arte marcial japonés. Clases para todos los niveles y edades. |
| Longitud del `h2` | 127 caracteres |
| Imagen | WebP responsive de 480, 960 y 1500 px |
| Dimensiones declaradas | 1500 × 750 |
| `sizes` | `100vw` |
| Carga | `loading="eager"` y prioridad alta |
| `alt` | Grupo de practicantes de kendo reunidos después de una actividad - 64 caracteres |

En mobile, el `h1` se divide visualmente en dos líneas: “KENDO” y “EL CAMINO DE LA ESPADA”. El componente conserva un solo encabezado.

## 3. Calendario de eventos

**Capturas:** `events-tablet.jpg` y `events-desktop.jpg`.

| Campo | Valor |
|---|---|
| Título de sección | `h2`: Calendario de Próximos Eventos - 30 caracteres |
| Título de tarjeta | `h3`: contenido variable proveniente del calendario |
| Datos asociados | Fecha, hora y ubicación; no son encabezados |
| Cantidad mostrada | Hasta cuatro eventos próximos |

## 4. Galería destacada y lightbox

**Capturas:** `gallery-featured-mobile.jpg`, `gallery-featured-desktop.jpg`, `galeria-lightbox-mobile.jpg` y `galeria-lightbox-desktop.jpg`.

| Atributo | Caracteres máx. | Valor actual |
|---|---:|---|
| Título de imagen | 32 | `h2` en imagen destacada y lightbox; se corta en el borde de una palabra y agrega `...` |
| Categoría | 20 | Se corta en el borde de una palabra y agrega `...` |
| Descripción completa | 200 | Texto descriptivo de la imagen |
| Vista previa mobile | 70 | Incluye `...Ver mas >>`; quedan aproximadamente 57 caracteres para la idea inicial |

| Campo | Valor |
|---|---|
| Título de página | `h1`: Galería de kendo |
| Imagen protagonista | `alt` igual al título de la imagen |
| Miniaturas | `alt=""`; el botón contiene “Ver imagen: [título]” |
| Lightbox | El `h2` también identifica el diálogo mediante `aria-labelledby` |

## 5. Tarjetas de dojos

**Capturas:** `dojo-mobile.jpg` y `dojo-desktop.jpg`.

| Campo | Valor |
|---|---|
| Título de página | `h1`: Dojos afiliados |
| Nombre de dojo | `h2` |
| Horario de clases | `h3` |
| Nombre de sede | `h4` |
| Imagen | AVIF y WebP responsive de 768 y 1200 px; respaldo JPG |
| Dimensiones declaradas | 1500 × 1001 |
| `sizes` | `(min-width: 1024px) 1200px, 100vw` |
| Carga | `loading="eager"`, `decoding="async"` y prioridad alta |
| `alt` actual | Nuestro dojo - 12 caracteres; requiere una descripción más específica |

## 6. Footer

**Captura:** `footer-desktop.jpg`.

| Campo | Valor |
|---|---|
| Primer `h2` | Propósito del KENDO - 19 caracteres |
| Texto | El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana. - 113 caracteres |
| Segundo `h2` | Contactos de la Federación - 26 caracteres |
| Correo | secretaria.fedekendo@outlook.com |

# PARTE II. SEO NECESARIO DEL SITIO

## 7. Metadatos globales

| Campo | Valor |
|---|---|
| Nombre | Federación de Asociaciones de Kendo |
| Nombre corto | FAK |
| Descripción general | Sitio oficial de la Federación de Asociaciones de Kendo: comunidad, galería y dojos afiliados. |
| Idioma | `es` |
| Locale Open Graph | `es_LA` |
| Actividad | Kendo |
| Área atendida | No declarada |
| Dominio canónico | https://fak-kendo.pages.dev |

## 8. Etiquetas por ruta

### Inicio `/`

| Atributo | Caracteres máx. | Valor actual |
|---|---:|---|
| `<title>` | Aproximadamente 60 | Inicio \| Federación de Asociaciones de Kendo - 44 caracteres |
| `meta description` | Aproximadamente 155 | Conoce la Federación de Asociaciones de Kendo y su comunidad de práctica. - 73 caracteres |

| Campo | Valor |
|---|---|
| Canonical | https://fak-kendo.pages.dev/ |
| Robots | `index, follow` |

### Galería `/galeria/`

| Atributo | Caracteres máx. | Valor actual |
|---|---:|---|
| `<title>` | Aproximadamente 60 | Galería \| Federación de Asociaciones de Kendo - 45 caracteres |
| `meta description` | Aproximadamente 155 | Galería oficial de la comunidad, entrenamientos y actividades de kendo. - 71 caracteres |

| Campo | Valor |
|---|---|
| Canonical | https://fak-kendo.pages.dev/galeria/ |
| Robots | `index, follow` |

### Afiliados `/afiliados/`

| Atributo | Caracteres máx. | Valor actual |
|---|---:|---|
| `<title>` | Aproximadamente 60 | Dojos afiliados \| Federación de Asociaciones de Kendo - 53 caracteres |
| `meta description` | Aproximadamente 155 | Información de contacto, horarios y ubicación de dojos afiliados a la federación. - 81 caracteres |

| Campo | Valor |
|---|---|
| Canonical | https://fak-kendo.pages.dev/afiliados/ |
| Robots | `index, follow` |

### Página 404

| Campo | Valor |
|---|---|
| `<title>` | Página no encontrada \| Federación de Asociaciones de Kendo |
| `meta description` | La página que buscas no existe o fue movida. |
| Robots | `noindex, nofollow` |
| Canonical, Open Graph y JSON-LD | Se omiten porque la página no debe indexarse |

## 9. Open Graph para Facebook

El sitio conserva Open Graph para controlar cómo se presenta un enlace compartido en Facebook y otras plataformas compatibles.

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Federación de Asociaciones de Kendo">
<meta property="og:title" content="[título por ruta]">
<meta property="og:description" content="[descripción por ruta]">
<meta property="og:url" content="[canonical por ruta]">
<meta property="og:image" content="https://fak-kendo.pages.dev/images/social/kendo-social-card.png">
<meta property="og:image:secure_url" content="https://fak-kendo.pages.dev/images/social/kendo-social-card.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Tarjeta social de la Federación de Asociaciones de Kendo">
<meta property="og:locale" content="es_LA">
```

Instagram no ofrece una familia separada de etiquetas SEO web equivalente. El enlace del perfil y las publicaciones se gestionan desde la plataforma; no se inventarán metadatos específicos para Instagram.

## 10. Qué es JSON-LD

JSON-LD es un bloque de datos estructurados incluido en el HTML. No aparece como texto visible, pero ayuda a los buscadores a comprender qué organización publica el sitio, qué representa cada página y qué imagen está asociada.

El sitio describe actualmente:

- `SportsOrganization`: nombre, URL, logo, descripción y deporte.
- `WebSite`: nombre, idioma y organización publicadora.
- `WebPage` para Inicio y `CollectionPage` para Galería y Afiliados.
- Cada página: título, descripción, canonical, idioma e imagen principal.

Los datos estructurados deben mantenerse alineados con el contenido visible y las etiquetas `<meta>`.

## 11. SEO de imágenes

### Imagen social

| Campo | Valor |
|---|---|
| Archivo | `/images/social/kendo-social-card.png` |
| Formato | PNG |
| Dimensiones | 1200 × 630 |
| Uso | `og:image`, JSON-LD y vista previa de enlaces compatibles |
| Texto alternativo | Tarjeta social de la Federación de Asociaciones de Kendo - 56 caracteres |

### Hero

- WebP responsive de 480, 960 y 1500 px.
- `srcSet` y `sizes="100vw"` permiten elegir el archivo adecuado al viewport.
- Dimensiones declaradas 1500 × 750 para reservar espacio y reducir movimiento durante la carga.
- Carga inmediata y prioridad alta porque es la imagen principal de Inicio.
- `alt`: “Grupo de practicantes de kendo reunidos después de una actividad”.

### Afiliados

- AVIF y WebP de 768 y 1200 px, con JPG de respaldo.
- `srcSet` y `sizes` adaptan el recurso al ancho disponible.
- Dimensiones declaradas 1500 × 1001, carga inmediata, decodificación asíncrona y prioridad alta.
- El `alt` “Nuestro dojo” debe sustituirse por una descripción veraz de la escena.

### Galería

| # | Título / `alt` | Categoría | Dimensiones principales | Descripción actual |
|---:|---|---|---:|---|
| 1 | Practicantes en seiza | Reiho | 1474 × 737 | La posición de seiza marca el inicio y cierre de la práctica con respeto, atención y disciplina. |
| 2 | Combates con armadura | Bogu geiko | 1600 × 900 | Practicantes con bogu aplican distancia, timing y precisión durante ejercicios de combate controlado. |
| 3 | Armaduras | Bogu | 1600 × 1067 | Detalle del equipo de protección usado en kendo: men, kote, do y tare listos para la práctica. |
| 4 | Entrenamiento multinivel | Mitori geiko | 1500 × 750 | La observación activa permite aprender ritmo, postura y etiqueta antes de entrar al combate. |
| 5 | Uniforme | Gi y Hakama | 1066 × 1066 | El gi y la hakama forman el uniforme tradicional, preparado para moverse con orden y seguridad. |
| 6 | Comunidad de kendo | Equipo y convivencia | 1600 × 800 | La comunidad crece compartiendo entrenamientos, apoyo entre practicantes y momentos fuera del dojo. |
| 7 | Kirikaeshi | Técnica | 1600 × 900 | Kirikaeshi trabaja cortes repetidos, desplazamiento y respiración para fortalecer fundamentos. |
| 8 | Combate competitivo | Shiai | 1600 × 1519 | El shiai pone a prueba técnica, decisión y respeto dentro de un formato competitivo. |

Cada imagen principal dispone de variantes responsive. Las miniaturas tienen archivos de 160, 320 y 480 px según el uso. El título se reutiliza como `alt` en la imagen destacada y el lightbox; las miniaturas son decorativas porque su botón ya tiene una etiqueta accesible.

## 12. Archivo `llms.txt`

`llms.txt` es un archivo público de texto pensado para ofrecer a sistemas de inteligencia artificial una descripción breve del sitio y enlaces directos a sus páginas principales. No sustituye el sitemap, las etiquetas `<meta>`, Open Graph ni JSON-LD; funciona como una referencia adicional y legible.

### Contenido actual

| Campo | Valor |
|---|---|
| Título | Federación de Asociaciones de Kendo - 35 caracteres |
| Descripción | Sitio oficial de la Federación de Asociaciones de Kendo. - 58 caracteres |
| Inicio | https://fak-kendo.pages.dev/ |
| Galería | https://fak-kendo.pages.dev/galeria/ |
| Afiliados | https://fak-kendo.pages.dev/afiliados/ |

```text
# Federación de Asociaciones de Kendo

Sitio oficial de la Federación de Asociaciones de Kendo.

## Pages

- [Inicio](https://fak-kendo.pages.dev/)
- [Galería](https://fak-kendo.pages.dev/galeria/)
- [Afiliados](https://fak-kendo.pages.dev/afiliados/)
```

El nombre, la descripción y las URL deben mantenerse alineados con `seo-data.json`, el dominio canónico, el sitemap y el contenido visible del sitio.

## 13. Archivos y señales complementarias

- `sitemap.xml`: incluye Inicio, Galería y Afiliados.
- `robots.txt`: permite rastrear el sitio y declara el sitemap.
- Canonical: evita duplicados por variantes de URL.
- HTML prerenderizado: incluye contenido visible y metadatos antes de ejecutar React.
