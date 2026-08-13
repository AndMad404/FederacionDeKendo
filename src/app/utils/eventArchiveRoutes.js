export function getArchivePagePath(page, language = "es") {
  if (language === "en") {
    return page <= 1
      ? "/en/events/past/"
      : `/en/events/past/page/${page}/`;
  }

  return page <= 1 ? "/eventos/pasados/" : `/eventos/pasados/pagina/${page}/`;
}
