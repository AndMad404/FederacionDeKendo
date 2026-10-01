import { readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import type { ApprovedPage, PageDesign } from "../design/design-contract";

function getPageDesign(path: string): PageDesign {
  if (path === "/" || path === "/en/") return "home";
  if (path === "/eventos/" || path === "/en/events/") return "calendar";
  if (path === "/galeria/" || path === "/en/gallery/") return "gallery";
  if (path === "/afiliados/" || path === "/en/affiliates/") return "affiliates";
  if (
    path === "/eventos/pasados/" ||
    path.startsWith("/eventos/pasados/pagina/") ||
    path === "/en/events/past/" ||
    path.startsWith("/en/events/past/page/")
  )
    return "pastEvents";
  return "event";
}

export function generatedPages({ spanishOnly = false } = {}): ApprovedPage[] {
  const directory = resolve(process.cwd(), "dist");
  const paths = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name === "index.html")
    .map((entry) => {
      const route = relative(directory, entry.parentPath).split(sep).join("/");
      return route ? `/${route}/` : "/";
    })
    .filter((path) => !spanishOnly || !path.startsWith("/en/"))
    .sort();
  return [
    ...paths.map((path) => ({
      name: path === "/" ? "home" : path.slice(1, -1).replaceAll("/", "-"),
      path,
      design: getPageDesign(path),
    })),
    {
      name: "not-found",
      path: "/ruta-visual-inexistente/",
      design: "notFound",
    },
  ];
}

export function representativePages(
  pages: ApprovedPage[],
  preferredPaths: Partial<Record<PageDesign, string>> = {},
) {
  const byDesign = new Map<PageDesign, ApprovedPage>();
  for (const page of pages) {
    if (
      !byDesign.has(page.design) ||
      page.path === preferredPaths[page.design]
    ) {
      byDesign.set(page.design, page);
    }
  }
  return Array.from(byDesign.values());
}
