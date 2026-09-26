import { Link } from "react-router";
import { useLanguage } from "../../config/i18n";
import { focusRingClass } from "../../styles/shared";

const eventSectionNavigationButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-5 py-2 font-bold transition-[box-shadow,transform] duration-200 hover:scale-[1.025] hover:shadow-md active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100";

interface EventSectionNavigationProps {
  active: "upcoming" | "past";
}

export function EventSectionNavigation({
  active,
}: EventSectionNavigationProps) {
  const { language, copy } = useLanguage();
  const paths =
    language === "en"
      ? { upcoming: "/en/events/", past: "/en/events/past/" }
      : { upcoming: "/eventos/", past: "/eventos/pasados/" };
  const items = [
    {
      id: "upcoming",
      label: copy.calendar.upcomingLabel,
      path: paths.upcoming,
    },
    { id: "past", label: copy.archive.title, path: paths.past },
  ] as const;

  return (
    <nav
      aria-label={
        active === "upcoming" ? copy.calendar.upcomingLabel : copy.archive.title
      }
      className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3"
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
