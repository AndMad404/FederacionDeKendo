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
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsOrganization",
        "@id": organizationId,
        name: seoData.siteName,
        url: `${siteUrl}/`,
        logo: absoluteUrl(seoData.logo),
        description: seoData.defaultDescription,
        sport: seoData.organization.sport,
        areaServed: {
          "@type": "Country",
          name: seoData.organization.areaServed,
        },
      },
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
          url: absoluteUrl(route.image || seoData.defaultImage),
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

  return [
    `    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`,
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:site_name" content="${escapeAttribute(seoData.siteName)}" />`,
    `    <meta property="og:title" content="${escapeAttribute(route.title)}" />`,
    `    <meta property="og:description" content="${escapeAttribute(route.description)}" />`,
    `    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />`,
    `    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />`,
    `    <meta property="og:locale" content="${escapeAttribute(seoData.locale)}" />`,
    `    <script type="application/ld+json" id="${ROUTE_JSON_LD_ID}">${jsonLd}</script>`,
  ].join("\n");
}

function stripManagedHead(html) {
  return html
    .replace(/\n\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+property="og:[^"]+"[^>]*>/gi, "")
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

for (const route of Object.values(seoData.routes)) {
  await writeRouteHtml(route);
}
