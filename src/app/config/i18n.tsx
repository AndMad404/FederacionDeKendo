import { createContext, useContext, type ReactNode } from "react";

export type Language = "es" | "en";

const ENGLISH_PREFIX = "/en";

export function getLanguageFromPathname(pathname: string): Language {
  return pathname === ENGLISH_PREFIX || pathname.startsWith(`${ENGLISH_PREFIX}/`)
    ? "en"
    : "es";
}

const STATIC_ROUTE_PAIRS = [
  ["/", "/en/"],
  ["/calendario/", "/en/calendar/"],
  ["/galeria/", "/en/gallery/"],
  ["/afiliados/", "/en/affiliates/"],
  ["/eventos/pasados/", "/en/events/past/"],
] as const;

function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function getLocalizedPath(pathname: string, language: Language) {
  const normalized = normalizePathname(pathname);

  for (const [spanishPath, englishPath] of STATIC_ROUTE_PAIRS) {
    if (normalized === spanishPath || normalized === englishPath) {
      return language === "en" ? englishPath : spanishPath;
    }
  }

  const spanishEvent = normalized.match(/^\/eventos\/([^/]+)\/$/);
  if (spanishEvent) {
    return language === "en"
      ? `/en/events/${spanishEvent[1]}/`
      : normalized;
  }

  const englishEvent = normalized.match(/^\/en\/events\/([^/]+)\/$/);
  if (englishEvent && englishEvent[1] !== "past") {
    return language === "es"
      ? `/eventos/${englishEvent[1]}/`
      : normalized;
  }

  const spanishArchivePage = normalized.match(
    /^\/eventos\/pasados\/pagina\/(\d+)\/$/,
  );
  if (spanishArchivePage) {
    return language === "en"
      ? `/en/events/past/page/${spanishArchivePage[1]}/`
      : normalized;
  }

  const englishArchivePage = normalized.match(
    /^\/en\/events\/past\/page\/(\d+)\/$/,
  );
  if (englishArchivePage) {
    return language === "es"
      ? `/eventos/pasados/pagina/${englishArchivePage[1]}/`
      : normalized;
  }

  return language === "en" ? "/en/" : "/";
}

export function isLanguageSwitch(
  previousPathname: string,
  nextPathname: string,
) {
  const nextLanguage = getLanguageFromPathname(nextPathname);
  return (
    getLanguageFromPathname(previousPathname) !== nextLanguage &&
    getLocalizedPath(previousPathname, nextLanguage) ===
      normalizePathname(nextPathname)
  );
}

const COPY = {
  es: {
    nav: {
      label: "Navegación principal",
      homeLabel: "Ir al inicio",
      open: "Abrir menú",
      close: "Cerrar menú",
      language: "Idioma",
      switchToSpanish: "Ver sitio en español",
      switchToEnglish: "View site in English",
      links: [
        { path: "/", label: "Inicio" },
        { path: "/calendario/", label: "Calendario" },
        { path: "/galeria/", label: "Galería" },
        { path: "/afiliados/", label: "Afiliados" },
      ],
    },
    shell: {
      skip: "Saltar al contenido principal",
      loading: "Cargando contenido…",
    },
    home: {
      title: "Federación de Asociaciones de Kendo",
      lead: "Una comunidad que aprende, entrena y crece unida a través del kendo en Costa Rica.",
      description: "Encuentra un dojo afiliado o consulta nuestros próximos encuentros.",
      dojos: "Encuentra un dojo",
      events: "Ver próximos eventos",
      upcoming: "Próximos encuentros",
      heroAlt: "Grupo de practicantes de kendo reunidos después de una actividad",
    },
    footer: {
      purposeTitle: "Propósito del",
      purpose: "El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.",
      contacts: "Contactos de la Federación",
      copyright: "© 2026 Federación de Asociaciones de Kendo.",
      rights: "Todos los derechos reservados.",
    },
  },
  en: {
    nav: {
      label: "Main navigation",
      homeLabel: "Go to home page",
      open: "Open menu",
      close: "Close menu",
      language: "Language",
      switchToSpanish: "Ver sitio en español",
      switchToEnglish: "View site in English",
      links: [
        { path: "/en/", label: "Home" },
        { path: "/en/calendar/", label: "Calendar" },
        { path: "/en/gallery/", label: "Gallery" },
        { path: "/en/affiliates/", label: "Affiliates" },
      ],
    },
    shell: {
      skip: "Skip to main content",
      loading: "Loading content…",
    },
    home: {
      title: "Federation of Kendo Associations",
      lead: "A community that learns, trains, and grows together through kendo in Costa Rica.",
      description: "Find an affiliated dojo or view our upcoming events.",
      dojos: "Find a dojo",
      events: "View upcoming events",
      upcoming: "Upcoming events",
      heroAlt: "Group of kendo practitioners gathered after an activity",
    },
    footer: {
      purposeTitle: "The purpose of",
      purpose: "The concept of Kendo is to discipline the human character through the application of the principles of the Katana.",
      contacts: "Federation contact",
      copyright: "© 2026 Federation of Kendo Associations.",
      rights: "All rights reserved.",
    },
  },
} as const;

interface LanguageContextValue {
  language: Language;
  locale: "es-CR" | "en";
  copy: (typeof COPY)[Language];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider
      value={{
        language,
        locale: language === "es" ? "es-CR" : "en",
        copy: COPY[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
