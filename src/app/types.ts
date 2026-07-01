export interface GalleryImage {
  id: number;
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  thumbnailSrc: string;
  thumbnailSrcSet?: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  objectPosition?: string;
  title: string;
  tag: string;
}

export type IconKey =
  | "mail"
  | "phone"
  | "mapPin"
  | "instagram"
  | "facebook"
  | "globe";

export interface InfoItem {
  icon: IconKey;
  label: string;
  value: string;
  href: string;
}

export interface ScheduleSlot {
  location: string;
  days: string;
  hours: string;
}

export interface DojoData {
  title: string;
  info: InfoItem[];
  schedule: ScheduleSlot[];
}
