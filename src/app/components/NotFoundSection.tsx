import { Link } from "react-router";
import { PageTitle } from "./PageTitle";
import { focusRingClass, panelSurfaceClass } from "../styles/shared";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/galeria/", label: "Galería" },
  { to: "/afiliados/", label: "Afiliados" },
];

export function NotFoundSection() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[calc(100svh_-_8rem)] flex-col items-center justify-center gap-6 px-4 py-12 text-center"
    >
      <PageTitle id="not-found-title" className="normal-case">
        Página no encontrada
      </PageTitle>

      <p className="max-w-md text-base leading-relaxed text-site-on-dark">
        La página que buscas no existe o fue movida. Puedes continuar desde
        alguna de estas secciones.
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-4">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`rounded-lg px-4 py-2 text-site-on-dark transition-colors duration-200 hover:text-site-accent ${panelSurfaceClass} ${focusRingClass}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
