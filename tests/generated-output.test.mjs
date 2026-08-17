import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getRouteManifest,
  getRouteSeoPayload,
} from "../dist-ssr/entry-server.js";

async function readDist(relativePath) {
  return readFile(new URL(`../dist/${relativePath}`, import.meta.url), "utf8");
}

test("generates event HTML with canonical and no structured data while indexing is paused", async () => {
  const complete = await readDist("eventos/2026-08-08-examen/index.html");
  const incomplete = await readDist(
    "eventos/2026-10-10-clak-1er-panamericano-brasil/index.html",
  );

  assert.match(complete, /<h1[^>]*>Examen<\/h1>/);
  assert.match(complete, /name="robots" content="noindex, nofollow"/);
  assert.match(
    complete,
    /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/eventos\/2026-08-08-examen\/"/,
  );
  assert.doesNotMatch(complete, /application\/ld\+json/);
  assert.doesNotMatch(incomplete, /application\/ld\+json/);
});

test("generates complete paused-indexing SEO output for every event route", async () => {
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

    assert.equal(seo.robots, "noindex, nofollow");
    assert.ok(seo.canonicalUrl);
    assert.match(html, /name="description" content="[^"]+"/);
    assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
    assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
    assert.ok(html.includes(`property="og:url" content="${seo.canonicalUrl}"`));
    assert.ok(
      html.includes(
        `hreflang="es-CR" href="https://fak-kendo.pages.dev${spanishPath}"`,
      ),
    );
    assert.ok(
      html.includes(
        `hreflang="en" href="https://fak-kendo.pages.dev${englishPath}"`,
      ),
    );
    assert.doesNotMatch(html, /application\/ld\+json/);
  }
});

test("keeps every generated route noindex while including it in the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const calendar = await readDist("calendario/index.html");
  assert.match(sitemap, /\/eventos\//);
  assert.match(sitemap, /\/en\/events\//);
  assert.match(sitemap, /\/eventos\/pasados\//);
  assert.match(sitemap, /\/en\/events\/past\//);
  assert.match(home, /name="robots" content="noindex, nofollow"/);
  assert.match(calendar, /name="robots" content="noindex, nofollow"/);
  assert.match(
    home,
    /rel="canonical" href="https:\/\/fak-kendo\.pages\.dev\/"/,
  );
  assert.doesNotMatch(home, /application\/ld\+json/);
  assert.doesNotMatch(calendar, /application\/ld\+json/);
});

test("keeps the sitemap synchronized with every public generated route", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  );
  const routeUrls = getRouteManifest()
    .map((route) => getRouteSeoPayload(route))
    .map((seo) => seo.canonicalUrl);

  assert.deepEqual(sitemapUrls, routeUrls);
});

test("keeps both calendar archive views noindex and structured-data-free", async () => {
  const pastEvents = await readDist("eventos/pasados/index.html");
  const englishPastEvents = await readDist("en/events/past/index.html");

  for (const html of [pastEvents, englishPastEvents]) {
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html, /application\/ld\+json/);
  }
});

test("generates the archive route", async () => {
  const archive = await readDist("eventos/pasados/index.html");
  assert.match(archive, /Eventos pasados/);
  assert.match(archive, /href="\/eventos\/2026-08-08-examen\/"/);
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
  const event = await readDist("en/events/2026-08-08-examen/index.html");
  const sitemap = await readDist("sitemap.xml");

  assert.match(home, /<html lang="en">/);
  assert.match(home, />Home<\/a>/);
  assert.match(home, /href="\/en\/calendar\/"/);
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
  assert.match(sitemap, /<loc>/);
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
