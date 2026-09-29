const SITE_ORIGIN = "https://fak-kendo.org";

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function escapeMarkdownLabel(value) {
  return normalizeText(value).replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function getIndexableEntries(routes, getRouteSeoPayload) {
  const entries = routes.flatMap((route) => {
    const seo = getRouteSeoPayload(route);
    if (seo.robots !== "index, follow" || !seo.canonicalUrl) return [];

    return [{ route, seo }];
  });
  const canonicalUrls = entries.map(({ seo }) => seo.canonicalUrl);

  if (new Set(canonicalUrls).size !== canonicalUrls.length) {
    throw new Error("Crawler files cannot contain duplicate canonical URLs.");
  }

  return entries;
}

function formatLlmsLink({ seo }) {
  return `- [${escapeMarkdownLabel(seo.title)}](${seo.canonicalUrl}): ${normalizeText(seo.description)}`;
}

export function generateLlmsTxt(routes, getRouteSeoPayload) {
  const entries = getIndexableEntries(routes, getRouteSeoPayload);
  const sections = [
    {
      title: "Páginas principales",
      entries: entries.filter(
        ({ route }) => route.language === "es" && route.component !== "event",
      ),
    },
    {
      title: "Eventos",
      entries: entries.filter(
        ({ route }) => route.language === "es" && route.component === "event",
      ),
    },
    {
      title: "English pages",
      entries: entries.filter(
        ({ route }) => route.language === "en" && route.component !== "event",
      ),
    },
    {
      title: "Events in English",
      entries: entries.filter(
        ({ route }) => route.language === "en" && route.component === "event",
      ),
    },
  ];

  return [
    "# Federación de Asociaciones de Kendo",
    "",
    "> Sitio oficial de la Federación de Asociaciones de Kendo, con información sobre eventos, comunidad y dojos afiliados en Costa Rica.",
    "",
    ...sections.flatMap((section) =>
      section.entries.length
        ? [
            `## ${section.title}`,
            "",
            ...section.entries.map(formatLlmsLink),
            "",
          ]
        : [],
    ),
  ].join("\n");
}

export function generateRobotsTxt(routes, getRouteSeoPayload) {
  const eventPaths = getIndexableEntries(routes, getRouteSeoPayload)
    .filter(({ route }) => route.component === "event")
    .map(({ seo }) => new URL(seo.canonicalUrl).pathname);

  return [
    "User-agent: *",
    "Allow: /",
    "",
    "# Event routes generated automatically from the published calendar.",
    ...eventPaths.map((path) => `Allow: ${path}`),
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}
