import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getRouteHeadDescriptors,
  getRouteManifest,
  getRouteMeta,
  getRouteSeoPayload,
  render,
} from "../dist-ssr/entry-server.js";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
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
  return getRouteHeadDescriptors(route)
    .map((descriptor) => {
      const attributes = Object.entries(descriptor.attributes)
        .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
        .join(" ");
      const opening = `${descriptor.tag} data-route-seo ${attributes}`;

      if (descriptor.tag === "script") {
        return `    <${opening}>${descriptor.text ?? ""}</script>`;
      }

      return `    <${opening} />`;
    })
    .join("\n");
}

function stripManagedHead(html) {
  return html
    .replace(/\n\s*<(?:link|meta)\s+[^>]*data-route-seo[^>]*>/gi, "")
    .replace(
      /\n\s*<script\s+[^>]*data-route-seo[^>]*>[\s\S]*?<\/script>/gi,
      "",
    )
    .replace(/\n\s*<link\s+rel="preload"[^>]*\s+as="image"[^>]*>/gi, "")
    .replace(/\n\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+name="(?:description|robots)"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+property="og:[^"]+"[^>]*>/gi, "")
    .replace(/\n\s*<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(
      /\n\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
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

  const bodyHtml = render("/404-not-found/");
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  return html.replace("</head>", `${managedHead(getRouteMeta("/404-not-found/"))}\n  </head>`);
}

async function writeNotFoundHtml() {
  const outputPath = path.join(DIST_DIR, "404.html");

  await writeFile(outputPath, renderNotFoundHtml(), "utf8");
  console.log(`generated ${path.relative(ROOT, outputPath)}`);
}

const routes = getRouteManifest();

for (const route of routes) {
  await writeRouteHtml(route);
}

await writeNotFoundHtml();

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.flatMap((route) => {
    const canonicalUrl = getRouteSeoPayload(route).canonicalUrl;
    return canonicalUrl
      ? ["  <url>", `    <loc>${escapeText(canonicalUrl)}</loc>`, "  </url>"]
      : [];
  }),
  "</urlset>",
  "",
].join("\n");

await writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
console.log("generated dist\\sitemap.xml");
