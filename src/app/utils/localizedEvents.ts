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

function translateTitle(title: string) {
  return title
    .replace("FEDERACIÓN  : Examen", "FEDERATION: Examination")
    .replace("FEDERACIÓN : Seminario y Reunión", "FEDERATION: Seminar and Meeting")
    .replace("Seminario Instructores", "Instructor Seminar")
    .replace("1er Panamericano", "1st Pan American Championship")
    .replace("Torneo por Equipos", "Team Tournament")
    .replace(/^Examen$/, "Examination")
    .replace(/^(\d+)(?:er|to|mo) Torneo$/, (_, number: string) =>
      `${number}${number === "3" ? "rd" : "th"} Tournament`,
    );
}

export function getLocalizedEvent(
  event: CalendarEvent,
  language: Language,
): CalendarEvent {
  if (language === "es") return event;
  return {
    ...event,
    title: translateTitle(event.title),
    summary: event.summary
      ? SUMMARY_TRANSLATIONS[event.summary] ?? event.summary
      : undefined,
  };
}

export function getLocalizedEvents(events: CalendarEvent[], language: Language) {
  return events.map((event) => getLocalizedEvent(event, language));
}
