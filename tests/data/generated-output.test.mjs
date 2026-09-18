import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CALENDAR_EVENTS,
  getEventRedirects,
  getRouteManifest,
  getRouteSeoPayload,
} from "../../dist-ssr/entry-server.js";

async function readDist(relativePath) {
  return readFile(
    new URL(`../../dist/${relativePath}`, import.meta.url),
    "utf8",
  );
}

test("generates one historical event route with its canonical and indexable metadata", async () => {
  const complete = await readDist(
    "eventos/pasados/2026-08-08-examen/index.html",
  );
  const incomplete = await readDist(
    "eventos/2026-10-10-clak-1er-panamericano-brasil/index.html",
  );

  assert.match(complete, /<h1[^>]*>Examen<\/h1>/);
  assert.match(complete, /name="robots" content="index, follow"/);
  assert.match(
    complete,
    /rel="canonical" href="https:\/\/fak-kendo\.org\/eventos\/pasados\/2026-08-08-examen\/"/,
  );
  assert.match(complete, /application\/ld\+json/);
  assert.match(incomplete, /name="robots" content="index, follow"/);
  assert.match(incomplete, /application\/ld\+json/);
});

test("generates localized, unique, indexable SEO output for every event route", async () => {
  const routeManifest = getRouteManifest();
  const eventRoutes = routeManifest.filter(
    (route) => route.component === "event",
  );

  for (const route of eventRoutes) {
    const html = await readDist(`${route.path.slice(1)}index.html`);
    const seo = getRouteSeoPayload(route);
    const spanishPath =
      route.language === "es" ? route.path : route.alternatePath;
    const englishPath =
      route.language === "en" ? route.path : route.alternatePath;

    assert.equal(seo.robots, "index, follow");
    assert.ok(seo.canonicalUrl);
    assert.ok(html.includes(`<title>${seo.title}</title>`));
    assert.ok(html.includes(`name="description" content="${seo.description}"`));
    assert.ok(seo.description.length <= 155);
    assert.doesNotMatch(seo.description, /\s{2,}|\*\s*$/);
    assert.ok(html.includes('name="robots" content="index, follow"'));
    assert.ok(html.includes(`rel="canonical" href="${seo.canonicalUrl}"`));
    assert.ok(html.includes(`property="og:url" content="${seo.canonicalUrl}"`));
    assert.ok(
      html.includes(
        `hreflang="es-CR" href="https://fak-kendo.org${spanishPath}"`,
      ),
    );
    if (englishPath) {
      assert.ok(
        html.includes(
          `hreflang="en" href="https://fak-kendo.org${englishPath}"`,
        ),
      );
    } else {
      assert.doesNotMatch(html, /hreflang="en"/);
    }
    assert.match(html, /application\/ld\+json/);
  }

  for (const language of ["es", "en"]) {
    const titles = eventRoutes
      .filter((route) => route.language === language)
      .map((route) => getRouteSeoPayload(route).title);
    assert.equal(new Set(titles).size, titles.length);
  }

  const expectedStaticTitles = new Map([
    ["/", "Federación de Asociaciones de Kendo | Costa Rica"],
    ["/eventos/", "Eventos de Kendo en Costa Rica"],
    ["/galeria/", "Galería de Kendo | Costa Rica"],
    ["/afiliados/", "Dojos de Kendo en Costa Rica"],
    ["/eventos/pasados/", "Eventos pasados de Kendo | Costa Rica"],
    ["/en/", "Federation of Kendo Associations | Costa Rica"],
    ["/en/events/", "Kendo Events in Costa Rica"],
    ["/en/gallery/", "Kendo Gallery | Costa Rica"],
    ["/en/affiliates/", "Kendo Dojos in Costa Rica"],
    ["/en/events/past/", "Past Kendo Events | Costa Rica"],
  ]);

  for (const [path, expectedTitle] of expectedStaticTitles) {
    const route = routeManifest.find((candidate) => candidate.path === path);
    assert.equal(route?.title, expectedTitle, path);
  }

  const expectedEventTitles = new Map([
    ["2026-10-31-examen:es", "Examen de Kendo — 31 oct 2026 | Costa Rica"],
    [
      "2026-05-30-seminario:es",
      "Seminario de Kendo — 30 may 2026 | Costa Rica",
    ],
    [
      "2026-09-12-gasshuku-monteverde:es",
      "Gasshuku Monteverde — 12 sept 2026 | Costa Rica",
    ],
    ["2026-08-22-3er-torneo:es", "3er Torneo de Kendo — 22 ago 2026"],
    ["2026-12-12-4to-torneo:es", "4to Torneo de Kendo — 12 dic 2026"],
    [
      "2026-05-29-clak-seminario-instructores-chile:es",
      "CLAK Seminario Instructores CHILE — 29 may 2026",
    ],
    [
      "2026-10-10-clak-1er-panamericano-brasil:es",
      "CLAK 1er Panamericano BRASIL — 10 oct 2026",
    ],
    [
      "2026-11-21-panama-torneo-por-equipos:es",
      "PANAMA Torneo por Equipos — 21 nov 2026",
    ],
    ["2026-10-31-examen:en", "Kendo Examination — Oct 31, 2026 | Costa Rica"],
  ]);

  for (const [key, expectedTitle] of expectedEventTitles) {
    const [eventId, language] = key.split(":");
    const route = eventRoutes.find(
      (candidate) =>
        candidate.eventId === eventId && candidate.language === language,
    );
    assert.equal(route?.title, expectedTitle, key);
  }

  const archivePageTwoTitles = routeManifest
    .filter(
      (route) => route.component === "pastEvents" && route.archivePage === 2,
    )
    .map((route) => route.title);
  assert.deepEqual(archivePageTwoTitles, [
    "Eventos pasados de Kendo — página 2 | Costa Rica",
    "Past Kendo Events — page 2 | Costa Rica",
  ]);

  for (const route of routeManifest) {
    assert.ok(route.title.length <= 60, `${route.path}: ${route.title}`);
  }
});

test("indexes all public routes, events, and archives in the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/eventos\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/en\/<\/loc>/);
  assert.match(
    sitemap,
    /<loc>https:\/\/fak-kendo\.org\/eventos\/pasados\/<\/loc>/,
  );
  assert.match(
    sitemap,
    /<loc>https:\/\/fak-kendo\.org\/eventos\/pasados\/2026-08-08-examen\/<\/loc>/,
  );
  assert.match(home, /name="robots" content="index, follow"/);
  assert.match(calendar, /name="robots" content="index, follow"/);
  assert.match(home, /rel="canonical" href="https:\/\/fak-kendo\.org\/"/);
  assert.match(home, /application\/ld\+json/);
  assert.match(calendar, /application\/ld\+json/);
});

test("uses the JPEG social card in generated Open Graph metadata", async () => {
  const gallery = await readDist("galeria/index.html");

  assert.match(gallery, /<html lang="es" prefix="og: https:\/\/ogp\.me\/ns#">/);
  assert.match(
    gallery,
    /property="og:image" content="https:\/\/fak-kendo\.org\/images\/social\/kendo-social-card-20260917\.jpg"/,
  );
  assert.match(gallery, /property="og:image:type" content="image\/jpeg"/);
  assert.match(gallery, /name="twitter:card" content="summary_large_image"/);
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

test("publishes only defensible event lastmod values in the sitemap", async () => {
  const sitemap = await readDist("sitemap.xml");
  const home = await readDist("index.html");
  const prerenderedAt = home.match(
    /<meta name="app-prerendered-at" content="([^"]+)" \/>/,
  )?.[1];

  assert.ok(prerenderedAt);

  const urlBlocks = new Map(
    [...sitemap.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map(([, block]) => {
      const location = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      return [location, block];
    }),
  );

  const homeBlock = urlBlocks.get("https://fak-kendo.org/");
  assert.ok(homeBlock);
  assert.doesNotMatch(homeBlock, /<lastmod>/);
  assert.doesNotMatch(
    sitemap,
    new RegExp(`<lastmod>${prerenderedAt}<\\/lastmod>`),
  );

  const bilingualLastmods = new Map();

  for (const route of getRouteManifest().filter(
    (candidate) => candidate.component === "event",
  )) {
    const event = CALENDAR_EVENTS.find(
      (candidate) => candidate.id === route.eventId,
    );
    assert.ok(event, route.path);

    const isPast =
      route.path.includes("/eventos/pasados/") ||
      route.path.includes("/en/events/past/");
    const candidates = (
      isPast
        ? [event.sourceUpdatedAt, event.archiveEligibleAt]
        : [event.sourceUpdatedAt]
    )
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));
    const expected = candidates.length
      ? new Date(Math.max(...candidates)).toISOString()
      : undefined;

    const seo = getRouteSeoPayload(route);
    const block = urlBlocks.get(seo.canonicalUrl);
    assert.ok(block, route.path);

    const actual = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    assert.equal(actual, expected, route.path);

    const values = bilingualLastmods.get(event.id) ?? [];
    values.push(actual);
    bilingualLastmods.set(event.id, values);
  }

  for (const values of bilingualLastmods.values()) {
    if (values.length > 1) {
      assert.equal(new Set(values).size, 1);
    }
  }
});

test("keeps every generated public route indexable", () => {
  const nonIndexableRoutes = getRouteManifest()
    .filter((route) => getRouteSeoPayload(route).robots !== "index, follow")
    .map((route) => route.path);

  assert.deepEqual(nonIndexableRoutes, []);
});
test("publishes sitemap images for approved routes", async () => {
  const sitemap = await readDist("sitemap.xml");
  const sitemapImageUrls = [
    ...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g),
  ].map(([, url]) => url);

  assert.ok(sitemapImageUrls.length > 0);
  assert.ok(
    sitemapImageUrls.includes(
      "https://fak-kendo.org/images/hero/kendo-hero-formacion-960.webp?v=20260704-0120",
    ),
  );

  const home = await readDist("index.html");
  const calendar = await readDist("eventos/index.html");
  for (const html of [home, calendar]) {
    assert.match(
      html,
      /og:image" content="https:\/\/fak-kendo\.org\/images\/social\/kendo-social-card-20260917\.jpg"/,
    );
    assert.match(html, /og:image:type" content="image\/jpeg"/);
    assert.match(html, /og:image:width" content="1200"/);
    assert.match(html, /og:image:height" content="630"/);
  }
});

test("keeps both calendar archive views indexable with structured data", async () => {
  const pastEvents = await readDist("eventos/pasados/index.html");
  const englishPastEvents = await readDist("en/events/past/index.html");

  for (const html of [pastEvents, englishPastEvents]) {
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /application\/ld\+json/);
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

test("publishes visible and structured breadcrumbs on deep routes", async () => {
  const pastEvent = await readDist(
    "eventos/pasados/2026-08-08-examen/index.html",
  );
  const englishPastEvent = await readDist(
    "en/events/past/2026-08-08-examen/index.html",
  );
  const archivePageTwo = await readDist("eventos/pasados/pagina/2/index.html");

  assert.match(pastEvent, /aria-label="Migas de navegación"/);
  assert.match(pastEvent, /href="\/eventos\/"/);
  assert.match(pastEvent, /href="\/eventos\/pasados\/"/);
  assert.match(pastEvent, /"@type":"BreadcrumbList"/);
  assert.match(
    pastEvent,
    /"item":"https:\/\/fak-kendo\.org\/eventos\/pasados\/2026-08-08-examen\/"/,
  );

  assert.match(englishPastEvent, /aria-label="Breadcrumb"/);
  assert.match(englishPastEvent, /href="\/en\/events\/"/);
  assert.match(englishPastEvent, /href="\/en\/events\/past\/"/);
  assert.match(englishPastEvent, /"name":"Past events"/);

  assert.match(archivePageTwo, /aria-current="page"[^>]*>P\u00e1gina 2</);
  assert.match(archivePageTwo, /"name":"Página 2"/);
  assert.match(
    archivePageTwo,
    /"item":"https:\/\/fak-kendo\.org\/eventos\/pasados\/pagina\/2\/"/,
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
    /rel="alternate" hreflang="es-CR" href="https:\/\/fak-kendo\.org\/"/,
  );
  assert.match(
    home,
    /rel="alternate" hreflang="en" href="https:\/\/fak-kendo\.org\/en\/"/,
  );
  assert.match(event, /<h1[^>]*>Examination<\/h1>/);
  assert.match(event, /Examinations from 8th to 2nd kyu/);
  assert.match(sitemap, /<loc>https:\/\/fak-kendo\.org\/en\/<\/loc>/);
});

test("publishes English event routes only when their editorial translation is valid", async () => {
  const { CALENDAR_EVENTS, getEventTranslationStatus } =
    await import("../../dist-ssr/entry-server.js");
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
