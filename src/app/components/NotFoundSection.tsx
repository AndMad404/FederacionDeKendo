import { Link } from "react-router";
import { PageTitle } from "./PageTitle";
import { focusRingClass, surfaceClass } from "../styles/shared";

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
      <PageTitle id="not-found-title" casing="normal">
        Página no encontrada
      </PageTitle>

      <p className="max-w-md leading-relaxed">
        La página que buscas no existe o fue movida. Puedes continuar desde
        alguna de estas secciones.
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-4">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`rounded-lg px-4 py-2 text-site-action transition-colors duration-200 hover:border-site-action ${surfaceClass} ${focusRingClass}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
