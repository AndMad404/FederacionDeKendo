import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { Page } from "../types";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_LINKS: { id: Page; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "galeria", label: "Galería" },
  { id: "afiliados", label: "Afiliados" },
];

function NavLink({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm tracking-wide transition-colors duration-200 ${
        active ? "text-red-400 border-b border-red-500 pb-0.5" : "text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <button onClick={() => handleNavigate("inicio")} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wider">剣道</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-semibold tracking-widest text-sm">KENDO</span>
            <span className="text-red-500 text-[10px] tracking-widest uppercase">Dojo</span>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.id}
              active={currentPage === link.id}
              label={link.label}
              onClick={() => handleNavigate(link.id)}
            />
          ))}
        </div>

        <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-stone-950 border-t border-white/5 px-6 py-5 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.id}
              active={currentPage === link.id}
              label={link.label}
              onClick={() => handleNavigate(link.id)}
            />
          ))}
        </div>
      )}
    </nav>
  );
}
