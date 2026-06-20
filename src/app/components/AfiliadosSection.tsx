import { MapPin, Mail, Phone, Clock } from "lucide-react";

const INFO = [
  {
    icon: <MapPin size={16} />,
    label: "Ubicación",
    value: "Av. del Bushido 88, Ciudad",
  },
  {
    icon: <Mail size={16} />,
    label: "Email",
    value: "info@kendodojo.com",
  },
  {
    icon: <Phone size={16} />,
    label: "Teléfono",
    value: "+1 (555) 000-0000",
  },
];

const SCHEDULE = [
  { days: "Lunes — Miércoles", hours: "18:00 – 21:00" },
  { days: "Viernes", hours: "18:00 – 20:30" },
  { days: "Sábado", hours: "09:00 – 12:00" },
];

function InfoCard() {
  return (
    <div className="bg-black/40 rounded-2xl p-7 border border-white/5 flex flex-col gap-5 justify-center ">
      <p
        className="text-white font-bold"
        style={{ fontWeight: 600, fontSize: "1rem" }}
      >
        Información del dojo #1
      </p>

      {INFO.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-700/20 flex items-center justify-center text-red-500 flex-shrink-0">
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
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-red-500" />
          <p className="text-xs text-white font-bold">
            Horario de clases
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-white">
          {SCHEDULE.map((s) => (
            <>
              <span key={s.days}>{s.days}</span>
              <span key={s.hours} className="text-left">
                {s.hours}
              </span>
            </>
          ))}
        </div>
      </div>
      <p
        className="text-white mt-6 font-bold"
        style={{ fontWeight: 600, fontSize: "1rem" }}
      >
        Información del dojo #2
      </p>

      {INFO.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-700/20 flex items-center justify-center text-red-500 flex-shrink-0">
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
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-red-500" />
          <p className="text-xs text-white font-bold">
            Horario de clases
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-white">
          {SCHEDULE.map((s) => (
            <>
              <span key={s.days}>{s.days}</span>
              <span key={s.hours} className="text-left">
                {s.hours}
              </span>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AfiliadosSection() {
  return (
    <main className="bg-stone-950 rounded-3xl md:flex md:h-full md:items-center md:justify-center">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
       <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-stone-800 h-80 lg:h-auto">
            <img
              src="https://images.unsplash.com/photo-1765666738346-28ce4c332831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Nuestro dojo"
              className="w-full h-full object-cover"
            />
          </div>

          <InfoCard />
        </div>
      </div>
    </main>
  );
}
