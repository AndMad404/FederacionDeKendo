import seoData from "./seo-data.json";

type SchemaType = "WebPage" | "CollectionPage";
export type RouteComponent = "home" | "calendar" | "gallery" | "affiliates";

export interface PreloadImage {
  href: string;
  type?: string;
  srcSet?: string;
  sizes?: string;
}

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
  component: RouteComponent;
  title: string;
  description: string;
  image: string;
  schemaType: SchemaType;
  preloadImage?: PreloadImage;
  /** true para rutas que no deben indexarse (ej. 404). No aparecen en ROUTE_META. */
  noindex?: boolean;
}

type StructuredData = Record<string, unknown>;
type StructuredDataBuilder = (
  meta: RouteMeta,
  canonicalUrl: string,
) => StructuredData[];

// Route-specific entities can be added here without expanding the base graph.
const ROUTE_STRUCTURED_DATA_BUILDERS: Partial<
  Record<RouteComponent, StructuredDataBuilder>
> = {};

export interface RouteSeoPayload {
  title: string;
  description: string;
  robots: "index, follow" | "noindex, nofollow";
  canonicalUrl: string | null;
  siteName: string;
  locale: string;
  image: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
  structuredData: StructuredData | null;
  preloadImage?: PreloadImage;
}

export interface HeadDescriptor {
  tag: "link" | "meta" | "script";
  attributes: Record<string, string>;
  text?: string;
}

function assertSeoData(value: unknown): asserts value is SeoData {
  if (!value || typeof value !== "object") {
    throw new Error("SEO config must be an object.");
  }

  const data = value as Partial<SeoData>;
  if (!data.siteUrl || !data.siteName || !data.routes) {
    throw new Error("SEO config is missing siteUrl, siteName, or routes.");
  }

  const validComponents = new Set<RouteComponent>([
    "home",
    "calendar",
    "gallery",
    "affiliates",
  ]);
  const validSchemaTypes = new Set<SchemaType>(["WebPage", "CollectionPage"]);

  for (const [routeKey, routeValue] of Object.entries(data.routes)) {
    const route = routeValue as Partial<RouteMeta>;
    if (
      route.path !== routeKey ||
      !route.title ||
      !route.description ||
      !route.image ||
      !route.component ||
      !validComponents.has(route.component) ||
      !route.schemaType ||
      !validSchemaTypes.has(route.schemaType)
    ) {
      throw new Error(`Invalid SEO route config for ${routeKey}.`);
    }
  }
}

assertSeoData(seoData);
const DATA: SeoData = seoData as SeoData;

const SITE_URL = DATA.siteUrl.replace(/\/$/, "");
const SITE_NAME = DATA.siteName;
const DEFAULT_SITE_DESCRIPTION = DATA.defaultDescription;
const SITE_LOCALE = DATA.locale;
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
  component: "home",
  title: `Página no encontrada | ${SITE_NAME}`,
  description: "La página que buscas no existe o fue movida.",
  image: DATA.defaultImage,
  schemaType: "WebPage",
  noindex: true,
};

export function getRouteMeta(pathname: string) {
  return ROUTE_META[normalizeRoutePath(pathname)] ?? NOT_FOUND_META;
}

export function getRouteManifest() {
  return Object.values(ROUTE_META);
}

function getCanonicalUrl(meta: RouteMeta) {
  return absoluteUrl(meta.path);
}

function getRouteImageUrl(meta: RouteMeta) {
  return absoluteUrl(meta.image || DATA.defaultImage);
}

function getRouteImageMetadata(meta: RouteMeta) {
  return {
    url: getRouteImageUrl(meta),
    alt: DEFAULT_SOCIAL_IMAGE_ALT,
    width: DEFAULT_SOCIAL_IMAGE_WIDTH,
    height: DEFAULT_SOCIAL_IMAGE_HEIGHT,
  };
}

function getRouteStructuredData(meta: RouteMeta): StructuredData | null {
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
  const routeEntities =
    ROUTE_STRUCTURED_DATA_BUILDERS[meta.component]?.(meta, canonicalUrl) ?? [];

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
      ...routeEntities,
    ],
  };
}

export function getRouteSeoPayload(meta: RouteMeta): RouteSeoPayload {
  const noindex = Boolean(meta.noindex);

  return {
    title: meta.title,
    description: meta.description || DEFAULT_SITE_DESCRIPTION,
    robots: noindex ? "noindex, nofollow" : "index, follow",
    canonicalUrl: noindex ? null : getCanonicalUrl(meta),
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    image: getRouteImageMetadata(meta),
    structuredData: getRouteStructuredData(meta),
    preloadImage: meta.preloadImage,
  };
}

export function getRouteHeadDescriptors(meta: RouteMeta): HeadDescriptor[] {
  const seo = getRouteSeoPayload(meta);
  const descriptors: HeadDescriptor[] = [
    {
      tag: "meta",
      attributes: { name: "description", content: seo.description },
    },
    {
      tag: "meta",
      attributes: { name: "robots", content: seo.robots },
    },
  ];

  if (!seo.canonicalUrl) return descriptors;

  if (seo.preloadImage) {
    descriptors.push({
      tag: "link",
      attributes: {
        rel: "preload",
        href: seo.preloadImage.href,
        as: "image",
        ...(seo.preloadImage.type ? { type: seo.preloadImage.type } : {}),
        fetchpriority: "high",
        ...(seo.preloadImage.srcSet
          ? { imagesrcset: seo.preloadImage.srcSet }
          : {}),
        ...(seo.preloadImage.sizes
          ? { imagesizes: seo.preloadImage.sizes }
          : {}),
      },
    });
  }

  descriptors.push(
    {
      tag: "link",
      attributes: { rel: "canonical", href: seo.canonicalUrl },
    },
    ...[
      ["og:type", "website"],
      ["og:site_name", seo.siteName],
      ["og:title", seo.title],
      ["og:description", seo.description],
      ["og:url", seo.canonicalUrl],
      ["og:image", seo.image.url],
      ["og:image:secure_url", seo.image.url],
      ["og:image:type", "image/png"],
      ["og:image:width", String(seo.image.width)],
      ["og:image:height", String(seo.image.height)],
      ["og:image:alt", seo.image.alt],
      ["og:locale", seo.locale],
    ].map(([property, content]) => ({
      tag: "meta" as const,
      attributes: { property, content },
    })),
  );

  if (seo.structuredData) {
    descriptors.push({
      tag: "script",
      attributes: { type: "application/ld+json", id: "route-json-ld" },
      text: JSON.stringify(seo.structuredData).replace(/</g, "\\u003c"),
    });
  }

  return descriptors;
}
