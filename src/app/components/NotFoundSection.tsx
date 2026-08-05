import { Link } from "react-router";
import { PageTitle } from "./PageTitle";
import { focusRingClass, surfaceClass } from "../styles/shared";
import { useLanguage } from "../config/i18n";

export function NotFoundSection() {
  const { language, copy } = useLanguage();
  const links = [copy.nav.links[0], copy.nav.links[2], copy.nav.links[3]];
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[calc(100svh_-_8rem)] flex-col items-center justify-center gap-6 px-4 py-12 text-center"
    >
      <PageTitle id="not-found-title" casing="normal">
        {language === "en" ? "Page not found" : "Página no encontrada"}
      </PageTitle>

      <p className="max-w-md leading-relaxed">
        {language === "en"
          ? "The page you are looking for does not exist or has moved. You can continue from one of these sections."
          : "La página que buscas no existe o fue movida. Puedes continuar desde alguna de estas secciones."}
      </p>

      <ul className="flex flex-wrap items-center justify-center gap-4">
        {links.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
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
