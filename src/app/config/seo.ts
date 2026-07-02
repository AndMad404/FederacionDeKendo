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
}

type StructuredData = Record<string, unknown>;

const DATA = seoData as SeoData;

export const SITE_URL = DATA.siteUrl.replace(/\/$/, "");
export const SITE_NAME = DATA.siteName;
export const DEFAULT_SITE_DESCRIPTION = DATA.defaultDescription;
export const SITE_LOCALE = DATA.locale;
export const SITE_LANGUAGE = DATA.language;
export const ROUTE_META = DATA.routes;

export const ROUTE_PATHS = Object.keys(ROUTE_META);

function normalizeRoutePath(pathname: string) {
  if (pathname === "/") return pathname;

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function getRouteMeta(pathname: string) {
  return ROUTE_META[normalizeRoutePath(pathname)] ?? ROUTE_META["/"];
}

export function getCanonicalUrl(meta: RouteMeta) {
  return absoluteUrl(meta.path);
}

export function getRouteImageUrl(meta: RouteMeta) {
  return absoluteUrl(meta.image || DATA.defaultImage);
}

export function getRouteStructuredData(meta: RouteMeta): StructuredData {
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
          url: getRouteImageUrl(meta),
        },
      },
    ],
  };
}
