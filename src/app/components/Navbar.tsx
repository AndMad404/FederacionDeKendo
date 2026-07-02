import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/galeria/", label: "Galería" },
  { to: "/afiliados/", label: "Afiliados" },
];

const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-base tracking-wide transition-colors duration-200 [@media_(orientation:landscape)_and_(max-height:480px)]:text-sm ${focusRingClass} ${
    isActive
      ? "border-b border-blue-500 pb-0.5 text-blue-400"
      : "text-white hover:text-red-400"
  }`;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-stone-950 backdrop-blur">
      <nav aria-label="Navegación principal">
      <div className="mx-auto my-[5px] flex h-16 max-w-6xl items-center justify-between px-6 [@media_(orientation:landscape)_and_(max-height:480px)]:my-[3px] [@media_(orientation:landscape)_and_(max-height:480px)]:h-12 [@media_(orientation:landscape)_and_(max-height:480px)]:px-5">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className={`flex min-w-0 items-center gap-3 ${focusRingClass}`}
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
              className="h-14 w-14 shrink-0 rounded-full bg-white object-contain [@media_(orientation:landscape)_and_(max-height:480px)]:h-10 [@media_(orientation:landscape)_and_(max-height:480px)]:w-10"
              width="56"
              height="56"
            />
          </picture>
          <span className="max-w-[11rem] text-sm font-semibold leading-tight tracking-wide text-white sm:max-w-none sm:text-base [@media_(orientation:landscape)_and_(max-height:480px)]:text-sm">
            Federación de<br className="sm:hidden" /> Asociaciones de Kendo
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex [@media_(orientation:landscape)_and_(max-height:480px)]:gap-6">
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
          type="button"
          className={`text-gray-400 hover:text-white md:hidden ${focusRingClass}`}
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
