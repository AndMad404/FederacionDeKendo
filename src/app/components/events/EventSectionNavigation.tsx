import { Link } from "react-router";
import { useLanguage } from "../../config/i18n";
import {
  focusRingClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../styles/shared";

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
    { id: "upcoming", label: copy.calendar.title, path: paths.upcoming },
    { id: "past", label: copy.archive.title, path: paths.past },
  ] as const;

  return (
    <nav
      aria-label={
        active === "upcoming" ? copy.calendar.title : copy.archive.title
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
            className={`${isActive ? primaryButtonClass : secondaryButtonClass} ${focusRingClass} max-sm:px-2 max-sm:text-sm`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
