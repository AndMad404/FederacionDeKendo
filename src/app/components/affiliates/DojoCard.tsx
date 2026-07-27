import { Fragment, type ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { DojoData, IconKey, InfoItem, ScheduleSlot } from "../../types";
import { focusRingClass, panelSurfaceClass } from "../../styles/shared";

const ICON_MAP: Record<IconKey, ReactNode> = {
  mail: <Mail />,
  phone: <Phone />,
  mapPin: <MapPin />,
  instagram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  globe: <Globe />,
};

const INFO_GRID =
  "grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-2 gap-y-2 sm:gap-x-4 md:grid-cols-[2.5rem_minmax(11rem,1.1fr)_1.5rem_2.5rem_minmax(0,1fr)] md:gap-y-4 lg:grid-cols-[3rem_minmax(13rem,1.1fr)_2rem_3rem_minmax(0,1fr)] land-compact:grid-cols-[1.75rem_minmax(0,1fr)] land-compact:gap-x-2 land-compact:gap-y-1";
const SCHEDULE_GRID =
  "grid w-full grid-cols-1 items-center gap-y-1 text-center md:grid-cols-[2.5rem_minmax(0,1fr)_2rem_2.5rem_minmax(0,1fr)] md:gap-x-4 md:gap-y-4 lg:grid-cols-[3rem_minmax(0,1fr)_2.5rem_3rem_minmax(0,1fr)] land-compact:grid-cols-[minmax(0,1fr)_max-content] land-compact:items-baseline land-compact:gap-x-2 land-compact:text-left";

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
  const iconColumn =
    side === "left" ? "col-start-1" : "md:col-start-4 land-compact:col-start-1";
  const textColumn =
    side === "left" ? "col-start-2" : "md:col-start-5 land-compact:col-start-2";

  return (
    <Fragment>
      <span
        className={`${iconColumn} flex size-8 items-center justify-center rounded-lg bg-site-media text-site-action [&>svg]:size-5 md:size-10 lg:size-12 lg:[&>svg]:size-6 land-compact:size-7 land-compact:[&>svg]:size-4`}
      >
        {ICON_MAP[item.icon]}
      </span>
      <div className={`${textColumn} min-w-0`}>
        <p className="text-xl font-bold lg:text-lg land-compact:text-xl land-compact:leading-tight">
          {item.label}
        </p>
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={`block text-base underline-offset-4 transition-colors duration-200 [overflow-wrap:anywhere] hover:text-site-action-soft hover:underline land-compact:leading-tight ${focusRingClass}`}
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
      <dt className="text-center text-base [overflow-wrap:anywhere] md:col-start-2 md:text-left land-compact:col-start-auto land-compact:leading-tight">
        {days}
      </dt>
      <dd className="text-center [overflow-wrap:anywhere] md:col-start-5 md:text-left land-compact:col-start-auto land-compact:leading-tight">
        {hours}
      </dd>
    </div>
  );
}

function getScheduleGroups(schedule: ScheduleSlot[]) {
  const slotsByLocation = new Map<string, ScheduleSlot[]>();

  for (const slot of schedule) {
    const locationSlots = slotsByLocation.get(slot.location);

    if (locationSlots) {
      locationSlots.push(slot);
    } else {
      slotsByLocation.set(slot.location, [slot]);
    }
  }

  return Array.from(slotsByLocation, ([location, slots]) => ({
    location,
    slots,
  }));
}

interface DojoCardProps extends DojoData {
  headingId: string;
}

export function DojoCard({
  headingId,
  title,
  info,
  schedule,
}: DojoCardProps) {
  const scheduleGroups = getScheduleGroups(schedule);

  return (
    <section
      aria-labelledby={headingId}
      className={`mb-2.5 flex flex-col justify-between gap-2 px-3 py-4 sm:px-6 xl:mb-0 xl:py-3 land-compact:mb-0 land-compact:gap-1 land-compact:px-3 land-compact:py-2 ${panelSurfaceClass}`}
    >
      <h2
        id={headingId}
        className="w-full text-center text-2xl font-bold land-compact:leading-tight"
      >
        {title}
      </h2>

      <div className="grid gap-2 md:gap-4 land-compact:gap-1">
        {getInfoRows(info).map(([leftItem, rightItem]) => (
          <div key={leftItem.label} className={INFO_GRID}>
            <InfoCell item={leftItem} side="left" />
            {rightItem ? <InfoCell item={rightItem} side="right" /> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-2 text-center land-compact:gap-1 land-compact:text-left">
        <h3 className="w-full text-center text-2xl font-bold land-compact:leading-tight">
          Horario de clases:
        </h3>
        <div className="grid gap-2 text-base land-compact:leading-tight">
          {scheduleGroups.map(({ location, slots }) => (
            <section key={location} aria-label={location}>
              <h4 className="text-lg font-bold land-compact:leading-tight">
                {location}
              </h4>
              <dl className={slots.length > 1 ? "grid gap-1" : undefined}>
                {slots.map((slot) => (
                  <ScheduleRow
                    key={`${slot.days}-${slot.hours}`}
                    days={slot.days}
                    hours={slot.hours}
                  />
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
