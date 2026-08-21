import { createContext, useContext } from "react";
import { findEventByPathname } from "../utils/eventRoutes";
import { getLocalizedEvent } from "../utils/localizedEvents";

export type Language = "es" | "en";

const ENGLISH_PREFIX = "/en";

export function getLanguageFromPathname(pathname: string): Language {
  return pathname === ENGLISH_PREFIX ||
    pathname.startsWith(`${ENGLISH_PREFIX}/`)
    ? "en"
    : "es";
}

const STATIC_ROUTE_PAIRS = [
  ["/", "/en/"],
  ["/eventos/", "/en/events/"],
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

  const spanishArchivedEvent = normalized.match(
    /^\/eventos\/pasados\/([^/]+)\/$/,
  );
  if (spanishArchivedEvent) {
    if (language === "es") return normalized;
    const event = findEventByPathname(normalized);
    return event && getLocalizedEvent(event, "en")
      ? `/en/events/past/${spanishArchivedEvent[1]}/`
      : "/en/";
  }

  const englishArchivedEvent = normalized.match(
    /^\/en\/events\/past\/([^/]+)\/$/,
  );
  if (englishArchivedEvent) {
    if (language === "en") return normalized;
    const event = findEventByPathname(normalized);
    return event ? `/eventos/pasados/${englishArchivedEvent[1]}/` : "/";
  }

  const spanishEvent = normalized.match(/^\/eventos\/([^/]+)\/$/);
  if (spanishEvent) {
    if (language === "es") return normalized;
    const event = findEventByPathname(normalized);
    return event && getLocalizedEvent(event, "en")
      ? `/en/events/${spanishEvent[1]}/`
      : "/en/";
  }

  const englishEvent = normalized.match(/^\/en\/events\/([^/]+)\/$/);
  if (englishEvent && englishEvent[1] !== "past") {
    return language === "es" ? `/eventos/${englishEvent[1]}/` : normalized;
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

export const COPY = {
  es: {
    nav: {
      label: "Navegación principal",
      homeLabel: "Ir al inicio",
      open: "Abrir menú",
      close: "Cerrar menú",
      language: "Idioma",
      switchToSpanish: "Ver sitio en español",
      switchToEnglish: "View site in English",
      calendarMenu: "Opciones del calendario",
      upcomingEvents: "Próximos eventos",
      pastEvents: "Eventos pasados",
      links: [
        { id: "home", path: "/", label: "Inicio" },
        { id: "calendar", path: "/eventos/", label: "Calendario" },
        { id: "gallery", path: "/galeria/", label: "Galería" },
        { id: "affiliates", path: "/afiliados/", label: "Afiliados" },
      ],
    },
    shell: {
      skip: "Saltar al contenido principal",
      loading: "Cargando contenido…",
    },
    home: {
      title: "Federación de Asociaciones de Kendo",
      lead: "Una comunidad que aprende, entrena y crece unida a través del kendo en Costa Rica.",
      description:
        "Encuentra un dojo afiliado o consulta nuestros próximos encuentros.",
      dojos: "Encuentra un dojo",
      events: "Próximos eventos",
      upcoming: "Próximos encuentros",
      heroAlt:
        "Grupo de practicantes de kendo reunidos después de una actividad",
    },
    footer: {
      purposeTitle: "Propósito del",
      purpose:
        "El concepto del Kendo es disciplinar el carácter humano a través de la aplicación de los principios de la Katana.",
      contacts: "Contactos de la Federación",
      copyright: "© 2026 Federación de Asociaciones de Kendo.",
      rights: "Todos los derechos reservados.",
    },
    common: {
      rangeSeparator: "al",
      place: "Lugar",
      opensMaps: "Abre Google Maps en una pestaña nueva.",
      toBeConfirmed: "Pendiente de confirmar",
      informationPending: "Información pendiente de confirmar.",
      eventDetails: "Detalles del evento",
      linkCopied: "Enlace copiado",
      shareEvent: "Compartir evento",
    },
    calendar: {
      title: "Próximos eventos",
      description: "Torneos, exámenes y actividades de kendo.",
      empty: "No hay próximos eventos publicados.",
      pastEvents: "Eventos pasados",
      copiedAnnouncement: "Enlace del evento copiado al portapapeles.",
      navigation: "Navegación del calendario",
      previousMonth: "Ver mes anterior",
      previousPair: "Ver los dos meses anteriores",
      nextMonth: "Ver mes siguiente",
      nextPair: "Ver los dos meses siguientes",
      page: "Página",
      of: "de",
      eventPagination: "Paginación de eventos de",
      previousEvents: "Ver eventos anteriores del mes",
      nextEvents: "Ver más eventos del mes",
      viewDetailsLabel: "Ver detalles del evento",
      openLocationLabel: "Abrir ubicación de",
      mapsPreposition: "en",
      viewLocation: "Ver ubicación",
      copiedLabel: "Enlace de",
      copiedLabelSuffix: "copiado",
      shareLabel: "Compartir",
      shareLabelSuffix: "por WhatsApp o copiar enlace",
    },
    affiliates: {
      title: "Dojos afiliados",
      description: "A encuentra donde practicar kendo.",
      pagination: "Paginación de dojos afiliados",
      previousPage: "Página anterior de dojos",
      nextPage: "Página siguiente de dojos",
      of: "de",
    },
    gallery: {
      title: "Galería de kendo",
      openDetails: "Abrir detalles",
      openDetailsInGallery: "Abrir detalles en la galería",
      close: "Cerrar galería",
      previousImage: "Imagen anterior",
      nextImage: "Imagen siguiente",
      viewImage: "Ver imagen:",
      thumbnails: "Miniaturas de galería",
    },
    event: {
      defaultType: "Actividad de kendo",
      completed: "Actividad finalizada",
      scheduled: "Actividad programada",
      date: "Fecha",
      time: "Horario",
      location: "Ubicación",
      description: "Descripción",
      backToCalendar: "Volver al calendario",
      viewArchive: "Antiguos eventos",
      directions: "Cómo llegar",
      viewDetailsLabel: "Consultar detalles del evento",
      addToCalendar: "Añade a tu calendario",
      audienceNotice:
        "Actividad abierta al público como espectador. La participación está reservada a miembros habilitados. El ingreso está sujeto a capacidad, normas del recinto y condiciones de seguridad.",
    },
    archive: {
      title: "Eventos pasados",
      description: "Archivo histórico de actividades publicadas.",
      upcomingEvents: "Próximos eventos",
      empty: "Todavía no hay eventos en el archivo.",
      viewEvent: "Detalles del evento",
      pagination: "Paginación del archivo",
      previous: "Anterior",
      next: "Siguiente",
      page: "Página",
      of: "de",
      year: "Año",
      type: "Tipo",
      eventType: "Tipo de evento",
      all: "Todos",
      types: {
        torneo: "Torneo",
        examen: "Examen",
        seminario: "Seminario",
        evento: "Evento",
      },
    },
    notFound: {
      title: "Página no encontrada",
      description:
        "La página que buscas no existe o fue movida. Puedes continuar desde alguna de estas secciones.",
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
      calendarMenu: "Calendar options",
      upcomingEvents: "Upcoming events",
      pastEvents: "Past events",
      links: [
        { id: "home", path: "/en/", label: "Home" },
        { id: "calendar", path: "/en/events/", label: "Calendar" },
        { id: "gallery", path: "/en/gallery/", label: "Gallery" },
        { id: "affiliates", path: "/en/affiliates/", label: "Affiliates" },
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
      events: "Upcoming events",
      upcoming: "Upcoming events",
      heroAlt: "Group of kendo practitioners gathered after an activity",
    },
    footer: {
      purposeTitle: "The purpose of",
      purpose:
        "The concept of Kendo is to discipline the human character through the application of the principles of the Katana.",
      contacts: "Federation contact",
      copyright: "© 2026 Federation of Kendo Associations.",
      rights: "All rights reserved.",
    },
    common: {
      rangeSeparator: "to",
      place: "Place",
      opensMaps: "Opens Google Maps in a new tab.",
      toBeConfirmed: "To be confirmed",
      informationPending: "Information to be confirmed.",
      eventDetails: "Event details",
      linkCopied: "Link copied",
      shareEvent: "Share event",
    },
    calendar: {
      title: "Upcoming events",
      description: "Kendo tournaments, examinations, and activities.",
      empty: "There are no upcoming published events.",
      pastEvents: "Past events",
      copiedAnnouncement: "Event link copied to the clipboard.",
      navigation: "Calendar navigation",
      previousMonth: "View previous month",
      previousPair: "View previous two months",
      nextMonth: "View next month",
      nextPair: "View next two months",
      page: "Page",
      of: "of",
      eventPagination: "Event pagination for",
      previousEvents: "View previous events this month",
      nextEvents: "View more events this month",
      viewDetailsLabel: "View details for",
      openLocationLabel: "Open the location of",
      mapsPreposition: "in",
      viewLocation: "View location",
      copiedLabel: "Link for",
      copiedLabelSuffix: "copied",
      shareLabel: "Share",
      shareLabelSuffix: "via WhatsApp or copy link",
    },
    affiliates: {
      title: "Affiliated dojos",
      description: "Affiliated dojos where you can practice kendo.",
      pagination: "Affiliated dojo pagination",
      previousPage: "Previous dojo page",
      nextPage: "Next dojo page",
      of: "of",
    },
    gallery: {
      title: "Kendo gallery",
      openDetails: "Open details",
      openDetailsInGallery: "Open details in the gallery",
      close: "Close gallery",
      previousImage: "Previous image",
      nextImage: "Next image",
      viewImage: "View image:",
      thumbnails: "Gallery thumbnails",
    },
    event: {
      defaultType: "Kendo activity",
      completed: "Completed activity",
      scheduled: "Scheduled activity",
      date: "Date",
      time: "Time",
      location: "Location",
      description: "Description",
      backToCalendar: "Back to calendar",
      viewArchive: "Past events",
      directions: "Directions",
      viewDetailsLabel: "View details for",
      addToCalendar: "Add to calendar",
      audienceNotice:
        "The public may attend as spectators. Participation is reserved for eligible members. Admission is subject to venue capacity, rules, and safety requirements.",
    },
    archive: {
      title: "Past events",
      description: "Historical archive of published activities.",
      upcomingEvents: "Upcoming events",
      empty: "There are no events in the archive yet.",
      viewEvent: "Event details",
      pagination: "Archive pagination",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      year: "Year",
      type: "Type",
      eventType: "Event type",
      all: "All",
      types: {
        torneo: "Tournament",
        examen: "Examination",
        seminario: "Seminar",
        evento: "Event",
      },
    },
    notFound: {
      title: "Page not found",
      description:
        "The page you are looking for does not exist or has moved. You can continue from one of these sections.",
    },
  },
} as const;

interface LanguageContextValue {
  language: Language;
  locale: "es-CR" | "en";
  copy: (typeof COPY)[Language];
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
