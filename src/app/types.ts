export type Page = "inicio" | "galeria" | "afiliados";

export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  tag: string;
  likes: number;
  date?: string; // ISO 8601, e.g. "2024-11-03"
}
