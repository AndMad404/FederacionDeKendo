import { Clock, Mail, MapPin, Phone } from "lucide-react";

const INFO = [
  {
    icon: <MapPin size={14} />,
    label: "Ubicacion",
    value: "Av. del Bushido 88, Ciudad",
  },
  {
    icon: <Mail size={14} />,
    label: "Email",
    value: "info@kendodojo.com",
  },
  {
    icon: <Phone size={14} />,
    label: "Telefono",
    value: "+1 (555) 000-0000",
  },
];

const SCHEDULE = [
  { days: "Lunes - Miercoles", hours: "18:00 - 21:00" },
  { days: "Viernes", hours: "18:00 - 20:30" },
  { days: "Sabado", hours: "09:00 - 12:00" },
];

function DojoInfo({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/40 py-2 px-4 my-1">
      <p className="text-base font-bold text-white">
        {title}
      </p>

      {INFO.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-700/20 text-red-500">
            {item.icon}
          </div>
          <div className="text-white">
            <p className="text-xs font-bold">
              {item.label}
            </p>
            <p className="text-sm">
              {item.value}
            </p>
          </div>
        </div>
      ))}

      <div>
        <div className="mb-2 flex items-center ">
          <p className="text-xs font-bold text-white">
            Horario de clases:
          </p>
        </div>
        <div className="grid max-w-[15rem] grid-cols-[auto_auto] gap-x-4 text-xs text-white">
          {SCHEDULE.map((slot) => (
            <div key={slot.days} className="contents">
              <span>{slot.days}</span>
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
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
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

        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6">
          <InfoCard />
        </div>
      </div>
    </main>
  );
}
