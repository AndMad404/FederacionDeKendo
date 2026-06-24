import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/galeria", label: "Galer\u00eda" },
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

        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wider">{"\u5263\u9053"}</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white text-center font-semibold tracking-widest text-base">Federación de<br/>Asociaciones de Kendo</span>
          </div>
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
          aria-label={open ? "Cerrar men\u00fa" : "Abrir men\u00fa"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden bg-stone-950 border-t border-white/5 px-6 py-5 flex flex-col items-center gap-5 text-center">
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
