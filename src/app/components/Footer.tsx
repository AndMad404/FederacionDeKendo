import { focusRingClass } from "../styles/shared";

export function Footer() {
  return (
    <footer className="bg-site-navy text-site-on-dark">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 p-2.5 text-center md:grid-cols-2 md:gap-10">
        <section
          aria-labelledby="footer-purpose-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <h2
            id="footer-purpose-title"
            className="flex items-baseline gap-1 text-lg font-extrabold tracking-widest"
          >
            Propósito del{" "}
            <span className="text-lg font-bold text-site-accent-on-dark">
              KENDO
            </span>
          </h2>
          <p className="leading-relaxed">
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
          <ul className="flex flex-col gap-1 text-base">
            <li>
              <a
                className={`underline-offset-4 hover:text-site-accent-soft hover:underline ${focusRingClass}`}
                href="mailto:secretaria.fedekendo@outlook.com"
              >
                secretaria.fedekendo@outlook.com
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div className="px-4 pb-4 md:pb-3">
        <p className="text-center text-xs text-site-on-dark/50">
          <span>© 2026 Federación de Asociaciones de Kendo.</span>{" "}
          <span className="block sm:inline">Todos los derechos reservados.</span>
        </p>
      </div>
    </footer>
  );
}
