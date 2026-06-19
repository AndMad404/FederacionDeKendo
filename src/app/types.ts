export type Page = "inicio" | "galeria" | "afiliados";

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  tag: string;
  likes: number;
}
