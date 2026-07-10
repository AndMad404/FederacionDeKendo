export interface GalleryImage {
  id: number;
  src: string;
  srcSet?: string;
  sizes?: string;
  featuredSrc?: string;
  featuredSrcSet?: string;
  featuredWidth?: number;
  featuredHeight?: number;
  width: number;
  height: number;
  thumbnailSrc: string;
  thumbnailSrcSet?: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  disableObjectPosition?: boolean;
  objectPosition?: string;
  mobileObjectPosition?: string;
  title: string;
  tag: string;
  description?: string;
}

type CalendarEventType =
  | "Examen"
  | "Torneo"
  | "Seminario"
  | "Entrenamiento especial"
  | "Actividad federativa";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  summary?: string;
  type?: CalendarEventType;
  organizer?: string;
  infoUrl?: string;
  ctaLabel?: string;
  timeZone?: string;
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
