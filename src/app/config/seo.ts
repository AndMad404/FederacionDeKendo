import seoData from "./seo-data.json";

type SchemaType = "WebPage" | "CollectionPage";

interface SeoData {
  siteUrl: string;
  siteName: string;
  defaultDescription: string;
  locale: string;
  language: string;
  logo: string;
  defaultImage: string;
  defaultImageAlt: string;
  defaultImageWidth: number;
  defaultImageHeight: number;
  organization: {
    sport: string;
    areaServed?: string;
  };
  routes: Record<string, RouteMeta>;
}

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  image: string;
  schemaType: SchemaType;
  /** true para rutas que no deben indexarse (ej. 404). No aparecen en ROUTE_META. */
  noindex?: boolean;
}

type StructuredData = Record<string, unknown>;

const DATA = seoData as SeoData;

const SITE_URL = DATA.siteUrl.replace(/\/$/, "");
export const SITE_NAME = DATA.siteName;
export const DEFAULT_SITE_DESCRIPTION = DATA.defaultDescription;
export const SITE_LOCALE = DATA.locale;
const SITE_LANGUAGE = DATA.language;
const DEFAULT_SOCIAL_IMAGE_ALT = DATA.defaultImageAlt;
const DEFAULT_SOCIAL_IMAGE_WIDTH = DATA.defaultImageWidth;
const DEFAULT_SOCIAL_IMAGE_HEIGHT = DATA.defaultImageHeight;
const ROUTE_META = DATA.routes;

function normalizeRoutePath(pathname: string) {
  if (pathname === "/") return pathname;

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

const NOT_FOUND_META: RouteMeta = {
  path: "/404/",
  title: `Página no encontrada | ${SITE_NAME}`,
  description: "La página que buscas no existe o fue movida.",
  image: DATA.defaultImage,
  schemaType: "WebPage",
  noindex: true,
};

export function getRouteMeta(pathname: string) {
  return ROUTE_META[normalizeRoutePath(pathname)] ?? NOT_FOUND_META;
}

export function getCanonicalUrl(meta: RouteMeta) {
  return absoluteUrl(meta.path);
}

function getRouteImageUrl(meta: RouteMeta) {
  return absoluteUrl(meta.image || DATA.defaultImage);
}

export function getRouteImageMetadata(meta: RouteMeta) {
  return {
    url: getRouteImageUrl(meta),
    alt: DEFAULT_SOCIAL_IMAGE_ALT,
    width: DEFAULT_SOCIAL_IMAGE_WIDTH,
    height: DEFAULT_SOCIAL_IMAGE_HEIGHT,
  };
}

export function getRouteStructuredData(meta: RouteMeta): StructuredData | null {
  if (meta.noindex) return null;

  const canonicalUrl = getCanonicalUrl(meta);
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const organizationData: StructuredData = {
    "@type": "SportsOrganization",
    "@id": organizationId,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: absoluteUrl(DATA.logo),
    description: DEFAULT_SITE_DESCRIPTION,
    sport: DATA.organization.sport,
  };

  if (DATA.organization.areaServed) {
    organizationData.areaServed = DATA.organization.areaServed;
  }

  const image = getRouteImageMetadata(meta);

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationData,
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: SITE_LANGUAGE,
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": meta.schemaType,
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: {
          "@id": websiteId,
        },
        about: {
          "@id": organizationId,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: image.url,
          width: image.width,
          height: image.height,
          caption: image.alt,
        },
      },
    ],
  };
}
