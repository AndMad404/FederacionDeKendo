export const DEFAULT_SITE_DESCRIPTION =
  "Sitio oficial de la Federación de Asociaciones de Kendo de Costa Rica: comunidad, galería y dojos afiliados.";

export const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Federación de Asociaciones de Kendo de Costa Rica",
    description:
      "Conoce la Federación de Asociaciones de Kendo de Costa Rica y su comunidad de práctica.",
  },
  "/galeria": {
    title: "Galería | Federación de Asociaciones de Kendo de Costa Rica",
    description:
      "Galería oficial de la comunidad, entrenamientos y actividades de kendo en Costa Rica.",
  },
  "/afiliados": {
    title: "Afiliados | Federación de Asociaciones de Kendo de Costa Rica",
    description:
      "Información de contacto, horarios y ubicación de dojos afiliados a la federación.",
  },
};
