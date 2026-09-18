import { Link } from "react-router";
import { focusRingClass } from "../styles/shared";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  ariaLabel: string;
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ ariaLabel, items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="w-full text-left text-sm text-site-muted"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center gap-2"
          >
            {index > 0 ? (
              <span aria-hidden="true" className="text-site-muted">
                /
              </span>
            ) : null}
            {item.to ? (
              <Link
                to={item.to}
                className={`rounded-sm font-semibold text-site-action underline underline-offset-4 ${focusRingClass}`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="min-w-0 break-words font-semibold text-site-text"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
