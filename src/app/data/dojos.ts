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
  href?: string;
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

export const DOJOS: DojoData[] = [
  {
    title: "Koken Chiai Dojo",
    info: [
      {
        icon: "mail",
        label: "Correo",
        value: "kendokokenchiai@gmail.com",
        href: "mailto:kendokokenchiai@gmail.com",
      },
      {
        icon: "phone",
        label: "Tel\u00e9fono",
        value: "+506 8869 9205",
        href: "tel:+50688699205",
      },
      {
        icon: "mapPin",
        label: "Moravia / Guadalupe",
        value: "Ver ubicaci\u00f3n",
        href: "https://maps.app.goo.gl/WeVxr3pNL7N2hkos5",
      },
      {
        icon: "mapPin",
        label: "Curridabat",
        value: "Ver ubicaci\u00f3n",
        href: "https://maps.app.goo.gl/jKnHfSwpWiobTCkN6",
      },
      {
        icon: "instagram",
        label: "Instagram",
        value: "@kendocostarica",
        href: "https://www.instagram.com/kendocostarica/",
      },
    ],
    schedule: [
      {
        location: "Moravia / Guadalupe",
        days: "Lunes, Mi\u00e9rcoles y Viernes",
        hours: "8:15 - 9:30 PM",
      },
      {
        location: "Curridabat",
        days: "Martes y Jueves",
        hours: "7:15 - 8:30 PM",
      },
    ],
  },
  {
    title: "Dojo #2",
    info: [
      {
        icon: "mapPin",
        label: "Ubicaci\u00f3n",
        value: "Por definir",
      },
      {
        icon: "mail",
        label: "Correo",
        value: "Por definir",
      },
      {
        icon: "phone",
        label: "Tel\u00e9fono",
        value: "Por definir",
      },
    ],
    schedule: [
      {
        location: "Por definir",
        days: "Por definir",
        hours: "Por definir",
      },
    ],
  },
];
