import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setOpen(false);
      menuButtonRef.current?.focus();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

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
          {copy.nav.links.map((link, index) => (
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
          onClick={() => setOpen(!open)}
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
          {copy.nav.links.map((link, index) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                end={index === 0}
                className={navLinkClass}
                onClick={() => setOpen(false)}
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
