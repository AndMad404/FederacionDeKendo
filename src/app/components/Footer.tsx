const focusRingClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300";

export function Footer() {
  return (
    <footer className="bg-stone-950 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 px-4 py-4 text-center md:grid-cols-2 md:gap-10 md:px-6 md:py-3 lg:px-0">
        <section
          aria-labelledby="footer-purpose-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-baseline gap-1">
              <h2
                id="footer-purpose-title"
                className="text-lg font-extrabold tracking-widest text-white"
              >
                Propósito del
              </h2>
              <span className="text-lg font-bold text-red-400">
                KENDO
              </span>
            </div>
          </div>
          <p className="text-base leading-relaxed">
            El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.
          </p>
        </section>

        <section
          aria-labelledby="footer-contact-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <h2
            id="footer-contact-title"
            className="text-center text-lg font-bold tracking-wide"
          >
            Contactos de la Federación
          </h2>
          <div className="flex flex-col items-center justify-center sm:text-center md:flex-row">
            <ul className="flex flex-col gap-1 text-base">
              <li>
                <a
                  className={`hover:text-blue-400 ${focusRingClass}`}
                  href="mailto:secretaria.fedekendo@outlook.com"
                >
                  secretaria.fedekendo@outlook.com
                </a>
              </li>
            </ul>
          </div>
        </section>
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
