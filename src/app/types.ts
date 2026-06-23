export interface GalleryImage {
  id: number;
  src: string;
  title: string;
  tag: string;
  likes: number;
  date?: string; // ISO 8601, e.g. "2024-11-03"
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
