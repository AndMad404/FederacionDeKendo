import type { Page } from "../types";

interface FooterProps {
  onNavigate: (page: Page) => void;
}

const SOCIAL_LINKS = ["ig", "yt", "fb"];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-stone-950 border-t border-white/5 text-gray-500">
      <div className="max-w-6xl mx-auto px-6 py-2 grid grid-cols-1 md:grid-cols-2 gap-10 justify-items-center text-center md:text-left">
        <div>
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                剣道
              </span>
            </div>
            <div>
              <span className="text-white font-semibold tracking-widest text-sm">
                Proposito del
              </span>
              <span className="text-red-500 text-xs ml-1">
                KENDO
              </span>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            El concepto del Kendo es disciplinar el carácter
            humano a través de la aplicación de los principios
            de la Katana.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-medium mb-4 tracking-wide">
            Contacto de la Federación
          </h4>
          <ul className="space-y-2 text-sm">
            <li>info@kendodojo.com</li>
            <li>+1 (555) 000-0000</li>
            <li>Av. del Bushido 88, Ciudad</li>
          </ul>
          <div className="flex gap-3 mt-5 justify-center md:justify-start">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s}
                href="#"
                className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-xs hover:border-red-600 hover:text-red-400 transition-colors"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-6">
        <p className="text-center text-xs text-gray-700">
          © 2026 Kendo Dojo. Todos los derechos reservados. —
          一期一会
        </p>
      </div>
    </footer>
  );
}