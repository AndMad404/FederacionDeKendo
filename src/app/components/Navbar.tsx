import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { focusRingClass } from "../styles/shared";
import { getLocalizedPath, useLanguage } from "../config/i18n";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg tracking-wide transition-colors duration-200 land-sm:text-base ${focusRingClass} ${
    isActive
      ? "border-b-2 border-site-accent pb-0.5 text-site-on-dark"
      : "text-site-on-dark/85 hover:text-site-on-dark"
  }`;

export function Navbar() {
  const { pathname } = useLocation();
  const { language, copy } = useLanguage();
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarMenuRef = useRef<HTMLLIElement>(null);
  const mobileCalendarMenuRef = useRef<HTMLLIElement>(null);

  const calendarPaths =
    language === "en"
      ? ["/en/calendar/", "/en/events/past/"]
      : ["/calendario/", "/eventos/pasados/"];
  const calendarActive = calendarPaths.some((path) =>
    pathname.startsWith(path),
  );

  useEffect(() => {
    setCalendarOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (calendarOpen) {
        setCalendarOpen(false);
        calendarButtonRef.current?.focus();
      } else if (open) {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        calendarOpen &&
        !calendarMenuRef.current?.contains(event.target as Node) &&
        !mobileCalendarMenuRef.current?.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [calendarOpen, open]);

  function closeNavigation() {
    setCalendarOpen(false);
    setOpen(false);
  }

  function renderCalendarMenu(mobile = false) {
    return (
      <li
        key={copy.nav.links[1].path}
        ref={mobile ? mobileCalendarMenuRef : calendarMenuRef}
        className={mobile ? "w-full" : "relative"}
        onMouseEnter={mobile ? undefined : () => setCalendarOpen(true)}
        onMouseLeave={mobile ? undefined : () => setCalendarOpen(false)}
        onBlur={
          mobile
            ? undefined
            : (event) => {
                if (
                  !event.currentTarget.contains(event.relatedTarget as Node | null)
                ) {
                  setCalendarOpen(false);
                }
              }
        }
      >
        <button
          ref={mobile ? undefined : calendarButtonRef}
          type="button"
          aria-expanded={calendarOpen}
          aria-controls={mobile ? "mobile-calendar-menu" : "desktop-calendar-menu"}
          onClick={() => setCalendarOpen((value) => !value)}
          className={`inline-flex min-h-11 items-center justify-center gap-1 ${navLinkClass({ isActive: calendarActive })}`}
        >
          {copy.nav.links[1].label}
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`transition-transform ${calendarOpen ? "rotate-180" : ""}`}
          />
        </button>
        {calendarOpen && (
          <ul
            id={mobile ? "mobile-calendar-menu" : "desktop-calendar-menu"}
            aria-label={copy.nav.calendarMenu}
            className={
              mobile
                ? "mt-2 flex flex-col items-center gap-2 border-y border-site-on-dark/20 py-2"
                : "absolute left-1/2 top-full z-10 mt-2 min-w-52 -translate-x-1/2 rounded-lg border border-site-on-dark/20 bg-site-navy p-2 shadow-lg before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:content-['']"
            }
          >
            {calendarPaths.map((path, index) => (
              <li key={path} className={mobile ? undefined : "w-full"}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `block min-h-11 rounded-md px-4 py-2.5 text-base transition-colors ${focusRingClass} ${
                      isActive
                        ? "bg-site-on-dark text-site-navy"
                        : "text-site-on-dark/85 hover:bg-site-on-dark/10 hover:text-site-on-dark"
                    }`
                  }
                >
                  {index === 0
                    ? copy.nav.upcomingEvents
                    : copy.nav.pastEvents}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-site-on-dark/10 bg-site-navy">
      <nav aria-label={copy.nav.label}>
      <div className="mx-auto my-[5px] flex h-16 max-w-6xl items-center justify-between px-6 land-sm:my-[3px] land-sm:h-12 land-sm:px-5">
        <Link
          to={copy.nav.links[0].path}
          aria-label={copy.nav.homeLabel}
          onClick={() => setOpen(false)}
          className={`flex min-w-0 items-center ${focusRingClass}`}
        >
          <picture>
            <source
              srcSet="/images/logo/fakcr-lockup-112.webp 112w, /images/logo/fakcr-lockup-224.webp 224w"
              sizes="56px"
              type="image/webp"
            />
            <img
              src="/images/logo/fakcr-lockup-224.png"
              alt=""
              aria-hidden="true"
              className="size-14 shrink-0 rounded-full bg-site-on-dark object-contain land-sm:size-10"
              width="56"
              height="56"
            />
          </picture>
        </Link>

        <ul className="hidden items-center gap-8 md:flex land-sm:gap-6">
          {copy.nav.links.map((link, index) => index === 1 ? renderCalendarMenu() : (
            <li key={link.path}>
              <NavLink
                to={link.path}
                end={index === 0}
                className={navLinkClass}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <LanguageSelector pathname={pathname} language={language} />
          </li>
        </ul>

        <button
          ref={menuButtonRef}
          type="button"
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/70 bg-white/10 text-white transition-colors hover:border-white hover:bg-white/20 hover:text-white md:hidden ${focusRingClass}`}
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? copy.nav.close : copy.nav.open}
          onClick={() => {
            setCalendarOpen(false);
            setOpen(!open);
          }}
        >
          {open ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {open && (
        <ul
          id="mobile-menu"
          className="flex flex-col items-center gap-5 bg-site-navy px-6 py-5 text-center md:hidden"
        >
          {copy.nav.links.map((link, index) => index === 1 ? renderCalendarMenu(true) : (
            <li key={link.path}>
              <NavLink
                to={link.path}
                end={index === 0}
                className={navLinkClass}
                onClick={closeNavigation}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="mt-1 w-full border-t border-site-on-dark/20 pt-4">
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-semibold text-site-on-dark/85">
                {copy.nav.language}
              </span>
              <LanguageSelector
                pathname={pathname}
                language={language}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </li>
        </ul>
      )}
      </nav>
    </header>
  );
}

function LanguageSelector({
  pathname,
  language,
  onNavigate,
}: {
  pathname: string;
  language: "es" | "en";
  onNavigate?: () => void;
}) {
  const { copy } = useLanguage();
  return (
    <div
      className="inline-flex rounded-lg border border-site-on-dark/40 bg-site-on-dark/10 p-0.5"
      role="group"
      aria-label={copy.nav.language}
    >
      {(["es", "en"] as const).map((option) => {
        const active = language === option;
        return (
          <Link
            key={option}
            to={getLocalizedPath(pathname, option)}
            lang={option}
            hrefLang={option}
            aria-current={active ? "page" : undefined}
            aria-label={
              option === "es"
                ? copy.nav.switchToSpanish
                : copy.nav.switchToEnglish
            }
            onClick={onNavigate}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-bold transition-colors ${focusRingClass} ${
              active
                ? "bg-site-on-dark text-site-navy shadow-sm"
                : "text-site-on-dark/85 hover:bg-site-on-dark/15 hover:text-site-on-dark"
            }`}
          >
            {option.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
