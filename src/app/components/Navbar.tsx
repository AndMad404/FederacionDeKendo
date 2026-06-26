import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/galeria", label: "Galería" },
  { to: "/afiliados", label: "Afiliados" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-base tracking-wide transition-colors duration-200 ${
    isActive ? "text-blue-400 border-b border-blue-500 pb-0.5" : "text-white hover:transition-colors hover:duration-200 hover:text-red-400"
  }`;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
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
              className="h-14 w-14 shrink-0 rounded-full bg-white object-contain"
              width="56"
              height="56"
            />
          </picture>
          <span className="max-w-[11rem] text-sm font-semibold leading-tight tracking-wide text-white sm:max-w-none sm:text-base">
            Federación de<br className="sm:hidden" /> Asociaciones de Kendo
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <button
          className="md:hidden text-gray-400 hover:text-white"
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden bg-stone-950 px-6 py-5 flex flex-col items-center gap-5 text-center">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navLinkClass}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
