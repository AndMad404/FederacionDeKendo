import { Link } from "react-router";
import { useLanguage } from "../../config/i18n";
import {
  textButtonInteractionClass,
  focusRingClass,
} from "../../styles/shared";

const eventSectionNavigationButtonClass = `control-navigation inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-center font-bold hover:border-site-action hover:bg-site-action hover:text-site-on-dark hover:[&_svg]:text-site-on-dark aria-[current=page]:hover:bg-site-surface aria-[current=page]:hover:text-site-action aria-[current=page]:hover:[&_svg]:text-site-action ${textButtonInteractionClass}`;

interface EventSectionNavigationProps {
  active: "upcoming" | "past";
}

export function EventSectionNavigation({
  active,
}: EventSectionNavigationProps) {
  const { copy } = useLanguage();
  const paths = { upcoming: "/eventos/", past: "/eventos/pasados/" };
  const items = [
    {
      id: "upcoming",
      label: copy.calendar.upcomingLabel,
      path: paths.upcoming,
    },
    { id: "past", label: copy.event.viewArchive, path: paths.past },
  ] as const;

  return (
    <nav
      aria-label={
        active === "upcoming" ? copy.calendar.upcomingLabel : copy.archive.title
      }
      className="grid w-fit max-w-full grid-cols-2 self-center gap-3 sm:gap-4"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            to={item.path}
            aria-current={isActive ? "page" : undefined}
            className={`${eventSectionNavigationButtonClass} ${
              isActive
                ? "border-site-action bg-site-action text-site-on-dark shadow-sm"
                : "border-site-action bg-site-surface text-site-action"
            } ${focusRingClass} max-sm:px-2 max-sm:text-sm`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
