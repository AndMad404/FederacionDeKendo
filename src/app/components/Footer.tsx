export function Footer() {
  return (
    <footer className="bg-stone-950 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 px-4 py-4 text-center md:grid-cols-2 md:gap-10 md:px-6 md:py-3 lg:px-0">
        <div className="flex max-w-md flex-col items-center gap-3 md:gap-2">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-baseline gap-1">
              <p className="text-base font-extrabold tracking-widest text-white">
                Propósito del
              </p>
              <p className="text-base font-bold text-red-400">
                KENDO
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.
          </p>
        </div>

        <div className="flex max-w-md flex-col items-center gap-3 md:gap-2">
          <p className="text-center text-base font-bold tracking-wide">
            Contactos de la Federación
          </p>
          <div className="flex flex-col items-center justify-center sm:text-center md:flex-row">
            <ul className="flex flex-col gap-1 text-sm">
              <li>
                <a
                  className="hover:text-blue-400"
                  href="mailto:secretaria.fedekendo@outlook.com"
                >
                  secretaria.fedekendo@outlook.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 md:pb-3">
        <p className="text-center text-xs text-white/50">
          <span>© 2026 Federación de Asociaciones de Kendo.</span>{" "}
          <span className="block sm:inline">Todos los derechos reservados.</span>
        </p>
      </div>
    </footer>
  );
}
