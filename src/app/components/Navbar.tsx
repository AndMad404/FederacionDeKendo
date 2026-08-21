import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { NavigationArrowButton } from "./ui/ModalControls";
import { focusRingClass } from "../styles/shared";
import { getLocalizedPath, useLanguage } from "../config/i18n";

const navInteractionClass =
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:-translate-y-0.5 focus-visible:shadow-sm active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0 motion-reduce:active:scale-100";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center text-lg tracking-wide ${navInteractionClass} land-sm:text-base ${focusRingClass} ${
    isActive
      ? "border-b-2 border-site-accent pb-0.5 text-site-on-dark"
      : "text-site-on-dark"
  }`;

export function Navbar() {
  const { pathname } = useLocation();
  const { language, copy } = useLanguage();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [calendarOpenPath, setCalendarOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const calendarOpen = calendarOpenPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarMenuRef = useRef<HTMLLIElement>(null);
  const mobileCalendarMenuRef = useRef<HTMLLIElement>(null);
  const homeLink = copy.nav.links.find((link) => link.id === "home")!;
  const calendarLink = copy.nav.links.find((link) => link.id === "calendar")!;

  const calendarPaths =
    language === "en"
      ? ["/en/events/", "/en/events/past/"]
      : ["/eventos/", "/eventos/pasados/"];
  const calendarActive = calendarPaths.some((path) =>
    pathname.startsWith(path),
  );

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (calendarOpen) {
        setCalendarOpenPath(null);
        calendarButtonRef.current?.focus();
      } else if (open) {
        setOpenPath(null);
        menuButtonRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        calendarOpen &&
        !calendarMenuRef.current?.contains(event.target as Node) &&
        !mobileCalendarMenuRef.current?.contains(event.target as Node)
      ) {
        setCalendarOpenPath(null);
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
    setCalendarOpenPath(null);
    setOpenPath(null);
  }

  function renderCalendarMenu(mobile = false) {
    return (
      <li
        key={calendarLink.path}
        ref={mobile ? mobileCalendarMenuRef : calendarMenuRef}
        className={mobile ? "w-full" : "relative"}
        onMouseEnter={mobile ? undefined : () => setCalendarOpenPath(pathname)}
        onMouseLeave={mobile ? undefined : () => setCalendarOpenPath(null)}
        onBlur={
          mobile
            ? undefined
            : (event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setCalendarOpenPath(null);
                }
              }
        }
      >
        <div
          className={`inline-flex items-center justify-center gap-2 ${
            mobile ? "w-full" : ""
          }`}
        >
          <NavLink
            to={calendarLink.path}
            end
            onClick={mobile ? closeNavigation : undefined}
            className={navLinkClass({ isActive: calendarActive })}
          >
            {calendarLink.label}
          </NavLink>
          <NavigationArrowButton
            ref={mobile ? undefined : calendarButtonRef}
            direction="down"
            label={copy.nav.calendarMenu}
            isActive={calendarOpen}
            aria-expanded={calendarOpen}
            aria-controls={
              mobile ? "mobile-calendar-menu" : "desktop-calendar-menu"
            }
            onFocus={mobile ? undefined : () => setCalendarOpenPath(pathname)}
            onClick={() =>
              setCalendarOpenPath(mobile && calendarOpen ? null : pathname)
            }
          />
        </div>
        {calendarOpen && (
          <ul
            id={mobile ? "mobile-calendar-menu" : "desktop-calendar-menu"}
            aria-label={copy.nav.calendarMenu}
            className={
              mobile
                ? "mt-2 flex flex-col items-center gap-2 border-y border-site-on-dark/20 py-2"
                : "nav-calendar-menu absolute left-1/2 top-full z-10 mt-2 min-w-52 -translate-x-1/2 rounded-lg border border-site-on-dark/20 bg-site-navy p-2 shadow-lg before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:content-['']"
            }
          >
            {calendarPaths.map((path, index) => (
              <li key={path} className={mobile ? undefined : "w-full"}>
                <NavLink
                  to={path}
                  end
                  className={({ isActive }) =>
                    `block min-h-11 rounded-md px-4 py-2.5 text-base ${navInteractionClass} ${focusRingClass} ${
                      isActive
                        ? "bg-site-on-dark text-site-navy shadow-sm"
                        : "text-site-on-dark/85 hover:bg-site-on-dark/15 hover:text-site-on-dark"
                    }`
                  }
                >
                  {index === 0 ? copy.nav.upcomingEvents : copy.nav.pastEvents}
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
            to={homeLink.path}
            aria-label={copy.nav.homeLabel}
            onClick={() => setOpenPath(null)}
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
                alt={copy.nav.homeLabel}
                className="size-14 shrink-0 rounded-full bg-site-on-dark object-contain land-sm:size-10"
                width="56"
                height="56"
              />
            </picture>
          </Link>

          <ul className="hidden items-center gap-8 md:flex land-sm:gap-6">
            {copy.nav.links.map((link) =>
              link.id === "calendar" ? (
                renderCalendarMenu()
              ) : (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.id === "home"}
                    className={navLinkClass}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ),
            )}
            <li>
              <LanguageSelector pathname={pathname} language={language} />
            </li>
          </ul>

          <button
            ref={menuButtonRef}
            type="button"
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/70 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white ${navInteractionClass} md:hidden ${focusRingClass}`}
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? copy.nav.close : copy.nav.open}
            onClick={() => {
              setCalendarOpenPath(null);
              setOpenPath(open ? null : pathname);
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
            className="flex flex-col items-center gap-5 bg-site-navy px-6 pb-5 pt-0 text-center md:hidden"
          >
            {copy.nav.links.map((link) =>
              link.id === "calendar" ? (
                renderCalendarMenu(true)
              ) : (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.id === "home"}
                    className={navLinkClass}
                    onClick={closeNavigation}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ),
            )}
            <li>
              <LanguageSelector
                pathname={pathname}
                language={language}
                labels="full"
                onNavigate={() => setOpenPath(null)}
              />
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
  labels = "abbreviated",
  onNavigate,
}: {
  pathname: string;
  language: "es" | "en";
  labels?: "abbreviated" | "full";
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
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-bold ${navInteractionClass} ${focusRingClass} ${
              active
                ? "bg-site-on-dark text-site-navy shadow-sm"
                : "text-site-on-dark/85 hover:bg-site-on-dark/15 hover:text-site-on-dark"
            }`}
          >
            {labels === "full"
              ? option === "es"
                ? "Español"
                : "English"
              : option.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
