import { MapPin } from "lucide-react";
import { HERO_CALENDAR_EVENTS } from "../data/calendarEvents";
import type { CalendarEvent } from "../types";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const imageVersion = "v=20260704-0120";
const maxHeroEvents = 4;
const getTodayIsoDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const todayIso = getTodayIsoDate();
const heroEvents = HERO_CALENDAR_EVENTS
  .filter((event) => event.date >= todayIso)
  .sort((a, b) =>
    `${a.date}-${a.startTime ?? ""}`.localeCompare(
      `${b.date}-${b.startTime ?? ""}`,
    ),
  )
  .slice(0, maxHeroEvents);
const eventDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatEventDate(date: string) {
  return eventDateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function formatEventTime({ startTime, endTime }: CalendarEvent) {
  if (!startTime) {
    return "Todo el día";
  }

  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function getEventVisibilityClass(index: number) {
  if (index === 2) {
    return "[@media_(orientation:landscape)_and_(max-height:640px)]:hidden";
  }

  if (index === 3) {
    return "hidden lg:flex [@media_(orientation:landscape)_and_(min-height:641px)]:flex";
  }

  return "";
}

function UpcomingEventsSection() {
  if (heroEvents.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="upcoming-events-title"
      className="mx-auto w-full max-w-6xl px-1 pt-2.5 pb-0 text-white sm:px-4"
    >
      <div className="mb-2.5 flex items-center justify-center text-center font-semibold text-white">
        <h2
          id="upcoming-events-title"
          className="text-lg font-bold leading-tight sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]"
        >
          Calendario de Proximos Eventos
        </h2>
      </div>

      <ul className="grid gap-3 [@media_(orientation:landscape)_and_(max-height:640px)]:grid-cols-2 [@media_(orientation:landscape)_and_(min-height:641px)]:grid-cols-4 lg:grid-cols-4">
        {heroEvents.map((event, index) => (
          <li
            key={event.id}
            className={`flex items-center gap-3 rounded-lg border border-blue-500/70 bg-white/[0.06] p-3 ${getEventVisibilityClass(index)}`}
          >
            <time
              dateTime={event.date}
              className="shrink-0 rounded-md bg-white/10 px-2.5 py-2 text-center text-lg font-bold uppercase leading-tight text-blue-100"
            >
              {formatEventDate(event.date)}
            </time>
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight">
                {event.title}
              </p>
              <p className="text-base leading-tight text-white/75">
                {formatEventTime(event)}
              </p>
              {event.location ? (
                <p className="mt-1 flex items-center gap-1 text-sm leading-tight text-white/70">
                  <MapPin className="size-3.5 shrink-0 text-red-300" aria-hidden="true" />
                  <span className="min-w-0 truncate">{event.location}</span>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HeroBanner() {
  return (
    <header className="relative flex h-[clamp(520px,calc(100svh_-_4rem_-_10px),680px)] items-stretch overflow-hidden rounded-2xl sm:rounded-3xl [@media_(orientation:landscape)_and_(max-height:640px)]:h-auto [@media_(orientation:landscape)_and_(max-height:640px)]:min-h-[calc(100svh_-_3rem_-_6px)] [@media_(min-width:768px)_and_(min-height:640px)]:h-[calc(100%_-_11rem)] [@media_(min-width:768px)_and_(min-height:640px)]:min-h-[380px]">
      <picture className="absolute inset-0 h-full w-full">
        <source
          srcSet={`/images/hero/kendo-hero-formacion-480.webp?${imageVersion} 480w, /images/hero/kendo-hero-formacion-960.webp?${imageVersion} 960w, /images/hero/kendo-hero-formacion-1500.webp?${imageVersion} 1500w`}
          sizes="100vw"
          type="image/webp"
        />
        <img
          src={`/images/hero/kendo-hero-formacion-1500.webp?${imageVersion}`}
          alt="Grupo de practicantes de kendo reunidos despues de una actividad"
          width={1500}
          height={750}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          {...highPriorityImageProps}
        />
      </picture>

      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-10 flex w-full flex-col justify-between gap-3 px-4 py-4 text-center sm:px-6 [@media_(orientation:landscape)_and_(max-height:640px)]:justify-center [@media_(orientation:landscape)_and_(max-height:640px)]:gap-2 [@media_(orientation:landscape)_and_(max-height:640px)]:px-2 [@media_(orientation:landscape)_and_(max-height:640px)]:py-2 [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3 shadow-2xl sm:px-5 [@media_(orientation:landscape)_and_(max-height:640px)]:px-2 [@media_(orientation:landscape)_and_(max-height:640px)]:pt-px [@media_(orientation:landscape)_and_(max-height:640px)]:pb-1 [@media_(min-width:768px)_and_(min-height:640px)]:rounded-3xl [@media_(min-width:768px)_and_(min-height:640px)]:px-10 [@media_(min-width:768px)_and_(min-height:640px)]:py-5">
          <h1
            id="home-title"
            className="text-lg font-bold leading-tight tracking-wide text-white sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]"
          >
            FEDERACIÓN DE ASOCIACIONES DE KENDO
          </h1>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1 rounded-2xl border border-blue-500/70 bg-black/70 px-3 py-3 shadow-2xl">
          <h2 className="text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl [@media_(min-width:768px)_and_(min-height:640px)]:text-[clamp(1.25rem,3vw,2rem)]">
            KENDO - 剣道
            <br />
            EL CAMINO DE LA ESPADA
          </h2>

          <p className="max-w-sm text-lg leading-snug text-white sm:max-w-md [@media_(min-width:768px)_and_(min-height:640px)]:text-lg [@media_(min-width:768px)_and_(min-height:640px)]:leading-relaxed">
            Únete a nuestra comunidad y descubre este arte marcial japonés.
            <br />
            Clases para todos los niveles, de principiante a dan avanzado.
          </p>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section
      aria-labelledby="home-title"
      className="[@media_(min-width:768px)_and_(min-height:640px)]:h-full [@media_(min-width:768px)_and_(min-height:640px)]:overflow-y-auto"
    >
      <HeroBanner />
      <UpcomingEventsSection />
    </section>
  );
}
