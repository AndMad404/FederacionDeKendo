import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getEventRedirects,
  getRouteManifest,
  getRouteSeoPayload,
} from "../dist-ssr/entry-server.js";

async function readDist(relativePath) {
  return readFile(new URL(`../dist/${relativePath}`, import.meta.url), "utf8");
}

test("generates event HTML with canonical and no structured data while indexing is paused", async () => {
  const complete = await readDist(
    "eventos/pasados/2026-08-08-examen/index.html",
  );
  const incomplete = await readDist(
    "eventos/2026-10-10-clak-1er-panamericano-brasil/index.html",
  );

  assert.match(complete, /<h1[^>]*>Examen<\/h1>/);
  assert.match(complete, /name="robots" content="noindex, follow"/);
  assert.match(
    complete,
    /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/eventos\/pasados\/2026-08-08-examen\/"/,
  );
  assert.doesNotMatch(complete, /application\/ld\+json/);
  assert.doesNotMatch(incomplete, /application\/ld\+json/);
});

test("generates localized, unique, paused-indexing SEO output for every event route", async () => {
  const eventRoutes = getRouteManifest().filter(
    (route) => route.component === "event",
  );

  for (const route of eventRoutes) {
    const html = await readDist(`${route.path.slice(1)}index.html`);
    const seo = getRouteSeoPayload(route);
    const spanishPath =
      route.language === "es" ? route.path : route.alternatePath;
    const englishPath =
      route.language === "en" ? route.path : route.alternatePath;

    assert.equal(seo.robots, "noindex, follow");
    assert.ok(seo.canonicalUrl);
    assert.ok(html.includes(`<title>${seo.title}</title>`));
    assert.ok(html.includes(`name="description" content="${seo.description}"`));
    assert.ok(seo.description.length <= 155);
    assert.doesNotMatch(seo.description, /\s{2,}|\*\s*$/);
    assert.ok(html.includes('name="robots" content="noindex, follow"'));
    assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
    assert.ok(html.includes(`property="og:url" content="${seo.canonicalUrl}"`));
    assert.ok(
      html.includes(
        `hreflang="es-CR" href="https://fak-kendo.pages.dev${spanishPath}"`,
      ),
    );
    if (englishPath) {
      assert.ok(
        html.includes(
          `hreflang="en" href="https://fak-kendo.pages.dev${englishPath}"`,
        ),
      );
    } else {
      assert.doesNotMatch(html, /hreflang="en"/);
    }
    assert.doesNotMatch(html, /application\/ld\+json/);
  }

  for (const language of ["es", "en"]) {
    const titles = eventRoutes
      .filter((route) => route.language === language)
      .map((route) => getRouteSeoPayload(route).title);
    assert.equal(new Set(titles).size, titles.length);
  }
});

test("excludes noindex routes from the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  assert.doesNotMatch(sitemap, /<loc>/);
  assert.match(home, /name="robots" content="noindex, follow"/);
  assert.match(calendar, /name="robots" content="noindex, follow"/);
  assert.match(
    home,
    /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/"/,
  );
  assert.doesNotMatch(home, /application\/ld\+json/);
  assert.doesNotMatch(calendar, /application\/ld\+json/);
});

test("uses the JPEG social card in generated Open Graph metadata", async () => {
  const gallery = await readDist("galeria/index.html");

  assert.match(gallery, /<html lang="es" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.match(
    gallery,
    /property="og:image" content="https:\/\/fak-kendo\.pages\.dev\/images\/social\/kendo-social-card-20260812\.jpg"/,
  );
  assert.match(gallery, /property="og:image:type" content="image\/jpeg"/);
});

test("keeps the sitemap synchronized with indexable generated routes only", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
  const routeUrls = getRouteManifest()
    .map((route) => getRouteSeoPayload(route))
    .filter((seo) => seo.robots === "index, follow")
    .map((seo) => seo.canonicalUrl);

  assert.deepEqual(sitemapUrls, routeUrls);
});

test("omits sitemap images when no route is indexable", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapImageUrls = [
    ...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g),
  ].map(([, url]) => url);

  assert.deepEqual(sitemapImageUrls, []);

  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  for (const html of [home, calendar]) {
    assert.match(
      html,
      /og:image" content="https:\/\/fak-kendo\.pages\.dev\/images\/social\/kendo-social-card-20260812\.jpg"/,
    );
    assert.match(html, /og:image:type" content="image\/jpeg"/);
    assert.match(html, /og:image:width" content="1200"/);
    assert.match(html, /og:image:height" content="630"/);
  }
});

test("keeps both calendar archive views noindex and structured-data-free", async () => {
  const pastEvents = await readDist("eventos/pasados/index.html");
  const englishPastEvents = await readDist("en/events/past/index.html");

  for (const html of [pastEvents, englishPastEvents]) {
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(html, /application\/ld\+json/);
  }
});

test("generates the archive route", async () => {
  const archive = await readDist("eventos/pasados/index.html");
  assert.match(archive, /Eventos pasados/);
  assert.match(archive, /href="\/eventos\/pasados\/2026-08-08-examen\/"/);
});

test("redirects legacy calendar and archived event URLs to their canonical routes", async () => {
  const redirects = await readDist("_redirects");
  const configuredRedirects = getEventRedirects();

  assert.ok(
    configuredRedirects.some(
      ({ from, to }) => from === "/calendario/" && to === "/eventos/",
    ),
  );
  assert.match(redirects, /^\/calendario\/ \/eventos\/ 301$/m);
  assert.match(
    redirects,
    /^\/eventos\/2026-08-08-examen\/ \/eventos\/pasados\/2026-08-08-examen\/ 301$/m,
  );
});

test("shares one deterministic prerender timestamp across generated routes", async () => {
  const home = await readDist("index.html");
  const archive = await readDist("eventos/pasados/index.html");
  const timestampPattern =
    /<meta name="app-prerendered-at" content="([^"]+)" \/>/;
  const homeTimestamp = home.match(timestampPattern)?.[1];
  const archiveTimestamp = archive.match(timestampPattern)?.[1];

  assert.ok(homeTimestamp);
  assert.equal(archiveTimestamp, homeTimestamp);
  assert.equal(new Date(homeTimestamp).toISOString(), homeTimestamp);
});

test("generates localized English routes with reciprocal language metadata", async () => {
  const home = await readDist("en/index.html");
  const event = await readDist("en/events/past/2026-08-08-examen/index.html");
  const sitemap = await readDist("sitemap.xml");

  assert.match(home, /<html lang="en" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.match(home, />Home<\/a>/);
  assert.match(home, /href="\/en\/events\/"/);
  assert.match(
    home,
    /rel="alternate" hreflang="es-CR" href="https:\/\/fak-kendo\.pages\.dev\/"/,
  );
  assert.match(
    home,
    /rel="alternate" hreflang="en" href="https:\/\/fak-kendo\.pages\.dev\/en\/"/,
  );
  assert.match(event, /<h1[^>]*>Examination<\/h1>/);
  assert.match(event, /Examinations from 8th to 2nd kyu/);
  assert.doesNotMatch(sitemap, /<loc>/);
});

test("publishes English event routes only when their editorial translation is valid", async () => {
  const { CALENDAR_EVENTS, getEventTranslationStatus } =
    await import("../dist-ssr/entry-server.js");
  const englishEventRoutes = getRouteManifest()
    .filter((route) => route.component === "event" && route.language === "en")
    .map((route) => route.eventId)
    .sort();
  const validTranslationIds = CALENDAR_EVENTS.filter(
    (event) => getEventTranslationStatus(event) === "valid",
  )
    .map((event) => event.id)
    .sort();

  assert.deepEqual(englishEventRoutes, validTranslationIds);
});
