import type { GalleryImage } from "../types";
import type { Language } from "../config/i18n";

const assetVersion = "v=20260704-0200";
const versioned = (path: string) => `${path}?${assetVersion}`;

const thumbnailSrcSet = (imageName: string) =>
  `${versioned(`/images/gallery/thumbs/${imageName}-160.webp`)} 160w, ${versioned(`/images/gallery/thumbs/${imageName}-320.webp`)} 320w`;

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: versioned("/images/gallery/kendo-gallery-01.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-01-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-01.webp")} 1474w`,
    sizes: "100vw",
    width: 1474,
    height: 737,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-01-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-01"),
    thumbnailWidth: 320,
    thumbnailHeight: 160,
    mobileObjectPosition: "25%",
    title: "Practicantes en seiza",
    alt: "Practicantes de kendo sentados en seiza con sus shinai alineados en el dojo",
    tag: "Reiho",
    description:
      "La posición de seiza marca el inicio y cierre de la práctica con respeto, atención y disciplina.",
  },
  {
    id: 2,
    src: versioned("/images/gallery/kendo-gallery-02.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-02-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-02.webp")} 1600w`,
    sizes: "100vw",
    width: 1600,
    height: 900,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-02-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-02"),
    thumbnailWidth: 320,
    thumbnailHeight: 180,
    title: "Combates con armadura",
    alt: "Practicantes de kendo con bogu realizan ejercicios de combate en el dojo",
    tag: "Bogu geiko",
    description:
      "Practicantes con bogu aplican distancia, timing y precisión durante ejercicios de combate controlado.",
  },
  {
    id: 3,
    src: versioned("/images/gallery/kendo-gallery-03.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-03-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-03.webp")} 1600w`,
    sizes: "100vw",
    width: 1600,
    height: 1067,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-03-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-03"),
    thumbnailWidth: 320,
    thumbnailHeight: 213,
    title: "Armaduras",
    alt: "Armaduras de kendo con men, kote, do y tare preparadas para el entrenamiento",
    tag: "Bogu",
    description:
      "Detalle del equipo de protección usado en kendo: men, kote, do y tare listos para la práctica.",
  },
  {
    id: 4,
    src: versioned("/images/gallery/kendo-gallery-04.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-04-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-04.webp")} 1500w`,
    sizes: "100vw",
    width: 1500,
    height: 750,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-04-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-04"),
    thumbnailWidth: 320,
    thumbnailHeight: 160,
    title: "Entrenamiento multinivel",
    alt: "Practicantes observan un ejercicio de kendo realizado en el centro del dojo",
    tag: "Mitori geiko",
    description:
      "La observación activa permite aprender ritmo, postura y etiqueta antes de entrar al combate.",
  },
  {
    id: 5,
    src: versioned("/images/gallery/kendo-gallery-05.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-05-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-05.webp")} 1066w`,
    sizes: "100vw",
    width: 1066,
    height: 1066,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-05-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-05"),
    thumbnailWidth: 320,
    thumbnailHeight: 320,
    objectPosition: "center",
    mobileObjectPosition: "center 0%",
    title: "Uniforme",
    alt: "Fila de practicantes de kendo sentados en seiza sobre el piso del dojo",
    tag: "Gi y Hakama",
    description:
      "El gi y la hakama forman el uniforme tradicional, preparado para moverse con orden y seguridad.",
  },
  {
    id: 6,
    src: versioned("/images/gallery/kendo-gallery-06.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-06-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-06.webp")} 1600w`,
    sizes: "100vw",
    width: 1600,
    height: 800,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-06-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-06"),
    thumbnailWidth: 320,
    thumbnailHeight: 160,
    disableObjectPosition: true,
    title: "Comunidad de kendo",
    alt: "Grupo de practicantes de kendo y acompañantes reunidos después de una competencia",
    tag: "Equipo y convivencia",
    description:
      "La comunidad crece compartiendo entrenamientos, apoyo entre practicantes y momentos fuera del dojo.",
  },
  {
    id: 7,
    src: versioned("/images/gallery/kendo-gallery-07.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-07-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-07.webp")} 1600w`,
    sizes: "100vw",
    width: 1600,
    height: 900,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-07-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-07"),
    thumbnailWidth: 320,
    thumbnailHeight: 180,
    title: "Kirikaeshi",
    alt: "Dos competidores de kendo intercambian golpes de shinai durante un combate",
    tag: "Técnica",
    description:
      "Kirikaeshi trabaja cortes repetidos, desplazamiento y respiración para fortalecer fundamentos.",
  },
  {
    id: 8,
    src: versioned("/images/gallery/kendo-gallery-08-1600.webp"),
    srcSet: `${versioned("/images/gallery/thumbs/kendo-gallery-08-480.webp")} 480w, ${versioned("/images/gallery/kendo-gallery-08-960.webp")} 960w, ${versioned("/images/gallery/kendo-gallery-08-1600.webp")} 1600w`,
    sizes: "100vw",
    width: 1600,
    height: 1519,
    thumbnailSrc: versioned("/images/gallery/thumbs/kendo-gallery-08-320.webp"),
    thumbnailSrcSet: thumbnailSrcSet("kendo-gallery-08"),
    thumbnailWidth: 320,
    thumbnailHeight: 303,
    disableObjectPosition: true,
    title: "Combate competitivo",
    alt: "Combate de kendo en el que un competidor avanza para atacar con el shinai",
    tag: "Shiai",
    description:
      "El shiai pone a prueba técnica, decisión y respeto dentro de un formato competitivo.",
  },
];

const ENGLISH_GALLERY_COPY: Record<
  number,
  Pick<GalleryImage, "title" | "alt" | "tag" | "description">
> = {
  1: { title: "Practitioners in seiza", alt: "Kendo practitioners seated in seiza with their shinai aligned in the dojo", tag: "Reiho", description: "The seiza position marks the beginning and end of practice with respect, attention, and discipline." },
  2: { title: "Armored practice", alt: "Kendo practitioners wearing bogu perform combat exercises in the dojo", tag: "Bogu geiko", description: "Practitioners wearing bogu apply distance, timing, and precision during controlled combat exercises." },
  3: { title: "Armor", alt: "Kendo armor with men, kote, do, and tare prepared for training", tag: "Bogu", description: "A close look at the protective equipment used in kendo: men, kote, do, and tare ready for practice." },
  4: { title: "Mixed-level training", alt: "Practitioners observe a kendo exercise performed in the center of the dojo", tag: "Mitori geiko", description: "Active observation helps practitioners learn rhythm, posture, and etiquette before entering combat." },
  5: { title: "Uniform", alt: "A row of kendo practitioners seated in seiza on the dojo floor", tag: "Gi and Hakama", description: "The gi and hakama form the traditional uniform, prepared for orderly and safe movement." },
  6: { title: "Kendo community", alt: "A group of kendo practitioners and companions gathered after a competition", tag: "Team and community", description: "The community grows by sharing training, mutual support, and moments outside the dojo." },
  7: { title: "Kirikaeshi", alt: "Two kendo competitors exchange shinai strikes during a match", tag: "Technique", description: "Kirikaeshi develops repeated cuts, footwork, and breathing to strengthen core fundamentals." },
  8: { title: "Competitive match", alt: "A kendo match in which one competitor advances to attack with the shinai", tag: "Shiai", description: "Shiai tests technique, decision-making, and respect within a competitive format." },
};

export function getGalleryImages(language: Language) {
  if (language === "es") return GALLERY_IMAGES;
  return GALLERY_IMAGES.map((image) => ({
    ...image,
    ...ENGLISH_GALLERY_COPY[image.id],
  }));
}
