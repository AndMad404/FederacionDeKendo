import type { Language } from "../config/i18n";

export function getArchivePagePath(page: number, language: Language = "es") {
  if (language === "en") {
    return page <= 1 ? "/en/events/past/" : `/en/events/past/page/${page}/`;
  }

  return page <= 1 ? "/eventos/pasados/" : `/eventos/pasados/pagina/${page}/`;
}

export function getArchivePageNumber(
  pathname: string,
  language: Language = "es",
) {
  const match =
    language === "en"
      ? /^\/en\/events\/past\/page\/(\d+)\/$/.exec(pathname)
      : /^\/eventos\/pasados\/pagina\/(\d+)\/$/.exec(pathname);
  return match ? Math.max(1, Number(match[1])) : 1;
}
