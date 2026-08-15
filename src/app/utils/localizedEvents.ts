import type { Language } from "../config/i18n";
import type { CalendarEvent } from "../types";

const SUMMARY_TRANSLATIONS: Record<string, string> = {
  "Exámenes de 8vo a 2do kyu": "Examinations from 8th to 2nd kyu",
  "Categoría con Bogu y sin Bogu": "Categories with and without bogu",
  "Entrenamientos intensivos de protocolo, técnica y combate.":
    "Intensive training in etiquette, technique, and combat.",
  "Torneo por Equipos en Panamá. Invitación de Shinsei Panamá.":
    "Team tournament in Panama, hosted by Shinsei Panama.",
};

const TITLE_TRANSLATIONS: Record<string, string> = {
  "FEDERACIÓN  : Examen": "FEDERATION: Examination",
  "FEDERACIÓN : Seminario y Reunión": "FEDERATION: Seminar and Meeting",
  "CLAK Seminario Instructores CHILE": "CLAK Instructor Seminar CHILE",
  "CLAK 1er Panamericano BRASIL": "CLAK 1st Pan American Championship BRASIL",
  "PANAMA Torneo por Equipos": "PANAMA Team Tournament",
  Examen: "Examination",
  Seminario: "Seminar",
  "3er Torneo": "3rd Tournament",
  "4to Torneo": "4th Tournament",
  "5to Torneo": "5th Tournament",
  "6to Torneo": "6th Tournament",
  "7mo Torneo": "7th Tournament",
};

export function getLocalizedEvent(
  event: CalendarEvent,
  language: Language,
): CalendarEvent {
  if (language === "es") return event;
  return {
    ...event,
    title: TITLE_TRANSLATIONS[event.title] ?? event.title,
    summary: event.summary
      ? (SUMMARY_TRANSLATIONS[event.summary] ?? event.summary)
      : undefined,
  };
}

export function getLocalizedEvents(
  events: CalendarEvent[],
  language: Language,
) {
  return events.map((event) => getLocalizedEvent(event, language));
}
