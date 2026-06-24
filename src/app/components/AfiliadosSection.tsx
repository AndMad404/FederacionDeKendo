import { Fragment, type ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { DOJOS } from "../data/dojos";
import type { IconKey, InfoItem, ScheduleSlot } from "../types";

const ICON_MAP: Record<IconKey, ReactNode> = {
  mail: <Mail />,
  phone: <Phone />,
  mapPin: <MapPin />,
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  globe: <Globe />,
};

const DETAIL_GRID =
  "grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 md:grid-cols-[2.5rem_minmax(0,1fr)_2rem_2.5rem_minmax(0,1fr)] md:gap-y-4 lg:grid-cols-[3rem_minmax(0,1fr)_2.5rem_3rem_minmax(0,1fr)]";
const INFO_GRID =
  "grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 md:grid-cols-[2.5rem_minmax(11rem,1.1fr)_1.5rem_2.5rem_minmax(0,1fr)] md:gap-y-4 lg:grid-cols-[3rem_minmax(13rem,1.1fr)_2rem_3rem_minmax(0,1fr)]";
const SCHEDULE_GRID =
  "grid w-full grid-cols-1 items-center gap-y-1 text-center md:grid-cols-[2.5rem_minmax(0,1fr)_2rem_2.5rem_minmax(0,1fr)] md:gap-x-4 md:gap-y-4 lg:grid-cols-[3rem_minmax(0,1fr)_2.5rem_3rem_minmax(0,1fr)]";

function getInfoRows(info: InfoItem[]) {
  return info.reduce<InfoItem[][]>((rows, item, index) => {
    if (index % 2 === 0) {
      rows.push([item]);
    } else {
      rows[rows.length - 1].push(item);
    }

    return rows;
  }, []);
}

function InfoCell({ item, side }: { item: InfoItem; side: "left" | "right" }) {
  const iconColumn = side === "left" ? "col-start-1" : "md:col-start-4";
  const textColumn = side === "left" ? "col-start-2" : "md:col-start-5";

  return (
    <Fragment>
      <span className={`${iconColumn} flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-red-400 [&>svg]:size-5 md:h-10 md:w-10 lg:h-12 lg:w-12 lg:[&>svg]:size-6`}>
        {ICON_MAP[item.icon]}
      </span>
      <div className={`${textColumn} min-w-0`}>
        <p className="text-xl font-bold lg:text-lg">
          {item.label}
        </p>
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="block text-base underline-offset-4 transition-colors duration-200 [overflow-wrap:anywhere] hover:text-blue-400 hover:underline lg:text-base"
        >
          {item.value}
        </a>
      </div>
    </Fragment>
  );
}

function ScheduleRow({ days, hours }: Pick<ScheduleSlot, "days" | "hours">) {
  return (
    <div className={SCHEDULE_GRID}>
      <p className="text-center [overflow-wrap:anywhere] md:col-start-2 md:text-left">
        {days}
      </p>
      <p className="text-center [overflow-wrap:anywhere] md:col-start-5 md:text-left">
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
  const allSlotsShareLocation =
    schedule.length > 0 && schedule.every((slot) => slot.location === schedule[0].location);

  return (
    <section className="mb-6 flex flex-col gap-2 rounded-3xl border border-blue-500 bg-black/70 px-6 py-4 text-white">
      <p className="text-center text-2xl font-bold">
        {title}
      </p>

      <div className="grid gap-2 md:gap-4">
        {getInfoRows(info).map(([leftItem, rightItem]) => (
          <div key={leftItem.label} className={INFO_GRID}>
            <InfoCell item={leftItem} side="left" />
            {rightItem ? <InfoCell item={rightItem} side="right" /> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-2 text-center">
        <p className="text-xl font-bold lg:text-2xl">
          Horario de clases:
        </p>
        <div className="grid gap-1 text-base lg:gap-4">
          {allSlotsShareLocation ? (
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
        <DojoInfo key={dojo.title} {...dojo} />
      ))}
    </div>
  );
}

export function AfiliadosSection() {
  return (
    <main className="rounded-3xl bg-stone-950 md:h-full">
      <div className="relative flex min-h-[530px] items-center justify-center overflow-hidden rounded-3xl pt-6 lg:pt-0 md:h-full md:min-h-0">
        <img
          src="/images/affiliates/kendo-affiliates-placeholder.svg"
          alt="Nuestro dojo"
          width={1920}
          height={1080}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 rounded-3xl bg-black/40" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
          <InfoCard />
        </div>
      </div>
    </main>
  );
}
