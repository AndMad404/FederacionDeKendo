import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import type { ApprovedPage, PageDesign } from "../design/design-contract";

export function getGeneratedEventPath(
  slug: string,
  language: "es" | "en" = "es",
) {
  // Published redirects account for aliases, vanity slugs, archive dates and
  // fallback to Spanish for events without a distinct English translation.
  const redirects = new Map(
    readFileSync(resolve(process.cwd(), "dist/_redirects"), "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [from, to] = line.split(/\s+/);
        return [from, to];
      }),
  );
  const prefixes =
    language === "en"
      ? ["/en/events/", "/en/events/past/"]
      : ["/eventos/", "/eventos/pasados/"];
  const pages = generatedPages();
  for (const prefix of prefixes) {
    const source = `${prefix}${slug}/`;
    const path = redirects.get(source) ?? source;
    if (pages.some((page) => page.path === path && page.design === "event")) {
      return path;
    }
  }
  throw new Error(
    `Missing canonical generated event page: ${language}/${slug}`,
  );
}

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
