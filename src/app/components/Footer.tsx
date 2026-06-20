import type { Page } from "../types";

interface FooterProps {
  onNavigate: (page: Page) => void;
}

const SOCIAL_LINKS = ["ig", "yt", "fb"];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="text-white bg-stone-950 border-t border-white/5">
      <div className="max-w-6xl mx-auto pt-2 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-3">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
              <p className="text-white text-xs font-extrabold">
                剣道
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-white font-semibold tracking-widest text-sm font-extrabold">
                Proposito del
              </p>
              <p className="text-red-500 text-xs font-bold">
                KENDO
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.
          </p>
        </div>

        <div>
          <p className="text-sm text-center mb-2 tracking-wide font-bold">
            Contactos de la Federación
          </p>
		  <div className="flex flex-col md:flex-row items-center sm:text-center md:items-start justify-center gap-3 lg:gap-6">
          	<ul className="space-y-2 text-sm">
          	  <li>info@kendodojo.com</li>
          	  <li>+1 (555) 000-0000</li>
          	</ul>
          	<div className="flex gap-1.5 justify-center md:justify-start">
          	  {SOCIAL_LINKS.map((s) => (
          	    <a
          	      key={s}
          	      href="#"
          	      className="w-8 h-8 rounded-full border border-white flex items-center justify-center text-xs hover:border-red-600 hover:text-red-400 transition-colors"
          	    >
          	      {s}
          	    </a>
          	  ))}
          	</div>
		  </div>
        </div>
      </div>
      <div className="px-4 py-2">
        <p className="text-center text-xs text-white/50">
          © 2026 Kendo Dojo. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
