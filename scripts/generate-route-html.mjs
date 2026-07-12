import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getRouteMeta,
  getRouteSeoPayload,
  render,
} from "../dist-ssr/entry-server.js";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const SEO_DATA_PATH = path.join(ROOT, "src", "app", "config", "seo-data.json");
const ROUTE_JSON_LD_ID = "route-json-ld";

const seoData = JSON.parse(await readFile(SEO_DATA_PATH, "utf8"));
const baseHtml = await readFile(path.join(DIST_DIR, "index.html"), "utf8");

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

function managedHead(route) {
  const seo = getRouteSeoPayload(route);
  const jsonLd = JSON.stringify(seo.structuredData).replaceAll(
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
    `    <link rel="canonical" href="${escapeAttribute(seo.canonicalUrl)}" />`,
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:site_name" content="${escapeAttribute(seo.siteName)}" />`,
    `    <meta property="og:title" content="${escapeAttribute(seo.title)}" />`,
    `    <meta property="og:description" content="${escapeAttribute(seo.description)}" />`,
    `    <meta property="og:url" content="${escapeAttribute(seo.canonicalUrl)}" />`,
    `    <meta property="og:image" content="${escapeAttribute(seo.image.url)}" />`,
    `    <meta property="og:image:secure_url" content="${escapeAttribute(seo.image.url)}" />`,
    '    <meta property="og:image:type" content="image/png" />',
    `    <meta property="og:image:width" content="${escapeAttribute(seo.image.width)}" />`,
    `    <meta property="og:image:height" content="${escapeAttribute(seo.image.height)}" />`,
    `    <meta property="og:image:alt" content="${escapeAttribute(seo.image.alt)}" />`,
    `    <meta property="og:locale" content="${escapeAttribute(seo.locale)}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeAttribute(seo.title)}" />`,
    `    <meta name="twitter:description" content="${escapeAttribute(seo.description)}" />`,
    `    <meta name="twitter:image" content="${escapeAttribute(seo.image.url)}" />`,
    `    <meta name="twitter:image:alt" content="${escapeAttribute(seo.image.alt)}" />`,
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
  const seo = getRouteSeoPayload(route);
  let html = stripManagedHead(baseHtml);

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeText(seo.title)}</title>`,
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta\n      name="description"\n      content="${escapeAttribute(seo.description)}"\n    />`,
  );

  const bodyHtml = render(route.path);
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

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
  const seo = getRouteSeoPayload(getRouteMeta("/404-not-found/"));
  let html = stripManagedHead(baseHtml);

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeText(seo.title)}</title>`,
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta\n      name="description"\n      content="${escapeAttribute(seo.description)}"\n    />`,
  );

  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeAttribute(seo.robots)}" />`,
  );

  const bodyHtml = render("/404-not-found/");
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

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
