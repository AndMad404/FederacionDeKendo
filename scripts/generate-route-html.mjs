import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SEO_DATA_PATH = path.join(ROOT, "src", "app", "config", "seo-data.json");
const ROUTE_JSON_LD_ID = "route-json-ld";

const seoData = JSON.parse(await readFile(SEO_DATA_PATH, "utf8"));
const baseHtml = await readFile(path.join(DIST_DIR, "index.html"), "utf8");
const siteUrl = seoData.siteUrl.replace(/\/$/, "");

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

function absoluteUrl(value) {
  if (/^https?:\/\//.test(value)) return value;

  return value === "/" ? `${siteUrl}/` : `${siteUrl}${value}`;
}

function routeStructuredData(route) {
  const canonicalUrl = absoluteUrl(route.path);
  const imageUrl = absoluteUrl(route.image || seoData.defaultImage);
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const organizationData = {
    "@type": "SportsOrganization",
    "@id": organizationId,
    name: seoData.siteName,
    url: `${siteUrl}/`,
    logo: absoluteUrl(seoData.logo),
    description: seoData.defaultDescription,
    sport: seoData.organization.sport,
  };

  if (seoData.organization.areaServed) {
    organizationData.areaServed = seoData.organization.areaServed;
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationData,
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${siteUrl}/`,
        name: seoData.siteName,
        inLanguage: seoData.language,
        publisher: {
          "@id": organizationId,
        },
      },
      {
        "@type": route.schemaType,
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: route.title,
        description: route.description,
        inLanguage: seoData.language,
        isPartOf: {
          "@id": websiteId,
        },
        about: {
          "@id": organizationId,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: imageUrl,
          width: seoData.defaultImageWidth,
          height: seoData.defaultImageHeight,
          caption: seoData.defaultImageAlt,
        },
      },
    ],
  };
}

function managedHead(route) {
  const canonicalUrl = absoluteUrl(route.path);
  const imageUrl = absoluteUrl(route.image || seoData.defaultImage);
  const jsonLd = JSON.stringify(routeStructuredData(route)).replaceAll(
    "<",
    "\\u003c",
  );

  const managedTags = [
    route.preloadImage
      ? [
          `    <link rel="preload" href="${escapeAttribute(route.preloadImage.href)}"`,
          '      as="image"',
          route.preloadImage.type
            ? `      type="${escapeAttribute(route.preloadImage.type)}"`
            : "",
          '      fetchpriority="high"',
          route.preloadImage.srcSet
            ? `      imagesrcset="${escapeAttribute(route.preloadImage.srcSet)}"`
            : "",
          route.preloadImage.sizes
            ? `      imagesizes="${escapeAttribute(route.preloadImage.sizes)}"`
            : "",
          "    />",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    `    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`,
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:site_name" content="${escapeAttribute(seoData.siteName)}" />`,
    `    <meta property="og:title" content="${escapeAttribute(route.title)}" />`,
    `    <meta property="og:description" content="${escapeAttribute(route.description)}" />`,
    `    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />`,
    `    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />`,
    `    <meta property="og:image:secure_url" content="${escapeAttribute(imageUrl)}" />`,
    '    <meta property="og:image:type" content="image/png" />',
    `    <meta property="og:image:width" content="${escapeAttribute(seoData.defaultImageWidth)}" />`,
    `    <meta property="og:image:height" content="${escapeAttribute(seoData.defaultImageHeight)}" />`,
    `    <meta property="og:image:alt" content="${escapeAttribute(seoData.defaultImageAlt)}" />`,
    `    <meta property="og:locale" content="${escapeAttribute(seoData.locale)}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeAttribute(route.title)}" />`,
    `    <meta name="twitter:description" content="${escapeAttribute(route.description)}" />`,
    `    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />`,
    `    <meta name="twitter:image:alt" content="${escapeAttribute(seoData.defaultImageAlt)}" />`,
    `    <script type="application/ld+json" id="${ROUTE_JSON_LD_ID}">${jsonLd}</script>`,
  ];

  return managedTags.filter(Boolean).join("\n");
}

function stripManagedHead(html) {
  return html
    .replace(/\n\s*<link\s+rel="preload"[^>]*\s+as="image"[^>]*>/gi, "")
    .replace(/\n\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+property="og:[^"]+"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(
      new RegExp(
        `\\n\\s*<script\\s+type="application/ld\\+json"\\s+id="${ROUTE_JSON_LD_ID}">[\\s\\S]*?<\\/script>`,
        "gi",
      ),
      "",
    );
}

function renderRouteHtml(route) {
  const description = route.description || seoData.defaultDescription;
  let html = stripManagedHead(baseHtml);

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeText(route.title)}</title>`,
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta\n      name="description"\n      content="${escapeAttribute(description)}"\n    />`,
  );

  return html.replace("</head>", `${managedHead(route)}\n  </head>`);
}

async function writeRouteHtml(route) {
  const outputDir =
    route.path === "/"
      ? DIST_DIR
      : path.join(DIST_DIR, route.path.replace(/^\//, ""));
  const outputPath = path.join(outputDir, "index.html");

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, renderRouteHtml(route), "utf8");
  console.log(`generated ${path.relative(ROOT, outputPath)}`);
}

function renderNotFoundHtml() {
  const title = `Página no encontrada | ${seoData.siteName}`;
  const description = "La página que buscas no existe o fue movida.";
  let html = stripManagedHead(baseHtml);

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeText(title)}</title>`,
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta\n      name="description"\n      content="${escapeAttribute(description)}"\n    />`,
  );

  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="robots" content="noindex, nofollow" />',
  );

  return html;
}

async function writeNotFoundHtml() {
  const outputPath = path.join(DIST_DIR, "404.html");

  await writeFile(outputPath, renderNotFoundHtml(), "utf8");
  console.log(`generated ${path.relative(ROOT, outputPath)}`);
}

for (const route of Object.values(seoData.routes)) {
  await writeRouteHtml(route);
}

await writeNotFoundHtml();
