import type { Language } from "../config/i18n";

const archivePaths: Record<Language, string> = {
  es: "/eventos/pasados/",
  en: "/eventos/pasados/",
};

export function getArchivePagePath(_page: number, language: Language = "es") {
  return archivePaths[language];
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
