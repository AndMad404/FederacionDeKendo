import type { ReactNode } from "react";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { DOJOS } from "../data/dojos";
import type { IconKey, InfoItem, ScheduleSlot } from "../data/dojos";

const ICON_MAP: Record<IconKey, ReactNode> = {
  mail: <Mail />,
  phone: <Phone />,
  mapPin: <MapPin />,
  instagram: <InstagramIcon />,
  facebook: <FacebookIcon />,
  globe: <Globe />,
};

function ScheduleRow({ days, hours }: Pick<ScheduleSlot, "days" | "hours">) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 md:grid-cols-2 md:gap-x-5 lg:gap-x-6">
      <p className="text-left [overflow-wrap:anywhere] md:pl-[3.5rem] lg:pl-[4.25rem]">
        {days}
      </p>
      <p className="text-right md:text-left [overflow-wrap:anywhere] md:pl-[3.5rem] lg:pl-[4.25rem]">
        {hours}
      </p>
    </div>
  );
}

function DojoInfo({
  title,
  info,
  schedule,
}: {
  title: string;
  info: InfoItem[];
  schedule: ScheduleSlot[];
}) {
  const singleScheduleLocation =
    schedule.length > 0 && schedule.every((slot) => slot.location === schedule[0].location);

  return (
    <section className="mb-6 flex flex-col gap-2 rounded-3xl border border-blue-500 bg-black/40 px-6 py-4 text-white">
      <p className="text-center text-2xl font-bold">
        {title}
      </p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
        {info.map((item) => (
          <div key={item.label} className="flex items-center gap-4">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-red-500 [&>svg]:size-5 md:h-10 md:w-10 lg:h-12 lg:w-12 lg:[&>svg]:size-6">
              {ICON_MAP[item.icon]}
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold lg:text-lg">
                {item.label}
              </p>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`block text-base underline-offset-4 [overflow-wrap:anywhere] hover:underline ${
                  item.icon === "mail" ? "lg:text-sm" : "lg:text-base"
                }`}
              >
                {item.value}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 text-center">
        <p className="text-xl font-bold lg:text-2xl">
          Horario de clases:
        </p>
        <div className="grid gap-1 text-base lg:gap-4">
          {singleScheduleLocation ? (
            <div>
              <p className="text-lg font-bold">
                {schedule[0].location}
              </p>
              <div className="grid gap-1">
                {schedule.map((slot) => (
                  <ScheduleRow
                    key={`${slot.days}-${slot.hours}`}
                    days={slot.days}
                    hours={slot.hours}
                  />
                ))}
              </div>
            </div>
          ) : (
            schedule.map((slot) => (
              <div key={slot.location}>
                <p className="text-lg font-bold">
                  {slot.location}
                </p>
                <ScheduleRow days={slot.days} hours={slot.hours} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function InfoCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
      {DOJOS.map((dojo) => (
        <DojoInfo
          key={dojo.title}
          title={dojo.title}
          info={dojo.info}
          schedule={dojo.schedule}
        />
      ))}
    </div>
  );
}

export function AfiliadosSection() {
  return (
    <main className="rounded-3xl bg-stone-950 md:h-full">
      <div className="relative flex min-h-[530px] items-center justify-center overflow-hidden rounded-3xl pt-6 lg:pt-0 md:h-full md:min-h-0">
        <img
          src="https://images.unsplash.com/photo-1765666738346-28ce4c332831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxrZW5kbyUyMG1hcnRpYWwlMjBhcnRzJTIwamFwYW5lc2UlMjBzd29yZHxlbnwxfHx8fDE3ODAxMDAzODB8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Nuestro dojo"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
          <InfoCard />
        </div>
      </div>
    </main>
  );
}
