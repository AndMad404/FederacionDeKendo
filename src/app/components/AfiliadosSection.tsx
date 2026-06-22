import type { ReactNode } from "react";
import { Clock, Facebook, Globe, Instagram, Mail, MapPin, Phone } from "lucide-react";

type InfoItem = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
};

const INFO: InfoItem[] = [
  {
    icon: <MapPin className="size-3.5 md:size-5 lg:size-6" />,
    label: "Ubicacion",
    value: "Av. del Bushido 88, Ciudad",
  },
  {
    icon: <Mail className="size-3.5 md:size-5 lg:size-6" />,
    label: "Email",
    value: "info@kendodojo.com",
  },
  {
    icon: <Phone className="size-3.5 md:size-5 lg:size-6" />,
    label: "Telefono",
    value: "+1 (555) 000-0000",
  },
  {
    icon: <Globe className="size-3.5 md:size-5 lg:size-6" />,
    label: "Sitio web",
    value: "www.kendodojo.com",
    href: "https://www.kendodojo.com",
  },
  {
    icon: <Instagram className="size-3.5 md:size-5 lg:size-6" />,
    label: "Instagram",
    value: "@kendodojo",
    href: "https://www.instagram.com/kendodojo",
  },
  {
    icon: <Facebook className="size-3.5 md:size-5 lg:size-6" />,
    label: "Facebook",
    value: "Kendo Dojo",
    href: "https://www.facebook.com/kendodojo",
  },
];

const SCHEDULE = [
  { days: "Lunes - Miercoles", hours: "18:00 - 21:00" },
  { days: "Viernes", hours: "18:00 - 20:30" },
  { days: "Sabado", hours: "09:00 - 12:00" },
];

function DojoInfo({ title }: { title: string }) {
  return (
    <section className="my-4 flex flex-col gap-2 rounded-3xl bg-black/40 px-3 py-3 md:my-0 md:gap-4 md:px-6 md:py-5 lg:gap-5 lg:px-8 lg:py-6">
      <p className="text-center text-base font-bold text-white md:text-xl lg:text-2xl">
        {title}
      </p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-5 md:gap-y-4 lg:gap-x-6 lg:gap-y-5">
        {INFO.map((item) => (
          <div key={item.label} className="flex items-start gap-3 md:gap-4 lg:gap-5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-700/20 text-red-500 md:h-10 md:w-10 lg:h-12 lg:w-12">
              {item.icon}
            </div>
            <div className="text-white">
              <p className="text-xs font-bold md:text-sm lg:text-base">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline-offset-4 hover:underline md:text-base lg:text-lg"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm md:text-base lg:text-lg">
                  {item.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="mb-2 flex items-center justify-center">
          <p className="text-xs font-bold text-white md:text-sm lg:text-base">
            Horario de clases:
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-[15rem] grid-cols-2 gap-x-4 text-xs text-white md:max-w-md md:gap-x-8 md:text-sm lg:max-w-lg lg:gap-x-10 lg:text-base">
          {SCHEDULE.map((slot) => (
            <div key={slot.days} className="contents">
              <span className="text-left">{slot.days}</span>
              <span className="text-right">{slot.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 lg:gap-10 xl:gap-12">
      <DojoInfo title="Informacion del dojo #1" />
      <DojoInfo title="Informacion del dojo #2" />
    </div>
  );
}

export function AfiliadosSection() {
  return (
    <main className="rounded-3xl bg-stone-950 md:h-full">
      <div className="relative flex min-h-[53W0px] items-center justify-center overflow-hidden rounded-3xl md:h-full md:min-h-0">
        <img
          src="https://images.unsplash.com/photo-1765666738346-28ce4c332831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Nuestro dojo"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
          <InfoCard />
        </div>
      </div>
    </main>
  );
}
