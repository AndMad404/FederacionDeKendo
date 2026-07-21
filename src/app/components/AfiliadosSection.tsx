import { Fragment, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Globe, Mail, MapPin, Phone } from "lucide-react";
import { DOJOS } from "../data/dojos";
import type { DojoData, IconKey, InfoItem, ScheduleSlot } from "../types";
import {
  actionControlSurfaceClass,
  focusRingClass,
  panelSurfaceClass,
} from "../styles/shared";
import { PageTitle } from "./PageTitle";

const highPriorityImageProps = { fetchpriority: "high" } as const;
const DOJOS_PER_PAGE = 2;

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
  const valueTextSize = "text-base";

  return (
    <Fragment>
      <span className={`${iconColumn} flex size-8 items-center justify-center rounded-full bg-site-action/20 text-site-accent [&>svg]:size-5 md:size-10 lg:size-12 lg:[&>svg]:size-6 land-compact:size-7 land-compact:[&>svg]:size-4`}>
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
          className={`block ${valueTextSize} underline-offset-4 transition-colors duration-200 [overflow-wrap:anywhere] hover:text-site-action-soft hover:underline land-compact:leading-tight ${focusRingClass}`}
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

function DojoInfo({
  headingId,
  title,
  info,
  schedule,
}: {
  headingId: string;
  title: string;
  info: InfoItem[];
  schedule: ScheduleSlot[];
}) {
  const allSlotsShareLocation =
    schedule.length > 0 && schedule.every((slot) => slot.location === schedule[0].location);

  return (
    <section
      aria-labelledby={headingId}
      className={`mb-6 flex flex-col justify-between gap-2 rounded-3xl px-3 py-4 text-site-on-dark sm:px-6 land-compact:mb-0 land-compact:gap-1 land-compact:rounded-2xl land-compact:px-3 land-compact:py-2 ${panelSurfaceClass}`}
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
          {allSlotsShareLocation ? (
            <section aria-label={schedule[0].location}>
              <h4 className="text-lg font-bold land-compact:leading-tight">
                {schedule[0].location}
              </h4>
              <dl className="grid gap-1">
                {schedule.map((slot) => (
                  <ScheduleRow
                    key={`${slot.days}-${slot.hours}`}
                    days={slot.days}
                    hours={slot.hours}
                  />
                ))}
              </dl>
            </section>
          ) : (
            schedule.map((slot) => (
              <section key={slot.location} aria-label={slot.location}>
                <h4 className="text-lg font-bold land-compact:leading-tight">
                  {slot.location}
                </h4>
                <dl>
                  <ScheduleRow days={slot.days} hours={slot.hours} />
                </dl>
              </section>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  dojos,
  startIndex,
}: {
  dojos: DojoData[];
  startIndex: number;
}) {
  const desktopGridClass =
    dojos.length === 1
      ? "xl:mx-auto xl:max-w-3xl"
      : "xl:grid-cols-2 xl:gap-8";

  return (
    <div
      id="affiliate-dojo-list"
      className={`grid w-full grid-cols-1 land-compact:grid-cols-2 land-compact:gap-3 ${desktopGridClass}`}
    >
      {dojos.map((dojo, index) => (
        <DojoInfo
          key={dojo.title}
          headingId={`dojo-${startIndex + index + 1}-title`}
          {...dojo}
        />
      ))}
    </div>
  );
}

function AffiliatePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación de dojos afiliados"
      className="mb-4 flex min-h-11 items-center justify-center gap-2 xl:absolute xl:right-6 xl:top-2 xl:z-20 xl:mb-0"
    >
      <button
        type="button"
        aria-label="Página anterior de dojos"
        aria-controls="affiliate-dojo-list"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className={`inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-site-action-hover/90 disabled:cursor-not-allowed disabled:border-site-on-dark/20 disabled:text-site-on-dark/35 ${actionControlSurfaceClass} ${focusRingClass}`}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <p className="min-w-20 text-center text-sm font-bold text-site-on-dark" aria-live="polite">
        {page + 1} de {totalPages}
      </p>

      <button
        type="button"
        aria-label="Página siguiente de dojos"
        aria-controls="affiliate-dojo-list"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className={`inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-site-action-hover/90 disabled:cursor-not-allowed disabled:border-site-on-dark/20 disabled:text-site-on-dark/35 ${actionControlSurfaceClass} ${focusRingClass}`}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </nav>
  );
}

export function AfiliadosSection() {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(DOJOS.length / DOJOS_PER_PAGE));
  const startIndex = page * DOJOS_PER_PAGE;
  const visibleDojos = DOJOS.slice(startIndex, startIndex + DOJOS_PER_PAGE);

  return (
    <section
      aria-labelledby="affiliates-title"
      className="relative rounded-3xl bg-site-canvas md:h-full md:overflow-y-auto xl:overflow-hidden land-compact:overflow-y-auto"
    >
      <PageTitle
        id="affiliates-title"
        className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 land-compact:top-2"
      >
        Dojos afiliados
      </PageTitle>
      <div className="relative flex min-h-[530px] items-center justify-center overflow-hidden rounded-3xl pt-6 xl:h-full xl:min-h-0 xl:pt-0 land-compact:min-h-[calc(100dvh-4rem-10px)] land-compact:items-start land-compact:overflow-y-auto land-compact:py-2">
        <picture className="absolute inset-0 h-full w-full">
          <source
            srcSet="/images/affiliates/kendo-affiliates-768.avif 768w, /images/affiliates/kendo-affiliates-1200.avif 1200w"
            sizes="(min-width: 1024px) 1200px, 100vw"
            type="image/avif"
          />
          <source
            srcSet="/images/affiliates/kendo-affiliates-768.webp 768w, /images/affiliates/kendo-affiliates-1200.webp 1200w"
            sizes="(min-width: 1024px) 1200px, 100vw"
            type="image/webp"
          />
          <img
            src="/images/affiliates/kendo-affiliates.jpg"
            alt="Nuestro dojo"
            width={1500}
            height={1001}
            loading="eager"
            decoding="async"
            {...highPriorityImageProps}
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 rounded-3xl bg-site-overlay/30" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-4xl px-4 pt-14 sm:px-6 md:max-w-5xl lg:max-w-6xl xl:flex xl:h-full xl:max-w-7xl xl:items-center xl:pt-10 land-compact:max-w-none land-compact:px-2 land-compact:pt-14">
          <AffiliatePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <InfoCard dojos={visibleDojos} startIndex={startIndex} />
        </div>
      </div>
    </section>
  );
}
