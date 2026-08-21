import seoData from "./seo-data.json";
import { GALLERY_IMAGES, getGalleryImages } from "../data/gallery";
import { CALENDAR_EVENTS } from "../data/calendarEvents";
import { EVENT_INDEXING_ENABLED, PAST_EVENTS_PAGE_SIZE } from "./events";
import {
  findEventByPathname,
  getArchivePagePath,
  getPastEvents,
  getEventPath,
} from "../utils/eventRoutes";
import { getLanguageFromPathname, type Language } from "./i18n";
import {
  getEventTranslationStatus,
  getLocalizedEvent,
} from "../utils/localizedEvents";
import { getEventEndDate } from "../utils/calendarEvents";
import type { RouteComponent } from "./routeTypes";

export type { RouteComponent } from "./routeTypes";

type SchemaType = "WebPage" | "CollectionPage";

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
  author: {
    name: string;
    url: string;
  };
  organization: {
    sport: string;
    areaServed?: string;
  };
  routes: Record<string, RouteMeta>;
}

export interface RouteMeta {
  path: string;
  language: Language;
  locale: "es_CR" | "en_US";
  alternatePath?: string;
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
  /** Whether this route is approved for public indexing after site launch. */
  indexable?: boolean;
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
  robots: "index, follow" | "noindex, follow" | "noindex, nofollow";
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
  if (
    !data.siteUrl ||
    !data.siteName ||
    !data.author?.name ||
    !data.author.url ||
    !data.routes
  ) {
    throw new Error("SEO config is missing site identity, author, or routes.");
  }

  const validComponents = new Set<RouteComponent>([
    "home",
    "calendar",
    "gallery",
    "affiliates",
    "event",
    "pastEvents",
    "notFound",
  ]);
  const validSchemaTypes = new Set<SchemaType>(["WebPage", "CollectionPage"]);

  for (const [routeKey, routeValue] of Object.entries(data.routes)) {
    const route = routeValue as Partial<RouteMeta>;
    if (
      route.path !== routeKey ||
      (route.language !== "es" && route.language !== "en") ||
      !route.locale ||
      !route.alternatePath ||
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
// Public indexing remains paused until the owner separately approves the
// canonical domain, legal identity, and launch policy.
const SITE_INDEXING_ENABLED = false;
const SITE_NAME = DATA.siteName;
const DEFAULT_SITE_DESCRIPTION = DATA.defaultDescription;
const DEFAULT_SOCIAL_IMAGE_ALT = DATA.defaultImageAlt;
const DEFAULT_SOCIAL_IMAGE_WIDTH = DATA.defaultImageWidth;
const DEFAULT_SOCIAL_IMAGE_HEIGHT = DATA.defaultImageHeight;
const AUTHOR = DATA.author;
const ROUTE_META = DATA.routes;
const CALENDAR_META: Record<Language, RouteMeta> = {
  es: ROUTE_META["/eventos/"],
  en: ROUTE_META["/en/events/"],
};

function normalizeRoutePath(pathname: string) {
  if (pathname === "/") return pathname;

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function formatEventDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function normalizeDescription(text: string) {
  return text
    .replace(/(?:^|\s)\*\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureTerminalPunctuation(text: string) {
  const normalized = normalizeDescription(text);
  return /[.!?…]$/u.test(normalized) ? normalized : `${normalized}.`;
}

function getFirstSentence(text?: string) {
  if (!text) return undefined;

  const normalized = normalizeDescription(text);
  if (!normalized) return undefined;

  const sentence = normalized.match(/^.*?[.!?…](?=\s|$)/u)?.[0] ?? normalized;
  return ensureTerminalPunctuation(sentence);
}

function getShortVenue(location?: string) {
  if (!location) return undefined;

  return normalizeDescription(location.split(",", 1)[0]);
}

// Dynamic event pages need a dependable minimum viable description even when
// Calendar provides little or no editorial copy. Static routes are curated
// separately and intentionally do not share this character limit.
const EVENT_DESCRIPTION_MAX_LENGTH = 155;

interface EventMetaDescriptionInput {
  event: (typeof CALENDAR_EVENTS)[number];
  localizedEvent: (typeof CALENDAR_EVENTS)[number];
  language: Language;
  now?: string;
  overrides?: Partial<Record<Language, string>>;
}

export function buildEventMetaDescription({
  event,
  localizedEvent,
  language,
  overrides,
}: EventMetaDescriptionInput) {
  const context = `${event.id} (${language})`;
  const title = normalizeDescription(localizedEvent.title);
  if (!title) throw new Error(`${context}: event name is required.`);
  if (!event.date) throw new Error(`${context}: event date is required.`);

  const override = overrides?.[language];
  if (override !== undefined) {
    if (
      override !== normalizeDescription(override) ||
      !/[.!?…]$/u.test(override)
    ) {
      throw new Error(`${context}: invalid editorial description override.`);
    }
    return override;
  }

  const english = language === "en";
  const date = formatEventDate(event.date, language);
  const summary = getFirstSentence(localizedEvent.summary);
  const fallback = english
    ? "View the official event details."
    : "Consulta los detalles oficiales del evento.";
  const time = normalizeDescription(event.startTime ?? "") || undefined;
  const venue = getShortVenue(event.location);

  const buildBase = (includeTime: boolean, includeVenue: boolean) => {
    const optionalDetails = [
      includeTime && time ? (english ? `at ${time}` : `a las ${time}`) : null,
      includeVenue && venue ? (english ? `at ${venue}` : `en ${venue}`) : null,
    ].filter(Boolean);
    const connector = english ? ` on ${date}` : ` el ${date}`;
    return `${title}${connector}${optionalDetails.length ? ` ${optionalDetails.join(" ")}` : ""}.`;
  };

  const variants = [
    buildBase(true, true),
    buildBase(true, false),
    buildBase(false, false),
  ];

  for (const base of variants) {
    if (summary) {
      const withSummary = `${base} ${summary}`;
      if (withSummary.length <= EVENT_DESCRIPTION_MAX_LENGTH) {
        return withSummary;
      }
    }

    const withFallback = `${base} ${fallback}`;
    if (withFallback.length <= EVENT_DESCRIPTION_MAX_LENGTH) {
      return withFallback;
    }
  }

  const requiredBase = variants[variants.length - 1];
  if (requiredBase.length <= EVENT_DESCRIPTION_MAX_LENGTH) return requiredBase;

  throw new Error(
    `${context}: required event description exceeds 155 characters.`,
  );
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
      inLanguage: meta.language,
      image: getGalleryImages(meta.language).map((image) => ({
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

function createNotFoundMeta(language: Language): RouteMeta {
  const english = language === "en";
  return {
    path: english ? "/en/404/" : "/404/",
    language,
    locale: english ? "en_US" : "es_CR",
    alternatePath: english ? "/404/" : "/en/404/",
    component: "notFound",
    title: english
      ? `Page not found | ${SITE_NAME}`
      : `Página no encontrada | ${SITE_NAME}`,
    description: english
      ? "The page you are looking for does not exist or has moved."
      : "La página que buscas no existe o fue movida.",
    image: DATA.defaultImage,
    imageAlt: DATA.defaultImageAlt,
    imageWidth: DATA.defaultImageWidth,
    imageHeight: DATA.defaultImageHeight,
    imageType: "image/webp",
    schemaType: "WebPage",
    indexable: false,
    noindex: true,
    suppressStructuredData: true,
  };
}

export function getRouteMeta(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname);
  const configuredRoute = ROUTE_META[normalizedPath];
  if (configuredRoute) return configuredRoute;

  const event = findEventByPathname(normalizedPath);
  const language = getLanguageFromPathname(pathname);
  if (event && getLocalizedEvent(event, language)) {
    return createEventRouteMeta(event, language);
  }

  return (
    getRouteManifest().find((route) => route.path === normalizedPath) ??
    createNotFoundMeta(language)
  );
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
    ...Object.values(ROUTE_META).filter(
      (route) => route.component !== "pastEvents",
    ),
    ...CALENDAR_EVENTS.flatMap((event) => {
      const spanishRoute = createEventRouteMeta(event, "es");
      return getEventTranslationStatus(event) === "valid"
        ? [spanishRoute, createEventRouteMeta(event, "en")]
        : [spanishRoute];
    }),
    ...archiveRoutes,
    ...Array.from({ length: pastPageCount }, (_, index) =>
      createArchiveRouteMeta(index + 1, "en"),
    ),
  ];
}

export function getEventRedirects() {
  return [
    { from: "/calendario/", to: "/eventos/" },
    { from: "/en/calendar/", to: "/en/events/" },
    ...CALENDAR_EVENTS.flatMap((event) => {
      const spanishPath = getEventPath(event, "es");
      const englishPath = getEventPath(event, "en");
      return [
        ...(spanishPath !== `/eventos/${event.id}/`
          ? [{ from: `/eventos/${event.id}/`, to: spanishPath }]
          : []),
        ...(getEventTranslationStatus(event) === "valid" &&
        englishPath !== `/en/events/${event.id}/`
          ? [{ from: `/en/events/${event.id}/`, to: englishPath }]
          : []),
        ...(event.aliases ?? []).flatMap((alias) => [
          { from: `/eventos/${alias}/`, to: spanishPath },
          ...(getEventTranslationStatus(event) === "valid"
            ? [{ from: `/en/events/${alias}/`, to: englishPath }]
            : []),
        ]),
      ];
    }),
  ];
}

function createEventRouteMeta(
  event: (typeof CALENDAR_EVENTS)[number],
  language: Language,
): RouteMeta {
  const english = language === "en";
  const localizedEvent = getLocalizedEvent(event, language);
  if (!localizedEvent) {
    throw new Error(`Missing valid ${language} translation for ${event.id}.`);
  }
  const calendarMeta = CALENDAR_META[language];
  return {
    path: getEventPath(event, language),
    language,
    locale: english ? "en_US" : "es_CR",
    alternatePath:
      english || getEventTranslationStatus(event) === "valid"
        ? getEventPath(event, english ? "es" : "en")
        : undefined,
    component: "event",
    eventId: event.id,
    title: `${localizedEvent.title} — ${formatEventDate(event.date, language)} | ${SITE_NAME}`,
    description: buildEventMetaDescription({
      event,
      localizedEvent,
      language,
    }),
    image: calendarMeta.image,
    imageAlt: calendarMeta.imageAlt,
    imageWidth: calendarMeta.imageWidth,
    imageHeight: calendarMeta.imageHeight,
    imageType: calendarMeta.imageType,
    schemaType: "WebPage",
    indexable: EVENT_INDEXING_ENABLED,
    noindex: !EVENT_INDEXING_ENABLED,
    canonicalWhileNoindex: true,
  };
}

function createArchiveRouteMeta(
  page: number,
  language: Language = "es",
): RouteMeta {
  const english = language === "en";
  const calendarMeta = CALENDAR_META[language];
  return {
    path: getArchivePagePath(page, language),
    language,
    locale: english ? "en_US" : "es_CR",
    alternatePath: getArchivePagePath(page, english ? "es" : "en"),
    component: "pastEvents",
    archivePage: page,
    title: english
      ? `Past events${page > 1 ? ` — page ${page}` : ""} | ${SITE_NAME}`
      : `Eventos pasados${page > 1 ? ` — página ${page}` : ""} | ${SITE_NAME}`,
    description:
      ROUTE_META[english ? "/en/events/past/" : "/eventos/pasados/"]
        .description,
    image: calendarMeta.image,
    imageAlt: calendarMeta.imageAlt,
    imageWidth: calendarMeta.imageWidth,
    imageHeight: calendarMeta.imageHeight,
    imageType: calendarMeta.imageType,
    schemaType: "CollectionPage",
    indexable: false,
    noindex: false,
    canonicalWhileNoindex: true,
  };
}

export function getRouteSitemapImageUrls(meta: RouteMeta) {
  if (meta.component === "gallery") {
    return GALLERY_IMAGES.map((image) => absoluteUrl(image.src));
  }

  if (meta.component === "home") {
    return [
      absoluteUrl("/images/hero/kendo-hero-formacion-960.webp?v=20260704-0120"),
    ];
  }

  if (
    meta.component === "calendar" ||
    meta.component === "event" ||
    meta.component === "pastEvents"
  ) {
    return [
      absoluteUrl("/images/calendar/kendo-calendar-960.webp?v=20260723-1004"),
    ];
  }

  return [getRouteImageUrl(meta)];
}

function getCanonicalUrl(meta: RouteMeta) {
  return absoluteUrl(meta.path);
}

function getRouteImageUrl(meta: RouteMeta) {
  return absoluteUrl(meta.image || DATA.defaultImage);
}

function getRouteImageMetadata() {
  return {
    url: absoluteUrl(DATA.defaultImage),
    alt: DEFAULT_SOCIAL_IMAGE_ALT,
    width: DEFAULT_SOCIAL_IMAGE_WIDTH,
    height: DEFAULT_SOCIAL_IMAGE_HEIGHT,
    type: "image/jpeg",
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

  const image = getRouteImageMetadata();
  const routeEntities =
    ROUTE_STRUCTURED_DATA_BUILDERS[meta.component]?.(meta, canonicalUrl) ?? [];
  if (meta.component === "event" && meta.eventId) {
    const event = CALENDAR_EVENTS.find(
      (candidate) => candidate.id === meta.eventId,
    );
    if (event) {
      const localizedEvent = getLocalizedEvent(event, meta.language);
      if (!localizedEvent) return null;
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
        name: localizedEvent.title,
        description: localizedEvent.summary || meta.description,
        startDate,
        ...(endDate ? { endDate } : {}),
        eventStatus:
          getEventEndDate(event).getTime() <= Date.now()
            ? "https://schema.org/EventCompleted"
            : "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        ...(event.location
          ? {
              location: {
                "@type": "Place",
                name: event.location.split(",", 1)[0].trim(),
                address: {
                  "@type": "PostalAddress",
                  streetAddress: event.location,
                  addressCountry: "CR",
                },
              },
            }
          : {}),
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
        inLanguage: meta.language,
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
        inLanguage: meta.language,
        author: {
          "@type": "Person",
          name: AUTHOR.name,
          url: AUTHOR.url,
        },
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
  const noindex =
    !SITE_INDEXING_ENABLED || !meta.indexable || Boolean(meta.noindex);

  return {
    title: meta.title,
    description: meta.description || DEFAULT_SITE_DESCRIPTION,
    robots: noindex
      ? meta.component === "notFound"
        ? "noindex, nofollow"
        : "noindex, follow"
      : "index, follow",
    canonicalUrl:
      noindex && Boolean(meta.noindex) && !meta.canonicalWhileNoindex
        ? null
        : getCanonicalUrl(meta),
    siteName: SITE_NAME,
    locale: meta.locale,
    image: getRouteImageMetadata(),
    structuredData: noindex ? null : getRouteStructuredData(meta),
    preloadImage: meta.preloadImage,
  };
}

export function getRouteHeadDescriptors(meta: RouteMeta): HeadDescriptor[] {
  const seo = getRouteSeoPayload(meta);
  const descriptors: HeadDescriptor[] = [
    {
      tag: "meta",
      attributes: { name: "author", content: AUTHOR.name },
    },
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
      ["og:locale:alternate", meta.language === "en" ? "es_CR" : "en_US"],
    ].map(([property, content]) => ({
      tag: "meta" as const,
      attributes: { property, content },
    })),
  );

  const spanishPath = meta.language === "es" ? meta.path : meta.alternatePath;
  const englishPath = meta.language === "en" ? meta.path : meta.alternatePath;
  if (!spanishPath) return descriptors;

  descriptors.push(
    {
      tag: "link",
      attributes: {
        rel: "alternate",
        hreflang: "es-CR",
        href: absoluteUrl(spanishPath),
      },
    },
    {
      tag: "link",
      attributes: {
        rel: "alternate",
        hreflang: "x-default",
        href: absoluteUrl(spanishPath),
      },
    },
  );

  if (englishPath) {
    descriptors.push({
      tag: "link",
      attributes: {
        rel: "alternate",
        hreflang: "en",
        href: absoluteUrl(englishPath),
      },
    });
  }

  if (seo.structuredData) {
    descriptors.push({
      tag: "script",
      attributes: { type: "application/ld+json", id: "route-json-ld" },
      text: JSON.stringify(seo.structuredData).replace(/</g, "\\u003c"),
    });
  }

  return descriptors;
}
