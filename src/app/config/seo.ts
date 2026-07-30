import seoData from "./seo-data.json";
import { GALLERY_IMAGES } from "../data/gallery";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import {
  EVENT_INDEXING_ENABLED,
  PAST_EVENTS_PAGE_SIZE,
} from "./events";
import {
  findEventByPathname,
  getArchivePagePath,
  getPastEvents,
  getEventPath,
} from "../utils/eventRoutes";

type SchemaType = "WebPage" | "CollectionPage";
export type RouteComponent =
  | "home"
  | "calendar"
  | "gallery"
  | "affiliates"
  | "event"
  | "pastEvents";

interface PreloadImage {
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
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageType: string;
  schemaType: SchemaType;
  preloadImage?: PreloadImage;
  eventId?: string;
  archivePage?: number;
  canonicalWhileNoindex?: boolean;
  suppressStructuredData?: boolean;
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
> = {
  gallery: buildGalleryStructuredData,
};

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
    type: string;
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
    "event",
    "pastEvents",
  ]);
  const validSchemaTypes = new Set<SchemaType>(["WebPage", "CollectionPage"]);

  for (const [routeKey, routeValue] of Object.entries(data.routes)) {
    const route = routeValue as Partial<RouteMeta>;
    if (
      route.path !== routeKey ||
      !route.title ||
      !route.description ||
      !route.image ||
      !route.imageAlt ||
      !route.imageWidth ||
      !route.imageHeight ||
      !route.imageType ||
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
const CALENDAR_META = ROUTE_META["/calendario/"];

function normalizeRoutePath(pathname: string) {
  if (pathname === "/") return pathname;

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function buildGalleryStructuredData(
  meta: RouteMeta,
  canonicalUrl: string,
): StructuredData[] {
  return [
    {
      "@type": "ImageGallery",
      "@id": `${canonicalUrl}#image-gallery`,
      url: canonicalUrl,
      name: meta.title,
      description: meta.description,
      inLanguage: SITE_LANGUAGE,
      image: GALLERY_IMAGES.map((image) => ({
        "@type": "ImageObject",
        "@id": `${canonicalUrl}#image-${image.id}`,
        contentUrl: absoluteUrl(image.src),
        name: image.title,
        caption: image.alt,
        description: image.description,
        width: image.width,
        height: image.height,
        encodingFormat: "image/webp",
        representativeOfPage: image.id === 1,
      })),
    },
  ];
}

const NOT_FOUND_META: RouteMeta = {
  path: "/404/",
  component: "home",
  title: `Página no encontrada | ${SITE_NAME}`,
  description: "La página que buscas no existe o fue movida.",
  image: DATA.defaultImage,
  imageAlt: DATA.defaultImageAlt,
  imageWidth: DATA.defaultImageWidth,
  imageHeight: DATA.defaultImageHeight,
  imageType: "image/png",
  schemaType: "WebPage",
  noindex: true,
  suppressStructuredData: true,
};

export function getRouteMeta(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname);
  const configuredRoute = ROUTE_META[normalizedPath];
  if (configuredRoute) return configuredRoute;

  const event = findEventByPathname(normalizedPath);
  if (event) return createEventRouteMeta(event);

  return getRouteManifest().find((route) => route.path === normalizedPath) ?? NOT_FOUND_META;
}

export function getRouteManifest() {
  const pastPageCount = Math.max(
    1,
    Math.ceil(getPastEvents().length / PAST_EVENTS_PAGE_SIZE),
  );
  const archiveRoutes = Array.from({ length: pastPageCount }, (_, index) =>
    createArchiveRouteMeta(index + 1),
  );

  return [
    ...Object.values(ROUTE_META),
    ...CALENDAR_EVENTS.map(createEventRouteMeta),
    ...archiveRoutes,
  ];
}

export function getEventRedirects() {
  return CALENDAR_EVENTS.flatMap((event) =>
    (event.aliases ?? [])
      .filter((alias) => alias !== event.id)
      .map((alias) => ({
        from: `/eventos/${alias}/`,
        to: getEventPath(event),
      })),
  );
}

function createEventRouteMeta(event: (typeof CALENDAR_EVENTS)[number]): RouteMeta {
  const description =
    event.summary ||
    `Consulta fecha, horario y detalles de ${event.title}.`;
  return {
    path: getEventPath(event),
    component: "event",
    eventId: event.id,
    title: `${event.title} | ${SITE_NAME}`,
    description: description.slice(0, 160),
    image: CALENDAR_META.image,
    imageAlt: CALENDAR_META.imageAlt,
    imageWidth: CALENDAR_META.imageWidth,
    imageHeight: CALENDAR_META.imageHeight,
    imageType: CALENDAR_META.imageType,
    schemaType: "WebPage",
    noindex: !EVENT_INDEXING_ENABLED,
    canonicalWhileNoindex: true,
  };
}

function createArchiveRouteMeta(page: number): RouteMeta {
  return {
    path: getArchivePagePath(page),
    component: "pastEvents",
    archivePage: page,
    title: `Eventos pasados${page > 1 ? ` — página ${page}` : ""} | ${SITE_NAME}`,
    description:
      "Archivo histórico de torneos, exámenes, seminarios y actividades de kendo.",
    image: CALENDAR_META.image,
    imageAlt: CALENDAR_META.imageAlt,
    imageWidth: CALENDAR_META.imageWidth,
    imageHeight: CALENDAR_META.imageHeight,
    imageType: CALENDAR_META.imageType,
    schemaType: "CollectionPage",
    noindex: !EVENT_INDEXING_ENABLED,
    canonicalWhileNoindex: true,
  };
}

export function getRouteSitemapImageUrls(meta: RouteMeta) {
  if (meta.component === "gallery") {
    return GALLERY_IMAGES.map((image) => absoluteUrl(image.src));
  }

  return [getRouteImageUrl(meta)];
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
    alt: meta.imageAlt || DEFAULT_SOCIAL_IMAGE_ALT,
    width: meta.imageWidth || DEFAULT_SOCIAL_IMAGE_WIDTH,
    height: meta.imageHeight || DEFAULT_SOCIAL_IMAGE_HEIGHT,
    type: meta.imageType || "image/png",
  };
}

function getRouteStructuredData(meta: RouteMeta): StructuredData | null {
  if (meta.suppressStructuredData) return null;

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
  if (meta.component === "event" && meta.eventId) {
    const event = CALENDAR_EVENTS.find((candidate) => candidate.id === meta.eventId);
    if (event?.location) {
      const startDate = event.startTime
        ? `${event.date}T${event.startTime}:00-06:00`
        : event.date;
      const endDate = event.endDate
        ? event.endTime
          ? `${event.endDate}T${event.endTime}:00-06:00`
          : event.endDate
        : event.endTime
          ? `${event.date}T${event.endTime}:00-06:00`
          : undefined;
      routeEntities.push({
        "@type": "Event",
        "@id": `${canonicalUrl}#event`,
        name: event.title,
        description: event.summary || meta.description,
        startDate,
        ...(endDate ? { endDate } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.location.split(",", 1)[0].trim(),
          address: {
            "@type": "PostalAddress",
            streetAddress: event.location,
            addressCountry: "CR",
          },
        },
        image: [image.url],
        url: canonicalUrl,
      });
    }
  }
  const mainEntityReferences = routeEntities
    .map((entity) => entity["@id"])
    .filter((id): id is string => typeof id === "string")
    .map((id) => ({ "@id": id }));

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
        ...(mainEntityReferences.length > 0
          ? { mainEntity: mainEntityReferences }
          : {}),
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
    canonicalUrl:
      noindex && !meta.canonicalWhileNoindex ? null : getCanonicalUrl(meta),
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
      ["og:image:type", seo.image.type],
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
