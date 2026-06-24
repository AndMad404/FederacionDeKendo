export function Footer() {
  return (
    <footer className="text-white bg-stone-950 border-t border-white/5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-3 px-4 pt-2 text-center md:grid-cols-2 md:px-0">
        <div className="flex max-w-md flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <p className="text-white text-xs font-extrabold">
                {"\u5263\u9053"}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-white font-semibold tracking-widest text-base font-extrabold">
                Propósito del
              </p>
              <p className="text-red-400 text-base font-bold">
                KENDO
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.
          </p>
        </div>

        <div className="flex max-w-md flex-col items-center gap-2">
          <p className="text-center text-base font-bold tracking-wide">
            Contactos de la Federación
          </p>
          <div className="flex flex-col items-center justify-center sm:text-center md:flex-row">
            <ul className="flex flex-col gap-1 text-sm">
              <li>
                <a
                  className="hover:transition-colors hover:duration-200 hover:text-blue-400"
                  href="mailto:secretaria.fedekendo@outlook.com"
                >
                  secretaria.fedekendo@outlook.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="px-4 py-2">
        <p className="text-center text-xs text-white/50">
          <span>{"\u00a9"} 2026 Federación de Asociaciones de Kendo.</span>{" "}
          <span className="block sm:inline">Todos los derechos reservados.</span>
        </p>
      </div>
    </footer>
  );
}
