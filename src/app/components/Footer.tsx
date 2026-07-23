import { Link, useLocation } from "react-router";
import { ctaLinkClass, focusRingClass } from "../styles/shared";

export function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <footer className="bg-site-canvas text-site-on-dark">
      <div className="mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-5 px-3 py-4 text-center md:grid-cols-2 md:gap-10 md:px-6 md:py-3 lg:px-0">
        <section
          aria-labelledby="footer-purpose-title"
          className="flex max-w-md flex-col items-center gap-3 md:gap-2"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-baseline">
              <h2
                id="footer-purpose-title"
                className="flex items-baseline gap-1 text-lg font-extrabold tracking-widest text-site-on-dark"
              >
                Propósito del{" "}
                <span className="text-lg font-bold text-site-accent">
                  KENDO
                </span>
              </h2>
            </div>
          </div>
          <p className="text-base leading-relaxed">
            El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.
          </p>
          {isHome ? (
            <Link
              to="/afiliados/"
              className={`${ctaLinkClass} ${focusRingClass}`}
            >
              Conoce nuestros dojos afiliados
            </Link>
          ) : null}
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
          <div className="flex flex-col items-center justify-center md:flex-row">
            <ul className="flex flex-col gap-1 text-base">
              <li>
                <a
                  className={`hover:text-site-action-soft ${focusRingClass}`}
                  href="mailto:secretaria.fedekendo@outlook.com"
                >
                  secretaria.fedekendo@outlook.com
                </a>
              </li>
              <li>
                <span className="text-site-on-dark/75">
                  Instagram: TODO — agregar enlace cuando se confirme el perfil
                </span>
              </li>
            </ul>
          </div>
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
