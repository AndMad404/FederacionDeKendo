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
    <div className="bg-stone-900 rounded-2xl p-7 border border-white/5 flex flex-col gap-5 justify-center">
      <h3
        className="text-white"
        style={{ fontWeight: 600, fontSize: "1rem" }}
      >
        Información del dojo #1
      </h3>

      {INFO.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-700/20 flex items-center justify-center text-red-500 flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {item.label}
            </p>
            <p className="text-sm text-gray-300">
              {item.value}
            </p>
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-red-500" />
          <p className="text-xs text-gray-500">
            Horario de clases
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
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
      <h3
        className="text-white mt-7"
        style={{ fontWeight: 600, fontSize: "1rem" }}
      >
        Información del dojo #2
      </h3>

      {INFO.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-700/20 flex items-center justify-center text-red-500 flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {item.label}
            </p>
            <p className="text-sm text-gray-300">
              {item.value}
            </p>
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-red-500" />
          <p className="text-xs text-gray-500">
            Horario de clases
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
          {SCHEDULE.map((s) => (
            <>
              <span key={s.days}>{s.days}</span>
              <span key={s.hours} className="text-right">
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
    <main className="pt-16 bg-stone-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="overflow-hidden rounded-2xl bg-stone-800 h-80 lg:h-auto">
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