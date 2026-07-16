import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import { focusRingClass } from "../styles/shared";

const NAV_LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/galeria/", label: "Galería" },
  { to: "/afiliados/", label: "Afiliados" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg tracking-wide transition-colors duration-200 land-sm:text-base ${focusRingClass} ${
    isActive
      ? "border-b border-blue-500/70 pb-0.5 text-blue-400"
      : "text-white hover:text-red-400"
  }`;

export function Navbar() {
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
    <header className="fixed inset-x-0 top-0 z-50 bg-stone-950 backdrop-blur">
      <nav aria-label="Navegación principal">
      <div className="mx-auto my-[5px] flex h-16 max-w-6xl items-center justify-between px-6 land-sm:my-[3px] land-sm:h-12 land-sm:px-5">
        <Link
          to="/"
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
              className="h-14 w-14 shrink-0 rounded-full bg-white object-contain land-sm:h-10 land-sm:w-10"
              width="56"
              height="56"
            />
          </picture>
        </Link>

        <ul className="hidden items-center gap-8 md:flex land-sm:gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={navLinkClass}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          ref={menuButtonRef}
          type="button"
          className={`inline-flex size-11 shrink-0 items-center justify-center text-gray-400 hover:text-white md:hidden ${focusRingClass}`}
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
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
          className="flex flex-col items-center gap-5 bg-stone-950 px-6 py-5 text-center md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
      </nav>
    </header>
  );
}
